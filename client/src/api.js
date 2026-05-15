import { Capacitor } from "@capacitor/core";

const envApiBase = import.meta.env.VITE_API_BASE?.trim();
const isNative = Capacitor?.isNativePlatform?.() ?? false;

const defaultBase = (() => {
  if (typeof window === "undefined") {
    return "/api";
  }

  const origin = window.location.origin || "";
  if (origin.startsWith("capacitor:") || origin.startsWith("ionic:")) {
    return "/api";
  }

  return `${origin}/api`;
})();

const API_BASE = envApiBase || defaultBase;
const IMAGE_BASE = API_BASE.replace(/\/api$/, "");

const apiUrl = (path) => `${API_BASE}/${path.replace(/^\/+/, "")}`;

export { API_BASE, IMAGE_BASE, apiUrl };
