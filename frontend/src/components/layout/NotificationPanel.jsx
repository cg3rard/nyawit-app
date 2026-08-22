import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

function NotifItem({ icon, iconColor, title, subtitle, badge, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 group cursor-pointer"
    >
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <span
          className="material-symbols-outlined text-base"
          style={{ color: iconColor }}
        >
          {icon}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="text-xs font-bold truncate text-slate-800 group-hover:text-[#00685F] transition-colors">
            {title}
          </p>
          {badge && (
            <span className="shrink-0 text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
              {badge}
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5 text-slate-500 line-clamp-1 leading-snug">
          {subtitle}
        </p>
      </div>
    </button>
  );
}

export default function NotificationPanel({
  open,
  onClose,
  lowStockProducts = [],
  expiryAlerts = [],
  aiInsight = null,
}) {
  const ref = useRef(null);
  const navigate = useNavigate();

  const total =
    lowStockProducts.length +
    expiryAlerts.length +
    (aiInsight ? 1 : 0);

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
    function handler(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full mt-2 z-50 w-84 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-800">
            Notifications & Alerts
          </span>
          {total > 0 && (
            <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-extrabold text-white">
              {total}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notifications"
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Notifications List */}
      <div className="max-h-88 overflow-y-auto divide-y divide-slate-50">
        {total === 0 ? (
          <div className="py-10 text-center px-4">
            <span className="material-symbols-outlined text-3xl text-emerald-500/80 mb-1">
              verified
            </span>
            <p className="text-xs font-bold text-slate-700">All Systems Healthy</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              No low stock warnings or upcoming expiry alerts at this time.
            </p>
          </div>
        ) : (
          <>
            {/* AI Insights Alert */}
            {aiInsight && (
              <div>
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#4F46E5]">
                    AI Action Recommendation
                  </span>
                  <span className="text-[9px] text-indigo-500 font-semibold">AI Insights</span>
                </div>
                <NotifItem
                  icon="auto_awesome"
                  iconColor="#4F46E5"
                  title={aiInsight.product_name || "Critical Product Alert"}
                  subtitle={aiInsight.ai_recommendation?.recommendation || "Restock or promotional action suggested by AI"}
                  badge={aiInsight.status || "Action"}
                  onClick={() => handleNavigate("/ai-insights")}
                />
              </div>
            )}

            {/* Expiry Alerts */}
            {expiryAlerts.length > 0 && (
              <div>
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-red-600">
                    Expiry Warnings
                  </span>
                  <span className="text-[9px] text-red-500 font-semibold">{expiryAlerts.length} items</span>
                </div>
                {expiryAlerts.map((p) => (
                  <NotifItem
                    key={`exp-${p.product_id}`}
                    icon="event_busy"
                    iconColor="#EF4444"
                    title={p.product_name}
                    subtitle={`Expires on: ${p.expiry_date} — Tap to review`}
                    badge="Expiring"
                    onClick={() => handleNavigate("/products")}
                  />
                ))}
              </div>
            )}

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && (
              <div>
                <div className="px-4 pt-2.5 pb-1 flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-amber-600">
                    Low Stock Urgency
                  </span>
                  <span className="text-[9px] text-amber-500 font-semibold">{lowStockProducts.length} items</span>
                </div>
                {lowStockProducts.map((p) => (
                  <NotifItem
                    key={`low-${p.product_id}`}
                    icon="inventory_2"
                    iconColor="#F59E0B"
                    title={p.product_name}
                    subtitle={`Only ${p.stock} units remaining in inventory`}
                    badge="Low Stock"
                    onClick={() => handleNavigate("/inventory")}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-2 text-center">
        <button
          type="button"
          onClick={() => handleNavigate("/")}
          className="text-[11px] font-bold text-[#00685F] hover:underline"
        >
          View Full Dashboard Analytics →
        </button>
      </div>
    </div>
  );
}
