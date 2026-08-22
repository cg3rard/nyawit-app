import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct, getSuppliers } from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

import DeleteProductModal from "../components/products/DeleteProductModal";
import ProductFilters from "../components/products/ProductFilters";
import ProductModal from "../components/products/ProductModal";
import ProductTable from "../components/products/ProductTable";
import AdjustStockModal from "../components/products/AdjustStockModal";

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const parseCSV = (text) => {
  const lines = text.split(/\r?\n/);
  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase());

  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = [];
    let current = "";
    let inQuotes = false;
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim().replace(/^["']|["']$/g, ""));
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim().replace(/^["']|["']$/g, ""));

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    results.push(row);
  }
  return results;
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [adjustStockModalOpen, setAdjustStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState(null);

  const [csvImportSummary, setCsvImportSummary] = useState(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && csvImportSummary) {
        setCsvImportSummary(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [csvImportSummary]);

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      try {
        const rows = parseCSV(text);
        if (rows.length === 0) {
          alert("CSV is empty or invalid.");
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const errorsList = [];

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const code = row.product_code || row.code || generateUUID();
          const name = row.name || row.product_name || `Product ${i + 1}`;
          const category = row.category || "General";
          const purchasePrice = parseFloat(row.purchase_price || row.purchase || 0);
          const sellingPrice = parseFloat(row.selling_price || row.selling || 0);
          const stock = parseInt(row.stock || row.initial_stock || 0);
          const expiryDate = row.expiry_date || row.expiry || null;

          const payload = {
            product_code: code,
            name: name,
            category: category,
            purchase_price: purchasePrice,
            selling_price: sellingPrice,
            stock: stock,
            expiry_date: expiryDate,
          };

          try {
            await createProduct(payload);
            successCount++;
          } catch (err) {
            failCount++;
            const errMsg = err?.response?.data?.detail;
            errorsList.push(
              `${name} (${code}): ${
                typeof errMsg === "string" ? errMsg : err?.message || "Conflict/error"
              }`
            );
          }
        }

        setCsvImportSummary({
          total: rows.length,
          success: successCount,
          failed: failCount,
          errors: errorsList,
        });

        await loadProducts();
      } catch (err) {
        alert("Failed to parse CSV file: " + err.message);
      } finally {
        e.target.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = [
      "name,category,purchase_price,selling_price,stock,expiry_date",
      "Mineral Water 600ml,Beverage,3000,5000,50,2027-12-31",
      "Apple Pie,Snacks,8000,12000,20,2026-09-15"
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "nyawit_product_template.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const loadSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to load suppliers:", err);
    }
  };

  useEffect(() => {
    loadProducts();
    loadSuppliers();
  }, []);

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))];
  }, [products]);

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

  const handleAddProduct = () => {
    setEditingProduct(null);
    setModalMode("add");
    setModalOpen(true);
    setError(null);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setModalMode("edit");
    setModalOpen(true);
    setError(null);
  };

  const handleCloseModal = () => {
    if (submitting) {
      return;
    }

    setModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmitProduct = async (payload) => {
    try {
      setSubmitting(true);
      setError(null);

      const { photo, ...apiPayload } = payload;

      if (modalMode === "edit") {
        await updateProduct(editingProduct.id, apiPayload);
      } else {
        await createProduct(apiPayload);
      }

      if (photo) {
        localStorage.setItem(`product_photo_${payload.product_code}`, photo);
      } else {
        localStorage.removeItem(`product_photo_${payload.product_code}`);
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

  const handleDeleteProduct = (product) => {
    setDeletingProduct(product);
    setDeleteError(null);
    setDeleteModalOpen(true);
  };

  const handleCloseDeleteModal = () => {
    if (deleting) {
      return;
    }

    setDeleteModalOpen(false);
    setDeletingProduct(null);
    setDeleteError(null);
  };

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

              <div className="flex gap-2.5">
                <input
                  type="file"
                  id="csv-upload-input"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVUpload}
                />
                <label
                  htmlFor="csv-upload-input"
                  className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
                >
                  <span className="material-symbols-outlined text-[19px]">upload_file</span>
                  Import CSV
                </label>

                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
                >
                  <span className="material-symbols-outlined text-[19px]">download</span>
                  Template CSV
                </button>

                <button type="button" onClick={handleAddProduct} className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00685F] px-4 text-sm font-semibold text-white transition hover:bg-[#00574F]">
                  <span className="material-symbols-outlined text-[19px]">add</span>
                  Add Product
                </button>
              </div>
            </div>

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

            <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
              <ProductFilters searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} selectedStatus={selectedStatus} onStatusChange={setSelectedStatus} categories={categories} />
            </div>

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

              {loading ? <ProductTableLoading /> : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onAdjustStock={(product) => {
                    setSelectedProductForStock(product);
                    setAdjustStockModalOpen(true);
                  }}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      <ProductModal open={modalOpen} mode={modalMode} product={editingProduct} onClose={handleCloseModal} onSubmit={handleSubmitProduct} submitting={submitting} categories={categories} suppliers={suppliers} />

      <DeleteProductModal open={deleteModalOpen} product={deletingProduct} onClose={handleCloseDeleteModal} onConfirm={handleConfirmDelete} deleting={deleting} error={deleteError} />

      <AdjustStockModal
        isOpen={adjustStockModalOpen}
        product={selectedProductForStock}
        onClose={() => {
          setAdjustStockModalOpen(false);
          setSelectedProductForStock(null);
        }}
        onSuccess={loadProducts}
      />

      {csvImportSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]" onClick={() => setCsvImportSummary(null)} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-[#141B2B] mb-2">CSV Import Result</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-[#64748B]">
                Successfully imported <span className="font-semibold text-emerald-600">{csvImportSummary.success}</span> of {csvImportSummary.total} products.
              </p>
              {csvImportSummary.failed > 0 && (
                <div>
                  <p className="text-sm text-red-600 font-semibold mb-1">
                    Failed to import {csvImportSummary.failed} products:
                  </p>
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-red-50 p-2.5 text-xs text-red-700 border border-red-100 font-mono space-y-1">
                    {csvImportSummary.errors.map((err, idx) => (
                      <div key={idx}>{err}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setCsvImportSummary(null)}
                className="h-10 rounded-lg bg-[#00685F] px-5 text-sm font-semibold text-white transition hover:bg-[#00574F]"
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
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
