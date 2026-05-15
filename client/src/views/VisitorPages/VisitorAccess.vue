<template>
  <div class="min-h-screen bg-black text-white p-6 space-y-6">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Indoor AR Wayfinding</h1>
        <p class="text-xs text-white/70">
          1) Scan an origin QR to calibrate | 2) Start BLE | 3) Open AR
        </p>
      </div>
      <button
        class="px-3 py-2 rounded text-sm"
        :class="isScanningBLE ? 'bg-red-600' : 'bg-green-600'"
        @click="toggleBLE"
      >
        {{ isScanningBLE ? 'Stop BLE' : 'Start BLE' }}
      </button>
    </div>

    <!-- Visitor link -->
    <div class="bg-white/10 p-4 rounded-xl">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-bold">Visitor</h2>
        <div v-if="visitorToken" class="text-[11px] text-white/50 font-mono">
          {{ visitorToken }}
        </div>
      </div>

      <div v-if="visitorLinkLoading" class="mt-2 text-xs text-white/60">
        Loading visitor link...
      </div>
      <div v-else-if="visitorLinkError" class="mt-2 text-xs text-red-300">
        {{ visitorLinkError }}
      </div>
      <div v-else-if="visitor && office" class="mt-2 text-xs text-white/70 space-y-1">
        <div><span class="text-white/50">Name:</span> {{ visitor.fullname }}</div>
        <div><span class="text-white/50">Destination:</span> {{ office.office_name }}</div>
      </div>
      <div v-else class="mt-2 text-xs text-white/60">No visitor link data.</div>
    </div>

    <!-- BLE status -->
    <div class="bg-white/10 p-4 rounded-xl">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold">BLE Beacons</h2>
        <div class="text-xs text-white/60">
          {{ Object.keys(filteredBeacons).length }} detected
        </div>
      </div>

      <div v-if="!isScanningBLE" class="text-xs text-white/60">
        BLE scanning is stopped.
      </div>
      <div v-else-if="Object.keys(filteredBeacons).length === 0" class="text-xs text-white/60">
        Scanning... make sure ESP32 beacons are advertising.
      </div>

      <div v-for="(b, name) in filteredBeacons" :key="name" class="text-xs py-2 border-t border-white/10">
        <div class="flex items-center justify-between">
          <div class="font-mono">{{ name }}</div>
          <div class="font-mono">RSSI: {{ b.rssi.toFixed(0) }} dBm</div>
        </div>
        <div class="text-white/60">
          Distance: {{ b.distance.toFixed(1) }} m | Confidence: {{ b.confidence }}%
        </div>
      </div>

      <div class="mt-3 text-[11px] text-white/60">
        Configured beacons:
        <span class="font-mono">{{ BEACON_NAMES.join(', ') || '(none)' }}</span>
      </div>
    </div>

    <!-- Calibration -->
    <div class="bg-white/10 p-4 rounded-xl space-y-3">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-bold">QR Calibration</h2>
        <div class="text-xs" :class="isCalibrated ? 'text-green-300' : 'text-yellow-300'">
          {{ isCalibrated ? 'Calibrated' : 'Not calibrated' }}
        </div>
      </div>

      <div class="text-xs text-white/70">
        Scan a QR placed at a known coordinate (usually the origin <span class="font-mono">(0,0)</span>).
        We compute an offset so BLE positions align to your map.
      </div>

      <div class="flex gap-2 flex-wrap">
        <button class="bg-green-600 px-3 py-2 rounded text-sm" @click="openScanner">
          Scan QR to Calibrate
        </button>
        <button v-if="isCalibrated" class="bg-white/10 px-3 py-2 rounded text-sm" @click="resetCalibration">
          Reset Calibration
        </button>
      </div>

      <div class="text-xs text-white/70">
        Offset: <span class="font-mono">({{ calibrationOffset.x.toFixed(2) }}, {{ calibrationOffset.y.toFixed(2) }})</span>
        <span v-if="lastCalibrationLabel" class="text-white/50"> | {{ lastCalibrationLabel }}</span>
      </div>

      <!-- Reference QR generation -->
      <div class="pt-2 border-t border-white/10">
        <div class="text-xs font-bold mb-2">Generate Reference QR (print these)</div>
        <div class="grid grid-cols-2 gap-2">
          <button class="bg-blue-600 p-2 rounded text-xs" @click="generateLocationQR('origin', 0, 0)">
            Origin (0,0)
          </button>
          <button class="bg-blue-600 p-2 rounded text-xs" @click="generateLocationQR('hallway_a', 10, 0)">
            Hallway A (10,0)
          </button>
          <button class="bg-blue-600 p-2 rounded text-xs" @click="generateLocationQR('hallway_b', 10, 15)">
            Hallway B (10,15)
          </button>
          <button class="bg-purple-600 p-2 rounded text-xs" @click="generateLocationQR('accre', 20, 0)">
            Accre (20,0)
          </button>
          <button class="bg-yellow-600 text-black p-2 rounded text-xs" @click="generateLocationQR('registrar', 10, 25)">
            Registrar (10,25)
          </button>
        </div>

        <div v-if="qrImageUrl" class="mt-3 bg-white p-3 rounded flex flex-col items-center">
          <img :src="qrImageUrl" alt="QR Code" class="w-40 h-40" />
          <div class="text-[11px] text-black/70 mt-2 text-center">{{ qrDescription }}</div>
          <a :href="qrImageUrl" download="qrcode.png" class="mt-2 bg-green-600 px-3 py-1 rounded text-sm text-white">
            Download
          </a>
        </div>
      </div>
    </div>

    <!-- Current position -->
    <div class="bg-gradient-to-r from-blue-900/50 to-purple-900/50 p-4 rounded-xl">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-xs text-white/70">CURRENT POSITION</div>
          <div v-if="calibratedPosition" class="font-mono text-xl font-bold">
            X: {{ calibratedPosition.x.toFixed(2) }} | Y: {{ calibratedPosition.y.toFixed(2) }}
          </div>
          <div v-else class="text-sm text-white/70">Waiting for BLE...</div>
        </div>
        <div class="text-right text-xs text-white/60">
          <div v-if="bleLastUpdatedAt">Updated: {{ secondsSinceUpdate }}s ago</div>
          <div v-if="bleError" class="text-red-300">BLE error</div>
        </div>
      </div>

      <div v-if="destinationKey" class="mt-2 text-xs text-white/80">
        Destination: <span class="font-mono">{{ destinationKey }}</span> | Remaining:
        <span class="font-mono">{{ remainingDistance.toFixed(1) }} m</span>
      </div>
    </div>

    <!-- Destination -->
    <div class="bg-white/10 p-4 rounded-xl space-y-3">
      <h2 class="text-sm font-bold">Destination</h2>
      <div class="flex gap-2 flex-wrap">
        <button
          class="px-4 py-2 rounded text-sm"
          :class="destinationKey === 'demo' ? 'bg-cyan-500 text-black' : 'bg-white/10'"
          @click="setDestination('demo')"
        >
          Demo (7,10)
        </button>
        <button
          class="px-4 py-2 rounded text-sm"
          :class="destinationKey === 'accre' ? 'bg-purple-600' : 'bg-white/10'"
          @click="setDestination('accre')"
        >
          Accre (20,0)
        </button>
        <button
          class="px-4 py-2 rounded text-sm text-black"
          :class="destinationKey === 'registrar' ? 'bg-yellow-600' : 'bg-yellow-600/40'"
          @click="setDestination('registrar')"
        >
          Registrar (10,25)
        </button>
      </div>

      <button
        class="w-full px-4 py-3 rounded text-sm disabled:opacity-50"
        :class="canOpenAr ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white'"
        :disabled="!canOpenAr"
        @click="openAr"
      >
        Open AR Waypoint
      </button>

      <div class="text-[11px] text-white/60">
        Tip: After scanning the origin QR, open AR while still facing the same direction for best alignment.
      </div>
    </div>

    <!-- Manual override (also updates simulation position on web) -->
    <div class="bg-white/10 p-4 rounded-xl space-y-2">
      <div class="text-xs font-bold">Manual Position (testing)</div>
      <div class="flex gap-2 flex-wrap">
        <button class="bg-white/10 px-3 py-2 rounded text-xs" @click="setManualPosition(0, 0, 'Origin')">(0,0)</button>
        <button class="bg-white/10 px-3 py-2 rounded text-xs" @click="setManualPosition(10, 0, 'Hallway A')">(10,0)</button>
        <button class="bg-white/10 px-3 py-2 rounded text-xs" @click="setManualPosition(10, 15, 'Hallway B')">(10,15)</button>
        <button class="bg-white/10 px-3 py-2 rounded text-xs" @click="setManualPosition(20, 0, 'Accre')">(20,0)</button>
        <button class="bg-white/10 px-3 py-2 rounded text-xs" @click="setManualPosition(10, 25, 'Registrar')">(10,25)</button>
      </div>
      <div class="text-[11px] text-white/60">
        Manual override affects AR immediately. On web, it also moves the BLE simulator.
      </div>
    </div>

    <!-- QR Scanner Modal -->
    <div v-if="showScanner" class="fixed inset-0 z-50 bg-black">
      <div class="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between">
        <div class="text-sm font-bold">Scan QR</div>
        <button class="px-3 py-2 rounded bg-white/10 text-sm" @click="closeScanner">Close</button>
      </div>
      <div class="pt-14 px-3">
        <div id="qr-reader" class="w-full rounded overflow-hidden bg-black/40"></div>
        <div class="mt-3 text-xs text-white/70 min-h-[1.25rem]">{{ scanMessage }}</div>
      </div>
    </div>

    <!-- AR Overlay -->
    <IndoorArOverlay
      v-if="showAR"
      :user-position="arUserPosition"
      :target-position="destinationCoordinates"
      :auto-recenter-on-start="true"
      @close="closeAr"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import QRCode from 'qrcode'
