function formatRupiah(value) {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

function KPICard({ icon, iconBg, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: icon.color }}>
            {icon.name}
          </span>
        </div>
      </div>
      <p className="text-2xl font-bold tracking-tight" style={{ color: "var(--color-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        {value}
      </p>
      <p className="mt-1 text-sm font-medium" style={{ color: "var(--color-muted)" }}>{label}</p>
      {sub && <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>{sub}</p>}
    </div>
  );
}

export default function DashboardKPI({ salesToday }) {
  const revenue = parseFloat(salesToday?.total_revenue || 0);
  const transactions = salesToday?.total_transactions || 0;
  const itemsSold = salesToday?.total_items_sold || 0;
  const avgTransaction = transactions > 0 ? revenue / transactions : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPICard
        icon={{ name: "payments", color: "var(--color-primary)" }}
        iconBg="#00685F15"
        label="Today's Revenue"
        value={formatRupiah(revenue)}
      />
      <KPICard
        icon={{ name: "receipt_long", color: "var(--color-secondary)" }}
        iconBg="#4648D415"
        label="Transactions"
        value={transactions.toLocaleString("id-ID")}
        sub="transactions today"
      />
      <KPICard
        icon={{ name: "shopping_bag", color: "var(--color-warning)" }}
        iconBg="#F59E0B15"
        label="Items Sold"
        value={itemsSold.toLocaleString("id-ID")}
        sub="units sold"
      />
      <KPICard
        icon={{ name: "bar_chart", color: "#8B5CF6" }}
        iconBg="#8B5CF615"
        label="Avg. Transaction"
        value={formatRupiah(avgTransaction)}
        sub={transactions === 0 ? "No transactions yet" : undefined}
      />
    </div>
  );
}
