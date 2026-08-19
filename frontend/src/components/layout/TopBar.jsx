import { useState } from "react";
import NotificationPanel from "./NotificationPanel";
import { getGreeting } from "../../utils/date";

export default function TopBar({
  onMenuOpen,
  searchQuery,
  onSearchChange,
  lowStockProducts = [],
  expiryAlerts = [],
}) {
  const [notifOpen, setNotifOpen] = useState(false);

  const notifCount = lowStockProducts.length + expiryAlerts.length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-6">
      {/* Left */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuOpen}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#00685F] focus:outline-none focus:ring-2 focus:ring-[#00685F]/20 lg:hidden"
        >
          <span className="material-symbols-outlined text-[22px]">
            menu
          </span>
        </button>

        {/* Mobile brand */}
        <div className="lg:hidden">
          <span
            className="text-lg font-bold tracking-tight text-[#00685F]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            CoStore
          </span>
        </div>

        {/* Search */}
        <div className="relative hidden w-full max-w-md md:block lg:ml-0">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B]">
            search
          </span>

          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, transactions..."
            className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-4 text-sm text-[#141B2B] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
          />
        </div>
      </div>

      {/* Right */}
      <div className="ml-4 flex shrink-0 items-center gap-3">
        {/* Notifications */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((prev) => !prev)}
            aria-label={
              notifCount > 0
                ? `Notifications, ${notifCount} alerts`
                : "Notifications"
            }
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-[#F8FAFC] hover:text-[#00685F] focus:outline-none focus:ring-2 focus:ring-[#00685F]/20"
          >
            <span className="material-symbols-outlined text-[21px]">
              notifications
            </span>

            {notifCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[9px] font-bold text-white">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </button>

          <NotificationPanel
            open={notifOpen}
            onClose={() => setNotifOpen(false)}
            lowStockProducts={lowStockProducts}
            expiryAlerts={expiryAlerts}
          />
        </div>

        {/* Divider */}
        <div className="hidden h-7 w-px bg-[#E2E8F0] sm:block" />

        {/* Greeting */}
        <div className="hidden text-right sm:block">
          <p className="text-xs font-semibold text-[#141B2B]">
            {getGreeting()}, Nyawit
          </p>
          <p className="mt-0.5 text-[11px] text-[#64748B]">
            {today}
          </p>
        </div>

        {/* Avatar */}
        <div
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8F5F3] text-xs font-bold text-[#00685F]"
          aria-label="Nyawit profile"
        >
          NY
        </div>
      </div>
    </header>
  );
}
