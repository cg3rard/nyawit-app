import { useEffect, useState } from "react";

const EMPTY_FORM = {
  product_code: "",
  name: "",
  category: "",
  purchase_price: "",
  selling_price: "",
  stock: 0,
  expiry_date: "",
  supplier_id: "",
};

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function ProductForm({
  product,
  mode = "add",
  onSubmit,
  onCancel,
  submitting = false,
  categories = [],
  suppliers = [],
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [selectedCategoryOption, setSelectedCategoryOption] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [photo, setPhoto] = useState(null);

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
        supplier_id: product.supplier_id ?? "",
      });

      if (product.category && categories.includes(product.category)) {
        setSelectedCategoryOption(product.category);
        setCustomCategory("");
      } else if (product.category) {
        setSelectedCategoryOption("__NEW__");
        setCustomCategory(product.category);
      } else {
        setSelectedCategoryOption("");
        setCustomCategory("");
      }

      const storedPhoto = localStorage.getItem(`product_photo_${product.product_code}`);
      setPhoto(storedPhoto);
    } else {
      setForm({
        ...EMPTY_FORM,
        product_code: generateUUID(),
      });
      setSelectedCategoryOption("");
      setCustomCategory("");
      setPhoto(null);
    }

    setErrors({});
  }, [product, categories]);

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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.product_code.trim()) {
      nextErrors.product_code = "Product code is required.";
    }

    if (!form.name.trim()) {
      nextErrors.name = "Product name is required.";
    }

    const categoryVal = selectedCategoryOption === "__NEW__" ? customCategory : selectedCategoryOption;
    if (!categoryVal || !categoryVal.trim()) {
      nextErrors.category = "Category is required.";
    }

    if (
      form.purchase_price === "" ||
      Number(form.purchase_price) < 0
    ) {
      nextErrors.purchase_price = "Purchase price must be 0 or greater.";
    }

    if (
      form.selling_price === "" ||
      Number(form.selling_price) < 0
    ) {
      nextErrors.selling_price = "Selling price must be 0 or greater.";
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

    const categoryVal = selectedCategoryOption === "__NEW__" ? customCategory : selectedCategoryOption;

    const payload = {
      product_code: form.product_code.trim(),
      name: form.name.trim(),
      category: categoryVal.trim(),
      purchase_price: Number(form.purchase_price),
      selling_price: Number(form.selling_price),
      expiry_date: form.expiry_date || null,
      supplier_id: form.supplier_id ? Number(form.supplier_id) : null,
      photo: photo,
    };

    if (!isEdit) {
      payload.stock = Number(form.stock);
    }

    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isEdit && (
          <FormField
            label="Product Code (UUID)"
            name="product_code"
            value={form.product_code}
            onChange={handleChange}
            error={errors.product_code}
            required
            readOnly
          />
        )}

        <FormField
          label="Product Name"
          name="name"
          value={form.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g. Mineral Water"
          required
        />

        <div className="flex flex-col">
          <label htmlFor="category_select" className="mb-1.5 block text-xs font-semibold text-[#334155]">
            Category <span className="text-red-500">*</span>
          </label>
          <select
            id="category_select"
            value={selectedCategoryOption}
            onChange={(e) => {
              setSelectedCategoryOption(e.target.value);
              setErrors((current) => ({ ...current, category: "" }));
            }}
            className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10 ${
              errors.category ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/10" : "border-[#E2E8F0]"
            }`}
          >
            <option value="">-- Choose Category --</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="__NEW__">+ Add New Category...</option>
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category}</p>}
        </div>

        {selectedCategoryOption === "__NEW__" && (
          <FormField
            label="New Category Name"
            name="custom_category"
            value={customCategory}
            onChange={(e) => {
              setCustomCategory(e.target.value);
              setErrors((current) => ({ ...current, category: "" }));
            }}
            error={errors.category}
            placeholder="e.g. Snack, Medicine"
            required
          />
        )}

        <div className="flex flex-col">
          <label htmlFor="supplier_select" className="mb-1.5 block text-xs font-semibold text-[#334155]">
            Supplier
          </label>
          <select
            id="supplier_select"
            name="supplier_id"
            value={form.supplier_id}
            onChange={handleChange}
            className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
          >
            <option value="">-- Choose Supplier (Optional) --</option>
            {suppliers.map((sup) => (
              <option key={sup.id} value={sup.id}>
                {sup.name} ({sup.whatsapp})
              </option>
            ))}
          </select>
        </div>

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

        <div className="sm:col-span-2 flex flex-col gap-2 rounded-lg border border-[#E2E8F0] p-4 bg-white">
          <label className="text-xs font-semibold text-[#334155]">
            Product Photo (Optional)
          </label>
          <div className="flex items-center gap-4">
            {photo ? (
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[#E2E8F0] bg-slate-50">
                <img src={photo} className="h-full w-full object-cover" alt="Product preview" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
                  title="Remove photo"
                >
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-[#E2E8F0] bg-slate-50 text-[#94A3B8]">
                <span className="material-symbols-outlined text-[28px]">image</span>
              </div>
            )}
            <div className="flex-1">
              <input
                id="photo_upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                disabled={submitting}
              />
              <label
                htmlFor="photo_upload"
                className="inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
              >
                <span className="material-symbols-outlined text-[16px]">upload</span>
                Upload Image
              </label>
              <p className="mt-1 text-[11px] text-[#94A3B8]">
                PNG, JPG, or WEBP. Max 2MB recommended.
              </p>
            </div>
          </div>
        </div>
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
  readOnly = false,
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
        readOnly={readOnly}
        className={`h-10 w-full rounded-lg border px-3 text-sm text-[#141B2B] outline-none transition placeholder:text-[#94A3B8] ${
          readOnly
            ? "border-[#E2E8F0] bg-[#F8FAFC] text-[#64748B] cursor-not-allowed"
            : error
              ? "border-red-400 bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10"
              : "border-[#E2E8F0] bg-white focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
