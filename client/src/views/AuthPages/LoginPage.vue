<template>
  <Navbar />
  <div class="min-h-screen flex items-center justify-center px-4 py-12">
    <div class="max-w-md w-full rounded-3xl shadow-2xl p-8 bg-white">
      <div class="text-center mb-8">
        <!-- Logo -->
        <div class="mx-auto mb-4 h-16 w-16">
          <img
            src="/logo/BatStateU-NEU-Logo-1-300x282.png"
            alt="Logo"
            class="h-full w-full object-contain rounded-full"
          />
        </div>

        <h1 class="text-3xl font-semibold text-black">
          Sign in to your account
        </h1>
        <p class="mt-2 text-black">Enter your BSU credentials to continue.</p>
      </div>

      <form @submit.prevent="onSubmit" class="space-y-6">
        <div>
          <label for="username" class="block text-sm font-medium text-black">
            Username
          </label>
          <input
            id="username"
            type="text"
            v-model="username"
            autocomplete="username"
            required
            class="mt-2 w-full rounded-2xl border border-gray-400 px-4 py-3 text-black placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/30"
          />
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-black">
            Password
          </label>
          <input
            id="password"
            type="password"
            v-model="password"
            autocomplete="current-password"
            required
            class="mt-2 w-full rounded-2xl border border-gray-400 px-4 py-3 text-black placeholder:text-gray-400 focus:border-red-800 focus:outline-none focus:ring-2 focus:ring-red-800/30"
          />
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full rounded-2xl bg-red-800 px-4 py-3 text-base font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span v-if="loading">Signing in...</span>
            <span v-else>Sign In</span>
          </button>
        </div>
      </form>

      <div
        v-if="error"
        class="mt-6 rounded-2xl border border-red-700/40 bg-red-700/10 px-4 py-3 text-sm text-black"
      >
        {{ error }}
      </div>

      <p class="mt-8 text-center text-sm text-black">
        Don’t have an account?
        <router-link to="/" class="font-medium text-black hover:text-gray-700">
          Contact your admin
        </router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "../../store/user";
import Navbar from "../../components/Navbar.vue";

const router = useRouter();
const userStore = useUserStore();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function onSubmit() {
  error.value = "";
  loading.value = true;

  try {
    await userStore.login({
      username: username.value,
      password: password.value,
    });
    router.push("/");
  } catch (err) {
    error.value =
      err?.message || "Unable to sign in. Please check your credentials.";
  } finally {
    loading.value = false;
  }
}
</script>
