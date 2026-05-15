<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { App as CapacitorApp } from "@capacitor/app";

const router = useRouter();

onMounted(() => {
  CapacitorApp.addListener("appUrlOpen", (event) => {
    // event.url = "myapp://visitor-access/TOKEN"
    const url = new URL(event.url);
    // pathname = "/TOKEN", so strip the leading slash
    const token = url.pathname.replace("/", "");

    if (token) {
      router.push(`/visitor-access/${token}`);
    }
  });
});
</script>

<template>
  <router-view />
</template>
