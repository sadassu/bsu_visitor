<script setup>
import { onMounted } from "vue";
import { useVisitorLinkStore } from "@/store/visitorLinks";
import Navbar from "../../components/Navbar.vue";

const visitorLinkStore = useVisitorLinkStore();

onMounted(() => {
  visitorLinkStore.fetchVisitorLinks();
});

// 🔥 always correct environment (local or ngrok)
const BASE_URL = window.location.origin;

const generateAccessUrl = (token) => {
  return `${BASE_URL}/visitor-access/${token}`;
};

const generateQR = (token) => {
  const url = encodeURIComponent(generateAccessUrl(token));
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${url}`;
};
</script>

<template>
  <Navbar />
  <div class="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="link in visitorLinkStore.links"
      :key="link.token"
      class="bg-white shadow rounded-xl p-4 border border-gray-200"
    >
      <h2 class="text-lg font-bold">
        {{ link.visitor.fullname }}
      </h2>

      <p class="text-sm text-gray-600">
        {{ link.visitor.contact_number }}
      </p>

      <p class="text-sm text-gray-600 mb-3">
        {{ link.office.office_name }}
      </p>

      <!-- QR -->
      <div class="flex justify-center">
        <img :src="generateQR(link.token)" class="w-40 h-40" />
      </div>

      <!-- Link -->
      <p class="text-xs text-center mt-2 break-all text-blue-600">
        {{ generateAccessUrl(link.token) }}
      </p>
    </div>
  </div>
</template>
