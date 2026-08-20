import ProductStatus from "./ProductStatus";
import ProductEmptyState from "./ProductEmptyState";

export default function ProductTable({ products, onEdit }) {
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
              <td className="px-5 py-4 text-sm text-[#64748B]">
                {formatExpiry(product.expiry_date)}
              </td>

              {/* Action */}
              <td className="px-5 py-4 text-center">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatCurrency(value) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  })
    .format(Number(value || 0))
    .replace("IDR", "Rp");
}

function formatExpiry(value) {
  if (!value) {
    return "No expiry";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
