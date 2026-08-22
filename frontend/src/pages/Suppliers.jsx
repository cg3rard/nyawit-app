import { useEffect, useState } from "react";
import {
  getSuppliers,
  getProducts,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  sendRestockRequest,
} from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

const formatPhoneForWA = (phone) => {
  return phone ? phone.replace(/[^0-9]/g, "") : "";
};

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [assignedProductIds, setAssignedProductIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingSupplier, setDeletingSupplier] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [restockOpen, setRestockOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockQty, setRestockQty] = useState(10);
  const [sendingRestock, setSendingRestock] = useState(false);
  const [restockMessage, setRestockMessage] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [suppliersData, productsData] = await Promise.all([
        getSuppliers(),
        getProducts(),
      ]);
      setSuppliers(suppliersData);
      setProducts(productsData);
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load suppliers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode("add");
    setEditingSupplier(null);
    setName("");
    setWhatsapp("");
    setAssignedProductIds([]);
    setModalOpen(true);
  };

  const handleOpenEditModal = (supplier) => {
    setModalMode("edit");
    setEditingSupplier(supplier);
    setName(supplier.name);
    setWhatsapp(supplier.whatsapp);
    setAssignedProductIds(supplier.products.map((p) => p.id));
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setModalOpen(false);
  };

  const handleProductToggle = (productId) => {
    setAssignedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !whatsapp.trim()) return;

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        whatsapp: whatsapp.trim(),
        product_ids: assignedProductIds,
      };

      if (modalMode === "add") {
        await createSupplier(payload);
      } else {
        await updateSupplier(editingSupplier.id, payload);
      }
      setModalOpen(false);
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to save supplier.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDelete = (supplier) => {
    setDeletingSupplier(supplier);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteSupplier(deletingSupplier.id);
      setDeleteOpen(false);
      await loadData();
    } catch (err) {
      alert("Failed to delete supplier.");
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenRestock = (product) => {
    setRestockProduct(product);
    setRestockQty(50);
    setRestockMessage("");
    setCreatedOrder(null);
    setRestockOpen(true);
  };

  const handleSendRestock = async () => {
    try {
      setSendingRestock(true);
      setRestockMessage("");
      const orderData = await sendRestockRequest(restockProduct.id, restockQty);
      setCreatedOrder(orderData);
      setRestockMessage("success");
    } catch (err) {
      setRestockMessage(err?.response?.data?.detail || "Failed to send restock request.");
    } finally {
      setSendingRestock(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col bg-[#F8FAFC]">
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <main className="flex-1 p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#141B2B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Supplier Management
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Add and manage suppliers, assign products, and trigger restock requests via WhatsApp bot.
            </p>
          </div>

          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#00685F] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#00574F]"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Supplier
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#00685F]">
              progress_activity
            </span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl bg-white border border-[#E2E8F0] p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#E8F5F3] text-[#00685F] mb-4">
              <span className="material-symbols-outlined text-[32px]">local_shipping</span>
            </div>
            <h3 className="text-lg font-semibold text-[#141B2B]">No Suppliers Registered</h3>
            <p className="mt-1 text-sm text-[#64748B] max-w-sm">
              Register your first supplier and assign their products to get started.
            </p>
            <button
              onClick={handleOpenAddModal}
              className="mt-5 rounded-lg bg-[#00685F] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00574F]"
            >
              Add Supplier
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {suppliers.map((supplier) => (
              <div key={supplier.id} className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-[#F1F5F9] pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E8F5F3] text-[#00685F]">
                        <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#141B2B]">{supplier.name}</h3>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 mt-0.5">
                          <span className="material-symbols-outlined text-[14px]">chat</span>
                          WhatsApp: <span className="font-semibold">{supplier.whatsapp}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(supplier)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#00685F] transition"
                        title="Edit supplier"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleOpenDelete(supplier)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#64748B] hover:bg-red-50 hover:text-red-600 transition"
                        title="Delete supplier"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>

                  <div className="mb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#94A3B8]">
                      Assigned Products ({supplier.products.length})
                    </h4>
                  </div>

                  {supplier.products.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic py-2">No products assigned yet. Edit this supplier to assign products.</p>
                  ) : (
                    <div className="divide-y divide-[#F1F5F9] max-h-48 overflow-y-auto pr-1">
                      {supplier.products.map((product) => (
                        <div key={product.id} className="flex items-center justify-between py-2 text-xs">
                          <div>
                            <p className="font-semibold text-slate-800">{product.name}</p>
                            <p className="text-[10px] text-slate-400">
                              Code: {product.product_code} • Stock: <span className={product.stock <= 5 ? "font-bold text-red-500" : "font-semibold"}>{product.stock} pcs</span>
                            </p>
                          </div>

                          <button
                            onClick={() => handleOpenRestock(product)}
                            className="text-[11px] font-bold text-[#00685F] hover:text-[#00574F] bg-[#E8F5F3] hover:bg-[#D2EBE7] px-2 py-1 rounded transition"
                          >
                            Restock WA
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]" onClick={handleCloseModal} />

          <div className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl flex flex-col">
            <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
              <div>
                <h2 className="text-lg font-semibold text-[#141B2B]">
                  {modalMode === "edit" ? "Edit Supplier" : "Add Supplier"}
                </h2>
                <p className="mt-1 text-xs text-[#64748B]">
                  Input supplier information and assign products.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                  placeholder="e.g. PT Indofood Sukses Makmur"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-[#334155]">WhatsApp Number *</label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                  placeholder="e.g. +628123456789"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#334155]">Assign Products (Optional)</label>
                <div className="border border-[#E2E8F0] rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 bg-slate-50">
                  {products.length === 0 ? (
                    <p className="text-xs text-[#94A3B8] italic">No products available in database.</p>
                  ) : (
                    products.map((p) => (
                      <label key={p.id} className="flex items-center gap-3 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={assignedProductIds.includes(p.id)}
                          onChange={() => handleProductToggle(p.id)}
                          className="rounded border-[#E2E8F0] text-[#00685F] focus:ring-[#00685F] h-4 w-4"
                        />
                        <span className="text-slate-700 font-medium">
                          {p.name} <span className="text-xs text-[#94A3B8]">({p.product_code})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4 mt-6">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-10 items-center justify-center gap-2 rounded-lg bg-[#00685F] px-5 text-sm font-semibold text-white hover:bg-[#00574F] disabled:opacity-50"
                >
                  {submitting && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  )}
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]" onClick={() => setDeleteOpen(false)} />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 mx-auto mb-4">
              <span className="material-symbols-outlined text-[24px]">warning</span>
            </div>
            <h3 className="text-lg font-bold text-slate-800">Delete Supplier</h3>
            <p className="text-sm text-[#64748B] mt-2">
              Are you sure you want to delete supplier <strong>{deletingSupplier?.name}</strong>?
              This action cannot be undone. Assigned products will have their supplier reference cleared.
            </p>

            <div className="flex justify-center gap-3 mt-6">
              <button
                onClick={() => setDeleteOpen(false)}
                disabled={deleting}
                className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="h-10 rounded-lg bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {restockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]" onClick={() => !sendingRestock && setRestockOpen(false)} />

          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-800">Request Restock via WA</h3>
            <p className="text-xs text-[#64748B] mt-1 mb-4">
              Sending restock request for <strong>{restockProduct?.name}</strong>.
            </p>

            {restockMessage === "success" ? (
              <div className="space-y-4 my-4">
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl mb-2 block animate-bounce">check_circle</span>
                  <p className="text-sm font-bold text-emerald-800">WhatsApp Message Link Generated!</p>
                  <p className="text-xs text-emerald-600 mt-1">Message is queued in CoStore WA Connection dashboard.</p>
                </div>

                {createdOrder && (
                  <div className="space-y-3">
                    <a
                      href={`https://api.whatsapp.com/send?phone=${formatPhoneForWA(createdOrder.supplier?.whatsapp)}&text=${encodeURIComponent(
                        `Halo ${createdOrder.supplier?.name},\n\nMohon untuk menyuplai kembali produk berikut:\n- Nama Produk: ${createdOrder.product?.name}\n- Jumlah: ${createdOrder.quantity} pcs\n\nSilakan konfirmasi pesanan restock ini dengan mengklik tautan berikut:\nhttp://localhost:5173/confirm_restock/${createdOrder.id}?token=${createdOrder.token}\n\nTerima kasih!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      Kirim via WhatsApp Web
                    </a>

                    <button
                      onClick={() => {
                        setRestockOpen(false);
                        loadData();
                      }}
                      className="w-full h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                    >
                      Selesai
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {restockMessage && (
                  <div className="rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                    {restockMessage}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-[#334155]">Restock Quantity (Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                    placeholder="e.g. 50"
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-4 mt-6">
                  <button
                    onClick={() => setRestockOpen(false)}
                    disabled={sendingRestock}
                    className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSendRestock}
                    disabled={sendingRestock || restockQty <= 0}
                    className="flex h-10 items-center gap-2 rounded-lg bg-[#00685F] px-5 text-sm font-semibold text-white hover:bg-[#00574F] disabled:opacity-50"
                  >
                    {sendingRestock && (
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                    )}
                    Send Message Link
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
