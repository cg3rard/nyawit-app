import { useState } from "react";
import EmptyState from "../common/EmptyState";
import { sendRestockRequest } from "../../services/api";

function AlertRow({ icon, iconColor, title, subtitle, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <button
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${iconColor}15` }}
        >
          <span className="material-symbols-outlined text-base" style={{ color: iconColor }}>
            {icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>{title}</p>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>{subtitle}</p>
        </div>
        <span className="material-symbols-outlined text-base shrink-0 transition-transform" style={{ color: "var(--color-muted)", transform: open ? "rotate(180deg)" : "none" }}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  );
}

export default function ActionRequired({ lowStockProducts = [], expiryAlerts = [], searchQuery = "" }) {
  const totalAlerts = lowStockProducts.length + expiryAlerts.length;

  const handleNotifySupplier = async (productId, productName, supplierName) => {
    const qtyStr = prompt(
      `Send WhatsApp restock notification to "${supplierName}" for "${productName}"?\n\nEnter restock quantity (units):`,
      "50"
    );
    if (qtyStr === null) return;
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }
    try {
      await sendRestockRequest(productId, qty);
      alert(`Success! Restock request link has been generated and logged in WhatsApp Connection dashboard.`);
    } catch (err) {
      alert(err?.response?.data?.detail || "Failed to notify supplier.");
    }
  };

  const filteredLow = lowStockProducts.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredExpiry = expiryAlerts.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (totalAlerts === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Action Required
        </h2>
        <EmptyState
          icon="check_circle"
          title="All looks good"
          message="No low stock or expiry alerts"
        />
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
          Action Required
        </h2>
        <span className="rounded-full px-2.5 py-0.5 text-xs font-bold text-white" style={{ backgroundColor: "var(--color-danger)" }}>
          {totalAlerts}
        </span>
      </div>

      <div className="space-y-2">
        {filteredLow.length > 0 && (
          <AlertRow
            icon="inventory_2"
            iconColor="var(--color-warning)"
            title={`${filteredLow.length} ${filteredLow.length === 1 ? "product running low" : "products running low"}`}
            subtitle="Stock below threshold"
            defaultOpen={filteredLow.length <= 3}
          >
            <ul className="space-y-2">
              {filteredLow.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-200/50 last:border-0">
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{p.product_name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Stock: <span className="text-amber-600 font-bold">{p.stock} units</span> remaining
                    </p>
                  </div>
                  {p.supplier_name ? (
                    <button
                      onClick={() => handleNotifySupplier(p.product_id, p.product_name, p.supplier_name)}
                      className="text-[11px] font-bold text-[#00685F] hover:text-[#00574F] bg-[#E8F5F3] hover:bg-[#D2EBE7] px-2 py-1 rounded transition shrink-0"
                    >
                      Notify WA
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic shrink-0">No supplier</span>
                  )}
                </li>
              ))}
            </ul>
          </AlertRow>
        )}

        {filteredExpiry.length > 0 && (
          <AlertRow
            icon="calendar_today"
            iconColor="var(--color-danger)"
            title={`${filteredExpiry.length} ${filteredExpiry.length === 1 ? "product expires within 7 days" : "products expire within 7 days"}`}
            subtitle="Within the next 7 days"
            defaultOpen={filteredExpiry.length <= 3}
          >
            <ul className="space-y-1.5">
              {filteredExpiry.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-text)" }}>{p.product_name}</span>
                  <span className="font-semibold" style={{ color: "var(--color-danger)" }}>
                    {p.expiry_date}
                  </span>
                </li>
              ))}
            </ul>
          </AlertRow>
        )}
      </div>
    </div>
  );
}
