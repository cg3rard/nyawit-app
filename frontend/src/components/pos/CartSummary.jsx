export default function CartSummary({
  items,
  onCheckout,
  isCheckingOut,
}) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum + Number(item.selling_price) * Number(item.quantity),
    0
  );

  const totalItems = items.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const isEmpty = items.length === 0;

  return (
    <div className="border-t border-[#E2E8F0] bg-white p-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-[#64748B]">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-semibold text-[#141B2B]">
            {formatCurrency(subtotal)}
          </span>
        </div>
      </div>

      <div className="my-4 h-px bg-[#E2E8F0]" />

      <div className="flex items-end justify-between">
        <span className="text-base font-semibold text-[#141B2B]">
          Total
        </span>

        <span className="text-2xl font-bold tracking-tight text-[#00685F]">
          {formatCurrency(subtotal)}
        </span>
      </div>

      <button
        type="button"
        onClick={onCheckout}
        disabled={isEmpty || isCheckingOut}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#00685F] px-4 py-3.5 text-sm font-semibold text-white transition-all hover:bg-[#00574F] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isCheckingOut ? (
          <>
            <span className="material-symbols-outlined animate-spin text-[18px]">
              progress_activity
            </span>
            Processing...
          </>
        ) : (
          <>
            <span
              className="material-symbols-outlined text-[19px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              payments
            </span>
            Charge
          </>
        )}
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
