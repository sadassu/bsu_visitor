<template>
  <Navbar />
  <div class="min-h-screen bg-slate-100 px-4 sm:px-6 lg:px-8 md:pl-64">
    <div
      class="mx-auto max-w-4xl border border-slate-200 bg-white p-8 shadow-[0_20px_80px_rgba(15,23,42,0.08)]"
    >
      <div class="mb-6 text-center">
        <p
          class="text-sm font-semibold uppercase tracking-[0.28em] text-red-600"
        >
          Visitor destination
        </p>
        <h1 class="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
          Scan the QR code to see the destination
        </h1>
        <p class="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
          Allow camera and location access to view the AR destination marker.
        </p>
      </div>

      <div
        v-if="loading"
        class="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600"
      >
        Loading destination…
      </div>

      <div
        v-else-if="error"
        class="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"
      >
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p class="text-sm font-semibold text-slate-700">Visitor</p>
            <p class="mt-3 text-lg font-semibold text-slate-900">
              {{ visitor.fullname }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              {{ visitor.contact_number }}
            </p>
            <p class="mt-1 text-sm text-slate-600">{{ visitor.address }}</p>
          </div>

          <div class="rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <p class="text-sm font-semibold text-slate-700">Destination</p>
            <p class="mt-3 text-lg font-semibold text-slate-900">
              {{ office.office_name }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              Type: {{ office.type || "Unknown" }}
            </p>
            <div class="mt-4 text-sm text-slate-600 space-y-1">
              <p><strong>Latitude:</strong> {{ office.latitude }}</p>
              <p><strong>Longitude:</strong> {{ office.longitude }}</p>
              <p><strong>Altitude:</strong> 0</p>
            </div>
          </div>
        </div>

        <div class="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p class="text-sm font-semibold text-slate-700">
            AR destination marker
          </p>
          <p class="mt-2 text-sm text-slate-500">
            Point a mobile device camera at the world and follow the red AR
            marker to your destination.
          </p>

          <div class="mt-4 flex flex-wrap gap-3">
            <button
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              :disabled="
                !isWebcamSupported || cameraAllowed || cameraRequesting
              "
              @click="requestCamera"
            >
              {{
                cameraAllowed
                  ? "Camera Allowed"
                  : cameraRequesting
                    ? "Allowing Camera…"
                    : "Allow Camera"
              }}
            </button>

            <button
              class="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              :disabled="gpsAllowed || gpsRequesting"
              @click="requestGps"
            >
              {{
                gpsAllowed
                  ? "GPS Allowed"
                  : gpsRequesting
                    ? "Allowing GPS…"
                    : "Allow GPS"
              }}
            </button>
          </div>

          <div class="mt-3 flex flex-wrap gap-2 text-sm">
            <span :class="cameraAllowed ? 'text-emerald-700' : 'text-amber-600'"
              >Camera: {{ cameraAllowed ? "Granted" : "Not Granted" }}</span
            >
            <span :class="gpsAllowed ? 'text-emerald-700' : 'text-amber-600'"
              >GPS: {{ gpsAllowed ? "Granted" : "Not Granted" }}</span
            >
          </div>

          <div
            v-if="permissionError"
            class="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {{ permissionError }}
          </div>

          <div
            class="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-black"
          >
            <div v-if="!isWebcamSupported" class="p-6 text-sm text-slate-300">
              Your browser does not support camera/location access for the AR
              view. Use a mobile browser and allow camera access to see the red
              destination marker.
            </div>
            <div
              v-else-if="!cameraAllowed || !gpsAllowed"
              class="p-6 text-sm text-slate-300"
            >
              Please allow camera and GPS access using the buttons above to load
              the AR destination marker.
            </div>
            <div v-else class="relative h-105 w-full">
              <a-scene
                embedded
                vr-mode-ui="enabled: false"
                arjs="sourceType: webcam; videoTexture: true; debugUIEnabled: false;"
                renderer="antialias: true; alpha: true"
                style="width: 100%; height: 100%"
              >
                <a-camera gps-new-camera="gpsMinDistance: 5"></a-camera>

                <!-- Big glowing marker, visible through walls -->
                <a-entity
                  :gps-new-entity-place="gpsPlace"
                  position="0 0 0"
                  scale="20 20 20"
                  geometry="primitive: sphere; radius: 1"
                  material="color: #ff4444; opacity: 0.65; transparent: true; shader: flat; side: double"
                  gltf-model="#"
                ></a-entity>
                
              </a-scene>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import Navbar from "../../components/Navbar.vue";
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const visitor = ref(null);
const office = ref(null);
const loading = ref(true);
const error = ref("");

const isWebcamSupported = ref(false);
onMounted(() => {
  isWebcamSupported.value = !!navigator?.mediaDevices?.getUserMedia;
});
const cameraAllowed = ref(false);
const gpsAllowed = ref(false);
const cameraRequesting = ref(false);
const gpsRequesting = ref(false);
const permissionError = ref("");
const gpsPlace = computed(() => {
  if (!office.value) return "";
  return `latitude: ${office.value.latitude}; longitude: ${office.value.longitude}`;
});

const requestCamera = async () => {
  cameraRequesting.value = true;
  permissionError.value = "";
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
    cameraAllowed.value = true;
  } catch (err) {
    permissionError.value = "Camera access denied or not available.";
  } finally {
    cameraRequesting.value = false;
  }
};

const requestGps = () => {
  gpsRequesting.value = true;
  permissionError.value = "";
  if (!navigator.geolocation) {
    permissionError.value = "Geolocation is not supported by this browser.";
    gpsRequesting.value = false;
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (position) => {
      gpsAllowed.value = true;
      gpsRequesting.value = false;
    },
    (err) => {
      permissionError.value = "Location access denied or not available.";
      gpsRequesting.value = false;
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
};

const loadVisitorAccess = async () => {
  const token = route.params.token;
  if (!token) {
    error.value = "No visitor token provided.";
    loading.value = false;
    return;
  }

  try {
    const apiBase =
      import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
    const response = await fetch(
      `${apiBase}/visitor-links/${encodeURIComponent(token)}`,
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error || response.statusText);
    }

    visitor.value = data.visitor;
    office.value = data.office;
  } catch (err) {
    error.value = err?.message || "Unable to load destination details.";
  } finally {
    loading.value = false;
  }
};

onMounted(loadVisitorAccess);
</script>
<style scoped>
.a-scene-container canvas,
.a-scene canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