import { Html5Qrcode } from 'html5-qrcode'
import IndoorArOverlay from '../../components/IndoorArOverlay.vue'
import { useBleIndoorPosition } from '../../composables/useBleIndoorPosition.js'
import { useVisitorLinkStore } from '../../store/visitorLinks.js'

// Update these to match your ESP32 advertised names (case-sensitive).
const BEACON_NAMES = ['ESP32_B1', 'ESP32_B2', 'ESP32_B3']

// Set beacon coordinates (meters) in your indoor map coordinate system.
// IMPORTANT: These must be measured relative to the same origin you calibrate with QR.
const BEACON_POSITIONS = {
  ESP32_TEST: { x: 0, y: 0 },
  ESP32_B2: { x: 10, y: 0 },
  ESP32_B3: { x: 5, y: 8 },
}

const destinationKey = ref('demo')
const DESTINATIONS = {
  demo: { x: 7, y: 10 },
  accre: { x: 20, y: 0 },
  registrar: { x: 10, y: 25 },
}

const showScanner = ref(false)
const scanMessage = ref('')
const qrImageUrl = ref('')
const qrDescription = ref('')
let html5QrCode = null

const showAR = ref(false)

// Manual override mainly for web/simulator testing
const manualOverride = ref(null) // {x,y,label}

