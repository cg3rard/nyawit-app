export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onSetQuantity,
  onRemove,
}) {
  const maxStock = item.stock ?? item.maxStock ?? 0;
  const subtotal = Number(item.selling_price) * Number(item.quantity);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (val === "") {
      if (onSetQuantity) onSetQuantity(item.id, 1);
      return;
    }
    let parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) parsed = 1;
    if (maxStock > 0 && parsed > maxStock) parsed = maxStock;
    if (onSetQuantity) onSetQuantity(item.id, parsed);
  };

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[#E2E8F0] bg-white p-2.5 shadow-2xs hover:border-slate-300 transition">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#F1F3FF] text-[#00685F]">
        <span className="material-symbols-outlined text-[22px]">
          shopping_bag
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-semibold text-[#141B2B]" title={item.name}>
          {item.name}
        </h4>

        <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#94A3B8] font-mono leading-tight">
          <span>#{item.product_code?.slice(0, 8)}</span>
          <span className="text-slate-300">•</span>
          <span className="text-emerald-700 font-sans font-semibold">Stk: {maxStock}</span>
          {item.expiry_date && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-amber-700 font-sans font-semibold">
                Exp: {new Date(item.expiry_date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            </>
          )}
        </div>

        <div className="mt-1 flex items-baseline justify-between">
          <p className="text-xs text-[#64748B]">
            {formatCurrency(item.selling_price)}
          </p>
          <p className="text-xs font-bold text-[#00685F]">
            {formatCurrency(subtotal)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5 shrink-0">
        <button
          type="button"
          onClick={() => onDecrease(item.id)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#00685F] hover:shadow-2xs active:scale-95 cursor-pointer"
          aria-label={`Decrease ${item.name}`}
        >
          <span className="material-symbols-outlined text-[16px]">
            remove
          </span>
        </button>

        <input
          type="number"
          min="1"
          max={maxStock}
          value={item.quantity}
          onChange={handleInputChange}
          className="h-7 w-12 text-center font-bold text-xs text-[#141B2B] bg-white rounded border border-[#E2E8F0] focus:border-[#00685F] focus:ring-1 focus:ring-[#00685F]/20 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label={`Quantity of ${item.name}`}
          title="Click to type quantity directly"
        />

        <button
          type="button"
          onClick={() => onIncrease(item.id)}
          disabled={item.quantity >= maxStock}
          className="flex h-7 w-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-white hover:text-[#00685F] hover:shadow-2xs active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
          aria-label={`Increase ${item.name}`}
          title={item.quantity >= maxStock ? `Max stock reached (${maxStock})` : "Increase quantity"}
        >
          <span className="material-symbols-outlined text-[16px]">
            add
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => onRemove(item.id)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-[#EF4444] cursor-pointer"
        aria-label={`Remove ${item.name}`}
        title="Remove item"
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
