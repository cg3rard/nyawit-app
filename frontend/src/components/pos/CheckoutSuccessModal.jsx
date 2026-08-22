import { useEffect, useState } from "react";

export default function CheckoutSuccessModal({
  transaction,
  onClose,
  onPrintReceipt,
  autoCloseSeconds = 5,
}) {
  const [countdown, setCountdown] = useState(autoCloseSeconds);

  useEffect(() => {
    if (!transaction) return;

    setCountdown(autoCloseSeconds);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transaction, autoCloseSeconds, onClose]);

  if (!transaction) return null;

  const formatIdr = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(Number(val || 0))
      .replace("IDR", "Rp");
  };

  const progressPercentage = ((autoCloseSeconds - countdown) / autoCloseSeconds) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-[3px] transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl transition-all animate-in zoom-in-95 duration-200">
        {/* Top Progress bar */}
        <div className="h-1.5 w-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        <div className="p-7 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shadow-inner">
            <span className="material-symbols-outlined text-[36px] font-bold">
              check_circle
            </span>
          </div>

          <h2
            className="text-xl font-bold text-[#141B2B]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Sale Completed Successfully!
          </h2>

          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-bold text-emerald-700 font-mono border border-emerald-200/60">
            <span>{transaction.transaction_code}</span>
          </div>

          {/* Details Box */}
          <div className="my-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] p-4 text-left space-y-2.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[#64748B]">Total Amount</span>
              <span className="font-extrabold text-base text-[#00685F]">
                {formatIdr(transaction.total_amount)}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs text-[#64748B]">
              <span>Payment Method</span>
              <span className="font-bold text-[#141B2B] uppercase">
                {transaction.payment_method || "CASH"}
              </span>
            </div>

            {transaction.payment_method === "cash" && (
              <>
                <div className="flex justify-between items-center text-xs text-[#64748B]">
                  <span>Cash Paid</span>
                  <span className="font-semibold text-[#141B2B]">
                    {formatIdr(transaction.cash_received || transaction.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200/60 pt-2">
                  <span className="font-bold text-[#141B2B]">Change</span>
                  <span className="font-extrabold text-emerald-600 text-sm">
                    {formatIdr(transaction.change || 0)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Auto return countdown info */}
          <p className="text-xs text-[#64748B] mb-5">
            Otomatis kembali ke kasir POS dalam{" "}
            <span className="font-bold text-emerald-600 font-mono text-sm">{countdown}</span> detik...
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPrintReceipt(transaction)}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-xs font-bold text-[#141B2B] transition hover:bg-[#F8FAFC] hover:border-[#00685F] hover:text-[#00685F] active:scale-95 cursor-pointer shadow-2xs"
            >
              <span className="material-symbols-outlined text-[18px]">print</span>
              Print Struk
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00685F] px-4 text-xs font-bold text-white transition hover:bg-[#00574F] active:scale-95 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
              Kembali ke POS ({countdown}s)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
