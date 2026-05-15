<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- BACKDROP -->
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <!-- MODAL CARD -->
        <div
          class="relative w-full max-w-lg bg-white rounded-2xl shadow-xl z-10 flex flex-col"
          :class="[size === 'large' ? 'max-w-2xl' : 'max-w-lg']"
          :style="{ maxHeight: maxHeight }"
        >
          <!-- CLOSE BUTTON -->
          <button
            @click="close"
            class="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 transition-colors duration-200 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <!-- HEADER -->
          <div
            v-if="$slots.header"
            class="px-6 pt-6 pb-3 border-b border-slate-100"
          >
            <slot name="header"></slot>
          </div>

          <!-- SCROLLABLE BODY -->
          <div class="overflow-y-auto flex-1" :class="bodyPaddingClass">
            <div class="space-y-4">
              <slot></slot>
            </div>
          </div>

          <!-- FOOTER -->
          <div
            v-if="$slots.footer"
            class="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl"
          >
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted, computed } from "vue";

const props = defineProps({
  modelValue: Boolean,
  size: {
    type: String,
    default: "default", // 'default' or 'large'
    validator: (value) => ["default", "large"].includes(value),
  },
  maxHeight: {
    type: String,
    default: "90vh",
  },
  noPadding: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue"]);

const bodyPaddingClass = computed(() => {
  if (props.noPadding) return "px-0 py-0";
  return "px-6 py-4";
});

const close = () => {
  emit("update:modelValue", false);
};

// Prevent body scroll when modal is open
const handleBodyScroll = (shouldPrevent) => {
  if (shouldPrevent) {
    document.body.style.overflow = "hidden";
  } else {
    document.body.style.overflow = "";
  }
};

// ESC key support
const handleKey = (e) => {
  if (e.key === "Escape") {
    close();
  }
};

onMounted(() => {
  if (props.modelValue) {
    handleBodyScroll(true);
  }
  window.addEventListener("keydown", handleKey);
});

onUnmounted(() => {
  handleBodyScroll(false);
  window.removeEventListener("keydown", handleKey);
});

// Watch for modal open/close to manage body scroll
import { watch } from "vue";
watch(
  () => props.modelValue,
  (newVal) => {
    handleBodyScroll(newVal);
  },
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
  opacity: 0;
}

/* Custom scrollbar for the body */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
