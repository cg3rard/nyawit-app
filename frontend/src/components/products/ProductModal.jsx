import { useEffect } from "react";
import ProductForm from "./ProductForm";

export default function ProductModal({
  open,
  mode = "add",
  product = null,
  onClose,
  onSubmit,
  submitting = false,
  categories = [],
  suppliers = [],
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

  if (!open) {
    return null;
  }

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
        onClick={submitting ? undefined : onClose}
      />

      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-[#141B2B]">
              {isEdit ? "Edit Product" : "Add Product"}
            </h2>

            <p className="mt-1 text-xs text-[#64748B]">
              {isEdit
                ? "Update product information."
                : "Add a new product to your inventory."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">
              close
            </span>
          </button>
        </div>

        <div className="px-6 py-6">
          <ProductForm
            product={product}
            mode={mode}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitting={submitting}
            categories={categories}
            suppliers={suppliers}
          />
        </div>
      </div>
    </div>
  );
}
