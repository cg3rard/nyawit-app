import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
});

export const getDashboardSummary = () =>
  api.get("/api/dashboard/summary").then((r) => r.data);

export const getProducts = () =>
  api.get("/api/products/").then((r) => r.data);

export const createProduct = (product) =>
  api.post("/api/products/", product).then((r) => r.data);

export const updateProduct = (productId, product) =>
  api.put(`/api/products/${productId}`, product).then((r) => r.data);

export const deleteProduct = (id) =>
  api.delete(`/api/products/${id}`).then((r) => r.data);

export const getTransactions = () =>
  api.get("/api/transactions/").then((r) => r.data);

export const getTransactionSummary = () =>
  api.get("/api/transactions/summary").then((r) => r.data);

export const createTransaction = (items) =>
  api.post("/api/transactions/", { items }).then((r) => r.data);

export const getTopProducts = (limit = 5) =>
  api.get(`/api/analytics/top-products?limit=${limit}`).then((r) => r.data);

export const getRevenueByProduct = () =>
  api.get("/api/analytics/revenue-by-product").then((r) => r.data);

export const getLowStock = (threshold = 5) =>
  api.get(`/api/analytics/low-stock?threshold=${threshold}`).then((r) => r.data);

export const getInventorySummary = () =>
  api.get("/api/analytics/inventory-summary").then((r) => r.data);

export const getMovements = (params = {}) =>
  api.get("/api/inventory/movements", { params }).then((r) => r.data);

export const stockIn = (data) =>
  api.post("/api/inventory/in", data).then((r) => r.data);

export const stockOut = (data) =>
  api.post("/api/inventory/out", data).then((r) => r.data);

export const adjustStock = (data) =>
  api.post("/api/inventory/adjustment", data).then((r) => r.data);

export const getAIScenarios = (days = 14) =>
  api.get("/api/mock/scenarios", { params: { days } }).then((r) => r.data);

export const simulateScenario = (scenarioKey, days = 14) =>
  api.post("/api/mock/simulate", null, { params: { scenario: scenarioKey, days } }).then((r) => r.data);

export const evaluateInventory = (payload) =>
  api.post("/api/inventory/evaluate", payload).then((r) => r.data);

export const evaluateAllProducts = (days = 14) =>
  api.post("/api/inventory/evaluate-all", null, { params: { days } }).then((r) => r.data);

export const getSuppliers = () =>
  api.get("/api/suppliers/").then((r) => r.data);

export const createSupplier = (supplier) =>
  api.post("/api/suppliers/", supplier).then((r) => r.data);

export const updateSupplier = (id, supplier) =>
  api.put(`/api/suppliers/${id}`, supplier).then((r) => r.data);

export const deleteSupplier = (id) =>
  api.delete(`/api/suppliers/${id}`).then((r) => r.data);

export const getWASettings = () =>
  api.get("/api/wa/settings").then((r) => r.data);

export const updateWASettings = (settings) =>
  api.put("/api/wa/settings", settings).then((r) => r.data);

export const connectWABot = () =>
  api.post("/api/wa/connect").then((r) => r.data);

export const disconnectWABot = () =>
  api.post("/api/wa/disconnect").then((r) => r.data);

export const getWAMessages = () =>
  api.get("/api/wa/messages").then((r) => r.data);

export const sendRestockRequest = (productId, quantity) =>
  api.post("/api/wa/send-restock", { product_id: productId, quantity }).then((r) => r.data);

export const getRestockOrder = (id, token) =>
  api.get(`/api/wa/restock-order/${id}`, { params: { token } }).then((r) => r.data);

export const receiveRestockOrder = (id, payload) =>
  api.post(`/api/wa/receive-restock/${id}`, payload).then((r) => r.data);

export const confirmRestockOrder = (id, token, payload) =>
  api.post(`/api/wa/confirm-restock/${id}?token=${token}`, payload).then((r) => r.data);

export default api;
