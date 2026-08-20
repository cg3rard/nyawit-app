import ProductEmptyState from "./ProductEmptyState";
import ProductStatus from "./ProductStatus";

export default function ProductTable({ products, onEdit, onDelete }) {
  if (products.length === 0) {
    return <ProductEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F9F9FF]">
            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Product
            </th>

            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Category
            </th>

            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Selling Price
            </th>

            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Stock
            </th>

            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Status
            </th>

            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Expiry
            </th>

            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Action
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-[#E2E8F0]">
          {products.map((product) => (
            <tr
              key={product.id}
              className="bg-white transition-colors hover:bg-[#F9F9FF]"
            >
              {/* Product */}
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F1F3FF] text-[#00685F]">
                    <span className="material-symbols-outlined text-[20px]">
                      inventory_2
                    </span>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#141B2B]">
                      {product.name}
                    </p>

                    <p className="mt-0.5 text-xs text-[#94A3B8]">
                      {product.product_code}
                    </p>
                  </div>
                </div>
              </td>

              {/* Category */}
              <td className="px-5 py-4 text-sm text-[#64748B]">
                {product.category || "—"}
              </td>

              {/* Selling Price */}
              <td className="px-5 py-4 text-right text-sm font-semibold text-[#141B2B]">
                {formatCurrency(product.selling_price)}
              </td>

              {/* Stock */}
              <td className="px-5 py-4 text-center text-sm font-semibold text-[#141B2B]">
                {product.stock}
              </td>

              {/* Status */}
              <td className="px-5 py-4 text-center">
                <ProductStatus stock={product.stock} />
              </td>

              {/* Expiry */}
              <td className="px-5 py-4">
                <ExpiryStatus expiryDate={product.expiry_date} />
              </td>

              {/* Action */}
              <td className="px-5 py-4 text-center">
                <div className="flex items-center justify-center gap-1">
                  {/* Edit */}
                  <button
                    type="button"
                    onClick={() => onEdit(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-[#E8F5F3] hover:text-[#00685F]"
                    title="Edit product"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      edit
                    </span>
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDelete(product)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition hover:bg-red-50 hover:text-red-500"
                    title="Delete product"
                  >
                    <span className="material-symbols-outlined text-[19px]">
                      delete
                    </span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Currency */
/* ─────────────────────────────────────────────────────────────── */

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(Number(value || 0))
    .replace("IDR", "Rp");
}

/* ─────────────────────────────────────────────────────────────── */
/* Expiry Status */
/* ─────────────────────────────────────────────────────────────── */

function ExpiryStatus({ expiryDate }) {
  if (!expiryDate) {
    return (
      <span className="text-sm text-[#94A3B8]">
        No expiry
      </span>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(`${expiryDate}T00:00:00`);

  if (Number.isNaN(expiry.getTime())) {
    return (
      <span className="text-sm text-[#64748B]">
        {expiryDate}
      </span>
    );
  }

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Sudah expired
  if (diffDays < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Expired
      </span>
    );
  }

  // Expired hari ini
  if (diffDays === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        Expires today
      </span>
    );
  }

  // ≤ 7 hari
  if (diffDays <= 7) {
    return (
      <div className="flex flex-col">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-600">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          Expiring soon
        </span>

        <span className="mt-1 text-xs text-[#94A3B8]">
          {formatExpiry(expiryDate)}
        </span>
      </div>
    );
  }

  // Normal
  return (
    <span className="text-sm text-[#64748B]">
      {formatExpiry(expiryDate)}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────── */
/* Date formatting */
/* ─────────────────────────────────────────────────────────────── */

function formatExpiry(value) {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
