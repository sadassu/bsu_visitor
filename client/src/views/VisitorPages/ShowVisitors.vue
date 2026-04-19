<template>
  <div class="min-h-screen bg-gray-100 p-6">
    <h1 class="text-2xl font-bold mb-6">Visitors</h1>

    <!-- Cards -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
    >
      <div
        v-for="visitor in visitorStore.visitors"
        :key="visitor.id"
        class="bg-white rounded-2xl shadow-md overflow-hidden"
      >
        <img :src="getImageUrl(visitor.img)" class="w-full h-48 object-cover" />

        <div class="p-4">
          <h2 class="text-lg font-semibold">{{ visitor.fullname }}</h2>
          <p class="text-sm text-gray-600">📞 {{ visitor.contact_number }}</p>
          <p class="text-sm text-gray-600">📍 {{ visitor.address }}</p>

          <!-- ACTIONS -->
          <div class="flex gap-2 mt-3">
            <button
              @click="openEdit(visitor)"
              class="px-3 py-1 text-sm bg-blue-500 text-white rounded"
            >
              Edit
            </button>

            <button
              @click="openDelete(visitor)"
              class="px-3 py-1 text-sm bg-red-500 text-white rounded"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- EDIT MODAL -->
    <BaseModal v-model="showEditModal">
      <template #header>
        <h2 class="text-lg font-bold">Edit Visitor</h2>
      </template>

      <div class="space-y-3">
        <input
          v-model="selected.fullname"
          class="input"
          placeholder="Fullname"
        />
        <input
          v-model="selected.contact_number"
          class="input"
          placeholder="Contact"
        />
        <input v-model="selected.address" class="input" placeholder="Address" />
        <input v-model="selected.id_type" class="input" placeholder="ID Type" />
      </div>

      <template #footer>
        <button @click="showEditModal = false" class="px-4 py-2">Cancel</button>

        <button
          @click="updateVisitor"
          class="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Save
        </button>
      </template>
    </BaseModal>

    <!-- DELETE MODAL -->
    <BaseModal v-model="showDeleteModal">
      <template #header>
        <h2 class="text-lg font-bold text-red-600">Delete Visitor</h2>
      </template>

      <p>
        Are you sure you want to delete <b>{{ selected.fullname }}</b
        >?
      </p>

      <template #footer>
        <button @click="showDeleteModal = false" class="px-4 py-2">
          Cancel
        </button>

        <button
          @click="deleteVisitor"
          class="px-4 py-2 bg-red-600 text-white rounded"
        >
          Delete
        </button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useVisitorStore } from "@/store/visitor.js";
import BaseModal from "@/components/BaseModal.vue";

const visitorStore = useVisitorStore();

const API_BASE = import.meta.env.VITE_API_BASE;
const IMAGE_BASE = API_BASE.replace("/api", "");

function getImageUrl(path) {
  if (!path) return "https://via.placeholder.com/300x200";
  return `${IMAGE_BASE}/${path.replace(/^\//, "")}`;
}

/* MODAL STATES */
const showEditModal = ref(false);
const showDeleteModal = ref(false);

/* SELECTED VISITOR */
const selected = ref({
  id: null,
  fullname: "",
  contact_number: "",
  address: "",
  id_type: "",
  img: "",
});

/* OPEN EDIT */
function openEdit(visitor) {
  selected.value = { ...visitor };
  showEditModal.value = true;
}

/* OPEN DELETE */
function openDelete(visitor) {
  selected.value = visitor;
  showDeleteModal.value = true;
}

/* UPDATE */
async function updateVisitor() {
  try {
    await visitorStore.updateVisitor(selected.value.id, selected.value);
    await visitorStore.fetchVisitors();
    showEditModal.value = false;
  } catch (err) {
    alert(err.message);
  }
}

/* DELETE */
async function deleteVisitor() {
  try {
    await visitorStore.deleteVisitor(selected.value.id);
    await visitorStore.fetchVisitors();
    showDeleteModal.value = false;
  } catch (err) {
    alert(err.message);
  }
}

onMounted(() => {
  visitorStore.fetchVisitors();
});
</script>

<style scoped>
.input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 6px;
}
</style>
