import { ref, onUnmounted } from 'vue'
import { Capacitor } from '@capacitor/core'

class KalmanFilter {
  constructor(processNoise = 0.5, measurementNoise = 4, estimatedError = 2) {
    this.q = processNoise
    this.r = measurementNoise
    this.p = estimatedError
    this.value = null
  }

  filter(measurement) {
    if (this.value === null) {
      this.value = measurement
      return measurement
    }
    this.p = this.p + this.q
    const k = this.p / (this.p + this.r)
    this.value = this.value + k * (measurement - this.value)
    this.p = (1 - k) * this.p
    return this.value
  }

  reset() {
    this.value = null
    this.p = 1
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeHeadingDeg(deg) {
  const r = deg % 360
  return r < 0 ? r + 360 : r
}

function rssiToDistanceMeters(rssi, txPower, pathLoss) {
  // Log-distance path loss model.
  // Distance = 10 ^ ((TxPower - RSSI) / (10 * n))
  return Math.pow(10, (txPower - rssi) / (10 * pathLoss))
}

function rssiToConfidencePct(rssi) {
  // Very rough heuristic: -55 (strong) -> ~100%, -95 (weak) -> ~0%
  const clamped = clamp(rssi, -95, -55)
  const pct = ((clamped + 95) / 40) * 100
  return Math.round(clamp(pct, 0, 100))
}

function weightedCentroid2D(beaconReadings) {
  // beaconReadings: [{ name, dist, pos: {x,y} }]
  let totalWeight = 0
  let wx = 0
  let wy = 0
  for (const b of beaconReadings) {
    const w = 1 / (b.dist + 0.1)
    wx += b.pos.x * w
    wy += b.pos.y * w
    totalWeight += w
  }
  if (!totalWeight) return null
  return { x: wx / totalWeight, y: wy / totalWeight }
}

function trilaterateLinearLeastSquares2D(beaconReadings) {
  // Linear least-squares trilateration (2D) by subtracting the first equation.
  // beaconReadings: [{ dist, pos: {x,y} }]
  if (!Array.isArray(beaconReadings) || beaconReadings.length < 3) return null

  const ref = beaconReadings[0]
  const x1 = ref.pos?.x
  const y1 = ref.pos?.y
  const d1 = ref.dist
  if (![x1, y1, d1].every((v) => typeof v === 'number' && Number.isFinite(v))) return null

  // Normal equations for weighted least squares of A*[x,y]=b (2 unknowns).
  let a00 = 0
  let a01 = 0
  let a11 = 0
  let b0 = 0
  let b1 = 0

  for (let i = 1; i < beaconReadings.length; i++) {
    const r = beaconReadings[i]
    const xi = r.pos?.x
    const yi = r.pos?.y
    const di = r.dist
    if (![xi, yi, di].every((v) => typeof v === 'number' && Number.isFinite(v))) continue

    const ax = 2 * (xi - x1)
    const ay = 2 * (yi - y1)
    const bi = xi * xi - x1 * x1 + (yi * yi - y1 * y1) - (di * di - d1 * d1)

    // Down-weight far/noisy distances.
    const w = 1 / (di + 0.1)

    a00 += w * ax * ax
    a01 += w * ax * ay
    a11 += w * ay * ay
    b0 += w * ax * bi
    b1 += w * ay * bi
  }

  const det = a00 * a11 - a01 * a01
  if (!Number.isFinite(det) || Math.abs(det) < 1e-8) return null

  const x = (b0 * a11 - b1 * a01) / det
  const y = (a00 * b1 - a01 * b0) / det

  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return { x, y }
}

export function useBleIndoorPosition(options = {}) {
  const {
    beaconNames = [],
    beaconPositions = {},
    txPower = -59,
    pathLoss = 2.2,
    maxDistanceMeters = 30,
    minConfidencePct = 10,
    positionSmoothing = 0.3,
    simulateInWeb = true,
    simulationIntervalMs = 1000,
  } = options

  const isScanning = ref(false)
  const error = ref(null)
  const rawBeacons = ref({})
  const filteredBeacons = ref({})
  const position = ref(null)
  const lastUpdatedAt = ref(null)

  // Web-only helper for demos.
  const simulatedPosition = ref({ x: 0, y: 0 })

  const kalmanFilters = new Map()
  let ble = null
  let scanListener = null
  let simTimer = null

  function resetState() {
    rawBeacons.value = {}
    filteredBeacons.value = {}
    position.value = null
    lastUpdatedAt.value = null
    for (const kf of kalmanFilters.values()) kf.reset()
    kalmanFilters.clear()
  }

  function processBeaconRssi(beaconName, rssi) {
    const pos = beaconPositions[beaconName]
    if (!pos) return
    if (typeof rssi !== 'number' || Number.isNaN(rssi)) return

    if (!kalmanFilters.has(beaconName)) {
      kalmanFilters.set(beaconName, new KalmanFilter())
    }

    const filteredRssi = kalmanFilters.get(beaconName).filter(rssi)
    const distance = rssiToDistanceMeters(filteredRssi, txPower, pathLoss)
    const confidence = rssiToConfidencePct(filteredRssi)

    rawBeacons.value[beaconName] = { rssi }
    filteredBeacons.value[beaconName] = {
      rssi: filteredRssi,
      distance,
      confidence,
      pos,
    }

    updatePositionEstimate()
  }

  function updatePositionEstimate() {
    const readings = []
    for (const [name, b] of Object.entries(filteredBeacons.value)) {
      if (!b?.pos) continue
      if (typeof b.distance !== 'number' || Number.isNaN(b.distance)) continue
      if (b.distance > maxDistanceMeters) continue
      if ((b.confidence ?? 0) < minConfidencePct) continue
      readings.push({ name, dist: b.distance, pos: b.pos })
    }

    if (readings.length < 2) return
    readings.sort((a, b) => a.dist - b.dist)

    const estimate =
      readings.length >= 3 ? trilaterateLinearLeastSquares2D(readings) || weightedCentroid2D(readings) : weightedCentroid2D(readings)
    if (!estimate) return

    if (!position.value) {
      position.value = { x: estimate.x, y: estimate.y, source: 'BLE' }
    } else {
      const k = clamp(positionSmoothing, 0, 1)
      position.value = {
        x: position.value.x * (1 - k) + estimate.x * k,
        y: position.value.y * (1 - k) + estimate.y * k,
        source: 'BLE',
      }
    }
    lastUpdatedAt.value = Date.now()
  }

  async function initNativeBle() {
    const module = await import('@capgo/capacitor-bluetooth-low-energy')
    const plugin = module.BluetoothLowEnergy || module.default || module
    if (!plugin || typeof plugin.initialize !== 'function') return null

    await plugin.initialize({ mode: 'central' })
    try {
      await plugin.requestPermissions?.()
    } catch {
      // Ignore; app may already have permissions.
    }
    return plugin
  }

  function matchBeaconName(deviceName) {
    if (!deviceName) return null
    for (const wantedName of beaconNames) {
      if (deviceName === wantedName) return wantedName
      if (deviceName.includes(wantedName)) return wantedName
    }
    return null
  }

  function startSimulation() {
    if (simTimer) clearInterval(simTimer)
    simTimer = setInterval(() => {
      if (!isScanning.value) return
      for (const [name, pos] of Object.entries(beaconPositions)) {
        if (beaconNames.length && !beaconNames.includes(name)) continue
        const dx = simulatedPosition.value.x - pos.x
        const dy = simulatedPosition.value.y - pos.y
        const dist = Math.max(0.3, Math.hypot(dx, dy))
        const noise = (Math.random() - 0.5) * 10
        const rssi = txPower - 10 * pathLoss * Math.log10(dist) + noise
        processBeaconRssi(name, rssi)
      }
    }, simulationIntervalMs)
  }

  async function startScan() {
    if (isScanning.value) return
    isScanning.value = true
    error.value = null
    resetState()

    if (!Capacitor.isNativePlatform()) {
      if (simulateInWeb) startSimulation()
      return
    }

    try {
      ble = await initNativeBle()
      if (!ble) {
        if (simulateInWeb) startSimulation()
        return
      }

      scanListener = await ble.addListener('deviceScanned', (event) => {
        const device = event?.device
        const deviceName = device?.name || ''
        const beaconName = matchBeaconName(deviceName)
        if (!beaconName) return
        processBeaconRssi(beaconName, device?.rssi)
      })

      await ble.startScan({ services: [], timeout: 0, allowDuplicates: true })
    } catch (e) {
      error.value = e instanceof Error ? e : new Error(String(e))
      if (simulateInWeb) startSimulation()
    }
  }

  async function stopScan() {
    isScanning.value = false
    if (simTimer) {
      clearInterval(simTimer)
      simTimer = null
    }
    if (scanListener) {
      try {
        await scanListener.remove()
      } catch {
        // ignore
      }
      scanListener = null
    }
    if (ble?.stopScan) {
      try {
        await ble.stopScan()
      } catch {
        // ignore
      }
    }
  }

  function setSimulatedPosition(x, y) {
    simulatedPosition.value = { x, y }
  }

  onUnmounted(() => {
    stopScan()
  })

  return {
    isScanning,
    error,
    rawBeacons,
    filteredBeacons,
    position,
    lastUpdatedAt,
    simulatedPosition,
    setSimulatedPosition,
    startScan,
    stopScan,
    normalizeHeadingDeg,
  }
}
