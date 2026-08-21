import { useEffect, useMemo, useState } from "react";
import { getMovements } from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

export default function Inventory() {
  const [movements, setMovements] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // ── Load Inventory Movements ───────────────────────────────────
  const loadMovements = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getMovements();

      setMovements(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load inventory movements."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovements();
  }, []);

  // ── Filter Movements ───────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return movements.filter((movement) => {
      const productName = movement.product?.name || "";
      const productCode = movement.product?.product_code || "";
      const type = movement.movement_type || "";
      const reason = movement.reason || "";

      const matchesSearch =
        !query ||
        productName.toLowerCase().includes(query) ||
        productCode.toLowerCase().includes(query) ||
        reason.toLowerCase().includes(query);

      const matchesType =
        !selectedType ||
        type.toLowerCase() === selectedType.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [movements, searchQuery, selectedType]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedType]);

  const paginatedMovements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredMovements.slice(startIndex, startIndex + pageSize);
  }, [filteredMovements, currentPage, pageSize]);

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

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

            {/* Header */}
            <div className="mb-5">
              <h1
                className="text-xl font-semibold text-[#141B2B]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Inventory
              </h1>

              <p className="mt-1 text-sm text-[#64748B]">
                Monitor stock levels and track every inventory movement.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-red-500">
                  error
                </span>

                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">
                    Failed to load inventory
                  </p>

                  <p className="mt-0.5 text-xs text-red-600">
                    {error}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 transition hover:text-red-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Filters */}
            <div className="mb-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

                {/* Search */}
                <div className="relative w-full lg:max-w-md">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#94A3B8]">
                    search
                  </span>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) =>
                      setSearchQuery(event.target.value)
                    }
                    placeholder="Search product..."
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:ring-2 focus:ring-[#00685F]/10"
                  />
                </div>

                {/* Movement Type */}
                <select
                  value={selectedType}
                  onChange={(event) =>
                    setSelectedType(event.target.value)
                  }
                  className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none focus:border-[#00685F]"
                >
                  <option value="">All Movements</option>
                  <option value="IN">Stock In</option>
                  <option value="OUT">Stock Out</option>
                  <option value="ADJUSTMENT">Adjustment</option>
                </select>
              </div>
            </div>

            {/* Inventory Movement Table */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">

              {/* Table Header */}
              <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-4">
                <div>
                  <h2 className="text-sm font-semibold text-[#141B2B]">
                    Inventory Movement History
                  </h2>

                  <p className="mt-0.5 text-xs text-[#64748B]">
                    {filteredMovements.length} of {movements.length} movements
                  </p>
                </div>

                <button
                  type="button"
                  onClick={loadMovements}
                  disabled={loading}
                  className="flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-50"
                >
                  <span
                    className={`material-symbols-outlined text-[17px] ${
                      loading ? "animate-spin" : ""
                    }`}
                  >
                    refresh
                  </span>

                  Refresh
                </button>
              </div>

              {loading ? (
                <MovementLoading />
              ) : filteredMovements.length === 0 ? (
                <MovementEmpty />
              ) : (
                <>
                  <MovementTable movements={paginatedMovements} />
                  
                  {/* Pagination Controls */}
                  {(() => {
                    const totalEntries = filteredMovements.length;
                    const totalPages = Math.ceil(totalEntries / pageSize);
                    const startIndex = (currentPage - 1) * pageSize;

                    return (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E2E8F0] px-5 py-4 bg-white">
                        {/* Page Size Selector */}
                        <div className="flex items-center gap-2 text-xs text-[#64748B]">
                          <span>Show</span>
                          <select
                            value={pageSize}
                            onChange={(e) => {
                              setPageSize(Number(e.target.value));
                              setCurrentPage(1);
                            }}
                            className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs text-[#141B2B] outline-none focus:border-[#00685F]"
                          >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="30">30</option>
                            <option value="50">50</option>
                          </select>
                          <span>entries</span>
                        </div>

                        {/* Showing X to Y of Z */}
                        <div className="text-xs text-[#64748B]">
                          Showing <span className="font-semibold text-[#141B2B]">{totalEntries === 0 ? 0 : startIndex + 1}</span> to{" "}
                          <span className="font-semibold text-[#141B2B]">
                            {Math.min(startIndex + pageSize, totalEntries)}
                          </span>{" "}
                          of <span className="font-semibold text-[#141B2B]">{totalEntries}</span> entries
                        </div>

                        {/* Navigation buttons */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                          </button>

                          {Array.from({ length: totalPages }).map((_, idx) => {
                            const pageNum = idx + 1;
                            if (
                              pageNum === 1 ||
                              pageNum === totalPages ||
                              Math.abs(pageNum - currentPage) <= 1
                            ) {
                              return (
                                <button
                                  key={pageNum}
                                  type="button"
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition ${
                                    currentPage === pageNum
                                      ? "bg-[#00685F] text-white font-bold"
                                      : "border border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                                  }`}
                                >
                                  {pageNum}
                                </button>
                              );
                            } else if (
                              (pageNum === 2 && currentPage > 3) ||
                              (pageNum === totalPages - 1 && currentPage < totalPages - 2)
                            ) {
                              return (
                                <span key={pageNum} className="px-1 text-slate-400 text-xs select-none">
                                  ...
                                </span>
                              );
                            }
                            return null;
                          })}

                          <button
                            type="button"
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function MovementTable({ movements }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1000px]">

        <thead>
          <tr className="border-b border-[#E2E8F0] bg-[#F9F9FF]">

            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Product
            </th>

            <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Type
            </th>

            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Quantity
            </th>

            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Stock Before
            </th>

            <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Stock After
            </th>

            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Reference
            </th>

            <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
              Date
            </th>

          </tr>
        </thead>

        <tbody className="divide-y divide-[#E2E8F0]">

          {movements.map((movement) => {
            const productName =
              movement.product?.name || "Unknown Product";

            const productCode =
              movement.product?.product_code || "";

            const type =
              movement.movement_type || "";

            const quantity =
              Math.abs(Number(movement.quantity ?? 0));

            const stockBefore =
              Number(movement.stock_before ?? 0);

            const stockAfter =
              Number(movement.stock_after ?? 0);

            const reason =
              movement.reason || "—";

            const date =
              movement.created_at;

            const normalizedType =
              type.toUpperCase();

            const isIn =
              normalizedType === "IN";

            const isOut =
              normalizedType === "OUT";

            const isAdjustment =
              normalizedType === "ADJUSTMENT";

            /*
             * Determine the displayed quantity.
             *
             * IN:
             *   10 -> +10
             *
             * OUT:
             *   2 -> -2
             *
             * ADJUSTMENT:
             *   0  -> 10 = +10
             *   25 -> 15 = -10
             */
            let displayQuantity = quantity;

            if (isIn) {
              displayQuantity = quantity;
            } else if (isOut) {
              displayQuantity = -quantity;
            } else if (isAdjustment) {
              if (stockAfter > stockBefore) {
                displayQuantity = quantity;
              } else if (stockAfter < stockBefore) {
                displayQuantity = -quantity;
              } else {
                displayQuantity = 0;
              }
            }

            const quantityText =
              displayQuantity > 0
                ? `+${displayQuantity}`
                : `${displayQuantity}`;

            return (
              <tr
                key={movement.id}
                className="bg-white transition-colors hover:bg-[#F9F9FF]"
              >

                {/* Product */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F1F3FF] text-[#00685F]">
                      <span className="material-symbols-outlined text-[20px]">
                        inventory_2
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#141B2B]">
                        {productName}
                      </p>

                      {productCode && (
                        <p className="mt-0.5 text-xs text-[#94A3B8]">
                          {productCode}
                        </p>
                      )}
                    </div>

                  </div>
                </td>

                {/* Type */}
                <td className="px-5 py-4 text-center">

                  {isAdjustment ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-600">
                      <span className="material-symbols-outlined text-[15px]">
                        tune
                      </span>

                      Adjustment
                    </span>
                  ) : isIn ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                      <span className="material-symbols-outlined text-[15px]">
                        arrow_downward
                      </span>

                      Stock In
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">
                      <span className="material-symbols-outlined text-[15px]">
                        arrow_upward
                      </span>

                      Stock Out
                    </span>
                  )}

                </td>

                {/* Quantity */}
                <td className="px-5 py-4 text-right">
                  <span
                    className={`text-sm font-semibold ${
                      displayQuantity > 0
                        ? "text-emerald-600"
                        : displayQuantity < 0
                          ? "text-red-600"
                          : "text-[#64748B]"
                    }`}
                  >
                    {quantityText}
                  </span>
                </td>

                {/* Stock Before */}
                <td className="px-5 py-4 text-right text-sm text-[#64748B]">
                  {stockBefore}
                </td>

                {/* Stock After */}
                <td className="px-5 py-4 text-right text-sm font-semibold text-[#141B2B]">
                  {stockAfter}
                </td>

                {/* Reference */}
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {reason}
                </td>

                {/* Date */}
                <td className="px-5 py-4 text-sm text-[#64748B]">
                  {formatDate(date)}
                </td>

              </tr>
            );
          })}

        </tbody>
      </table>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function MovementLoading() {
  return (
    <div className="divide-y divide-[#E2E8F0]">

      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-6 px-5 py-5"
        >
          <div className="h-10 w-10 animate-pulse rounded-lg bg-[#E2E8F0]" />

          <div className="h-4 w-40 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />

          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}

    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function MovementEmpty() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5F3]">
        <span className="material-symbols-outlined text-[24px] text-[#00685F]">
          swap_vert
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[#141B2B]">
        No inventory movements found
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
        Inventory movements will appear here when stock changes.
      </p>

    </div>
  );
}

/* ───────────────────────────────────────────────────────────── */

function formatDate(value) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
