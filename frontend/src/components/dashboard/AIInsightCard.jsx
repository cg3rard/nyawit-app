export default function AIInsightCard() {
  return (
    <div
      className="rounded-2xl p-5 shadow-sm"
      style={{ background: "linear-gradient(135deg, #4F46E510 0%, #4648D410 100%)", border: "1px solid #4F46E520" }}
    >
      <div className="flex items-start gap-3 mb-4">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: "#4F46E520" }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: "var(--color-ai)" }}>
            auto_awesome
          </span>
        </div>
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--color-text)" }}>
            AI Insights
          </h2>
          <p className="text-xs" style={{ color: "var(--color-muted)" }}>
            Powered by smart analytics
          </p>
        </div>
      </div>

      <div className="rounded-xl py-6 px-4 text-center" style={{ backgroundColor: "#4F46E508" }}>
        <span
          className="material-symbols-outlined text-4xl mb-3 block"
          style={{ color: "#4F46E580" }}
        >
          psychology
        </span>
        <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-ai)" }}>
          AI insights are being prepared
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "var(--color-muted)" }}>
          Inventory predictions and sales analytics will appear here once AI analysis is available.
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full"
              style={{ width: i === 0 ? 24 : 8, backgroundColor: i === 0 ? "var(--color-ai)" : "#4F46E530" }}
            />
          ))}
        </div>
        <span className="text-[11px]" style={{ color: "var(--color-muted)" }}>
          Coming soon
        </span>
      </div>
    </div>
  );
}
