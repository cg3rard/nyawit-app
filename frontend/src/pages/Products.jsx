import { useEffect, useMemo, useState } from "react";
import { createProduct, deleteProduct, getProducts, updateProduct, getSuppliers } from "../services/api";
import { getStoreSettings } from "../utils/storeProfile";

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

const parsePrice = (val) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  let s = val.toString().trim();
  s = s.replace(/^(rp\.?|idr|\$)\s*/i, "").trim();
  s = s.replace(/[,.]/g, "");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
};

const parseExpiryDate = (val) => {
  if (!val) return null;
  const s = val.toString().trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const parts = s.split(/[\/\-.]/);
  if (parts.length === 3) {
    let [d, m, y] = parts;
    d = d.padStart(2, "0");
    m = m.padStart(2, "0");
    if (y.length === 2) {
      y = parseInt(y, 10) < 50 ? `20${y}` : `19${y}`;
    }
    if (d.length === 4) {
      return `${d}-${m}-${y.padStart(2, "0")}`;
    }
    return `${y}-${m}-${d}`;
  }
  const dateObj = new Date(s);
  if (!isNaN(dateObj.getTime())) {
    return dateObj.toISOString().split("T")[0];
  }
  return null;
};

const parseCSV = (text) => {
  if (!text) return [];
  const cleanText = text.replace(/^\ufeff/, "");
  const lines = cleanText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const firstLine = lines[0];
  let delimiter = ",";
  if (firstLine.includes(";") && (firstLine.split(";").length > firstLine.split(",").length)) {
    delimiter = ";";
  } else if (firstLine.includes("\t") && (firstLine.split("\t").length > firstLine.split(",").length)) {
    delimiter = "\t";
  }

  const headers = lines[0]
    .split(delimiter)
    .map((h) => h.trim().replace(/^["']|["']$/g, "").toLowerCase().replace(/[\s_-]+/g, "_"));

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
      } else if (char === delimiter && !inQuotes) {
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

        // Consolidate rows with the same product name
        const consolidatedMap = new Map();

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const name = (row.name || row.product_name || row.nama || row.produk || `Product ${i + 1}`).trim();
          const category = (row.category || row.kategori || "General").trim();
          const purchasePrice = parsePrice(row.purchase_price || row.purchase || row.harga_beli || row.cost || 0);
          const sellingPrice = parsePrice(row.selling_price || row.selling || row.harga_jual || row.harga || row.price || 0);
          const stock = parseInt(row.stock || row.initial_stock || row.stok || row.qty || 0, 10) || 0;
          const expiryDate = parseExpiryDate(row.expiry_date || row.expiry || row.expired || row.tgl_kedaluwarsa || row.tgl_kadaluarsa || null);

          const key = name.toLowerCase();
          if (!consolidatedMap.has(key)) {
            const catPrefix = "".concat(category.split(" ").map((w) => w.slice(0, 3).toUpperCase()).join("")).slice(0, 3) || "PRD";
            const code = row.product_code || row.code || row.kode || `${catPrefix}-${String(consolidatedMap.size + 1).padStart(3, "0")}`;
            consolidatedMap.set(key, {
              product_code: code,
              name,
              category,
              purchase_price: purchasePrice,
              selling_price: sellingPrice,
              stock,
              expiry_date: expiryDate,
            });
          } else {
            const existing = consolidatedMap.get(key);
            existing.stock += stock;
            if (purchasePrice > 0) existing.purchase_price = purchasePrice;
            if (sellingPrice > 0) existing.selling_price = sellingPrice;
            if (expiryDate) {
              if (!existing.expiry_date || new Date(expiryDate) < new Date(existing.expiry_date)) {
                existing.expiry_date = expiryDate;
              }
            }
          }
        }

        const consolidatedList = Array.from(consolidatedMap.values());
        let successCount = 0;
        let failCount = 0;
        const errorsList = [];

        for (let i = 0; i < consolidatedList.length; i++) {
          const payload = consolidatedList[i];
          try {
            await createProduct(payload);
            successCount++;
          } catch (err) {
            failCount++;
            const errMsg = err?.response?.data?.detail;
            errorsList.push(
              `${payload.name} (${payload.product_code}): ${
                typeof errMsg === "string" ? errMsg : err?.message || "Conflict/error"
              }`
            );
          }
        }

        setCsvImportSummary({
          total: consolidatedList.length,
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

  const urgencyStats = useMemo(() => {
    const threshold = getStoreSettings().lowStockThreshold || 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let urgentCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let expiringSoonCount = 0;
    let expiredCount = 0;
    let optimalCount = 0;

    products.forEach((p) => {
      const isOutOfStock = p.stock <= 0;
      const isLowStock = p.stock > 0 && p.stock <= threshold;

      let isExpired = false;
      let isExpiringSoon = false;

      if (p.expiry_date) {
        const exp = new Date(`${p.expiry_date}T00:00:00`);
        if (!isNaN(exp.getTime())) {
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) isExpired = true;
          else if (diffDays <= 30) isExpiringSoon = true;
        }
      }

      if (isOutOfStock) outOfStockCount++;
      if (isLowStock) lowStockCount++;
      if (isExpired) expiredCount++;
      if (isExpiringSoon) expiringSoonCount++;

      if (isOutOfStock || isLowStock || isExpired || isExpiringSoon) {
        urgentCount++;
      } else {
        optimalCount++;
      }
    });

    return {
      total: products.length,
      urgent: urgentCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      expiringSoon: expiringSoonCount,
      expired: expiredCount,
      optimal: optimalCount,
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const threshold = getStoreSettings().lowStockThreshold || 5;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.product_code.toLowerCase().includes(query);

      const matchesCategory = !selectedCategory || product.category === selectedCategory;

      let matchesStatus = true;

      const isOutOfStock = product.stock <= 0;
      const isLowStock = product.stock > 0 && product.stock <= threshold;

      let isExpired = false;
      let isExpiringSoon = false;

      if (product.expiry_date) {
        const exp = new Date(`${product.expiry_date}T00:00:00`);
        if (!isNaN(exp.getTime())) {
          const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) isExpired = true;
          else if (diffDays <= 30) isExpiringSoon = true;
        }
      }

      if (selectedStatus === "urgent") {
        matchesStatus = isOutOfStock || isLowStock || isExpired || isExpiringSoon;
      } else if (selectedStatus === "low_stock") {
        matchesStatus = isLowStock;
      } else if (selectedStatus === "out_of_stock") {
        matchesStatus = isOutOfStock;
      } else if (selectedStatus === "expiring_soon") {
        matchesStatus = isExpiringSoon;
      } else if (selectedStatus === "expired") {
        matchesStatus = isExpired;
      } else if (selectedStatus === "optimal" || selectedStatus === "in_stock") {
        matchesStatus = !isOutOfStock && !isLowStock && !isExpired && !isExpiringSoon;
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
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

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

            <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-2xs">
              <ProductFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                categories={categories}
                urgencyStats={urgencyStats}
              />
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
