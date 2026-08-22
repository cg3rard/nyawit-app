import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    storeName: "",
    ownerName: "",
    storeEmail: "",
    storePhone: "",
    storeAddress: "",
    password: "",
    confirmPassword: "",
    agreeTerms: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (!formData.agreeTerms) {
      setError("You must agree to the Terms of Service to register.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const currentSettings = {
        storeName: formData.storeName.trim() || "CoStore",
        ownerName: formData.ownerName.trim() || "Store Manager",
        storeEmail: formData.storeEmail.trim(),
        storePhone: formData.storePhone.trim(),
        storeAddress: formData.storeAddress.trim(),
        receiptHeader: `${formData.storeName.trim() || "CoStore"} Retail`,
        receiptFooter: "Thank you for shopping with us! Please come again.",
        currency: "IDR (Rp)",
        lowStockThreshold: 5,
        autoPrintReceipt: true,
        soundEffects: true,
        enableAIRecommendations: true,
      };

      localStorage.setItem("costore_settings", JSON.stringify(currentSettings));

      const authUser = {
        email: formData.storeEmail.trim(),
        storeName: formData.storeName.trim(),
        ownerName: formData.ownerName.trim(),
        storePhone: formData.storePhone.trim(),
        storeAddress: formData.storeAddress.trim(),
        registeredAt: new Date().toISOString(),
      };
      localStorage.setItem("costore_auth_user", JSON.stringify(authUser));

      setIsSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    }, 600);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F7F6] p-4 sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#00685F]/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#4648D4]/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl">
        <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E8F5F3] p-2.5 shadow-xs mb-3">
              <img src="/icons.png" alt="CoStore Logo" className="h-full w-full object-contain" />
            </div>

            <h1
              className="text-2xl font-extrabold tracking-tight text-[#141B2B] sm:text-3xl"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Register Your Store
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[#64748B]">
              Create your store account to start managing POS, inventory, and AI sales insights.
            </p>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-in fade-in">
              <span className="material-symbols-outlined text-lg shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-in fade-in">
              <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
              <p>Store account registered successfully! Redirecting to Dashboard...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Store Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    storefront
                  </span>
                  <input
                    type="text"
                    name="storeName"
                    required
                    placeholder="e.g. Nyawit Mart"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Store Manager / Owner <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    person
                  </span>
                  <input
                    type="text"
                    name="ownerName"
                    required
                    placeholder="e.g. Nyawit"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    mail
                  </span>
                  <input
                    type="email"
                    name="storeEmail"
                    required
                    placeholder="e.g. nyawit@costore.app"
                    value={formData.storeEmail}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Phone / Contact Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    phone
                  </span>
                  <input
                    type="tel"
                    name="storePhone"
                    required
                    placeholder="e.g. +62 812-3456-7890"
                    value={formData.storePhone}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Store Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-3 text-slate-400 text-lg">
                    location_on
                  </span>
                  <input
                    type="text"
                    name="storeAddress"
                    required
                    placeholder="e.g. Jl. Sudirman No. 88, Jakarta Selatan"
                    value={formData.storeAddress}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-10 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                    lock_reset
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-3.5 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-[#00685F] focus:ring-[#00685F] cursor-pointer"
                />
                <span className="text-xs text-[#64748B]">
                  I agree to the <span className="font-semibold text-[#00685F]">Terms of Service</span> and <span className="font-semibold text-[#00685F]">Privacy Policy</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00685F] text-sm font-semibold text-white shadow-md shadow-[#00685F]/20 transition hover:bg-[#00574F] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Creating Store Account...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Store Created!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">how_to_reg</span>
                  Create Store Account
                </>
              )}
            </button>
          </form>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-xs text-[#64748B]">
              Already have a store account?{" "}
              <Link to="/login" className="font-bold text-[#00685F] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
