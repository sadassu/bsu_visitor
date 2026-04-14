<template>
  <button
    @click="handleLogout"
    class="w-full text-left px-3 py-2 rounded-md text-red-600 font-semibold hover:bg-red-50 transition flex items-center gap-2"
  >
    <LogOut class="w-5 h-5" />
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-6"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
      />
    </svg>
    Logout
  </button>
</template>

<script>
import { LogOut } from "@lucide/vue";
import { useUserStore } from "../store/user.js";
import { useRouter } from "vue-router";

export default {
  name: "LogoutButton",

  setup() {
    const userStore = useUserStore();
    const router = useRouter();

    const handleLogout = async () => {
      try {
        await userStore.logout();
        router.push("/login");
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    return { handleLogout };
  },
};
</script>
