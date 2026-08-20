import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  timeout: 15000,
});

/* ── Dashboard ───────────────────────────────────────────────────── */
export const getDashboardSummary = () =>
  api.get("/api/dashboard/summary").then((r) => r.data);

/* ── Products ────────────────────────────────────────────────────── */
export const getProducts = () =>
  api.get("/api/products/").then((r) => r.data);

export const createProduct = (product) =>
  api.post("/api/products/", product).then((r) => r.data);

export const updateProduct = (productId, product) =>
  api.put(`/api/products/${productId}`, product).then((r) => r.data);

/* ── Transactions ────────────────────────────────────────────────── */
export const getTransactions = () =>
  api.get("/api/transactions/").then((r) => r.data);

export const getTransactionSummary = () =>
  api.get("/api/transactions/summary").then((r) => r.data);

export const createTransaction = (items) =>
  api.post("/api/transactions/", { items }).then((r) => r.data);

/* ── Analytics ───────────────────────────────────────────────────── */
export const getTopProducts = (limit = 5) =>
  api.get(`/api/analytics/top-products?limit=${limit}`).then((r) => r.data);

export const getRevenueByProduct = () =>
  api.get("/api/analytics/revenue-by-product").then((r) => r.data);

export const getLowStock = (threshold = 5) =>
  api.get(`/api/analytics/low-stock?threshold=${threshold}`).then((r) => r.data);

export const getInventorySummary = () =>
  api.get("/api/analytics/inventory-summary").then((r) => r.data);

/* ── Inventory movements ─────────────────────────────────────────── */
export const getMovements = (params = {}) =>
  api.get("/api/inventory/movements", { params }).then((r) => r.data);

export default api;
