import { useEffect } from "react";

export default function DeleteProductModal({
  open,
  product,
  onClose,
  onConfirm,
  deleting,
  error,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50">
            <span className="material-symbols-outlined text-[22px] text-red-500">
              delete
            </span>
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#141B2B]">
              Delete Product?
            </h2>

            <p className="mt-1 text-sm leading-5 text-[#64748B]">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-[#141B2B]">
                {product.name}
              </span>
              ?
            </p>
          </div>
        </div>

        {/* Backend Error */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined mt-0.5 text-[18px] text-red-500">
                error
              </span>

              <div>
                <p className="text-xs font-semibold text-red-700">
                  Cannot delete product
                </p>

                <p className="mt-1 text-xs leading-5 text-red-600">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {!error && (
          <p className="mt-3 text-xs text-red-500">
            This action cannot be undone.
          </p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex h-10 items-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {deleting && (
              <span className="material-symbols-outlined animate-spin text-[17px]">
                progress_activity
              </span>
            )}

            {deleting ? "Deleting..." : "Delete Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
