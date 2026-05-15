import { defineStore } from "pinia";
import { API_BASE } from "@/api.js";

const BEACON_ENDPOINT = `${API_BASE}/beacons`;

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || body?.message || response.statusText);
    }
    return body;
  });
}

function buildQueryString(url, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();
  return queryString ? `${url}?${queryString}` : url;
}

export const useBeaconStore = defineStore("beacon", {
  state: () => ({
    beacons: [],
    loading: {
      fetch: false,
      create: false,
      update: false,
      delete: false,
    },
    error: null,
  }),

  getters: {
    beaconCount: (state) => state.beacons.length,

    getBeaconById: (state) => (id) =>
      state.beacons.find((b) => String(b.id) === String(id)),

    getBeaconByIdentity: (state) => (uuid, major, minor) =>
      state.beacons.find(
        (b) =>
          b.uuid === uuid &&
          String(b.major) === String(major) &&
          String(b.minor) === String(minor),
      ),
  },

  actions: {
    /* ================= FETCH ================= */
    async fetchBeacons(filters = {}) {
      this.loading.fetch = true;
      this.error = null;

      try {
        const url = buildQueryString(BEACON_ENDPOINT, filters);

        const response = await fetch(url, {
          credentials: "include",
        });

        const data = await handleResponse(response);

        this.beacons = data;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.fetch = false;
      }
    },

    /* ================= GET ONE ================= */
    async getBeacon(id) {
      this.loading.fetch = true;
      this.error = null;

      try {
        const response = await fetch(`${BEACON_ENDPOINT}/${id}`, {
          credentials: "include",
        });

        return await handleResponse(response);
      } finally {
        this.loading.fetch = false;
      }
    },

    /* ================= CREATE ================= */
    async createBeacon(payload) {
      this.loading.create = true;
      this.error = null;

      try {
        const response = await fetch(BEACON_ENDPOINT, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await handleResponse(response);

        // optimistic update
        this.beacons.push(data);

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.create = false;
      }
    },

    /* ================= UPDATE ================= */
    async updateBeacon(id, payload) {
      this.loading.update = true;
      this.error = null;

      try {
        const response = await fetch(`${BEACON_ENDPOINT}/${id}`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await handleResponse(response);

        const index = this.beacons.findIndex(
          (b) => String(b.id) === String(id),
        );

        if (index !== -1) {
          this.beacons[index] = data;
        }

        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.update = false;
      }
    },

    /* ================= DELETE ================= */
    async deleteBeacon(id) {
      this.loading.delete = true;
      this.error = null;

      try {
        const response = await fetch(`${BEACON_ENDPOINT}/${id}`, {
          method: "DELETE",
          credentials: "include",
        });

        await handleResponse(response);

        this.beacons = this.beacons.filter((b) => String(b.id) !== String(id));
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading.delete = false;
      }
    },
  },
});
