import { useEffect, useState } from "react";
import {
  getAIScenarios,
  simulateScenario,
  evaluateInventory,
  evaluateAllProducts,
} from "../services/api";
import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

export default function AIInsights() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preset");

  const [scenarios, setScenarios] = useState([]);
  const [selectedScenarioKey, setSelectedScenarioKey] = useState("");
  const [loadingSimulation, setLoadingSimulation] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [presetError, setPresetError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIndications, setSelectedIndications] = useState({
    Merah: false,
    Kuning: false,
    Hijau: false,
  });
  const [selectedCategories, setSelectedCategories] = useState({});
  const [selectedProducts, setSelectedProducts] = useState({});
  const [analysisDays, setAnalysisDays] = useState(14);

  const [customInput, setCustomInput] = useState({
    product_name: "Toraja Arabica Coffee 250g",
    current_stock: 4,
    sales_recent_7d: ["10", "12", "8", "11", "9", "10", "10"],
    sales_prior_7d: ["5", "6", "4", "5", "5", "6", "5"],
  });
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [customError, setCustomError] = useState(null);

  const loadFiltersData = async (force = false, daysOverride = null) => {
    const targetDays = daysOverride !== null ? daysOverride : analysisDays;
    if (scenarios.length > 0 && !force) return;
    try {
      const data = await getAIScenarios(targetDays);
      if (data && data.scenarios) {
        setScenarios(data.scenarios);
        if (data.scenarios.length > 0) {
          setSelectedScenarioKey(data.scenarios[0].key);
        }

        const dbScenarios = data.scenarios.filter((s) =>
          s.key.startsWith("db_"),
        );

        const categoriesObj = {};
        dbScenarios.forEach((s) => {
          if (s.category) {
            categoriesObj[s.category] = false;
          }
        });
        setSelectedCategories(categoriesObj);

        const productsObj = {};
        dbScenarios.forEach((s) => {
          productsObj[s.key] = false;
        });
        setSelectedProducts(productsObj);
        setPresetError(null);
      }
    } catch (err) {
      console.error("Failed to fetch preset scenarios", err);
      setPresetError(
        "Failed to load scenarios from AI backend. Please ensure the backend is running.",
      );
    }
  };

  useEffect(() => {
    loadFiltersData();
  }, []);

  const handleCategoryToggle = (catName, isChecked) => {
    setSelectedCategories((prev) => ({
      ...prev,
      [catName]: isChecked,
    }));

    const updatedProducts = { ...selectedProducts };
    scenarios.forEach((s) => {
      if (s.key.startsWith("db_") && s.category === catName) {
        updatedProducts[s.key] = isChecked;
      }
    });
    setSelectedProducts(updatedProducts);
  };

  const handleProductToggle = (prodKey, isChecked) => {
    setSelectedProducts((prev) => {
      const nextProducts = { ...prev, [prodKey]: isChecked };

      const targetProduct = scenarios.find((s) => s.key === prodKey);
      if (targetProduct && targetProduct.category) {
        const catName = targetProduct.category;

        const anyChecked = scenarios.some((s) =>
          s.key.startsWith("db_") &&
          s.category === catName &&
          (s.key === prodKey ? isChecked : prev[s.key])
        );

        setSelectedCategories((prevCats) => ({
          ...prevCats,
          [catName]: anyChecked,
        }));
      }

      return nextProducts;
    });
  };

  const handleSelectAllCategories = (isSelected) => {
    const nextCats = {};
    Object.keys(selectedCategories).forEach((cat) => {
      nextCats[cat] = isSelected;
    });
    setSelectedCategories(nextCats);

    const nextProds = {};
    Object.keys(selectedProducts).forEach((key) => {
      nextProds[key] = isSelected;
    });
    setSelectedProducts(nextProds);
  };

  const handleSelectAllProducts = (isSelected) => {
    const nextProds = {};
    Object.keys(selectedProducts).forEach((key) => {
      nextProds[key] = isSelected;
    });
    setSelectedProducts(nextProds);

    const nextCats = {};
    Object.keys(selectedCategories).forEach((cat) => {
      nextCats[cat] = isSelected;
    });
    setSelectedCategories(nextCats);
  };

  const handleRunSimulation = async (days = 14) => {
    setLoadingSimulation(true);
    setPresetError(null);
    setSimulationResult(null);
    try {
      const result = await evaluateAllProducts(days);
      setSimulationResult(result);
    } catch (err) {
      console.error(err);
      setPresetError(
        err?.response?.data?.detail ||
          err.message ||
          "Simulation failed. Please try again.",
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

    const stock = parseInt(customInput.current_stock, 10);
    const recentSales = customInput.sales_recent_7d.map((val) =>
      parseInt(val, 10),
    );
    const priorSales = customInput.sales_prior_7d.map((val) =>
      parseInt(val, 10),
    );

    if (isNaN(stock) || stock < 0) {
      setCustomError("Current stock must be a non-negative number.");
      setLoadingCustom(false);
      return;
    }

    if (
      recentSales.some((n) => isNaN(n) || n < 0) ||
      priorSales.some((n) => isNaN(n) || n < 0)
    ) {
      setCustomError("Sales history values must be non-negative numbers.");
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
        err?.response?.data?.detail ||
          err.message ||
          "Failed to perform custom evaluation.",
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
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1600px]">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-[#141B2B]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  AI Inventory Insights
                </h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Automated AI inference to predict restocking and detect dead
                  stock in your store.
                </p>
              </div>

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
                  <span className="material-symbols-outlined text-[16px]">
                    psychology
                  </span>
                  AI Scenarios
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
                  <span className="material-symbols-outlined text-[16px]">
                    tune
                  </span>
                  Custom Evaluator
                </button>
              </div>
            </div>

            {activeTab === "preset" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-4 flex flex-col gap-5">
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 shadow-sm">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4F46E5]/10 text-[#4F46E5]">
                      <span className="material-symbols-outlined text-[28px]">
                        query_stats
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-[#141B2B] mb-2">
                      Automated Inventory Analysis
                    </h2>
                    <p className="text-xs text-[#64748B] leading-relaxed mb-6">
                      Running this analysis will query all products from your
                      live database, fetch their sales records over the last{" "}
                      <span className="font-semibold text-[#4F46E5]">
                        {analysisDays} days
                      </span>
                      , and calculate the following metrics:
                    </p>

                    <ul className="mb-6 flex flex-col gap-2.5 text-xs text-[#475569]">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">
                          check_circle
                        </span>
                        <span>Current Stock Levels</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">
                          check_circle
                        </span>
                        <span>7-Day Simple Moving Average (SMA)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">
                          check_circle
                        </span>
                        <span>Sales Trend (Baseline Comparison)</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-emerald-500 font-bold">
                          check_circle
                        </span>
                        <span>Days of Inventory Remaining (DOI)</span>
                      </li>
                    </ul>

                    {presetError && (
                      <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700">
                        {presetError}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={loadingSimulation}
                      onClick={() => {
                        loadFiltersData();
                        setIsModalOpen(true);
                      }}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#4F46E5] text-sm font-semibold text-white shadow-md shadow-indigo-600/10 transition hover:bg-[#4338CA] disabled:opacity-50"
                    >
                      {loadingSimulation ? (
                        <>
                          <span className="material-symbols-outlined animate-spin text-[20px]">
                            progress_activity
                          </span>
                          Evaluating AI...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">
                            auto_awesome
                          </span>
                          Run AI Simulation
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-8 flex flex-col gap-6">
                  {loadingSimulation ? (
                    <LoadingResultCard />
                  ) : simulationResult && Array.isArray(simulationResult) ? (
                    (() => {
                      const query = searchQuery.trim().toLowerCase();
                      const filteredResults = simulationResult.filter((res) => {
                        const matchedScenario = scenarios.find(
                          (s) => s.name === res.product_name,
                        );
                        const passesSelection =
                          !matchedScenario ||
                          ((selectedIndications[res.status] || false) &&
                            (selectedCategories[matchedScenario.category] ||
                              false) &&
                            (selectedProducts[matchedScenario.key] || false));

                        if (!passesSelection) return false;
                        if (!query) return true;

                        const nameMatch = res.product_name?.toLowerCase().includes(query);
                        const statusMatch = res.status?.toLowerCase().includes(query);
                        const actionMatch = res.action?.toLowerCase().includes(query);
                        const recMatch = res.ai_recommendation?.recommendation?.toLowerCase().includes(query);
                        return nameMatch || statusMatch || actionMatch || recMatch;
                      });

                      return (
                        <div className="flex flex-col gap-6">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Analysis Results (
                              {filteredResults.length ===
                              simulationResult.length
                                ? `${simulationResult.length} Products`
                                : `Showing ${filteredResults.length} of ${simulationResult.length} Products`}
                              )
                            </span>
                          </div>
                          <div className="flex flex-col gap-5">
                            {filteredResults.length === 0 ? (
                              <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 bg-white rounded-2xl">
                                No products match the selected filters.
                              </div>
                            ) : (
                              filteredResults.map((res, index) => (
                                <ResultCard key={index} result={res} />
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <EmptyResultCard text="Click 'Run AI Simulation' on the left panel to execute dynamic AI inference on all products in your inventory." />
                  )}
                </div>
              </div>
            )}

            {activeTab === "custom" && (
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <div className="lg:col-span-6">
                  <form
                    onSubmit={handleRunCustomEvaluation}
                    className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#141B2B]">
                        Custom Inventory Input
                      </h2>
                      <button
                        type="button"
                        onClick={() => {
                          setCustomInput({
                            product_name: "Toraja Arabica Coffee 250g",
                            current_stock: 4,
                            sales_recent_7d: [
                              "10",
                              "12",
                              "8",
                              "11",
                              "9",
                              "10",
                              "10",
                            ],
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
                          Product Name / SKU
                        </label>
                        <input
                          type="text"
                          required
                          value={customInput.product_name}
                          onChange={(e) =>
                            setCustomInput({
                              ...customInput,
                              product_name: e.target.value,
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                          placeholder="e.g. Liquid Soap Refill 450ml"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">
                          Current Stock Quantity
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={customInput.current_stock}
                          onChange={(e) =>
                            setCustomInput({
                              ...customInput,
                              current_stock: e.target.value,
                            })
                          }
                          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#4F46E5] focus:ring-1 focus:ring-[#4F46E5]/20"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3">
                        Daily Sales Units History (Last 14 Days)
                      </h3>

                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Recent 7 Days (Index 0 = Oldest, Index 6 = Today)
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
                                  handleCustomSalesChange(
                                    idx,
                                    "sales_recent_7d",
                                    e.target.value,
                                  )
                                }
                                className="h-9 w-full text-center rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#141B2B] outline-none focus:border-[#4F46E5]"
                                placeholder={`D-${7 - idx}`}
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                D-{7 - idx}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-2">
                          Prior 7 Days (Baseline Comparison)
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
                                  handleCustomSalesChange(
                                    idx,
                                    "sales_prior_7d",
                                    e.target.value,
                                  )
                                }
                                className="h-9 w-full text-center rounded-lg border border-[#E2E8F0] bg-white text-xs text-[#141B2B] outline-none focus:border-[#4F46E5]"
                                placeholder={`D-${14 - idx}`}
                              />
                              <span className="text-[9px] text-slate-400 mt-1 block">
                                D-{14 - idx}
                              </span>
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
                          Evaluating...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[20px]">
                            analytics
                          </span>
                          Analyze Stock with AI
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6">
                  {loadingCustom ? (
                    <LoadingResultCard />
                  ) : customResult ? (
                    <ResultCard result={customResult} />
                  ) : (
                    <EmptyResultCard text="Please fill out the sales input form on the left panel and click 'Analyze Stock with AI' to run custom inference." />
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-[#141B2B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#4F46E5]">
                    filter_list
                  </span>
                  Filter AI Inventory Analysis
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Select the segments of your inventory you wish to evaluate (at
                  least 1 must be checked).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition"
              >
                <span className="material-symbols-outlined text-[24px]">
                  close
                </span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-5 py-2">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#4F46E5]">
                      calendar_month
                    </span>
                    Analysis Time Window
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Choose the number of history days to evaluate sales averages and trends.
                  </p>
                </div>
                <select
                  value={analysisDays}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setAnalysisDays(val);
                    loadFiltersData(true, val);
                  }}
                  className="h-9 min-w-[130px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#141B2B] outline-none focus:border-[#4F46E5] shadow-sm cursor-pointer"
                >
                  <option value="7">7 Days</option>
                  <option value="14">14 Days (Default)</option>
                  <option value="30">30 Days</option>
                  <option value="45">45 Days</option>
                  <option value="60">60 Days</option>
                  <option value="90">90 Days</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Filter by Status Indication
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIndications({
                          Merah: true,
                          Kuning: true,
                          Hijau: true,
                        })
                      }
                      className="text-[10px] font-semibold text-[#4F46E5] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedIndications({
                          Merah: false,
                          Kuning: false,
                          Hijau: false,
                        })
                      }
                      className="text-[10px] font-semibold text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "Merah",
                      label: "Critical (Red)",
                      color: "border-red-200 bg-red-50/50 text-red-700",
                    },
                    {
                      key: "Kuning",
                      label: "Warning (Yellow)",
                      color: "border-amber-200 bg-amber-50/50 text-amber-700",
                    },
                    {
                      key: "Hijau",
                      label: "Optimal (Green)",
                      color:
                        "border-emerald-200 bg-emerald-50/50 text-emerald-700",
                    },
                  ].map((item) => (
                    <label
                      key={item.key}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 cursor-pointer text-xs font-bold transition select-none ${
                        selectedIndications[item.key]
                          ? `${item.color} shadow-sm`
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIndications[item.key] || false}
                        onChange={(e) =>
                          setSelectedIndications({
                            ...selectedIndications,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5]/20 h-4 w-4"
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Filter by Category
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllCategories(true)}
                      className="text-[10px] font-semibold text-[#4F46E5] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllCategories(false)}
                      className="text-[10px] font-semibold text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {Object.keys(selectedCategories).map((cat) => (
                    <label
                      key={cat}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 cursor-pointer text-xs font-semibold truncate transition select-none ${
                        selectedCategories[cat]
                          ? "border-[#4F46E5] bg-[#4F46E5]/5 text-[#4F46E5] font-bold"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories[cat] || false}
                        onChange={(e) => handleCategoryToggle(cat, e.target.checked)}
                        className="rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5]/20 h-4 w-4"
                      />
                      <span className="truncate">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                    Filter by Product List
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectAllProducts(true)}
                      className="text-[10px] font-semibold text-[#4F46E5] hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllProducts(false)}
                      className="text-[10px] font-semibold text-slate-500 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 max-h-[220px] overflow-y-auto border border-slate-150 rounded-xl p-3 bg-slate-50/30">
                  {scenarios
                    .filter((s) => s.key.startsWith("db_"))
                    .map((prod) => (
                      <label
                        key={prod.key}
                        className={`flex items-center gap-3 rounded-lg px-2.5 py-1.5 cursor-pointer text-xs transition select-none ${
                          selectedProducts[prod.key]
                            ? "bg-[#4F46E5]/5 text-[#4F46E5] font-semibold"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts[prod.key] || false}
                          onChange={(e) => handleProductToggle(prod.key, e.target.checked)}
                          className="rounded border-slate-350 text-[#4F46E5] focus:ring-[#4F46E5]/20 h-4 w-4"
                        />
                        <span className="truncate flex-1">{prod.name}</span>
                        <span className="text-[10px] text-slate-400 font-normal shrink-0">
                          {prod.category}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 h-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  !Object.values(selectedIndications).some(Boolean) ||
                  (!Object.values(selectedCategories).some(Boolean) &&
                    !Object.values(selectedProducts).some(Boolean))
                }
                onClick={() => {
                  setIsModalOpen(false);
                  handleRunSimulation(analysisDays);
                }}
                className="px-5 h-10 rounded-xl bg-[#4F46E5] text-xs font-semibold text-white hover:bg-[#4338CA] transition shadow-md shadow-indigo-600/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run AI Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultCard({ result }) {
  const { product_name, status, metrics, ai_recommendation } = result;
  const action = ai_recommendation.action;

  let statusBadgeColor = "";
  let actionIcon = "help";
  let actionColorClass = "";
  let gradientBg = "";

  if (status === "Merah" || status === "Red") {
    statusBadgeColor = "bg-red-50 text-red-600 border border-red-200";
  } else if (status === "Kuning" || status === "Yellow") {
    statusBadgeColor = "bg-amber-50 text-amber-600 border border-amber-200";
  } else {
    statusBadgeColor =
      "bg-emerald-50 text-emerald-600 border border-emerald-200";
  }

  if (
    action === "RESTOCK_URGENT" ||
    action === "REORDER_SEGERA" ||
    action === "ORDER_SUPPLIER" ||
    action === "RESTOCK_PRIORITAS"
  ) {
    actionIcon = "emergency_home";
    actionColorClass = "text-red-600 bg-red-50 border-red-100";
    gradientBg = "from-red-50/50 via-white to-white";
  } else if (
    action === "PROMO_DISKON" ||
    action === "DISCOUNT_PROMO" ||
    action === "BUNDLING_PRODUK" ||
    action === "FLASH_SALE" ||
    action === "RELOKASI_DISPLAY"
  ) {
    actionIcon = "percent";
    actionColorClass = "text-amber-600 bg-amber-50 border-amber-100";
    gradientBg = "from-amber-50/50 via-white to-white";
  } else {
    actionIcon = "check_circle";
    actionColorClass = "text-emerald-600 bg-emerald-50 border-emerald-100";
    gradientBg = "from-emerald-50/50 via-white to-white";
  }

  const formatExpiryDate = (val) => {
    if (!val) return "—";
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatStatus = (st) => {
    if (st === "Merah") return "Red (Critical)";
    if (st === "Kuning") return "Yellow (Warning)";
    if (st === "Hijau") return "Green (Optimal)";
    return st;
  };

  const formatAction = (act) => {
    if (!act) return "AI RECOMMENDATION";
    const map = {
      RESTOCK_URGENT: "URGENT RESTOCK",
      REORDER_SEGERA: "IMMEDIATE REORDER",
      ORDER_SUPPLIER: "ORDER FROM SUPPLIER",
      RESTOCK_PRIORITAS: "PRIORITY RESTOCK",
      PROMO_DISKON: "PROMOTIONAL DISCOUNT",
      PROMO_DISCOUNT: "PROMOTIONAL DISCOUNT",
      CLEARANCE_DISCOUNT: "CLEARANCE DISCOUNT",
      BUNDLING_PRODUK: "PRODUCT BUNDLING",
      FLASH_SALE: "FLASH SALE",
      RELOKASI_DISPLAY: "DISPLAY RELOCATION",
      PERTAHANKAN_STOK: "MAINTAIN CURRENT STOCK",
      MAINTAIN_STOCK: "MAINTAIN CURRENT STOCK",
      MONITORING_RUTIN: "ROUTINE MONITORING",
      ROUTINE_MONITORING: "ROUTINE MONITORING",
    };
    return map[act] || act.replace(/_/g, " ").toUpperCase();
  };

  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-gradient-to-b ${gradientBg} p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-800">{product_name}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Product Status Classification
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeColor}`}
        >
          Status: {formatStatus(status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center flex flex-col justify-between min-h-[76px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Current Stock
          </p>
          <p className="text-base font-extrabold text-slate-800 mt-1">
            {metrics.current_stock} pcs
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center flex flex-col justify-between min-h-[76px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Expiry Date
          </p>
          <p className="text-sm font-extrabold text-slate-800 mt-1 truncate" title={metrics.expiry_date || "No Expiration"}>
            {formatExpiryDate(metrics.expiry_date)}
          </p>
          <p className={`text-[8px] font-bold mt-0.5 ${metrics.days_to_expiry !== null ? (metrics.days_to_expiry <= 30 ? "text-red-500 animate-pulse font-extrabold" : "text-slate-400") : "text-slate-400"}`}>
            {metrics.days_to_expiry !== null
              ? (metrics.days_to_expiry >= 0 ? `${metrics.days_to_expiry} days left` : "Expired")
              : "No expiration"}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center flex flex-col justify-between min-h-[76px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            7-Day SMA
          </p>
          <p className="text-base font-extrabold text-slate-800 mt-1">
            {metrics.sma_7_daily} pcs/day
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 text-center flex flex-col justify-between min-h-[76px]">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            Sales Trend
          </p>
          <p
            className={`text-base font-extrabold mt-1 ${metrics.sales_trend_pct.startsWith("-") ? "text-red-500" : "text-emerald-600"}`}
          >
            {metrics.sales_trend_pct}
          </p>
        </div>

        {(() => {
          const isCapped = metrics.expiry_date !== null &&
                           metrics.days_to_expiry !== null &&
                           metrics.original_days_of_inventory !== undefined &&
                           metrics.original_days_of_inventory > metrics.days_to_expiry;

          return (
            <div className={`rounded-xl p-3 text-center border flex flex-col justify-between min-h-[76px] ${isCapped ? "bg-amber-50/20 border-amber-200" : "bg-slate-50 border-slate-100"}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Days of Inventory
              </p>
              <p className="text-base font-extrabold text-slate-800 mt-1">
                {metrics.days_of_inventory} days
              </p>
              <p className={`text-[8px] font-bold mt-0.5 ${isCapped ? "text-amber-600 font-extrabold" : "text-slate-400"}`}>
                {isCapped ? "Capped by Expiry" : "Based on SMA"}
              </p>
            </div>
          );
        })()}
      </div>

      {(metrics.sales_recent_7d || metrics.sales_prior_7d) && (() => {
        const recentDaysCount = metrics.sales_recent_7d ? metrics.sales_recent_7d.length : 7;
        const priorDaysCount = metrics.sales_prior_7d ? metrics.sales_prior_7d.length : 7;
        const totalDaysCount = recentDaysCount + priorDaysCount;

        return (
          <div className="mb-5 rounded-xl border border-slate-200/60 bg-white p-4 shadow-inner">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-indigo-500">
                analytics
              </span>
              Sales History & Calculations Transparency ({totalDaysCount} Days Window)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {metrics.sales_recent_7d && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Recent {recentDaysCount} Days (D-{recentDaysCount - 1} to D-0 / Today)
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {metrics.sales_recent_7d.map((val, idx) => (
                      <div
                        key={`rec-${idx}`}
                        className="rounded bg-slate-50 border border-slate-150 p-1.5 text-center min-w-[36px]"
                      >
                        <span className="block text-xs font-extrabold text-slate-800">
                          {val}
                        </span>
                        <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                          D-{recentDaysCount - 1 - idx}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metrics.sales_prior_7d && (
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Prior {priorDaysCount} Days Baseline (D-{totalDaysCount - 1} to D-{recentDaysCount})
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {metrics.sales_prior_7d.map((val, idx) => (
                      <div
                        key={`pri-${idx}`}
                        className="rounded bg-slate-50 border border-slate-150 p-1.5 text-center min-w-[36px]"
                      >
                        <span className="block text-xs font-extrabold text-slate-800">
                          {val}
                        </span>
                        <span className="text-[8px] text-slate-400 font-semibold block mt-0.5">
                          D-{totalDaysCount - 1 - idx}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10px] text-slate-500">
              <div>
                <span className="font-bold text-slate-700">{recentDaysCount}-Day SMA:</span> (Sum
                of Recent {recentDaysCount} Days) / {recentDaysCount} ={" "}
                <span className="font-extrabold text-indigo-600">
                  {metrics.sma_7_daily}
                </span>{" "}
                pcs/day
              </div>
              <div>
                <span className="font-bold text-slate-700">Baseline SMA:</span>{" "}
                (Sum of Prior {priorDaysCount} Days) / {priorDaysCount} ={" "}
                <span className="font-extrabold text-indigo-600">
                  {metrics.sma_prior_daily}
                </span>{" "}
                pcs/day
              </div>
              <div>
                <span className="font-bold text-slate-700">Sales Trend:</span>{" "}
                ((Recent SMA - Baseline SMA) / Baseline SMA) * 100 ={" "}
                <span className="font-extrabold text-indigo-600">
                  {metrics.sales_trend_pct}
                </span>
              </div>
              <div>
                <span className="font-bold text-slate-700">
                  Days of Inventory (DOI):
                </span>{" "}
                Stock / Recent SMA ={" "}
                <span className="font-extrabold text-indigo-600">
                  {metrics.days_of_inventory}
                </span>{" "}
                days
              </div>
            </div>
          </div>
        );
      })()}

      <div className={`rounded-xl border p-4 ${actionColorClass}`}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-inherit">
            <span className="material-symbols-outlined text-[22px]">
              {actionIcon}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wide text-inherit">
              AI Action Recommendation
            </span>
            <h4 className="text-sm font-bold mt-0.5 leading-snug">{formatAction(action)}</h4>
            <p className="text-sm mt-2 text-slate-800 font-semibold">
              {ai_recommendation.recommendation}
            </p>
            {ai_recommendation.rationale && (
              <div className="mt-3 border-t border-dashed border-inherit pt-2.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Justification / Rationale
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

function EmptyResultCard({ text }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4F46E5]/5 text-[#4F46E5]">
        <span className="material-symbols-outlined text-[30px]">
          psychology
        </span>
      </div>
      <h3 className="text-sm font-bold text-slate-800">
        Awaiting Analysis Input
      </h3>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-[#64748B]">
        {text}
      </p>
    </div>
  );
}

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
