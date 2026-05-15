<template>
  <div class="mx-auto max-w-2xl px-4 py-6">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-800 tracking-tight">
        Add New Beacon
      </h2>
      <p class="text-sm text-slate-500 mt-1">Configure beacon device details</p>
    </div>

    <form @submit.prevent="submitForm" class="space-y-5">
      <!-- UUID Field -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">
          UUID <span class="text-red-500">*</span>
        </label>
        <input
          v-model="uuid"
          type="text"
          placeholder="e.g., 123e4567-e89b-12d3-a456-426614174000"
          class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-mono text-sm"
          :class="{ 'border-red-500 ring-2 ring-red-200': uuidError && !uuid }"
          required
        />
        <p v-if="uuidError && !uuid" class="mt-1 text-xs text-red-500">
          UUID is required
        </p>
      </div>

      <!-- Major & Minor Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Major <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="major"
            type="number"
            placeholder="Major value"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            :class="{
              'border-red-500 ring-2 ring-red-200': majorError && !major,
            }"
            required
          />
          <p v-if="majorError && !major" class="mt-1 text-xs text-red-500">
            Major is required
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            Minor <span class="text-red-500">*</span>
          </label>
          <input
            v-model.number="minor"
            type="number"
            placeholder="Minor value"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            :class="{
              'border-red-500 ring-2 ring-red-200': minorError && !minor,
            }"
            required
          />
          <p v-if="minorError && !minor" class="mt-1 text-xs text-red-500">
            Minor is required
          </p>
        </div>
      </div>

      <!-- Device Name -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Device Name
        </label>
        <div class="relative">
          <span
            class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"
          >
            <svg
              class="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="1.5"
                d="M9 3v2m6-2v2M9 19v2m6-2v2M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2zm3 8h8m-8 4h8"
              />
            </svg>
          </span>
          <input
            v-model="device_name"
            type="text"
            placeholder="e.g., Beacon-01"
            class="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
          />
        </div>
        <p class="mt-1 text-xs text-slate-400">
          Optional friendly name for this beacon
        </p>
      </div>

      <!-- Office Selection -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-1">
          Assign Office
        </label>
        <div class="relative">
          <select
            v-model="office_id"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all appearance-none bg-white"
          >
            <option value="">Select an office (optional)</option>
            <option v-for="o in offices" :key="o.id" :value="o.id">
              {{ o.office_name }}
            </option>
          </select>
          <div
            class="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none"
          >
            <svg
              class="w-4 h-4 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
        <p class="mt-1 text-xs text-slate-400">
          Optional: Assign this beacon to a specific office
        </p>
      </div>

      <!-- Coordinates Row -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Map Coordinates
        </label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs text-slate-500 mb-1"
              >X Coordinate</label
            >
            <input
              v-model.number="x"
              type="number"
              step="any"
              placeholder="X position"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label class="block text-xs text-slate-500 mb-1"
              >Y Coordinate</label
            >
            <input
              v-model.number="y"
              type="number"
              step="any"
              placeholder="Y position"
              class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
        <p class="mt-1 text-xs text-slate-400">
          Optional: Map positioning for indoor navigation
        </p>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-3 pt-4 border-t border-slate-200">
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <svg
            v-if="loading"
            class="w-4 h-4 animate-spin"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          <svg
            v-else
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          {{ loading ? "Saving..." : "Save Beacon" }}
        </button>
      </div>
    </form>

    <!-- Loading Offices State -->
    <div
      v-if="officeStore.fetchingOffices"
      class="mt-4 flex items-center justify-center py-2"
    >
      <div class="flex items-center gap-2">
        <div
          class="w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin"
        ></div>
        <span class="text-xs text-slate-500">Loading offices...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useBeaconStore } from "@/store/beacon";
import { useOfficeStore } from "@/store/office";

const emit = defineEmits(["created", "close"]);

const beaconStore = useBeaconStore();
const officeStore = useOfficeStore();

const offices = computed(() => officeStore.offices);

// Form fields
const uuid = ref("");
const major = ref(null);
const minor = ref(null);
const device_name = ref("");
const office_id = ref("");
const x = ref(0);
const y = ref(0);

// Validation errors
const uuidError = ref(false);
const majorError = ref(false);
const minorError = ref(false);

const loading = ref(false);

async function submitForm() {
  // Simple validation
  uuidError.value = !uuid.value;
  majorError.value = !major.value && major.value !== 0;
  minorError.value = !minor.value && minor.value !== 0;

  if (uuidError.value || majorError.value || minorError.value) {
    return;
  }

  loading.value = true;

  try {
    const result = await beaconStore.createBeacon({
      uuid: uuid.value,
      major: major.value,
      minor: minor.value,
      device_name: device_name.value,
      office_id: office_id.value || null,
      x: x.value || 0,
      y: y.value || 0,
    });

    emit("created", result);
    emit("close");
  } catch (err) {
    console.error("Failed to create beacon:", err);
    alert(err.message || "Failed to create beacon");
  } finally {
    loading.value = false;
  }
}

// Clear validation errors on input
const clearUuidError = () => {
  uuidError.value = false;
};
const clearMajorError = () => {
  majorError.value = false;
};
const clearMinorError = () => {
  minorError.value = false;
};

// Watch for input changes to clear errors
import { watch } from "vue";
watch(uuid, clearUuidError);
watch(major, clearMajorError);
watch(minor, clearMinorError);

onMounted(() => officeStore.fetchOffices());
</script>
