import { useState, useEffect } from "react";
import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

export default function Settings() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [storeSettings, setStoreSettings] = useState(() => {
    const saved = localStorage.getItem("costore_settings");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved settings", e);
      }
    }
    return {
      storeName: "CoStore",
      ownerName: "Nyawit",
      storeEmail: "nyawit@costore.app",
      storeAddress: "Jl. Sudirman No. 88, Jakarta Selatan",
      storePhone: "+62 812-3456-7890",
      receiptHeader: "CoStore Retail & Convenience",
      receiptFooter: "Thank you for shopping with us! Please come again.",
      currency: "IDR (Rp)",
      lowStockThreshold: 5,
      autoPrintReceipt: true,
      soundEffects: true,
      enableAIRecommendations: true,
    };
  });

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      localStorage.setItem("costore_settings", JSON.stringify(storeSettings));
      setIsSaving(false);
      setSavedSuccess(true);
    }, 400);

    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  return (
    <div className="relative flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {savedSuccess && (
        <div className="fixed top-6 right-6 z-50 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-xl shadow-emerald-950/10 transition-all duration-300 animate-in fade-in slide-in-from-top-4 sm:max-w-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <span className="material-symbols-outlined text-[22px]">check_circle</span>
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h4 className="text-sm font-bold text-[#141B2B]">Changes Saved Successfully!</h4>
            <p className="mt-0.5 text-xs text-[#64748B] leading-relaxed">
              Store profile and POS preferences have been updated and stored locally.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSavedSuccess(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          lowStockProducts={[]}
          expiryAlerts={[]}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-[#141B2B]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Settings & Preferences
                </h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Manage store profile, POS configurations, and system operational defaults.
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#00685F] text-2xl">storefront</span>
                    <div>
                      <h2 className="text-base font-bold text-[#141B2B]">Store Profile</h2>
                      <p className="text-xs text-[#64748B]">General business information shown on reports and receipts</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Store Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={storeSettings.storeName}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Store Manager / Owner Persona
                      </label>
                      <input
                        type="text"
                        value={storeSettings.ownerName}
                        onChange={(e) => setStoreSettings({ ...storeSettings, ownerName: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Phone / Contact Number
                      </label>
                      <input
                        type="text"
                        value={storeSettings.storePhone}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storePhone: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={storeSettings.storeEmail || ""}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeEmail: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                        placeholder="e.g. manager@costore.app"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Store Address
                      </label>
                      <input
                        type="text"
                        value={storeSettings.storeAddress}
                        onChange={(e) => setStoreSettings({ ...storeSettings, storeAddress: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#00685F] text-2xl">receipt_long</span>
                    <div>
                      <h2 className="text-base font-bold text-[#141B2B]">POS & Receipt Customization</h2>
                      <p className="text-xs text-[#64748B]">Receipt notes, currency formatting, and operational thresholds</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                          Receipt Header Title
                        </label>
                        <input
                          type="text"
                          value={storeSettings.receiptHeader}
                          onChange={(e) => setStoreSettings({ ...storeSettings, receiptHeader: e.target.value })}
                          className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                          Low Stock Alert Threshold (Units)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={storeSettings.lowStockThreshold}
                          onChange={(e) => setStoreSettings({ ...storeSettings, lowStockThreshold: parseInt(e.target.value, 10) || 5 })}
                          className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#334155] mb-1.5">
                        Receipt Footer Note
                      </label>
                      <input
                        type="text"
                        value={storeSettings.receiptFooter}
                        onChange={(e) => setStoreSettings({ ...storeSettings, receiptFooter: e.target.value })}
                        className="h-10 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-semibold text-[#141B2B]">Auto-Print Receipt Dialog</span>
                          <p className="text-xs text-[#64748B]">Automatically prompt receipt printing window upon successful checkout</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={storeSettings.autoPrintReceipt}
                          onChange={(e) => setStoreSettings({ ...storeSettings, autoPrintReceipt: e.target.checked })}
                          className="h-5 w-5 rounded border-gray-300 text-[#00685F] focus:ring-[#00685F] cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <span className="text-sm font-semibold text-[#141B2B]">Enable AI Insight Engine</span>
                          <p className="text-xs text-[#64748B]">Display smart restock recommendations and dead stock detection</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={storeSettings.enableAIRecommendations}
                          onChange={(e) => setStoreSettings({ ...storeSettings, enableAIRecommendations: e.target.checked })}
                          className="h-5 w-5 rounded border-gray-300 text-[#00685F] focus:ring-[#00685F] cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className={`flex h-11 items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-white shadow-md transition-all duration-200 active:scale-[0.98] ${
                      savedSuccess
                        ? "bg-emerald-600 shadow-emerald-600/20"
                        : "bg-[#00685F] hover:bg-[#00574F] shadow-[#00685F]/15"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        Saving...
                      </>
                    ) : savedSuccess ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">check_circle</span>
                        Changes Saved!
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">save</span>
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#4648D4] text-xl">dns</span>
                    <h2 className="text-sm font-bold text-[#141B2B]">System Health & Diagnostics</h2>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-medium text-slate-600">Application Version</span>
                      <span className="font-bold text-slate-800">CoStore v1.2.0</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="font-medium text-emerald-800">Backend API</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        FastAPI Online
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100">
                      <span className="font-medium text-emerald-800">Database Engine</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        MySQL 8.4 Active
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-100">
                      <span className="font-medium text-indigo-800">AI Intelligence Core</span>
                      <span className="font-bold text-indigo-700">Mock / LoRA Ready</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                      CoStore is operating in standard containerized mode. Data synchronization and audit logs are active in real-time.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
