import api from "./api";

export const analyticsService = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getInsights:  () => api.get("/analytics/insights"),
  getAlerts:    () => api.get("/analytics/alerts"),
};
