import { useEffect, useState } from "react";
import { getWAMessages, receiveRestockOrder } from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

const formatPhoneForWA = (phone) =>
  phone ? phone.replace(/[^0-9]/g, "") : "";

/* ── Result badge shown in the right column ─────────────────────── */
function ResultBadge({ order, onReceive }) {
  if (!order) return <span className="text-slate-300 text-xs">—</span>;

  if (order.status === "PENDING") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2.5 py-1 text-[11px] font-semibold">
        <span className="material-symbols-outlined text-[12px]">schedule</span>
        Menunggu Supplier
      </span>
    );
  }

  if (order.status === "REJECTED") {
    return (
      <div className="space-y-1 text-left">
        <span className="inline-flex items-center gap-1 rounded-full bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[12px]">cancel</span>
          Ditolak Supplier
        </span>
        {order.supplier_note && (
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-[180px]">
            <span className="font-semibold text-red-500">Alasan: </span>
            {order.supplier_note}
          </p>
        )}
      </div>
    );
  }

  if (order.status === "CONFIRMED") {
    return (
      <div className="space-y-1.5 text-left">
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[12px]">thumb_up</span>
          Dikonfirmasi Supplier
        </span>
        {order.supplier_note && (
          <p className="text-[10px] text-slate-500 max-w-[180px]">
            <span className="font-semibold text-slate-600">Catatan: </span>
            {order.supplier_note}
          </p>
        )}
        {order.received_quantity && (
          <p className="text-[10px] text-blue-600 font-semibold">
            Siap kirim: {order.received_quantity} pcs
          </p>
        )}
        {/* Owner action button */}
        <button
          onClick={() => onReceive(order)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#00685F] hover:bg-[#00574F] px-2.5 py-1.5 rounded transition"
        >
          <span className="material-symbols-outlined text-[13px]">move_to_inbox</span>
          Terima Barang
        </button>
      </div>
    );
  }

  if (order.status === "RECEIVED") {
    return (
      <div className="space-y-1 text-left">
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 text-[11px] font-semibold">
          <span className="material-symbols-outlined text-[12px]">check_circle</span>
          Diterima & Masuk Stock
        </span>
        <p className="text-[10px] text-slate-600 font-semibold">
          Diterima: {order.received_quantity} pcs
        </p>
        {order.received_expiry_date && (
          <p className="text-[10px] text-slate-500">
            Exp: {new Date(order.received_expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
        )}
        {order.supplier_note && (
          <p className="text-[10px] text-slate-400 max-w-[180px]">
            <span className="font-semibold">Catatan: </span>{order.supplier_note}
          </p>
        )}
      </div>
    );
  }

  return <span className="text-slate-400 text-xs">{order.status}</span>;
}

/* ── Receive Modal ───────────────────────────────────────────────── */
function ReceiveModal({ order, onClose, onSuccess }) {
  const [qty, setQty] = useState(order?.received_quantity || order?.quantity || 1);
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (qty <= 0) { setError("Jumlah harus lebih dari 0."); return; }
    try {
      setSubmitting(true);
      setError(null);
      await receiveRestockOrder(order.id, {
        received_quantity: Number(qty),
        received_expiry_date: expiryDate || null,
      });
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.detail || "Gagal memproses penerimaan barang.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-[#141B2B]">Terima Barang</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Supplier konfirmasi pengiriman. Input jumlah yang benar-benar diterima.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Info card */}
        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 mb-5 text-xs space-y-1">
          <p><span className="font-semibold text-blue-700">Produk: </span>{order?.product?.name}</p>
          <p><span className="font-semibold text-blue-700">Supplier: </span>{order?.supplier?.name}</p>
          <p><span className="font-semibold text-blue-700">Qty dikonfirmasi supplier: </span>{order?.received_quantity || order?.quantity} pcs</p>
          {order?.supplier_note && (
            <p><span className="font-semibold text-blue-700">Catatan supplier: </span>{order.supplier_note}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-xs text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Jumlah yang Diterima (pcs) *
            </label>
            <input
              type="number"
              min="1"
              required
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#334155] mb-1.5">
              Tanggal Kadaluarsa (Opsional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-[#E2E8F0] px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 h-10 rounded-lg border border-[#E2E8F0] text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-[#00685F] hover:bg-[#00574F] text-white text-sm font-semibold transition disabled:opacity-50"
            >
              {submitting && <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>}
              Konfirmasi Penerimaan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────── */
export default function WAConnection() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Receive modal state
  const [receiveOrder, setReceiveOrder] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const data = await getWAMessages();
      setMessages(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Failed to load messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleReceiveSuccess = () => {
    setReceiveOrder(null);
    loadData();
  };

  return (
    <div className="flex flex-1 flex-col bg-[#F8FAFC]">
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Receive modal */}
      {receiveOrder && (
        <ReceiveModal
          order={receiveOrder}
          onClose={() => setReceiveOrder(null)}
          onSuccess={handleReceiveSuccess}
        />
      )}

      <main className="flex-1 p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#141B2B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Stock Management Response
            </h1>
            <p className="mt-1 text-sm text-[#64748B]">
              Log notifikasi restock ke supplier. Terima barang setelah supplier konfirmasi.
            </p>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            {error}
          </div>
        )}

        {loading && messages.length === 0 ? (
          <div className="flex h-64 items-center justify-center">
            <span className="material-symbols-outlined animate-spin text-[32px] text-[#00685F]">progress_activity</span>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden">
            <div className="border-b border-[#E2E8F0] px-6 py-5">
              <h3 className="text-base font-bold text-[#141B2B]">Outgoing Messages Log</h3>
              <p className="text-xs text-[#64748B] mt-0.5">{messages.length} notifikasi restock terkirim</p>
            </div>

            <div className="overflow-x-auto">
              {messages.length === 0 ? (
                <div className="p-12 text-center">
                  <span className="material-symbols-outlined text-[36px] text-slate-300 mb-2 block">forum</span>
                  <p className="text-sm font-semibold text-slate-500">Belum Ada Pesan</p>
                  <p className="text-xs text-slate-400 mt-1">Notifikasi restock ke supplier akan muncul di sini.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-[#E2E8F0]">
                      <th className="px-5 py-3 text-xs font-bold uppercase text-[#64748B] whitespace-nowrap">Date / Time</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-[#64748B]">Recipient</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-[#64748B]">Message</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-[#64748B] whitespace-nowrap">Send via WA</th>
                      <th className="px-5 py-3 text-xs font-bold uppercase text-[#64748B] whitespace-nowrap">Result / Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {messages.map((msg) => {
                      const dateObj = new Date(msg.created_at);
                      const formattedDate = dateObj.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
                      const formattedTime = dateObj.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

                      return (
                        <tr key={msg.id} className="hover:bg-slate-50/50 align-top">
                          <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">
                            <div>{formattedDate}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{formattedTime}</div>
                          </td>

                          <td className="px-5 py-4 text-xs whitespace-nowrap">
                            <p className="font-semibold text-slate-800">{msg.supplier?.name || "Unknown"}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{msg.phone_number}</p>
                          </td>

                          <td className="px-5 py-4 text-xs max-w-xs">
                            <div className="bg-emerald-50/60 text-emerald-900 border border-emerald-100 rounded-lg p-2.5 font-mono text-[10px] leading-relaxed whitespace-pre-wrap">
                              {msg.message}
                            </div>
                          </td>

                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <a
                              href={`https://api.whatsapp.com/send?phone=${formatPhoneForWA(msg.phone_number)}&text=${encodeURIComponent(msg.message)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded transition"
                            >
                              <span className="material-symbols-outlined text-[14px]">send</span>
                              Send WA
                            </a>
                          </td>

                          <td className="px-5 py-4">
                            <ResultBadge
                              order={msg.restock_order}
                              onReceive={(order) => setReceiveOrder({ ...order, supplier: msg.supplier })}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
