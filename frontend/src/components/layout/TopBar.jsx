import { useState, useEffect, useRef } from "react";
import NotificationPanel from "./NotificationPanel";
import { getGreeting } from "../../utils/date";
import { getDashboardSummary } from "../../services/api";
import { getStoreProfile, getInitials } from "../../utils/storeProfile";

export default function TopBar({
  onMenuOpen,
  onMenuClick,
  searchQuery = "",
  onSearchChange = () => {},
  showSearch = false,
  lowStockProducts: propsLowStock,
  expiryAlerts: propsExpiryAlerts,
  aiInsight: propsAiInsight,
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [storeProfile, setStoreProfile] = useState(getStoreProfile);
  const searchInputRef = useRef(null);
  const [internalAlerts, setInternalAlerts] = useState({
    lowStock: [],
    expiryAlerts: [],
    aiInsight: null,
  });
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleMenu = onMenuOpen || onMenuClick || (() => {});

  useEffect(() => {
    if (!showSearch) return;

    const handleKeyDown = (e) => {
      if (e.shiftKey && (e.key === "S" || e.key === "s")) {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
        }
      } else if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current.blur();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setStoreProfile(getStoreProfile());
    };

    window.addEventListener("costore_settings_updated", handleProfileUpdate);
    window.addEventListener("storage", handleProfileUpdate);

    return () => {
      window.removeEventListener("costore_settings_updated", handleProfileUpdate);
      window.removeEventListener("storage", handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchLiveAlerts = async () => {
      try {
        const threshold = getStoreProfile().lowStockThreshold || 5;
        const summary = await getDashboardSummary(threshold);
        if (isMounted && summary) {
          setInternalAlerts({
            lowStock: summary.low_stock_products || [],
            expiryAlerts: summary.expiry_alerts || [],
            aiInsight: summary.ai_insight || null,
          });
        }
      } catch (err) {
      }
    };

    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const lowStockProducts =
    propsLowStock !== undefined && propsLowStock.length > 0
      ? propsLowStock
      : internalAlerts.lowStock;

  const expiryAlerts =
    propsExpiryAlerts !== undefined && propsExpiryAlerts.length > 0
      ? propsExpiryAlerts
      : internalAlerts.expiryAlerts;

  const rawAiInsight =
    propsAiInsight !== undefined && propsAiInsight !== null
      ? propsAiInsight
      : internalAlerts.aiInsight;

  const aiInsight = storeProfile.enableAIRecommendations !== false ? rawAiInsight : null;

  const notifCount =
    lowStockProducts.length +
    expiryAlerts.length +
    (aiInsight ? 1 : 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const ownerDisplayName = storeProfile.ownerName || "Nyawit";
  const avatarInitials = getInitials(ownerDisplayName);

  const formattedDateTime = `${currentTime.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })} • ${currentTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={handleMenu}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#00685F] focus:outline-none focus:ring-2 focus:ring-[#00685F]/20 lg:hidden cursor-pointer"
        >
          <span className="material-symbols-outlined text-[22px]">menu</span>
        </button>

        <div className="lg:hidden">
          <span
            className="text-lg font-bold tracking-tight text-[#00685F]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            CoStore
          </span>
        </div>

        {showSearch && (
          <div className="relative hidden w-full max-w-md md:block lg:ml-0">
            <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B]">
              search
            </span>

            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search products, transactions..."
              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-20 text-sm text-[#141B2B] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
            />

            <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">
              Shift + S
            </kbd>
          </div>
        )}
      </div>

      <div className="ml-4 flex shrink-0 items-center gap-3">
        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label={
              notifCount > 0
                ? `Notifications, ${notifCount} alerts`
                : "Notifications"
            }
            className={`relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#00685F]/20 cursor-pointer ${
              notifOpen
                ? "bg-[#E8F5F3] text-[#00685F]"
                : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#00685F]"
            }`}
          >
            <span className="material-symbols-outlined text-[21px]">
              notifications
            </span>

            {notifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-bold text-white shadow-xs animate-pulse">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          <NotificationPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            lowStockProducts={lowStockProducts}
            expiryAlerts={expiryAlerts}
            aiInsight={aiInsight}
          />
        </div>

        <div className="hidden h-7 w-px bg-[#E2E8F0] sm:block" />

        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#141B2B]">
            {getGreeting()}, {ownerDisplayName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium text-[#64748B] flex items-center justify-end gap-1">
            <span className="material-symbols-outlined text-[13px] text-[#00685F]">schedule</span>
            <span>{formattedDateTime}</span>
          </p>
        </div>

        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5F3] text-xs font-bold text-[#00685F]"
          aria-label={`${ownerDisplayName} profile`}
        >
          {avatarInitials}
        </div>
      </div>
    </header>
  );
}
