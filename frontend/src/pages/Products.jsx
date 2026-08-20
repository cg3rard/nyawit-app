import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct } from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

import DeleteProductModal from "../components/products/DeleteProductModal";
import ProductFilters from "../components/products/ProductFilters";
import ProductModal from "../components/products/ProductModal";
import ProductTable from "../components/products/ProductTable";

export default function Products() {
  const [products, setProducts] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Add / Edit modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  // ── Load Products ───────────────────────────────────────────────
  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ── Categories ─────────────────────────────────────────────────
  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))];
  }, [products]);

  // ── Filter Products ────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.product_code.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      let matchesStatus = true;

      if (selectedStatus === "out_of_stock") {
        matchesStatus = product.stock <= 0;
      }

      if (selectedStatus === "low_stock") {
        matchesStatus = product.stock > 0 && product.stock <= 5;
      }

      if (selectedStatus === "in_stock") {
        matchesStatus = product.stock > 5;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, selectedStatus]);

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

  // ── Close Add/Edit Modal ───────────────────────────────────────
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

      setError(typeof detail === "string" ? detail : err?.message || "Failed to save product.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Open Delete Modal ──────────────────────────────────────────
  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  // ── Close Delete Modal ─────────────────────────────────────────
  const handleCloseDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteModalOpen(false);
    setDeletingProduct(null);
    setDeleteError(null);
  };

  // ── Delete Product ─────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!deletingProduct) {
      return;
    }

    try {
      setDeleting(true);
      setDeleteError(null);

      await deleteProduct(deletingProduct.id);

      setDeleteModalOpen(false);
      setDeletingProduct(null);

      await loadProducts();
    } catch (err) {
      const detail = err?.response?.data?.detail;

      setDeleteError(typeof detail === "string" ? detail : err?.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuOpen={() => setMobileSidebarOpen(true)} searchQuery="" onSearchChange={() => {}} lowStockProducts={[]} expiryAlerts={[]} />

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

                <p className="mt-1 text-sm text-[#64748B]">Manage your products, stock, and expiry information.</p>
              </div>

              <button type="button" onClick={handleAddProduct} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00685F] px-4 text-sm font-semibold text-white transition hover:bg-[#00574F]">
                <span className="material-symbols-outlined text-[19px]">add</span>
                Add Product
              </button>
            </div>

            {/* Global Error */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-red-500">error</span>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">Something went wrong</p>

                  <p className="mt-0.5 text-xs text-red-600">{error}</p>
                </div>

                <button type="button" onClick={() => setError(null)} className="text-red-400 transition hover:text-red-600">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
              <ProductFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} categories={categories} />
            </div>

            {/* Product Table */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#141B2B]">Product List</h2>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {filteredProducts.length} of {products.length} products
                  </p>
                </div>

                <button type="button" onClick={loadProducts} disabled={loading} className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-50">
                  <span className={`material-symbols-outlined text-[17px] ${loading ? "animate-spin" : ""}`}>refresh</span>
                  Refresh
                </button>
              </div>

              {loading ? <ProductTableLoading /> : <ProductTable products={filteredProducts} onEdit={handleEditProduct} onDelete={handleDeleteProduct} />}
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal open={modalOpen} mode={modalMode} product={editingProduct} onClose={handleCloseModal} onSubmit={handleSubmitProduct} submitting={submitting} />

      {/* Delete Product Modal */}
      <DeleteProductModal open={deleteModalOpen} product={deletingProduct} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} deleting={deleting} error={deleteError} />
    </div>
  );
}

function ProductTableLoading() {
  return (
    <div className="divide-y divide-[#E2E8F0]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-6 px-5 py-5">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E2E8F0]" />

          <div className="h-4 w-40 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="ml-auto h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}
