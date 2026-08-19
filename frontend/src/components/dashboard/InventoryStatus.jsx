export default function InventoryStatus({ inventory }) {
  const total = inventory?.total_products || 0;
  const low = inventory?.low_stock_products || 0;
  const outOfStock = inventory?.out_of_stock_products || 0;
  const healthy = Math.max(0, total - low - outOfStock);

  const segments = [
    { label: "Healthy",       value: healthy,    color: "var(--color-success)", bg: "#10B98115" },
    { label: "Low Stock",     value: low,        color: "var(--color-warning)", bg: "#F59E0B15" },
    { label: "Out of Stock",  value: outOfStock, color: "var(--color-danger)",  bg: "#EF444415" },
  ];

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold mb-1" style={{ color: "var(--color-text)" }}>
        Inventory Status
      </h2>
      <p className="text-xs mb-4" style={{ color: "var(--color-muted)" }}>
        {total} products · {inventory?.total_stock_units ?? 0} total units
      </p>

      {/* Stacked bar */}
      {total > 0 && (
        <div className="flex h-3 w-full overflow-hidden rounded-full gap-0.5 mb-4">
          {segments.map((s) => {
            const pct = total > 0 ? (s.value / total) * 100 : 0;
            return pct > 0 ? (
              <div
                key={s.label}
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${pct}%`, backgroundColor: s.color }}
                title={`${s.label}: ${s.value}`}
              />
            ) : null;
          })}
        </div>
      )}

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2">
        {segments.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center rounded-xl p-3 text-center"
            style={{ backgroundColor: s.bg }}
          >
            <span className="text-xl font-bold" style={{ color: s.color, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              {s.value}
            </span>
            <span className="text-[11px] font-medium mt-0.5" style={{ color: s.color }}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
