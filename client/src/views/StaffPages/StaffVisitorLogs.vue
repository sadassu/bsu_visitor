<template>
  <div class="staff-visitor-logs">
    <h1>Visitor Logs</h1>
    <p>This page is under construction. Please check back later for updates.</p>
  </div>
  <table class="min-w-full divide-y divide-slate-200 text-sm">
    <thead class="bg-slate-50 text-slate-700">
      <tr>
        <th class="px-4 py-3 text-left font-semibold">Time In</th>
        <th class="px-4 py-3 text-left font-semibold">Visitor</th>
        <th class="px-4 py-3 text-left font-semibold">Office</th>
        <th class="px-4 py-3 text-left font-semibold">Purpose</th>
        <th class="px-4 py-3 text-left font-semibold">Time Out</th>
        <th class="px-4 py-3 text-left font-semibold">Action</th>
      </tr>
    </thead>

    <tbody class="divide-y divide-slate-200 bg-white">
      <tr v-if="!visitorLogStore.loading && visitorLogStore.logs.length === 0">
        <td colspan="6" class="px-4 py-8 text-center text-sm text-slate-500">
          No visitor logs found.
        </td>
      </tr>

      <tr
        v-for="log in visitorLogStore.logs"
        :key="log.id"
        class="hover:bg-slate-100 transition"
      >
        <td class="whitespace-nowrap px-4 py-4 text-slate-700">
          {{ formatDateTime(log.time_in) }}
        </td>

        <td class="px-4 py-4 text-slate-700">
          <div class="font-semibold text-slate-900">
            {{ log.visitor_name }}
          </div>
          <div class="text-sm text-slate-500">
            {{ log.contact_number }}
          </div>
        </td>

        <td class="px-4 py-4 text-slate-700">
          {{ log.office_name }}
        </td>

        <td class="px-4 py-4 text-slate-700">
          {{ log.purpose || "-" }}
        </td>

        <td class="px-4 py-4 text-slate-700">
          {{ log.time_out ? formatDateTime(log.time_out) : "Active" }}
        </td>

        <!-- ✅ ACTION BUTTON -->
        <td class="px-4 py-4">
          <button
            @click="handleDelete(log.id)"
            class="rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 transition"
          >
            Delete
          </button>
        </td>
      </tr>
    </tbody>
  </table>
</template>
<script setup>
import { onMounted } from "vue";
import { useVisitorLogStore } from "../../store/visitorLog";

const visitorLogStore = useVisitorLogStore();

// Fetch logs on page load
const getLogs = async () => {
  try {
    await visitorLogStore.fetchVisitLogs({
      page: 1,
      perPage: visitorLogStore.perPage,
    });
  } catch (error) {
    console.error(error);
  }
};

// Delete handler
const handleDelete = async (id) => {
  const confirmDelete = confirm("Are you sure you want to delete this log?");
  if (!confirmDelete) return;

  try {
    await visitorLogStore.deleteLog(id);
    await getLogs(); // refresh after delete
  } catch (error) {
    alert(error.message || "Failed to delete log");
  }
};

// Format date
const formatDateTime = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Load logs when component mounts
onMounted(() => {
  getLogs();
});
</script>
