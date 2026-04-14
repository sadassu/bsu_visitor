import { defineStore } from "pinia";

const API_BASE = import.meta.env.VITE_API_BASE;

if (!API_BASE) {
  throw new Error("VITE_API_BASE is not defined in environment variables");
}

const VISITOR_LOG_ENDPOINT = `${API_BASE}/visit-logs`;

function handleResponse(response) {
  return response.json().then((body) => {
    if (!response.ok) {
      throw new Error(body?.error || response.statusText);
    }
    return body;
  });
}

export const useVisitorLogStore = defineStore("visitorLog", {
  state: () => ({
    logs: [],
    total: 0,
    page: 1,
    perPage: 20,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchVisitLogs({
      visitorName = "",
      startDate = "",
      endDate = "",
      page = 1,
      perPage = 20,
    } = {}) {
      this.loading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(perPage),
        });

        if (visitorName) params.append("visitor_name", visitorName);
        if (startDate) params.append("start_date", startDate);
        if (endDate) params.append("end_date", endDate);

        const response = await fetch(
          `${VISITOR_LOG_ENDPOINT}?${params.toString()}`,
          {
            credentials: "include",
          },
        );

        const data = await handleResponse(response);
        console.log("Fetched visit logs:", data);
        this.logs = data.logs || [];
        this.total = data.total || 0;
        this.page = data.page || page;
        this.perPage = data.per_page || perPage;
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async registerVisit(payload) {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch(`${VISITOR_LOG_ENDPOINT}/register`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await handleResponse(response);
        return data;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
