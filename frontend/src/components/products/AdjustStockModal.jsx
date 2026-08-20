import { useEffect, useState } from "react";
import { stockIn, stockOut, adjustStock, createProduct, updateProduct } from "../../services/api";

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

export default function AdjustStockModal({ isOpen, product, onClose, onSuccess }) {
  const [movementType, setMovementType] = useState("IN"); // IN, OUT, ADJUSTMENT
  const [qty, setQty] = useState(1);
  const [newStock, setNewStock] = useState(0);
  const [reason, setReason] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [createAsNewBatch, setCreateAsNewBatch] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getFormattedDate = (d) => {
    if (!d) return "";
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "";
    return dateObj.toISOString().split("T")[0];
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset fields when opened or product changes
  useEffect(() => {
    if (isOpen && product) {
      setMovementType("IN");
      setQty(1);
      setNewStock(product.stock || 0);
      setReason("");
      setExpiryDate(getFormattedDate(product.expiry_date));
      setCreateAsNewBatch(true);
      setError(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock || 0;
  const originalExpiryStr = getFormattedDate(product.expiry_date);
  const isExpiryChanged = movementType === "IN" && expiryDate !== originalExpiryStr;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (movementType === "IN") {
        if (qty <= 0) throw new Error("Quantity must be greater than 0");

        if (isExpiryChanged && createAsNewBatch) {
          // 1. Create duplicate product as a separate batch
          const newCode = generateUUID();
          await createProduct({
            product_code: newCode,
            name: product.name,
            category: product.category,
            purchase_price: product.purchase_price,
            selling_price: product.selling_price,
            stock: qty,
            expiry_date: expiryDate || null,
          });

          // Duplicate photo if any
          const oldPhoto = localStorage.getItem(`product_photo_${product.product_code}`);
          if (oldPhoto) {
            localStorage.setItem(`product_photo_${newCode}`, oldPhoto);
          }
        } else {
          // 2. Standard Stock In
          await stockIn({
            product_id: product.id,
            quantity: qty,
            reason: reason.trim() || undefined,
          });

          // 3. Update current product's expiry date if chosen
          if (isExpiryChanged && !createAsNewBatch) {
            await updateProduct(product.id, {
              expiry_date: expiryDate || null,
            });
          }
        }
      } else if (movementType === "OUT") {
        if (qty <= 0) throw new Error("Quantity must be greater than 0");
        if (qty > currentStock) {
          throw new Error(`Insufficient stock. Maximum removable is ${currentStock} units`);
        }
        await stockOut({
          product_id: product.id,
          quantity: qty,
          reason: reason.trim() || undefined,
        });
      } else if (movementType === "ADJUSTMENT") {
        if (newStock < 0) throw new Error("Target stock level cannot be negative");
        await adjustStock({
          product_id: product.id,
          new_stock: newStock,
          reason: reason.trim() || undefined,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.detail || err?.message || "Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Card Box */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <h2 className="text-base font-bold text-[#141B2B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Record Stock Change
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Product Summary */}
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
              <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">Product</p>
              <h3 className="font-bold text-sm text-[#141B2B] mt-0.5">{product.name}</h3>
              <div className="mt-2 flex justify-between text-xs text-[#64748B]">
                <span>Code: <span className="font-mono text-[#141B2B]">{product.product_code}</span></span>
                <span>Current Stock: <span className="font-semibold text-[#00685F]">{currentStock} units</span></span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <span className="material-symbols-outlined text-[16px] text-red-500 mt-0.5">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Movement Type */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#334155]">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setMovementType("IN")}
                  className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                    movementType === "IN"
                      ? "bg-[#E8F5F3] border-[#00685F]/20 text-[#00685F]"
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">add_circle</span>
                  Stock In
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("OUT")}
                  className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                    movementType === "OUT"
                      ? "bg-amber-50 border-amber-300 text-amber-800"
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">remove_circle</span>
                  Stock Out
                </button>
                <button
                  type="button"
                  onClick={() => setMovementType("ADJUSTMENT")}
                  className={`h-9 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 border ${
                    movementType === "ADJUSTMENT"
                      ? "bg-indigo-50 border-indigo-200 text-indigo-800"
                      : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">settings</span>
                  Correct
                </button>
              </div>
            </div>

            {/* Quantity inputs depending on type */}
            {movementType !== "ADJUSTMENT" ? (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="qty_input" className="text-xs font-semibold text-[#334155]">
                  {movementType === "IN" ? "Quantity to Add" : "Quantity to Remove"}
                </label>
                <input
                  id="qty_input"
                  type="number"
                  min="1"
                  max={movementType === "OUT" ? currentStock : undefined}
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value || 0))}
                  required
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="target_stock" className="text-xs font-semibold text-[#334155]">New Stock Level</label>
                <input
                  id="target_stock"
                  type="number"
                  min="0"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value || 0))}
                  required
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                />
              </div>
            )}

            {/* Expiry Date (Stock In only) */}
            {movementType === "IN" && (
              <div className="flex flex-col gap-1.5">
                <label htmlFor="expiry_date" className="text-xs font-semibold text-[#334155]">Expiry Date</label>
                <input
                  id="expiry_date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                />
              </div>
            )}

            {/* Batching Option (Stock In & Expiry Date modified) */}
            {isExpiryChanged && (
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 space-y-2">
                <p className="text-xs font-semibold text-blue-900">Different Expiry Date Detected</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="radio"
                      name="batch_type"
                      checked={createAsNewBatch}
                      onChange={() => setCreateAsNewBatch(true)}
                      className="mt-0.5 accent-[#00685F]"
                    />
                    <span>
                      <strong className="text-slate-800">Create new batch</strong><br />
                      Creates a new separate product row for exp <strong>{expiryDate || "no date"}</strong> with {qty} stock.
                    </span>
                  </label>
                  <label className="flex items-start gap-2.5 text-xs text-[#475569] cursor-pointer">
                    <input
                      type="radio"
                      name="batch_type"
                      checked={!createAsNewBatch}
                      onChange={() => setCreateAsNewBatch(false)}
                      className="mt-0.5 accent-[#00685F]"
                    />
                    <span>
                      <strong className="text-slate-800">Update current product</strong><br />
                      Adds stock to the existing product and updates its expiry date to <strong>{expiryDate || "no date"}</strong>.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="reason" className="text-xs font-semibold text-[#334155]">Reason / Notes</label>
              <input
                id="reason"
                type="text"
                placeholder={
                  movementType === "IN"
                    ? "e.g. Restock from supplier"
                    : movementType === "OUT"
                    ? "e.g. Broken package / expired"
                    : "e.g. Monthly stock opname"
                }
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC]">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 items-center justify-center rounded-lg bg-[#00685F] px-5 text-xs font-bold text-white transition hover:bg-[#00574F] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Confirm Change"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
