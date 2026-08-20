export default function ProductEmptyState() {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5F3]">
        <span className="material-symbols-outlined text-[24px] text-[#00685F]">
          inventory_2
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[#141B2B]">
        No products found
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
        Try changing your search or category filter.
      </p>
    </div>
  );
}
