import { useState } from "react";
import EmptyState from "../common/EmptyState";

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
            <ul className="space-y-1.5">
              {filteredLow.map((p) => (
                <li key={p.product_id} className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--color-text)" }}>{p.product_name}</span>
                  <span className="font-semibold" style={{ color: "var(--color-warning)" }}>
                    {p.stock} units remaining
                  </span>
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
