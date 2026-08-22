import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { getStoreProfile } from "../../utils/storeProfile";

const NAV_ITEMS = [
  { to: "/", icon: "dashboard", label: "Dashboard" },
  { to: "/pos", icon: "point_of_sale", label: "POS" },
  { to: "/transactions", icon: "receipt_long", label: "Transactions" },
  { to: "/products", icon: "inventory_2", label: "Products" },
  { to: "/suppliers", icon: "local_shipping", label: "Suppliers" },
  { to: "/inventory", icon: "inventory", label: "Inventory" },
  { to: "/ai-insights", icon: "auto_awesome", label: "AI Insights" },
];

const FOOTER_ITEMS = [
  { to: "/wa-connection", icon: "inventory", label: "Stock Mgmt Response" },
  { to: "/settings", icon: "settings", label: "Settings" },
  { to: "/support", icon: "help", label: "Support" },
  { to: "/login", icon: "logout", label: "Sign Out" },
];

function NavItem({ to, icon, label, onClick }) {
  const isPos = to === "/pos";
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      target={isPos ? "_blank" : undefined}
      rel={isPos ? "noopener noreferrer" : undefined}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm",
          "transition-colors duration-150",
          isActive && !isPos
            ? "text-[#00685F] bg-[#E8F5F3] font-semibold border-r-4 border-[#00685F]"
            : "text-[#64748B] hover:text-[#00685F] hover:bg-[#F8FAFC]",
        ].join(" ")
      }
    >
      <span className="material-symbols-outlined text-[21px]">
        {icon}
      </span>
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ onNavigate }) {
  const [storeProfile, setStoreProfile] = useState(getStoreProfile);

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

  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r border-[#E2E8F0]">
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F3] p-1.5">
            <img src="/icons.png" alt="Logo" className="h-full w-full object-contain" />
          </div>

          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#00685F]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              CoStore
            </h1>
            <p className="text-xs text-[#64748B] truncate max-w-[140px]">
              {storeProfile.storeName || "Nyawit Store"}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 mb-5">
        <Link
          to="/pos"
          onClick={onNavigate}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#00685F] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#00574F] active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">
            add
          </span>
          New Sale
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            onClick={onNavigate}
          />
        ))}
      </nav>

      <div className="px-3 pt-4 pb-6 border-t border-[#E2E8F0] space-y-1">
        {FOOTER_ITEMS.map((item) => (
          <NavItem
            key={item.to}
            {...item}
            onClick={onNavigate}
          />
        ))}
      </div>
    </aside>
  );
}
