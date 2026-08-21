import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [storeInfo, setStoreInfo] = useState({
    storeName: "CoStore",
    ownerName: "Nyawit",
    storeEmail: "nyawit@costore.app",
    storePhone: "+62 812-3456-7890",
    storeAddress: "Jl. Sudirman No. 88, Jakarta Selatan",
  });

  const [formData, setFormData] = useState({
    email: "nyawit@costore.app",
    password: "password123",
    rememberMe: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("costore_settings");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setStoreInfo((prev) => ({
          ...prev,
          storeName: parsed.storeName || prev.storeName,
          ownerName: parsed.ownerName || prev.ownerName,
          storeEmail: parsed.storeEmail || prev.storeEmail,
          storePhone: parsed.storePhone || prev.storePhone,
          storeAddress: parsed.storeAddress || prev.storeAddress,
        }));
        if (parsed.storeEmail) {
          setFormData((prev) => ({ ...prev, email: parsed.storeEmail }));
        }
      } catch (e) {
        console.error("Failed to parse store settings", e);
      }
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setError("");
  };

  const handleQuickDemo = () => {
    setFormData({
      email: storeInfo.storeEmail || "nyawit@costore.app",
      password: "password123",
      rememberMe: true,
    });
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const authUser = {
        email: formData.email,
        storeName: storeInfo.storeName,
        ownerName: storeInfo.ownerName,
        storePhone: storeInfo.storePhone,
        storeAddress: storeInfo.storeAddress,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem("costore_auth_user", JSON.stringify(authUser));

      setIsSubmitting(false);
      setSuccess(true);

      setTimeout(() => {
        navigate("/");
      }, 800);
    }, 400);
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-white">
      {/* ── LEFT COLUMN: FULL SCREEN PHOTO ───────────────────────── */}
      <div className="relative hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-between p-10 xl:p-16 overflow-hidden">
        {/* Background Image with Dark Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1600&auto=format&fit=crop&q=80')`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/70" />

        {/* Top: CoStore Header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 p-2.5 backdrop-blur-md border border-white/20 shadow-lg">
              <img src="/icons.png" alt="Logo" className="h-full w-full object-contain brightness-0 invert" />
            </div>
            <div>
              <h1
                className="text-3xl font-extrabold tracking-tight text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                CoStore
              </h1>
              <p className="text-xs text-white/70">Point of Sale & Inventory Intelligence</p>
            </div>
          </div>
        </div>

        {/* Center Tagline */}
        <div className="relative z-10 max-w-lg my-auto py-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00685F]/80 px-3.5 py-1 text-xs font-bold text-white backdrop-blur-md mb-4 border border-white/10">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Next-Gen Retail POS
          </span>
          <h2
            className="text-4xl font-extrabold text-white leading-tight tracking-tight"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Streamline checkout, track inventory, and grow your store smarter.
          </h2>
          <p className="mt-4 text-sm text-slate-200/90 leading-relaxed max-w-md">
            Seamless multi-payment checkout, real-time stock movements, and AI-driven restock forecasting in one single workspace.
          </p>
        </div>

        {/* Bottom: @2026 nyawit */}
        <div className="relative z-10 pt-6 border-t border-white/15 flex items-center justify-between text-xs text-white/80">
          <span className="font-semibold tracking-wide">@2026 nyawit</span>
          <span className="text-white/60">All rights reserved</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: LOGIN FORM ─────────────────────────────── */}
      <div className="flex flex-1 flex-col justify-between p-6 sm:p-12 lg:p-16 min-h-screen bg-white">
        {/* Top Header / Mobile Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8F5F3] p-2">
              <img src="/icons.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span
              className="text-xl font-bold tracking-tight text-[#00685F]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              CoStore
            </span>
          </div>

          <div className="ml-auto text-xs sm:text-sm text-[#64748B]">
            Need a new store?{" "}
            <Link to="/signup" className="font-bold text-[#00685F] hover:underline">
              Register Store
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="mx-auto w-full max-w-md my-auto py-8">
          <div className="mb-8">
            <h2
              className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141B2B]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Welcome Back
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#64748B]">
              Sign in to manage your register, products, and sales transactions.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 animate-in fade-in">
              <span className="material-symbols-outlined text-lg shrink-0">error</span>
              <p>{error}</p>
            </div>
          )}

          {/* Success Alert */}
          {success && (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 animate-in fade-in">
              <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>
              <p>Login successful! Entering dashboard...</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="e.g. nyawit@costore.app"
                  value={formData.email}
                  onChange={handleChange}
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 text-xs sm:text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#334155]">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert("For this demo, your default password is 'password123'")}
                  className="text-[11px] font-semibold text-[#00685F] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
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

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-[#00685F] focus:ring-[#00685F] cursor-pointer"
                />
                <span className="text-xs text-[#64748B]">Remember this device</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#00685F] text-sm font-semibold text-white shadow-md shadow-[#00685F]/20 transition hover:bg-[#00574F] active:scale-[0.99] disabled:opacity-60 cursor-pointer pt-0.5"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
                  Signing In...
                </>
              ) : success ? (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Authenticated!
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">login</span>
                  Sign In
                </>
              )}
            </button>

            {/* Quick Demo Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 transition hover:bg-slate-100 active:scale-[0.99] cursor-pointer"
              >
                <span className="material-symbols-outlined text-base text-[#00685F]">auto_fix_high</span>
                Use Demo Account Credentials
              </button>
            </div>
          </form>
        </div>

        {/* Bottom Mobile Footer */}
        <div className="text-center text-xs text-[#94A3B8] lg:hidden">
          @2026 nyawit
        </div>
        <div className="hidden lg:block" />
      </div>
    </div>
  );
}
