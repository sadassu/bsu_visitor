<template>
  <div class="w-full">
    <!-- HEADER -->
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="text-lg font-semibold text-slate-800">Beacons</h2>
        <p class="text-sm text-slate-500">
          Manage BLE beacons for indoor navigation
        </p>
      </div>

      <button
        @click="refresh"
        class="rounded-2xl bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
      >
        Refresh
      </button>
      <!-- ADD BEACON BUTTON -->
      <button
        @click="showModal = true"
        class="rounded-2xl bg-red-800 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
      >
        + Add Beacon
      </button>
    </div>

    <!-- ERROR -->
    <p v-if="error" class="mb-3 text-sm text-red-800">
      {{ error }}
    </p>

    <!-- TABLE -->
    <div class="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table class="min-w-full text-sm">
        <thead class="bg-slate-50 text-slate-600">
          <tr>
            <th class="px-4 py-3 text-left">ID</th>
            <th class="px-4 py-3 text-left">UUID</th>
            <th class="px-4 py-3 text-left">Major</th>
            <th class="px-4 py-3 text-left">Minor</th>
            <th class="px-4 py-3 text-left">Device</th>
            <th class="px-4 py-3 text-left">Office</th>
            <th class="px-4 py-3 text-left">X</th>
            <th class="px-4 py-3 text-left">Y</th>
            <th class="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>

        <tbody>
          <!-- LOADING -->
          <tr v-if="loading.fetch">
            <td colspan="9" class="text-center py-6 text-slate-500">
              Loading beacons...
            </td>
          </tr>

          <!-- DATA -->
          <tr
            v-for="b in beacons"
            :key="b.id"
            class="border-t hover:bg-slate-50 transition"
          >
            <td class="px-4 py-3">{{ b.id }}</td>
            <td class="px-4 py-3 font-mono text-xs">{{ b.uuid }}</td>
            <td class="px-4 py-3">{{ b.major ?? "-" }}</td>
            <td class="px-4 py-3">{{ b.minor ?? "-" }}</td>
            <td class="px-4 py-3">{{ b.device_name ?? "-" }}</td>
            <td class="px-4 py-3">{{ b.office_id ?? "-" }}</td>
            <td class="px-4 py-3">{{ b.x }}</td>
            <td class="px-4 py-3">{{ b.y }}</td>

            <td class="px-4 py-3 text-right space-x-2">
              <button
                class="px-3 py-1 text-xs rounded-xl bg-slate-100 hover:bg-slate-200"
                @click="$emit('edit', b)"
              >
                Edit
              </button>

              <button
                class="px-3 py-1 text-xs rounded-xl bg-red-100 text-red-800 hover:bg-red-200"
                @click="removeBeacon(b.id)"
              >
                Delete
              </button>
            </td>
          </tr>

          <!-- EMPTY -->
          <tr v-if="!loading.fetch && beacons.length === 0">
            <td colspan="9" class="text-center py-6 text-slate-500">
              No beacons found
            </td>
          </tr>
        </tbody>
      </table>
      <BaseModal v-model="showModal">
        <template #header>
          <h2 class="text-lg font-semibold text-slate-800">Add Beacon</h2>
          <p class="text-sm text-slate-500">
            Register a BLE beacon for indoor navigation.
          </p>
        </template>

        <!-- YOUR FORM COMPONENT -->
        <BeaconForm
          @created="onCreated"
          @update:modelValue="showModal = false"
        />

        <template #footer>
          <button
            @click="showModal = false"
            class="rounded-xl border px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
        </template>
      </BaseModal>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from "vue";
import { useBeaconStore } from "../../store/beacon.js";
import BaseModal from "@/components/BaseModal.vue";
import BeaconForm from "../AdminPages/CreateBeaconForm.vue";
const emit = defineEmits(["edit"]);

const beaconStore = useBeaconStore();

const showModal = ref(false);

const beacons = computed(() => beaconStore.beacons);
const loading = computed(() => beaconStore.loading);
const error = computed(() => beaconStore.error);

/* FETCH */
async function refresh() {
  await beaconStore.fetchBeacons();
}

/* DELETE */
async function removeBeacon(id) {
  if (!confirm("Delete this beacon?")) return;

  try {
    await beaconStore.deleteBeacon(id);
  } catch (err) {
    alert(err.message);
  }
}

const onCreated = async () => {
  await refresh();
  showModal.value = false;
};

onMounted(refresh);
</script>
