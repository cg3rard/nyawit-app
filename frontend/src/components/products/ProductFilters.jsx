export default function ProductFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#94A3B8]">
          search
        </span>

        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products..."
          className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
        />
      </div>

      <select
        value={selectedCategory}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#00685F]"
      >
        <option value="">All Categories</option>

        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
}
