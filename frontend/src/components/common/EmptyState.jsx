export default function EmptyState({ icon = "inbox", title, message, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center py-10 text-center ${className}`}>
      <span
        className="material-symbols-outlined text-5xl mb-3"
        style={{ color: "var(--color-muted)", fontSize: 48 }}
      >
        {icon}
      </span>
      <p className="text-sm font-semibold" style={{ color: "var(--color-text)" }}>
        {title}
      </p>
      {message && (
        <p className="mt-1 text-xs" style={{ color: "var(--color-muted)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
