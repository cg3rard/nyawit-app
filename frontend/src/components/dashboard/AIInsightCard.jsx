export default function AIInsightCard({ insight }) {
  const hasInsight = !!insight;

  let badgeClass = "";
  let borderClass = "";
  let actionColor = "";
  let actionIcon = "psychology";

  if (hasInsight) {
    const isRed = insight.status === "Merah";
    badgeClass = isRed ? "bg-red-50 text-red-600 border border-red-200" : "bg-amber-50 text-amber-600 border border-amber-200";
    borderClass = isRed ? "border-red-100" : "border-amber-100";
    actionColor = isRed ? "text-red-700" : "text-amber-700";
    actionIcon = insight.ai_recommendation.action === "RESTOCK_URGENT" ? "emergency_home" : "percent";
  }

  return (
    <div
      className="rounded-2xl p-5 shadow-sm flex flex-col justify-between"
      style={{
        background: hasInsight 
          ? "linear-gradient(180deg, #4F46E508 0%, #FFFFFF 100%)" 
          : "linear-gradient(135deg, #10B98108 0%, #FFFFFF 100%)",
        border: hasInsight ? "1px solid #4F46E518" : "1px solid #10B98118",
        minHeight: "340px"
      }}
    >
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: hasInsight ? "#4F46E515" : "#10B98115" }}
            >
              <span 
                className="material-symbols-outlined text-xl" 
                style={{ color: hasInsight ? "var(--color-ai)" : "#10B981" }}
              >
                auto_awesome
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
                AI Insights
              </h2>
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                {hasInsight ? "Rekomendasi Tindakan Otomatis" : "Status Stok Inventori"}
              </p>
            </div>
          </div>

          {hasInsight && (
            <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${badgeClass}`}>
              {insight.status}
            </span>
          )}
        </div>

        {/* Content Body */}
        {hasInsight ? (
          <div className="flex flex-col gap-3">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-800">{insight.product_name}</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Stok: {insight.metrics.current_stock} pcs • DOI: {insight.metrics.days_of_inventory} hari • Tren: {insight.metrics.sales_trend_pct}
              </p>
            </div>

            <div className={`rounded-xl border p-3.5 bg-white shadow-sm flex items-start gap-2.5 ${borderClass}`}>
              <span className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${actionColor}`}>
                {actionIcon}
              </span>
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-wide text-slate-400">
                  {insight.ai_recommendation.action}
                </span>
                <p className="text-xs font-semibold text-slate-800 leading-snug mt-0.5">
                  {insight.ai_recommendation.recommendation}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl py-6 px-4 text-center mt-3" style={{ backgroundColor: "#10B98104" }}>
            <span
              className="material-symbols-outlined text-4xl mb-3 block"
              style={{ color: "#10B98180" }}
            >
              check_circle
            </span>
            <p className="text-sm font-semibold mb-1 text-emerald-700">
              Semua Stok Aman
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
              Tidak terdeteksi adanya risiko kehabisan stok (*restock*) maupun penumpukan barang (*dead stock*) saat ini.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Status Indicator */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-3">
        <span className="text-[10px] text-slate-400">
          {hasInsight ? "AI mendeteksi barang kritis" : "Kondisi operasional optimal"}
        </span>
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-1 rounded-full"
              style={{ 
                width: i === 0 ? 16 : 6, 
                backgroundColor: hasInsight 
                  ? (i === 0 ? "var(--color-ai)" : "#4F46E525")
                  : (i === 0 ? "#10B981" : "#10B98125")
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
