export default function PlaceholderPage({ title = "Coming Soon" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <span
        className="material-symbols-outlined text-6xl mb-4"
        style={{ color: "#CBD5E1", fontSize: 64 }}
      >
        construction
      </span>
      <h2
        className="text-xl font-bold mb-2"
        style={{ color: "var(--color-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {title}
      </h2>
      <p className="text-sm max-w-xs" style={{ color: "var(--color-muted)" }}>
        This page is under development and will be available soon.
      </p>
    </div>
  );
}