// Calibration offset: corrected = raw - offset
const calibrationOffset = ref(loadCalibrationOffset())
const hasCalibrationScan = ref(loadHasCalibrationScan())
const isCalibrated = computed(() => hasCalibrationScan.value)
const lastCalibrationLabel = ref(loadCalibrationLabel())

const route = useRoute()
const visitorLinkStore = useVisitorLinkStore()
const visitorToken = computed(() => String(route.params.token || ''))
const visitorLinkLoading = computed(() => visitorLinkStore.loading)
const visitorLinkError = computed(() => visitorLinkStore.error)
const visitor = computed(() => visitorLinkStore.currentLink?.visitor || null)
const office = computed(() => visitorLinkStore.currentLink?.office || null)

const {
  isScanning: isScanningBLE,
  error: bleError,
  filteredBeacons,
  position: bleRawPosition,
  lastUpdatedAt: bleLastUpdatedAt,
  setSimulatedPosition,
  startScan: startBLE,
  stopScan: stopBLE,
} = useBleIndoorPosition({
  beaconNames: BEACON_NAMES,
  beaconPositions: BEACON_POSITIONS,
  txPower: -59,
  pathLoss: 2.2,
  simulateInWeb: true,
})

const destinationCoordinates = computed(() => DESTINATIONS[destinationKey.value] || { x: 0, y: 0 })

