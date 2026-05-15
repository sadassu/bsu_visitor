<template>
  <div class="fixed inset-0 z-50 bg-black">
    <div class="absolute top-0 left-0 right-0 z-10 p-3 flex items-center justify-between gap-2">
      <button class="px-3 py-2 rounded bg-white/10 text-white text-sm" @click="handleClose">
        Close
      </button>
      <div class="flex-1 text-center text-xs text-white/80 truncate">
        <span v-if="distanceMeters !== null">Distance: {{ distanceMeters.toFixed(1) }} m</span>
        <span v-else>Waiting for position...</span>
        <span v-if="cameraError" class="text-red-300"> | Camera error</span>
      </div>
      <button
        class="px-3 py-2 rounded bg-yellow-500/90 text-black text-sm disabled:opacity-50"
        :disabled="!isSceneReady"
        @click="recenterWorld"
      >
        Recenter
      </button>
    </div>

    <div v-if="!aframeAvailable" class="absolute inset-0 flex items-center justify-center p-6 text-center text-white/80">
      A-Frame / AR.js scripts are not loaded. Check `client/index.html`.
    </div>

    <a-scene
      v-else
      ref="sceneEl"
      class="w-full h-full"
      embedded
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui
      renderer="antialias: true; alpha: true"
      arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
    >
      <a-entity ref="worldEl">
        <a-entity ref="markerEl">
          <!-- Simple 3D arrow marker (cylinder + cone) -->
          <a-cylinder radius="0.035" height="0.45" position="0 0.225 0" color="#FFD700"></a-cylinder>
          <a-cone radius-bottom="0.11" radius-top="0" height="0.18" position="0 0.54 0" color="#FFD700"></a-cone>
          <a-ring
            radius-inner="0.12"
            radius-outer="0.14"
            rotation="-90 0 0"
            position="0 0.02 0"
            color="#00E5FF"
            material="opacity: 0.8; transparent: true"
          ></a-ring>
          <a-text
            v-if="distanceMeters !== null"
            :value="`${distanceMeters.toFixed(1)} m`"
            position="0 0.8 0"
            align="center"
            color="#FFFFFF"
            scale="1.2 1.2 1.2"
            look-at="[camera]"
          ></a-text>
        </a-entity>

        <a-entity ref="rigEl" position="0 1.6 0">
          <a-entity
            ref="cameraEl"
            id="indoor-ar-camera"
            camera
            wasd-controls-enabled="false"
            look-controls="touchEnabled: false; mouseEnabled: false"
            position="0 0 0"
          ></a-entity>
        </a-entity>
      </a-entity>
    </a-scene>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'

const props = defineProps({
  userPosition: { type: Object, default: null }, // {x,y}
  targetPosition: { type: Object, required: true }, // {x,y}
  autoRecenterOnStart: { type: Boolean, default: true },
})

const emit = defineEmits(['close'])

const aframeAvailable = typeof window !== 'undefined' && typeof window.AFRAME !== 'undefined'

const sceneEl = ref(null)
const worldEl = ref(null)
const rigEl = ref(null)
const cameraEl = ref(null)
const markerEl = ref(null)

const isSceneReady = ref(false)
const cameraError = ref(null)
let cameraStream = null

const distanceMeters = computed(() => {
  if (!props.userPosition) return null
  const dx = props.targetPosition.x - props.userPosition.x
  const dy = props.targetPosition.y - props.userPosition.y
  return Math.hypot(dx, dy)
})

function setEntityPosition(el, x, y, z) {
  if (!el) return
  if (el.object3D && el.object3D.position) {
    el.object3D.position.set(x, y, z)
    return
  }
  el.setAttribute('position', `${x} ${y} ${z}`)
}

function updateRigAndMarker() {
  if (!isSceneReady.value) return
  if (!props.userPosition) return
  setEntityPosition(rigEl.value, props.userPosition.x, 1.6, -props.userPosition.y)
  setEntityPosition(markerEl.value, props.targetPosition.x, 0, -props.targetPosition.y)
}

function recenterWorld() {
  const cam = cameraEl.value
  const world = worldEl.value
  if (!cam?.object3D || !world?.object3D) return
  const yaw = cam.object3D.rotation.y
  world.object3D.rotation.y = -yaw
}

function handleClose() {
  emit('close')
}

function stopCameraStream() {
  if (cameraStream && typeof cameraStream.getTracks === 'function') {
    for (const track of cameraStream.getTracks()) {
      try {
        track.stop()
      } catch {
        // ignore
      }
    }
  }
  cameraStream = null

  // Extra safety: stop active <video> streams created by AR.js.
  // AR.js typically uses `id="arjs-video"`.
  const videos = Array.from(document.querySelectorAll('video#arjs-video, video.arjs-video'))
  for (const v of videos) {
    const stream = v?.srcObject
    if (stream && typeof stream.getTracks === 'function') {
      for (const t of stream.getTracks()) {
        try {
          t.stop()
        } catch {
          // ignore
        }
      }
    }
    try {
      v.srcObject = null
    } catch {
      // ignore
    }
  }
}

onMounted(async () => {
  if (!aframeAvailable) return
  await nextTick()

  const scene = sceneEl.value
  if (!scene) return

  scene.addEventListener('camera-error', (e) => {
    cameraError.value = e?.error || e?.detail?.error || new Error('camera-error')
  })

  scene.addEventListener('camera-init', (e) => {
    cameraStream = e?.detail?.stream || null
  })

  const onLoaded = () => {
    isSceneReady.value = true
    updateRigAndMarker()
    if (props.autoRecenterOnStart) {
      // Let one frame render so the camera gets an initial rotation, then recenter.
      setTimeout(() => recenterWorld(), 200)
    }
  }

  if (scene.hasLoaded) onLoaded()
  else scene.addEventListener('loaded', onLoaded, { once: true })
})

watch(
  () => [props.userPosition?.x, props.userPosition?.y, props.targetPosition?.x, props.targetPosition?.y],
  () => updateRigAndMarker()
)

onUnmounted(() => {
  stopCameraStream()
})
</script>
