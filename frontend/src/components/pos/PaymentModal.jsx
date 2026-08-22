import { useEffect, useState } from "react";

export default function PaymentModal({
  isOpen,
  totalAmount,
  onClose,
  onConfirm,
  isCheckingOut,
}) {
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [cashReceived, setCashReceived] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod("cash");
      setCashReceived("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const total = Number(totalAmount || 0);
  const cashAmount = Number(cashReceived || 0);
  const change = cashAmount - total;
  const isInsufficient = paymentMethod === "cash" && cashAmount < total;

  const handleQuickCash = (amount) => {
    setCashReceived(amount.toString());
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === "cash" && isInsufficient) {
      setError("Cash received is insufficient.");
      return;
    }
    setError("");
    onConfirm({
      payment_method: paymentMethod,
      cash_received: paymentMethod === "cash" ? cashAmount : total,
      change: paymentMethod === "cash" ? Math.max(0, change) : 0,
    });
  };

  const formatIdr = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(Number(val))
      .replace("IDR", "Rp");
  };

  const getQuickCashOptions = () => {
    const options = new Set([total]);
    const billDenominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000];

    billDenominations.forEach((denom) => {
      if (denom > total) {
        options.add(denom);
      }
      const nextMultiple = Math.ceil(total / denom) * denom;
      if (nextMultiple > total && nextMultiple <= 200000) {
        options.add(nextMultiple);
      }
    });

    return [...options].sort((a, b) => a - b).slice(0, 5);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
        onClick={isCheckingOut ? undefined : onClose}
      />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#141B2B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Complete Payment
            </h2>
            <p className="text-xs text-[#64748B]">Choose a payment method to complete this sale.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isCheckingOut}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569] disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 flex justify-between items-center rounded-xl bg-[#E8F5F3] px-5 py-4 border border-[#00685F]/10">
            <span className="text-sm font-semibold text-[#00685F]">Total Payable</span>
            <span className="text-2xl font-extrabold text-[#00685F]">{formatIdr(total)}</span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("cash")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                paymentMethod === "cash"
                  ? "border-[#00685F] bg-[#E8F5F3]/30 text-[#00685F] ring-2 ring-[#00685F]/10"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#94A3B8]"
              }`}
            >
              <span className="material-symbols-outlined text-[26px]">payments</span>
              <span className="text-sm font-bold">Cash</span>
            </button>

            <button
              type="button"
              onClick={() => setPaymentMethod("qris")}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                paymentMethod === "qris"
                  ? "border-[#00685F] bg-[#E8F5F3]/30 text-[#00685F] ring-2 ring-[#00685F]/10"
                  : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#94A3B8]"
              }`}
            >
              <span className="material-symbols-outlined text-[26px]">qr_code_2</span>
              <span className="text-sm font-bold">QRIS</span>
            </button>
          </div>

          {paymentMethod === "cash" ? (
            <div className="space-y-4">
              <div>
                <label htmlFor="cash_received" className="mb-1.5 block text-xs font-semibold text-[#334155]">
                  Cash Received <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64748B]">Rp</span>
                  <input
                    id="cash_received"
                    type="number"
                    min="0"
                    placeholder="Enter cash received"
                    value={cashReceived}
                    onChange={(e) => {
                      setCashReceived(e.target.value);
                      setError("");
                    }}
                    className={`h-11 w-full rounded-xl border pl-10 pr-4 text-base font-bold text-[#141B2B] outline-none transition ${
                      isInsufficient
                        ? "border-amber-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
                        : "border-[#E2E8F0] focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                    }`}
                  />
                </div>
              </div>

              <div>
                <span className="block text-xs font-semibold text-[#64748B] mb-2">Quick Cash Suggestion</span>
                <div className="flex flex-wrap gap-2">
                  {getQuickCashOptions().map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleQuickCash(opt)}
                      className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-bold text-[#475569] transition hover:border-[#00685F] hover:text-[#00685F]"
                    >
                      {opt === total ? "Exact Amount" : formatIdr(opt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 flex justify-between items-center">
                <span className="text-sm font-semibold text-[#64748B]">Change</span>
                <span
                  className={`text-xl font-extrabold ${
                    change >= 0 ? "text-emerald-600" : "text-[#94A3B8]"
                  }`}
                >
                  {change >= 0 ? formatIdr(change) : "Rp0"}
                </span>
              </div>

              {isInsufficient && cashReceived !== "" && (
                <p className="text-xs font-semibold text-amber-600">
                  * Amount is less than total payable ({formatIdr(total)}).
                </p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 border border-[#E2E8F0] rounded-2xl bg-[#F8FAFC]">
              <span className="text-xs font-bold text-[#00685F] mb-3 tracking-wide uppercase">Scan to Pay via QRIS</span>

              <svg className="w-44 h-44 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm" viewBox="0 0 100 100">
                <rect x="5" y="5" width="25" height="25" fill="#1E293B" />
                <rect x="10" y="10" width="15" height="15" fill="#FFFFFF" />
                <rect x="13" y="13" width="9" height="9" fill="#1E293B" />

                <rect x="70" y="5" width="25" height="25" fill="#1E293B" />
                <rect x="75" y="10" width="15" height="15" fill="#FFFFFF" />
                <rect x="78" y="13" width="9" height="9" fill="#1E293B" />

                <rect x="5" y="70" width="25" height="25" fill="#1E293B" />
                <rect x="10" y="75" width="15" height="15" fill="#FFFFFF" />
                <rect x="13" y="78" width="9" height="9" fill="#1E293B" />

                <rect x="35" y="5" width="5" height="10" fill="#1E293B" />
                <rect x="45" y="5" width="10" height="5" fill="#1E293B" />
                <rect x="60" y="5" width="5" height="5" fill="#1E293B" />
                <rect x="35" y="20" width="15" height="5" fill="#1E293B" />
                <rect x="55" y="15" width="10" height="10" fill="#1E293B" />

                <rect x="5" y="35" width="10" height="5" fill="#1E293B" />
                <rect x="20" y="35" width="5" height="15" fill="#1E293B" />
                <rect x="30" y="30" width="10" height="10" fill="#1E293B" />
                <rect x="45" y="30" width="20" height="5" fill="#1E293B" />

                <rect x="5" y="55" width="5" height="10" fill="#1E293B" />
                <rect x="15" y="50" width="15" height="5" fill="#1E293B" />
                <rect x="35" y="45" width="5" height="25" fill="#1E293B" />
                <rect x="45" y="40" width="10" height="10" fill="#1E293B" />
                <rect x="60" y="45" width="15" height="5" fill="#1E293B" />
                <rect x="50" y="55" width="5" height="15" fill="#1E293B" />
                <rect x="65" y="55" width="10" height="10" fill="#1E293B" />

                <rect x="75" y="35" width="5" height="25" fill="#1E293B" />
                <rect x="85" y="35" width="10" height="5" fill="#1E293B" />
                <rect x="80" y="45" width="15" height="10" fill="#1E293B" />

                <rect x="35" y="75" width="15" height="5" fill="#1E293B" />
                <rect x="55" y="70" width="5" height="15" fill="#1E293B" />
                <rect x="70" y="70" width="10" height="5" fill="#1E293B" />
                <rect x="85" y="70" width="5" height="15" fill="#1E293B" />
                <rect x="40" y="85" width="10" height="10" fill="#1E293B" />
                <rect x="60" y="85" width="20" height="5" fill="#1E293B" />
                <rect x="85" y="85" width="10" height="10" fill="#1E293B" />
                <rect x="70" y="90" width="10" height="5" fill="#1E293B" />

                <rect x="42" y="42" width="16" height="16" rx="4" fill="#00685F" />
                <text x="50" y="52" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">QRIS</text>
              </svg>

              <p className="mt-3 text-[11px] text-[#64748B] text-center max-w-[280px]">
                Please scan the QR code using any compatible e-wallet or banking app (GoPay, OVO, Dana, LinkAja, BCA, etc.).
              </p>
            </div>
          )}

          {error && <p className="mt-3 text-xs font-semibold text-red-500">{error}</p>}
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] px-6 py-5 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            disabled={isCheckingOut}
            className="h-11 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={isCheckingOut || isInsufficient}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#00685F] px-6 text-sm font-bold text-white transition hover:bg-[#00574F] disabled:cursor-not-allowed disabled:opacity-50 shadow-md hover:shadow-lg active:scale-[0.98]"
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
                <span className="material-symbols-outlined text-[19px]">check_circle</span>
                Complete Checkout
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