function applyCalibrationOffset(pos) {
  if (!pos) return null
  return {
    x: pos.x - calibrationOffset.value.x,
    y: pos.y - calibrationOffset.value.y,
    source: pos.source || 'BLE',
  }
}

const calibratedBlePosition = computed(() => applyCalibrationOffset(bleRawPosition.value))

const calibratedPosition = computed(() => {
  if (manualOverride.value) return { x: manualOverride.value.x, y: manualOverride.value.y, source: 'manual' }
  return calibratedBlePosition.value
})

const remainingDistance = computed(() => {
  if (!destinationKey.value || !calibratedPosition.value) return 0
  const dx = destinationCoordinates.value.x - calibratedPosition.value.x
  const dy = destinationCoordinates.value.y - calibratedPosition.value.y
  return Math.hypot(dx, dy)
})

const secondsSinceUpdate = computed(() => {
  if (!bleLastUpdatedAt.value) return '-'
  return Math.max(0, Math.round((Date.now() - bleLastUpdatedAt.value) / 1000))
})

const canOpenAr = computed(() => !!destinationKey.value && !!calibratedPosition.value)

const arUserPosition = computed(() => {
  // AR always uses the best-available position
  return calibratedPosition.value
})

function setDestination(key) {
  destinationKey.value = key
}

function toggleBLE() {
  if (isScanningBLE.value) stopBLE()
  else startBLE()
}

async function generateLocationQR(id, x, y) {
  const payload = JSON.stringify({ id, x, y })
  qrImageUrl.value = await QRCode.toDataURL(payload, { width: 320, margin: 1 })
  qrDescription.value = payload
}

function parseQrPayload(text) {
  // Accept JSON payloads like {"id":"origin","x":0,"y":0}
  try {
    const obj = JSON.parse(text)
    if (obj && typeof obj === 'object' && typeof obj.x === 'number' && typeof obj.y === 'number') return obj
  } catch {
    // ignore
  }
  return null
}

function saveHasCalibrationScan(value) {
  try {
    localStorage.setItem('indoor_has_calibration_scan_v1', value ? '1' : '0')
  } catch {
    // ignore
  }
}

function loadHasCalibrationScan() {
  try {
    const raw = localStorage.getItem('indoor_has_calibration_scan_v1')
    if (raw === null) {
      // Backwards-compatible fallback for older builds that only stored the offset.
      const offset = loadCalibrationOffset()
      return Math.abs(offset.x) > 0.0001 || Math.abs(offset.y) > 0.0001
    }
    return raw === '1'
  } catch {
    return false
  }
}

function saveCalibrationOffset(offset) {
  try {
    localStorage.setItem('indoor_calibration_offset_v1', JSON.stringify(offset))
  } catch {
    // ignore
  }
}

function loadCalibrationOffset() {
  try {
    const raw = localStorage.getItem('indoor_calibration_offset_v1')
    if (!raw) return { x: 0, y: 0 }
    const parsed = JSON.parse(raw)
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return { x: parsed.x, y: parsed.y }
  } catch {
    // ignore
  }
  return { x: 0, y: 0 }
}

