import api from "./api";

export const productService = {
  getAll:       (params) => api.get("/products", { params }),
  create:       (data)   => api.post("/products", data),
  update:       (id, data) => api.put(`/products/${id}`, data),
  remove:       (id)     => api.delete(`/products/${id}`),
  recordSale:   (id, data) => api.post(`/products/${id}/sale`, data),
  recordRestock:(id, data) => api.post(`/products/${id}/restock`, data),
  getMovements: (params) => api.get("/products/movements/all", { params }),
};
