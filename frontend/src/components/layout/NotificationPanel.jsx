import { useEffect, useRef } from "react";

function NotifItem({ icon, iconColor, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--color-text)" }}>
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: "var(--color-muted)" }}>
          {subtitle}
        </p>
      </div>
    </div>
  );
}

export default function NotificationPanel({ open, onClose, lowStockProducts = [], expiryAlerts = [] }) {
  const ref = useRef(null);
  const total = lowStockProducts.length + expiryAlerts.length;

  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    function handler(e) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-80 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
          Notifications {total > 0 && <span className="ml-1 rounded-full bg-red-500 px-1.5 py-0.5 text-xs text-white">{total}</span>}
        </span>
        <button
          onClick={onClose}
          aria-label="Close notifications"
          className="rounded-lg p-1 hover:bg-gray-100 transition-colors"
        >
          <span className="material-symbols-outlined text-lg" style={{ color: "var(--color-muted)" }}>close</span>
        </button>
      </div>

      <div className="max-h-80 overflow-y-auto">
        {total === 0 ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl" style={{ color: "var(--color-muted)" }}>notifications_none</span>
            <p className="mt-2 text-sm" style={{ color: "var(--color-muted)" }}>No notifications</p>
          </div>
        ) : (
          <>
            {lowStockProducts.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                  Low Stock
                </p>
                {lowStockProducts.map((p) => (
                  <NotifItem
                    key={p.product_id}
                    icon="inventory_2"
                    iconColor="var(--color-warning)"
                    title={p.product_name}
                    subtitle={`Remaining stock: ${p.stock} units`}
                  />
                ))}
              </>
            )}
            {expiryAlerts.length > 0 && (
              <>
                <p className="px-4 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>
                  Expiry Alerts
                </p>
                {expiryAlerts.map((p) => (
                  <NotifItem
                    key={p.product_id}
                    icon="calendar_today"
                    iconColor="var(--color-danger)"
                    title={p.product_name}
                    subtitle={`Expires: ${p.expiry_date}`}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