function saveCalibrationLabel(label) {
  try {
    localStorage.setItem('indoor_calibration_label_v1', label || '')
  } catch {
    // ignore
  }
}

function loadCalibrationLabel() {
  try {
    return localStorage.getItem('indoor_calibration_label_v1') || ''
  } catch {
    return ''
  }
}

function resetCalibration() {
  calibrationOffset.value = { x: 0, y: 0 }
  lastCalibrationLabel.value = ''
  hasCalibrationScan.value = false
  saveCalibrationOffset(calibrationOffset.value)
  saveCalibrationLabel('')
  saveHasCalibrationScan(false)
}

async function openScanner() {
  scanMessage.value = 'Starting camera...'
  showScanner.value = true
  await nextTick()

  try {
    html5QrCode = new Html5Qrcode('qr-reader')
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        scanMessage.value = `Scanned: ${decodedText}`
        const payload = parseQrPayload(decodedText)

        // Compute calibration offset if we have a live BLE position.
        // corrected = raw - offset  =>  offset = raw - known
        if (payload && bleRawPosition.value) {
          calibrationOffset.value = {
            x: bleRawPosition.value.x - payload.x,
            y: bleRawPosition.value.y - payload.y,
          }
          saveCalibrationOffset(calibrationOffset.value)
          lastCalibrationLabel.value = `Calibrated at ${payload.id || 'QR'} (${payload.x},${payload.y})`
          saveCalibrationLabel(lastCalibrationLabel.value)
          hasCalibrationScan.value = true
          saveHasCalibrationScan(true)
        } else if (payload) {
          // No BLE fix yet; store the label anyway so user knows what was scanned.
          lastCalibrationLabel.value = `Scanned ${payload.id || 'QR'} (${payload.x},${payload.y})`
          saveCalibrationLabel(lastCalibrationLabel.value)
          hasCalibrationScan.value = true
          saveHasCalibrationScan(true)
        }

        await closeScanner()

        // If they scanned the origin, jump straight into AR for best heading alignment.
        if (payload?.id === 'origin' || (payload?.x === 0 && payload?.y === 0)) {
          openAr()
        }
      },
      () => {
        // Per-frame decode error; ignore.
      }
    )
  } catch (e) {
    scanMessage.value = `Scanner error: ${e instanceof Error ? e.message : String(e)}`
  }
}

async function closeScanner() {
  if (!showScanner.value) return
  showScanner.value = false
  if (html5QrCode) {
    try {
      await html5QrCode.stop()
    } catch {
      // ignore
    }
    try {
      await html5QrCode.clear()
    } catch {
      // ignore
    }
    html5QrCode = null
  }
}

function openAr() {
  showAR.value = true
}

function closeAr() {
  showAR.value = false
}

function setManualPosition(x, y, label) {
  manualOverride.value = { x, y, label }
  setSimulatedPosition(x, y)
}

function destinationKeyFromOffice(officeObj) {
  const name = String(officeObj?.office_name || '').toLowerCase()
  if (name.includes('accre')) return 'accre'
  if (name.includes('registrar')) return 'registrar'
  return ''
}

async function loadVisitorLinkFromToken() {
  if (!visitorToken.value) return
  try {
    await visitorLinkStore.fetchByToken(visitorToken.value)
    const nextKey = destinationKeyFromOffice(visitorLinkStore.currentLink?.office)
    if (nextKey) destinationKey.value = nextKey
  } catch {
    // store already sets error state
  }
}

watch(bleRawPosition, (pos) => {
  // If user never set a manual override, keep simulator position loosely aligned for demo.
  if (!pos || manualOverride.value) return
  setSimulatedPosition(pos.x, pos.y)
})

onMounted(() => {
  loadVisitorLinkFromToken()
  // Start BLE automatically for convenience.
  startBLE()
})

onUnmounted(() => {
  stopBLE()
  closeScanner()
})
</script>
