export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}) {
  const subtotal =
    Number(item.selling_price) * Number(item.quantity);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-2.5">
      {/* Product icon */}
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F1F3FF] text-[#00685F]">
        <span className="material-symbols-outlined text-[22px]">
          shopping_bag
        </span>
      </div>

      {/* Product info */}
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-[#141B2B]">
          {item.name}
        </h4>

        <div className="flex flex-col mt-0.5 text-[10px] text-[#94A3B8] font-mono leading-tight">
          <span>#{item.product_code?.slice(0, 8)}</span>
          {item.expiry_date && (
            <span className="text-amber-700 font-semibold mt-0.5">
              Exp: {new Date(item.expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        <p className="mt-1 text-xs text-[#64748B]">
          {formatCurrency(item.selling_price)}
        </p>

        <p className="mt-0.5 text-xs font-semibold text-[#141B2B]">
          {formatCurrency(subtotal)}
        </p>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-1 rounded-md bg-[#F1F3FF] p-1">
        <button
          type="button"
          onClick={() => onDecrease(item.id)}
          className="flex h-6 w-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-white hover:text-[#00685F]"
          aria-label={`Decrease ${item.name}`}
        >
          <span className="material-symbols-outlined text-[17px]">
            remove
          </span>
        </button>

        <span className="w-7 text-center text-xs font-semibold text-[#141B2B]">
          {item.quantity}
        </span>

        <button
          type="button"
          onClick={() => onIncrease(item.id)}
          disabled={item.quantity >= item.stock}
          className="flex h-6 w-6 items-center justify-center rounded text-[#64748B] transition-colors hover:bg-white hover:text-[#00685F] disabled:cursor-not-allowed disabled:opacity-30"
          aria-label={`Increase ${item.name}`}
        >
          <span className="material-symbols-outlined text-[17px]">
            add
          </span>
        </button>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-[#EF4444]"
        aria-label={`Remove ${item.name}`}
      >
        <span className="material-symbols-outlined text-[19px]">
          delete
        </span>
      </button>
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
