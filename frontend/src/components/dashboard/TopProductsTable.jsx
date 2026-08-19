import EmptyState from "../common/EmptyState";

export default function TopProductsTable({ products = [], searchQuery = "" }) {
  const filtered = products.filter((p) =>
    p.product_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm h-full">
      <h2 className="text-base font-bold mb-4" style={{ color: "var(--color-text)" }}>
        Top Selling Products
      </h2>

      {products.length === 0 ? (
        <EmptyState
          icon="leaderboard"
          title="No sales yet today"
          message="Data will appear after the first transaction today"
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon="search_off" title="No products found" />
      ) : (
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 pl-5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>#</th>
                <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Product</th>
                <th className="pb-2 pr-5 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--color-muted)" }}>Sold</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, idx) => (
                <tr
                  key={product.product_id}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors focus-within:bg-gray-50"
                  tabIndex={0}
                >
                  <td className="py-3 pl-5">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        backgroundColor: idx === 0 ? "#FEF3C7" : "#F1F5F9",
                        color: idx === 0 ? "#92400E" : "var(--color-muted)",
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td className="py-3 font-medium" style={{ color: "var(--color-text)" }}>
                    {product.product_name}
                  </td>
                  <td className="py-3 pr-5 text-right">
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold"
                      style={{ backgroundColor: "#00685F15", color: "var(--color-primary)" }}
                    >
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      {product.total_quantity_sold} units
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
