import { useEffect, useState } from "react";

const EMPTY_FORM = {
  product_code: "",
  name: "",
  category: "",
  purchase_price: "",
  selling_price: "",
  stock: 0,
  expiry_date: "",
};

export default function ProductForm({
  product,
  mode = "add",
  onSubmit,
  onCancel,
  submitting = false,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const isEdit = mode === "edit";

  useEffect(() => {
    if (product) {
      setForm({
        product_code: product.product_code ?? "",
        name: product.name ?? "",
        category: product.category ?? "",
        purchase_price: product.purchase_price ?? "",
        selling_price: product.selling_price ?? "",
        stock: product.stock ?? 0,
        expiry_date: product.expiry_date ?? "",
      });
    } else {
      setForm(EMPTY_FORM);
    }

    setErrors({});
  }, [product]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    setErrors((current) => ({
      ...current,
      [name]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.product_code.trim()) {
      nextErrors.product_code = "Product code is required.";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    if (!form.category.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (
      form.purchase_price === "" ||
      Number(form.purchase_price) < 0
    ) {
      nextErrors.purchase_price =
        "Purchase price must be 0 or greater.";
    }

    if (
      form.selling_price === "" ||
      Number(form.selling_price) < 0
    ) {
      nextErrors.selling_price =
        "Selling price must be 0 or greater.";
    }

    if (!isEdit && Number(form.stock) < 0) {
      nextErrors.stock = "Stock cannot be negative.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    const payload = {
      product_code: form.product_code.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      expiry_date: form.expiry_date || null,
    };

    if (!isEdit) {
      payload.stock = Number(form.stock);
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Product Code"
          name="product_code"
          value={form.product_code}
          onChange={handleChange}
          error={errors.product_code}
          placeholder="e.g. INV-001"
          required
        />

        <FormField
          label="Product Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g. Mineral Water"
          required
        />

        <FormField
          label="Category"
          name="category"
          value={form.category}
          onChange={handleChange}
          error={errors.category}
          placeholder="e.g. Beverage"
          required
        />

        <FormField
          label="Expiry Date"
          name="expiry_date"
          type="date"
          value={form.expiry_date}
          onChange={handleChange}
          error={errors.expiry_date}
        />

        <FormField
          label="Purchase Price"
          name="purchase_price"
          type="number"
          min="0"
          step="0.01"
          value={form.purchase_price}
          onChange={handleChange}
          error={errors.purchase_price}
          placeholder="0"
          required
        />

        <FormField
          label="Selling Price"
          name="selling_price"
          type="number"
          min="0"
          step="0.01"
          value={form.selling_price}
          onChange={handleChange}
          error={errors.selling_price}
          placeholder="0"
          required
        />

        {!isEdit && (
          <FormField
            label="Initial Stock"
            name="stock"
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={handleChange}
            error={errors.stock}
            placeholder="0"
          />
        )}
      </div>

      {isEdit && (
        <div className="rounded-lg bg-[#F8FAFC] px-4 py-3">
          <div className="flex items-start gap-2">
            <span className="material-symbols-outlined text-[18px] text-[#64748B]">
              info
            </span>

            <p className="text-xs leading-5 text-[#64748B]">
              Stock cannot be edited here. Use Inventory to record
              stock changes so every adjustment is tracked properly.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 border-t border-[#E2E8F0] pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="flex h-10 items-center gap-2 rounded-lg bg-[#00685F] px-5 text-sm font-semibold text-white transition hover:bg-[#00574F] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && (
            <span className="material-symbols-outlined animate-spin text-[18px]">
              progress_activity
            </span>
          )}

          {isEdit ? "Save Changes" : "Add Product"}
        </button>
      </div>
    </form>
  );
}

function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  required = false,
  min,
  step,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-1.5 block text-xs font-semibold text-[#334155]"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        step={step}
        className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#141B2B] outline-none transition placeholder:text-[#94A3B8] ${
          error
            ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
            : "border-[#E2E8F0] focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
