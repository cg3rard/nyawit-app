import { useCallback, useEffect, useState } from "react";
import { getDashboardSummary } from "../services/api";
import { getStoreSettings } from "../utils/storeProfile";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

import ActionRequired from "../components/dashboard/ActionRequired";
import AIInsightCard from "../components/dashboard/AIInsightCard";
import DashboardKPI from "../components/dashboard/DashboardKPI";
import ExpiryAlerts from "../components/dashboard/ExpiryAlerts";
import InventoryStatus from "../components/dashboard/InventoryStatus";
import RevenueByProduct from "../components/dashboard/RevenueByProduct";
import TopProductsTable from "../components/dashboard/TopProductsTable";

import ErrorState from "../components/common/ErrorState";
import { CardSkeleton, KPISkeleton, TableSkeleton } from "../components/common/LoadingSkeleton";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [storeSettings, setStoreSettings] = useState(getStoreSettings);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const currentThreshold = getStoreSettings().lowStockThreshold || 5;
      const result = await getDashboardSummary(currentThreshold);
      setData(result);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || "Connection failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const handleSettingsUpdate = () => {
      setStoreSettings(getStoreSettings());
      fetchData();
    };

    window.addEventListener("costore_settings_updated", handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);

    return () => {
      window.removeEventListener("costore_settings_updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
    };
  }, [fetchData]);

  const lowStockProducts = data?.low_stock_products ?? [];
  const expiryAlerts = data?.expiry_alerts ?? [];

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "var(--color-bg)" }}>
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          showSearch={true}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          lowStockProducts={lowStockProducts}
          expiryAlerts={expiryAlerts}
          aiInsight={storeSettings.enableAIRecommendations !== false ? data?.ai_insight : null}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-6">
          <div className="mb-6">
            <h1
              className="text-2xl font-semibold tracking-tight"
              style={{
                color: "var(--color-text)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Dashboard
            </h1>

            <p className="mt-1 text-sm" style={{ color: "var(--color-muted)" }}>
              Here's what's happening in your store today.
            </p>
          </div>

          {error && !loading && (
            <div className="rounded-2xl bg-white p-6 shadow-sm mb-6">
              <ErrorState message={error} onRetry={fetchData} />
            </div>
          )}

          {loading && (
            <div className="space-y-6">
              <KPISkeleton />
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TableSkeleton rows={5} />
                </div>
                <CardSkeleton />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            </div>
          )}

          {!loading && !error && data && (
            <div className="space-y-6">
              <DashboardKPI salesToday={data.sales_today} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <TopProductsTable products={data.top_products} searchQuery={searchQuery} />
                </div>
                <RevenueByProduct products={data.revenue_by_product} />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                <div className={storeSettings.enableAIRecommendations !== false ? "lg:col-span-2" : "lg:col-span-3"}>
                  <InventoryStatus inventory={data.inventory} />
                </div>
                {storeSettings.enableAIRecommendations !== false && (
                  <AIInsightCard insight={data.ai_insight} />
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ActionRequired lowStockProducts={lowStockProducts} expiryAlerts={expiryAlerts} searchQuery={searchQuery} />
                <ExpiryAlerts alerts={expiryAlerts} searchQuery={searchQuery} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
