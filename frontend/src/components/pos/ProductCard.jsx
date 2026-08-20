export default function ProductCard({ product, onAdd }) {
  const storedPhoto = localStorage.getItem(`product_photo_${product.product_code}`);
  const isOutOfStock = product.stock <= 0;
  const isLowStock = product.stock > 0 && product.stock <= 5;

  const stockColor = isOutOfStock
    ? "bg-[#EF4444]"
    : isLowStock
      ? "bg-[#F59E0B]"
      : "bg-[#10B981]";

  const stockTextColor = isOutOfStock
    ? "text-[#EF4444]"
    : isLowStock
      ? "text-[#B45309]"
      : "text-[#64748B]";

  const displayCode = product.product_code && product.product_code.length > 8
    ? `#${product.product_code.slice(0, 8)}`
    : `#${product.product_code}`;

  const formatDate = (val) => {
    if (!val) return null;
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getExpiryStyle = (val) => {
    if (!val) return null;
    const expiry = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: "Expired", color: "text-red-700 bg-red-50 border-red-200" };
    } else if (diffDays <= 7) {
      return { text: `Exp: ${formatDate(val)}`, color: "text-amber-800 bg-amber-50 border-amber-200" };
    } else {
      return { text: `Exp: ${formatDate(val)}`, color: "text-[#64748B] bg-slate-50 border-slate-200" };
    }
  };

  const expiryInfo = getExpiryStyle(product.expiry_date);

  return (
    <button
      type="button"
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={[
        "group flex flex-col overflow-hidden rounded-xl border text-left",
        "bg-white transition-all duration-150",
        isOutOfStock
          ? "cursor-not-allowed border-red-200 opacity-60"
          : "cursor-pointer border-[#E2E8F0] hover:border-[#94A3B8] hover:shadow-md",
      ].join(" ")}
    >
      {/* Product visual */}
      <div className="relative flex aspect-square items-center justify-center bg-[#F1F3FF] p-4">
        {storedPhoto ? (
          <img
            src={storedPhoto}
            alt={product.name}
            className="h-full w-full object-cover rounded-xl"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-[#00685F] shadow-sm">
            <span className="material-symbols-outlined text-[38px]">
              shopping_bag
            </span>
          </div>
        )}

        {expiryInfo && (
          <span className={`absolute left-2 top-2 rounded-md border px-2 py-1 text-[9px] font-bold shadow-sm ${expiryInfo.color}`}>
            {expiryInfo.text}
          </span>
        )}

        <span className="absolute right-2 top-2 rounded-md border border-[#E2E8F0] bg-white/95 px-2 py-1 text-xs font-semibold text-[#141B2B] shadow-sm">
          {formatCurrency(product.selling_price)}
        </span>
      </div>

      {/* Product info */}
      <div className="flex flex-1 flex-col justify-between p-3">
        <div>
          <h3 className="line-clamp-2 text-sm font-medium text-[#141B2B] transition-colors group-hover:text-[#00685F]">
            {product.name}
          </h3>

          <p className="mt-1 text-[11px] text-[#94A3B8] font-mono">
            {displayCode}
          </p>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${stockColor}`} />

          <span
            className={`text-[10px] font-semibold uppercase tracking-wide ${stockTextColor}`}
          >
            {isOutOfStock
              ? "Out of Stock"
              : isLowStock
                ? `${product.stock} Low Stock`
                : `${product.stock} In Stock`}
          </span>
        </div>
      </div>
    </button>
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
