export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span
        className="material-symbols-outlined text-5xl mb-3"
        style={{ color: "var(--color-danger)", fontSize: 48 }}
      >
        error_outline
      </span>
      <p className="text-sm font-semibold mb-1" style={{ color: "var(--color-text)" }}>
        Failed to load data
      </p>
      <p className="text-xs mb-4 max-w-xs" style={{ color: "var(--color-muted)" }}>
        {message || "An error occurred while connecting to the server. Please check your connection."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          <span className="material-symbols-outlined text-base">refresh</span>
          Try Again
        </button>
      )}
    </div>
  );
}
