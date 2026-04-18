<template>
  <div class="mx-auto max-w-5xl">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-slate-800">Visitor Queue</h1>
      <p class="text-sm text-slate-500 capitalize">
        {{ currentStatus }} visitor requests
      </p>

      <!-- STATUS BUTTONS -->
      <div class="mt-4 flex gap-2">
        <button
          v-for="status in statuses"
          :key="status"
          @click="changeStatus(status)"
          class="px-4 py-2 rounded-lg border text-sm font-medium transition"
          :class="[
            currentStatus === status
              ? 'bg-red-800 text-white border-red-800'
              : 'border-slate-300 text-slate-600 hover:bg-slate-100',
          ]"
        >
          {{ status }}
        </button>
      </div>
    </div>

    <!-- Error -->
    <p v-if="store.error" class="mb-3 text-red-600 font-medium">
      {{ store.error }}
    </p>

    <!-- Table -->
    <div class="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div
        v-if="store.logs.length === 0 && !store.loading"
        class="p-10 text-center text-slate-500"
      >
        No {{ currentStatus }} visitors.
      </div>

      <div v-else class="overflow-x-auto">
        <table class="min-w-full text-sm text-left">
          <thead>
            <tr>
              <th class="px-4 py-3">Visitor</th>
              <th class="px-4 py-3">Purpose</th>
              <th class="px-4 py-3">Office</th>
              <th class="px-4 py-3">Time In</th>
              <th class="px-4 py-3 text-center">Status</th>
            </tr>
          </thead>

          <tbody>
            <tr
              v-for="log in store.logs"
              :key="log.id"
              @click="openConfirm(log)"
              class="cursor-pointer hover:bg-slate-100 transition select-none"
              :class="{
                'opacity-50 cursor-not-allowed': log.status === 'completed',
              }"
            >
              <td class="px-4 py-3 font-medium text-slate-800">
                {{ log.visitor_name }}
              </td>

              <td class="px-4 py-3 text-slate-600">
                {{ log.purpose }}
              </td>

              <td class="px-4 py-3 text-slate-600">
                {{ log.office_name }}
              </td>

              <td class="px-4 py-3 text-slate-500">
                {{ log.time_in }}
              </td>

              <td class="px-4 py-3 text-center">
                <span
                  class="px-3 py-1 text-xs rounded-full font-semibold"
                  :class="{
                    'bg-red-100 text-red-800': log.status === 'pending',
                    'bg-yellow-100 text-yellow-800':
                      log.status === 'processing',
                    'bg-green-100 text-green-800': log.status === 'completed',
                  }"
                >
                  {{ log.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-6 flex justify-between items-center">
      <button
        class="px-4 py-2 rounded-lg border border-red-800 text-red-800 hover:bg-red-800 hover:text-white transition disabled:opacity-50"
        @click="prevPage"
        :disabled="store.page <= 1 || store.loading"
      >
        Prev
      </button>

      <span class="text-sm text-slate-600"> Page {{ store.page }} </span>

      <button
        class="px-4 py-2 rounded-lg border border-red-800 text-red-800 hover:bg-red-800 hover:text-white transition disabled:opacity-50"
        @click="nextPage"
        :disabled="store.loading"
      >
        Next
      </button>
    </div>

    <!-- MODAL -->
    <BaseModal v-model="isModalOpen">
      <template #header>
        <h2 class="text-lg font-semibold text-slate-800">Confirm Action</h2>
      </template>

      <div v-if="selectedLog">
        <p class="text-slate-700">
          Mark visitor
          <span class="font-semibold">
            {{ selectedLog.visitor_name }}
          </span>
          as
          <span
            class="font-bold"
            :class="{
              'text-yellow-600': nextStatus === 'processing',
              'text-green-600': nextStatus === 'completed',
            }"
          >
            {{ nextStatus.toUpperCase() }}
          </span>
          ?
        </p>
      </div>

      <template #footer>
        <button class="px-4 py-2 border rounded-lg" @click="closeModal">
          Cancel
        </button>

        <button
          class="px-4 py-2 text-white rounded-lg"
          :class="{
            'bg-yellow-500 hover:bg-yellow-600': nextStatus === 'processing',
            'bg-green-600 hover:bg-green-700': nextStatus === 'completed',
          }"
          @click="confirmNextStatus"
        >
          Confirm
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from "vue";
import BaseModal from "@/components/BaseModal.vue";
import { useVisitorLogStore } from "@/store/visitorLog";

const store = useVisitorLogStore();

const isModalOpen = ref(false);
const selectedLog = ref(null);

const currentStatus = ref("pending");
const statuses = ["pending", "processing", "completed"];

// ✅ Determine next status
const nextStatus = computed(() => {
  if (!selectedLog.value) return "";

  if (selectedLog.value.status === "pending") return "processing";
  if (selectedLog.value.status === "processing") return "completed";

  return "";
});

const loadStatus = async (status = currentStatus.value, page = store.page) => {
  currentStatus.value = status;

  await store.fetchByStatus({
    status,
    page,
    perPage: store.perPage,
  });
};

const changeStatus = (status) => {
  store.page = 1;
  loadStatus(status, 1);
};

// ✅ Allow pending + processing only
const openConfirm = (log) => {
  if (log.status === "completed") return;

  selectedLog.value = log;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  selectedLog.value = null;
};

// ✅ Dynamic request
const confirmNextStatus = async () => {
  if (!selectedLog.value || !nextStatus.value) return;

  await fetch(
    `${import.meta.env.VITE_API_BASE}/visitor-status/${selectedLog.value.id}/status`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        status: nextStatus.value,
      }),
    },
  );

  closeModal();
  await loadStatus(currentStatus.value, store.page);
};

const nextPage = () => loadStatus(currentStatus.value, store.page + 1);

const prevPage = () => {
  if (store.page > 1) {
    loadStatus(currentStatus.value, store.page - 1);
  }
};

// ✅ Auto refresh
let intervalId = null;

onMounted(() => {
  loadStatus();

  intervalId = setInterval(() => {
    loadStatus(currentStatus.value, store.page);
  }, 10000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>
