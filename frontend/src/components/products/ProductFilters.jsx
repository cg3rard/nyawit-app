import { useEffect, useRef } from "react";

export default function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedStatus,
  onStatusChange,
  categories,
}) {
  const searchInputRef = useRef(null);

  useEffect(() => {
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
  }, []);

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#94A3B8]">
          search
        </span>

        <input
          ref={searchInputRef}
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products..."
          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-20 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
        />

        <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
          Shift + S
        </kbd>
      </div>

      <div className="flex w-full gap-3 lg:w-auto">
        <select
          value={selectedCategory}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#00685F] sm:min-w-[150px] sm:flex-none cursor-pointer"
        >
          <option value="">All Categories</option>

          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(event) => onStatusChange(event.target.value)}
          className="h-10 min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#00685F] sm:min-w-[150px] sm:flex-none cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="in_stock">In Stock</option>
          <option value="low_stock">Low Stock</option>
          <option value="out_of_stock">Out of Stock</option>
        </select>
      </div>
    </div>
  );
}
