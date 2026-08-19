import EmptyState from "../common/EmptyState";

function getUrgency(expiryDateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDateStr);
  expiry.setHours(0, 0, 0, 0);
  const diffMs = expiry - today;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0)  return { label: "Expired",          color: "#EF4444", bg: "#FEF2F2" };
  if (diffDays === 0) return { label: "Expires today",    color: "#EF4444", bg: "#FEF2F2" };
  if (diffDays === 1) return { label: "Expires tomorrow", color: "#F97316", bg: "#FFF7ED" };
  return { label: `Expires in ${diffDays} days`, color: "#F59E0B", bg: "#FFFBEB" };
}

export default function ExpiryAlerts({ alerts = [], searchQuery = "" }) {
  const filtered = alerts.filter((a) =>
    a.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.product_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text)" }}>
        Expiry Alerts
      </h2>

      {alerts.length === 0 ? (
        <EmptyState
          icon="event_available"
          title="No expiry alerts"
          message="All products are well within their shelf life"
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search_off" title="No products found" />
      ) : (
        <div className="space-y-2">
          {filtered.map((alert) => {
            const urgency = getUrgency(alert.expiry_date);
            return (
              <div
                key={alert.product_id}
                className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 transition-colors hover:opacity-90"
                style={{ backgroundColor: urgency.bg }}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text)" }}>
                    {alert.product_name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                    {alert.product_code} · {alert.expiry_date}
                  </p>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{ backgroundColor: urgency.color, color: "#fff" }}
                >
                  {urgency.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
