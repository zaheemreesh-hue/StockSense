import api from "./api";

export const billingService = {
  checkout:     (data) => api.post("/billing/checkout", data),
  getInvoices:  (params) => api.get("/billing/invoices", { params }),
  getInvoice:   (id)   => api.get(`/billing/invoices/${id}`),
  refund:       (id)   => api.post(`/billing/invoices/${id}/refund`),
};

export const analyticsService = {
  getDashboard: () => api.get("/analytics/dashboard"),
  getInsights:  () => api.get("/analytics/insights"),
  getAlerts:    () => api.get("/analytics/alerts"),
};
