import { useEffect, useMemo, useState } from "react";
import {
  createProduct,
  getProducts,
  updateProduct,
} from "../services/api";

import TopBar from "../components/layout/TopBar";
import MobileSidebar from "../components/layout/MobileSidebar";

import ProductFilters from "../components/products/ProductFilters";
import ProductTable from "../components/products/ProductTable";
import ProductModal from "../components/products/ProductModal";

export default function Products() {
  const [products, setProducts] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Product modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    return [
      ...new Set(
        products
          .map((product) => product.category)
          .filter(Boolean)
      ),
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !query ||
        product.name.toLowerCase().includes(query) ||
        product.product_code.toLowerCase().includes(query);

      const matchesCategory =
        !selectedCategory ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // ── Add Product ────────────────────────────────────────────────
  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalMode("add");
    setModalOpen(true);
    setError(null);
  };

  // ── Edit Product ───────────────────────────────────────────────
  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setModalMode("edit");
    setModalOpen(true);
    setError(null);
  };

  // ── Close Modal ────────────────────────────────────────────────
  const handleCloseModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
  };

  // ── Save Product ───────────────────────────────────────────────
  const handleSubmitProduct = async (payload) => {
    try {
      setSubmitting(true);
      setError(null);

      if (modalMode === "edit") {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }

      setModalOpen(false);
      setEditingProduct(null);

      await loadProducts();
    } catch (err) {
      const detail = err?.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : err?.message || "Failed to save product."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          lowStockProducts={[]}
          expiryAlerts={[]}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            {/* Header */}
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1
                  className="text-xl font-semibold text-[#141B2B]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Products
                </h1>

                <p className="mt-1 text-sm text-[#64748B]">
                  Manage your products, stock, and expiry information.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddProduct}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00685F] px-4 text-sm font-semibold text-white transition hover:bg-[#00574F]"
              >
                <span className="material-symbols-outlined text-[19px]">
                  add
                </span>
                Add Product
              </button>
            </div>

            {/* Filters */}
            <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
              <ProductFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
              />
            </div>

            {/* Table */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#141B2B]">
                    Product List
                  </h2>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {filteredProducts.length} of {products.length} products
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadProducts}
                  disabled={loading}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      loading ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>
                  Refresh
                </button>
              </div>

              {loading ? (
                <ProductTableLoading />
              ) : error ? (
                <ProductError
                  message={error}
                  onRetry={loadProducts}
                />
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        open={modalOpen}
        mode={modalMode}
        product={editingProduct}
        onClose={handleCloseModal}
        onSubmit={handleSubmitProduct}
        submitting={submitting}
      />
    </div>
  );
}

function ProductTableLoading() {
  return (
    <div className="divide-y divide-[#E2E8F0]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 px-5 py-5"
        >
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E2E8F0]" />

          <div className="h-4 w-40 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function ProductError({ message, onRetry }) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
      <span className="material-symbols-outlined mb-3 text-[32px] text-red-500">
        error
      </span>

      <p className="text-sm font-semibold text-[#141B2B]">
        Failed to load products
      </p>

      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-[#00685F] px-4 py-2 text-xs font-semibold text-white"
      >
        Retry
      </button>
    </div>
  );
}
