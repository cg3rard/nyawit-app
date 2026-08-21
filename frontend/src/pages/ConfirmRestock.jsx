import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { getRestockOrder, confirmRestockOrder } from "../services/api";

export default function ConfirmRestock() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // New Supplier Option States
  const [confirmSend, setConfirmSend] = useState(true); // true = Kirim, false = Tolak
  const [qtyToSend, setQtyToSend] = useState(0);
  const [supplierNote, setSupplierNote] = useState("");

  const loadOrder = async () => {
    if (!id) {
      setError("Missing Restock Order ID.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("400 — Token wajib ada untuk mengakses halaman ini.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getRestockOrder(id, token);
      setOrder(data);
      setQtyToSend(data.quantity); // Default quantity to requested amount
    } catch (err) {
      setError(err?.response?.data?.detail || "Restock order not found or link is invalid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleConfirm = async () => {
    if (!id || !token) {
      alert("Invalid restock parameters.");
      return;
    }

    if (confirmSend) {
      if (qtyToSend <= 0) {
        setError("Jumlah yang dikirim harus lebih besar dari 0.");
        return;
      }
      if (qtyToSend > order.quantity) {
        setError(`Jumlah yang dikirim tidak boleh melebihi jumlah permintaan (${order.quantity} pcs).`);
        return;
      }
    } else {
      if (!supplierNote.trim()) {
        setError("Mohon isi alasan penolakan/pembatalan restock.");
        return;
      }
    }

    try {
      setConfirming(true);
      setError(null);

      const payload = {
        confirm: confirmSend,
        quantity: confirmSend ? Number(qtyToSend) : 0,
        reason: supplierNote.trim(),
      };

      await confirmRestockOrder(id, token, payload);
      setSuccess(true);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to submit restock confirmation.");
    } finally {
      setConfirming(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(Number(value || 0))
      .replace("IDR", "Rp");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F8FAFC] px-4 py-12">
      {/* Brand logo header */}
      <div className="mb-8 text-center flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F3] p-1.5 border border-[#E2E8F0] shadow-sm">
          <img src="/icons.png" alt="Logo" className="h-full w-full object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#00685F]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            CoStore Nyawit
          </h1>
          <p className="text-xs text-[#64748B]">Supplier Gateway</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <span className="material-symbols-outlined animate-spin text-[36px] text-[#00685F]">
            progress_activity
          </span>
          <p className="text-sm text-[#64748B]">Loading restock order details...</p>
        </div>
      ) : error && !order ? (
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <span className="material-symbols-outlined text-red-500 text-5xl mb-4">cancel</span>
          <h3 className="text-lg font-bold text-slate-800">Invalid Link</h3>
          <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
            {error}
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Please make sure the link matches the one sent by our WhatsApp Bot.
          </p>
        </div>
      ) : success ? (
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-8 text-center shadow-lg">
          {confirmSend ? (
            <>
              <span className="material-symbols-outlined text-emerald-500 text-5xl mb-4 animate-bounce">check_circle</span>
              <h3 className="text-xl font-bold text-slate-800">Restock Confirmed!</h3>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                Thank you! Restock order for <strong>{order?.product.name}</strong> has been successfully confirmed.
              </p>
              <div className="my-6 rounded-xl bg-emerald-50 p-4 border border-emerald-100 text-left text-xs space-y-2 text-emerald-950 font-mono">
                <div><strong>Product:</strong> {order?.product.name}</div>
                <div><strong>Quantity Sent:</strong> {qtyToSend} units (from {order?.quantity} requested)</div>
                <div><strong>Status:</strong> CONFIRMED (Updated)</div>
                {supplierNote.trim() && <div><strong>Note:</strong> "{supplierNote}"</div>}
                <div><strong>Confirmed At:</strong> {new Date().toLocaleString()}</div>
              </div>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-red-500 text-5xl mb-4">cancel</span>
              <h3 className="text-xl font-bold text-slate-800">Restock Declined</h3>
              <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
                The restock request for <strong>{order?.product.name}</strong> has been declined.
              </p>
              <div className="my-6 rounded-xl bg-red-50 p-4 border border-red-100 text-left text-xs space-y-2 text-red-950 font-mono">
                <div><strong>Product:</strong> {order?.product.name}</div>
                <div><strong>Status:</strong> REJECTED</div>
                <div><strong>Reason:</strong> "{supplierNote}"</div>
                <div><strong>Declined At:</strong> {new Date().toLocaleString()}</div>
              </div>
            </>
          )}
          <p className="text-xs text-slate-400">
            The store database has been updated. You can close this tab now.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-lg">
          <div className="text-center mb-6">
            <span className="material-symbols-outlined text-[#00685F] text-4xl mb-2">local_shipping</span>
            <h3 className="text-lg font-bold text-slate-800">Restock Confirmation</h3>
            <p className="text-xs text-[#64748B] mt-0.5">Supply request details from CoStore Nyawit.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {error}
            </div>
          )}

          {/* Details Card */}
          <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 mb-6 space-y-3 text-sm">
            <div className="flex justify-between border-b border-[#E2E8F0]/80 pb-2">
              <span className="text-[#64748B]">Supplier:</span>
              <span className="font-semibold text-slate-800">{order?.supplier?.name}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0]/80 pb-2">
              <span className="text-[#64748B]">Product:</span>
              <span className="font-semibold text-slate-800">{order?.product.name}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0]/80 pb-2">
              <span className="text-[#64748B]">Product Code:</span>
              <span className="font-mono text-xs text-slate-700">{order?.product.product_code}</span>
            </div>
            <div className="flex justify-between border-b border-[#E2E8F0]/80 pb-2">
              <span className="text-[#64748B]">Supply Requested:</span>
              <span className="font-extrabold text-[#00685F]">{order?.quantity} pcs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">Unit Cost:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(order?.product.purchase_price)}</span>
            </div>
          </div>

          {order?.status !== "PENDING" ? (
            <div className="text-center py-4 space-y-2">
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold ${
                order?.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
              }`}>
                Status: {order?.status}
              </div>
              <p className="text-xs text-[#64748B] mt-2">
                This restock request has already been processed and cannot be changed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Option Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-2">Apakah Anda bersedia mengirimkan restock?</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="confirm_send"
                      checked={confirmSend === true}
                      onChange={() => {
                        setConfirmSend(true);
                        setError(null);
                      }}
                      className="text-[#00685F] focus:ring-[#00685F] h-4 w-4"
                    />
                    <span>Ya, Kirim</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                    <input
                      type="radio"
                      name="confirm_send"
                      checked={confirmSend === false}
                      onChange={() => {
                        setConfirmSend(false);
                        setError(null);
                      }}
                      className="text-red-500 focus:ring-red-500 h-4 w-4"
                    />
                    <span>Tidak / Tolak</span>
                  </label>
                </div>
              </div>

              {confirmSend ? (
                <>
                  {/* Quantity input */}
                  <div>
                    <label htmlFor="qty_to_send" className="block text-xs font-semibold text-[#334155] mb-1.5">
                      Jumlah yang dikirim (Maksimum {order?.quantity} pcs)
                    </label>
                    <input
                      id="qty_to_send"
                      type="number"
                      min="1"
                      max={order?.quantity}
                      value={qtyToSend}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setQtyToSend(val);
                        if (val > (order?.quantity || 0)) {
                          setError(`Jumlah yang dikirim tidak boleh melebihi permintaan (${order?.quantity} pcs).`);
                        } else {
                          setError(null);
                        }
                      }}
                      className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                    />
                  </div>

                  {/* Supplier note */}
                  <div>
                    <label htmlFor="supplier_note" className="block text-xs font-semibold text-[#334155] mb-1.5">
                      Catatan Tambahan (Opsional)
                    </label>
                    <textarea
                      id="supplier_note"
                      value={supplierNote}
                      onChange={(e) => setSupplierNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-[#E2E8F0] p-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10 resize-none"
                      placeholder="Tulis catatan atau pesan jika ada..."
                    />
                  </div>
                </>
              ) : (
                /* Rejection Reason note */
                <div>
                  <label htmlFor="reject_reason" className="block text-xs font-semibold text-red-700 mb-1.5">
                    Alasan Penolakan (Wajib diisi) *
                  </label>
                  <textarea
                    id="reject_reason"
                    required
                    value={supplierNote}
                    onChange={(e) => {
                      setSupplierNote(e.target.value);
                      if (e.target.value.trim()) setError(null);
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-red-200 p-3 text-sm text-[#141B2B] outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/10 resize-none bg-red-50/10"
                    placeholder="Mohon sebutkan alasan mengapa pesanan ditolak..."
                  />
                </div>
              )}

              {/* Confirm submit button */}
              <div className="pt-2">
                <button
                  onClick={handleConfirm}
                  disabled={
                    confirming ||
                    (confirmSend && (qtyToSend <= 0 || qtyToSend > (order?.quantity || 0))) ||
                    (!confirmSend && !supplierNote.trim())
                  }
                  className={`w-full flex h-11 items-center justify-center gap-2 rounded-lg text-white font-bold transition shadow-sm disabled:opacity-50 ${
                    confirmSend ? "bg-[#00685F] hover:bg-[#00574F]" : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {confirming && (
                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                  )}
                  {confirmSend ? "Confirm Restock Order" : "Submit Rejection"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
