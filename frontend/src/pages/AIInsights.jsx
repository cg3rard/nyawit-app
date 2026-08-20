import { useEffect, useState } from "react";
import { getAIScenarios, simulateScenario, evaluateInventory } from "../services/api";
import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

export default function AIInsights() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preset");

  // Preset states
  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("");
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [presetError, setPresetError] = useState(null);

  // Custom states
  const [customInput, setCustomInput] = useState({
    product_name: "Kopi Arabika Toraja 250g",
    current_stock: 4,
    sales_recent_7d: ["10", "12", "8", "11", "9", "10", "10"],
    sales_prior_7d: ["5", "6", "4", "5", "5", "6", "5"],
  });
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [customError, setCustomError] = useState(null);

  // Load scenarios on mount
  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const data = await getAIScenarios();
        if (data && data.scenarios) {
          setScenarios(data.scenarios);
          if (data.scenarios.length > 0) {
            setSelectedScenarioKey(data.scenarios[0].key);
          }
        }
      } catch (err) {
        console.error("Failed to fetch preset scenarios", err);
        setPresetError("Gagal memuat skenario dari backend AI. Pastikan backend sudah menyala.");
      }
    };
    fetchScenarios();
  }, []);

  const handleRunSimulation = async () => {
    if (!selectedScenarioKey) return;
    setLoadingSimulation(true);
    setPresetError(null);
    setSimulationResult(null);
    try {
      const result = await simulateScenario(selectedScenarioKey);
      setSimulationResult(result);
    } catch (err) {
      console.error(err);
      setPresetError(
        err?.response?.data?.detail || err.message || "Simulasi gagal. Silakan coba kembali."
      );
    } finally {
      setLoadingSimulation(false);
    }
  };

  const handleRunCustomEvaluation = async (e) => {
    e.preventDefault();
    setLoadingCustom(true);
    setCustomError(null);
    setCustomResult(null);

    // Validate inputs
    const stock = parseInt(customInput.current_stock, 10);
    const recentSales = customInput.sales_recent_7d.map((val) => parseInt(val, 10));
    const priorSales = customInput.sales_prior_7d.map((val) => parseInt(val, 10));

    if (isNaN(stock) || stock < 0) {
      setCustomError("Stok saat ini harus berupa angka positif.");
      setLoadingCustom(false);
      return;
    }

    if (
      recentSales.some((n) => isNaN(n) || n < 0) ||
      priorSales.some((n) => isNaN(n) || n < 0)
    ) {
      setCustomError("Riwayat penjualan harus berupa angka positif.");
      setLoadingCustom(false);
      return;
    }

    try {
      const payload = {
        product_name: customInput.product_name,
        current_stock: stock,
        sales_recent_7d: recentSales,
        sales_prior_7d: priorSales,
      };
      const result = await evaluateInventory(payload);
      setCustomResult(result);
    } catch (err) {
      console.error(err);
      setCustomError(
        err?.response?.data?.detail || err.message || "Gagal melakukan evaluasi kustom."
      );
    } finally {
      setLoadingCustom(false);
    }
  };

  const handleCustomSalesChange = (index, listName, value) => {
    setCustomInput((prev) => {
      const list = [...prev[listName]];
      list[index] = value;
      return { ...prev, [listName]: list };
    });
  };

  const selectedScenario = scenarios.find((s) => s.key === selectedScenarioKey);

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          lowStockProducts={[]}
          expiryAlerts={[]}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            {/* Page Title */}
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-[#141B2B]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  AI Inventory Insights
                </h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Inferensi AI otomatis untuk memprediksi restock dan mendeteksi dead stock produk Anda.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("preset")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "preset"
                      ? "bg-white text-[#4F46E5] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Skenario Preset (Judge Panel)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("custom")}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    activeTab === "custom"
                      ? "bg-white text-[#4F46E5] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Evaluator Kustom
                </button>
              </div>
            </div>

            {/* TAB 1: PRESET SCENARIO */}
            {activeTab === "preset" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left: Input Selection */}
                <div className="lg:col-span-5 flex flex-col gap-5">
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-[#141B2B] mb-4">Pilih Skenario Demo</h2>
                    
                    {presetError && (
                      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                        {presetError}
                      </div>
                    )}

                    {scenarios.length === 0 && !presetError ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        Memuat skenario dari backend...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-2">
                            Preset Skenario
                          </label>
                          <select
                            value={selectedScenarioKey}
                            onChange={(e) => {
                              setSelectedScenarioKey(e.target.value);
                              setSimulationResult(null);
                            }}
                            className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm text-[#141B2B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                          >
                            {scenarios.map((sc) => (
                              <option key={sc.key} value={sc.key}>
                                {sc.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedScenario && (
                          <div className="rounded-xl bg-[#4F46E5]/5 border border-[#4F46E5]/10 p-4">
                            <h3 className="text-xs font-bold text-[#4F46E5] uppercase tracking-wide">
                              Detail Skenario
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              ID: {selectedScenario.id}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {selectedScenario.description}
                            </p>
                            <div className="mt-2.5 inline-flex items-center gap-1 rounded bg-slate-200/50 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                              Ekspektasi: {selectedScenario.expected_status}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          disabled={loadingSimulation || !selectedScenarioKey}
                          onClick={handleRunSimulation}
                          className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-[#4338CA] disabled:opacity-50"
                        >
                          {loadingSimulation ? (
                            <>
                              <span className="material-symbols-outlined animate-spin text-[20px]">
                                progress_activity
                              </span>
                              Mengevaluasi AI...
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[20px]">
                                auto_awesome
                              </span>
                              Jalankan Simulasi AI
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Output Result */}
                <div className="lg:col-span-7">
                  {loadingSimulation ? (
                    <LoadingResultCard />
                  ) : simulationResult ? (
                    <ResultCard result={simulationResult} />
                  ) : (
                    <EmptyResultCard text="Silakan pilih skenario preset di panel kiri lalu klik tombol 'Jalankan Simulasi AI' untuk melihat hasil rekomendasi." />
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: CUSTOM EVALUATOR */}
            {activeTab === "custom" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                {/* Left: Custom Inputs Form */}
                <div className="lg:col-span-6">
                  <form
                    onSubmit={handleRunCustomEvaluation}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#141B2B]">Input Transaksi Kustom</h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomInput({
                            product_name: "Kopi Arabika Toraja 250g",
                            current_stock: 4,
                            sales_recent_7d: ["10", "12", "8", "11", "9", "10", "10"],
                            sales_prior_7d: ["5", "6", "4", "5", "5", "6", "5"],
                          });
                          setCustomResult(null);
                        }}
                        className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                      >
                        Reset Form
                      </button>
                    </div>

                    {customError && (
                      <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                        {customError}
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Nama Produk / SKU
                        </label>
                        <input
                          type="text"
                          required
                          value={customInput.product_name}
                          onChange={(e) =>
                            setCustomInput({ ...customInput, product_name: e.target.value })
                          }
                          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                          placeholder="Contoh: Sabun Cair Refill 450ml"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Sisa Stok Saat Ini
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={customInput.current_stock}
                          onChange={(e) =>
                            setCustomInput({ ...customInput, current_stock: e.target.value })
                          }
                          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                        />
                      </div>
                    </div>

                    {/* Sales History Inputs */}
                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                        Riwayat Penjualan Unit Harian (14 Hari Terakhir)
                      </h3>

                      {/* Recent 7 days */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          7 Hari Terakhir (Index 0 = Paling Lama, Index 6 = Hari Ini)
                        </label>
                        <div className="grid grid-cols-7 gap-1.5">
                          {customInput.sales_recent_7d.map((val, idx) => (
                            <div key={`rec-${idx}`} className="text-center">
                              <input
                                type="number"
                                required
                                min="0"
                                value={val}
                                onChange={(e) =>
                                  handleCustomSalesChange(idx, "sales_recent_7d", e.target.value)
                                }
                                className="h-9 w-full text-center rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#141B2B] outline-none focus:border-[#4F46E5]"
                                placeholder={`H-${7 - idx}`}
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block">H-{7 - idx}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Prior 7 days */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          7 Hari Sebelumnya (Baseline Pembanding)
                        </label>
                        <div className="grid grid-cols-7 gap-1.5">
                          {customInput.sales_prior_7d.map((val, idx) => (
                            <div key={`pri-${idx}`} className="text-center">
                              <input
                                type="number"
                                required
                                min="0"
                                value={val}
                                onChange={(e) =>
                                  handleCustomSalesChange(idx, "sales_prior_7d", e.target.value)
                                }
                                className="h-9 w-full text-center rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#141B2B] outline-none focus:border-[#4F46E5]"
                                placeholder={`H-${14 - idx}`}
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block">H-{14 - idx}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loadingCustom}
                      className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-[#4338CA] disabled:opacity-50"
                    >
                      {loadingCustom ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">
                            progress_activity
                          </span>
                          Mengevaluasi...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">analytics</span>
                          Analisis Stok dengan AI
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right: Custom Output Result */}
                <div className="lg:col-span-6">
                  {loadingCustom ? (
                    <LoadingResultCard />
                  ) : customResult ? (
                    <ResultCard result={customResult} />
                  ) : (
                    <EmptyResultCard text="Silakan isi form input penjualan di panel kiri lalu klik tombol 'Analisis Stok dengan AI' untuk melakukan inferensi kustom." />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function ResultCard({ result }) {
  const { product_name, status, metrics, ai_recommendation } = result;
  const action = ai_recommendation.action;

  // Visual formatting based on status
  let statusBadgeColor = "";
  let actionIcon = "help";
  let actionColorClass = "";
  let gradientBg = "";

  if (status === "Merah") {
    statusBadgeColor = "bg-red-50 text-red-600 border border-red-200";
  } else if (status === "Kuning") {
    statusBadgeColor = "bg-amber-50 text-amber-600 border border-amber-200";
  } else {
    statusBadgeColor = "bg-emerald-50 text-emerald-600 border border-emerald-200";
  }

  if (action === "RESTOCK_URGENT") {
    actionIcon = "emergency_home";
    actionColorClass = "text-red-600 bg-red-50 border-red-100";
    gradientBg = "from-red-50/50 via-white to-white";
  } else if (action === "PROMO_DISKON") {
    actionIcon = "percent";
    actionColorClass = "text-amber-600 bg-amber-50 border-amber-100";
    gradientBg = "from-amber-50/50 via-white to-white";
  } else {
    actionIcon = "check_circle";
    actionColorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
    gradientBg = "from-emerald-50/50 via-white to-white";
  }

  return (
    <div className={`rounded-2xl border border-slate-100 bg-gradient-to-b ${gradientBg} p-5 shadow-sm`}>
      <h2 className="text-sm font-bold text-[#141B2B] mb-4">Hasil Analisis & Rekomendasi</h2>

      {/* Main product summary info */}
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">{product_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">Klasifikasi Status Produk</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColor}`}>
          Status: {status}
        </span>
      </div>

      {/* Grid calculated metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Stok Saat Ini</p>
          <p className="text-base font-extrabold text-slate-800 mt-1">{metrics.current_stock} pcs</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SMA 7 Hari</p>
          <p className="text-base font-extrabold text-slate-800 mt-1">{metrics.sma_7_daily} pcs/h</p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Tren Penjualan</p>
          <p className={`text-base font-extrabold mt-1 ${metrics.sales_trend_pct.startsWith('-') ? 'text-red-500' : 'text-emerald-600'}`}>
            {metrics.sales_trend_pct}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Days of Inventory</p>
          <p className="text-base font-extrabold text-slate-800 mt-1">{metrics.days_of_inventory} hari</p>
        </div>
      </div>

      {/* AI recommendation block */}
      <div className={`rounded-xl border p-4 ${actionColorClass}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-inherit">
            <span className="material-symbols-outlined text-[22px]">{actionIcon}</span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-inherit">
              Rekomendasi Tindakan AI
            </span>
            <h4 className="text-sm font-bold mt-0.5 leading-snug">{action}</h4>
            <p className="text-sm mt-2 text-slate-800 font-semibold">
              {ai_recommendation.recommendation}
            </p>
            {ai_recommendation.rationale && (
              <div className="mt-3 border-t border-dashed border-inherit pt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Justifikasi / Rationale
                </span>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {ai_recommendation.rationale}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function EmptyResultCard({ text }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5]/5 text-[#4F46E5]">
        <span className="material-symbols-outlined text-[30px]">psychology</span>
      </div>
      <h3 className="text-sm font-bold text-slate-800">Menunggu Input Analisis</h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#64748B]">{text}</p>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function LoadingResultCard() {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm animate-pulse">
      <div className="h-4 w-40 rounded bg-slate-200 mb-6" />
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="h-5 w-48 rounded bg-slate-200 mb-2" />
          <div className="h-3 w-28 rounded bg-slate-200" />
        </div>
        <div className="h-6 w-20 rounded bg-slate-200" />
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-100 p-3" />
        ))}
      </div>

      <div className="h-32 rounded-xl bg-slate-100" />
    </div>
  );
}
