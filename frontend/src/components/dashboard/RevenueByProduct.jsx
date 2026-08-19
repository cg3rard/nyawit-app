import EmptyState from "../common/EmptyState";

function formatRupiah(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(parseFloat(value) || 0);
}

const BAR_COLORS = [
  "var(--color-primary)",
  "var(--color-secondary)",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
];

export default function RevenueByProduct({ products = [] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm h-full">
        <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text)" }}>
          Revenue by Product
        </h2>
        <EmptyState
          icon="bar_chart"
          title="No revenue data yet"
          message="Revenue data will appear after the first sale"
        />
      </div>
    );
  }

  const maxRevenue = Math.max(...products.map((p) => parseFloat(p.total_revenue) || 0));

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm h-full">
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text)" }}>
        Revenue by Product
      </h2>
      <div className="space-y-3">
        {products.map((product, idx) => {
          const rev = parseFloat(product.total_revenue) || 0;
          const pct = maxRevenue > 0 ? (rev / maxRevenue) * 100 : 0;
          const color = BAR_COLORS[idx % BAR_COLORS.length];
          return (
            <div key={product.product_id}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium truncate max-w-[60%]" style={{ color: "var(--color-text)" }}>
                  {product.product_name}
                </span>
                <span className="text-sm font-semibold ml-2 shrink-0" style={{ color }}>
                  {formatRupiah(rev)}
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
