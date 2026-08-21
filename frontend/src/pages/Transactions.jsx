import { useCallback, useEffect, useMemo, useState } from "react";
import { getTransactions, getProducts } from "../services/api";

import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Details Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Pass date filters to API if present
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      // We fetch both transactions and products to map names/codes
      const [txData, prodData] = await Promise.all([
        getTransactions(params),
        getProducts(),
      ]);

      setTransactions(Array.isArray(txData) ? txData : []);
      setProducts(Array.isArray(prodData) ? prodData : []);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load transaction data.",
      );
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Product Map for fast lookup
  const productMap = useMemo(() => {
    return new Map(products.map((p) => [p.id, p]));
  }, [products]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter on frontend for search query
  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((tx) => {
      const codeMatches = tx.transaction_code.toLowerCase().includes(query);
      const productMatches = tx.items?.some((item) => {
        const prod = productMap.get(item.product_id);
        return (
          prod?.name?.toLowerCase().includes(query) ||
          prod?.product_code?.toLowerCase().includes(query)
        );
      });

      return codeMatches || productMatches;
    });
  }, [transactions, searchQuery, productMap]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, startDate, endDate]);

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  // Summary Metrics based on currently filtered/listed transactions
  const summary = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, tx) => {
        acc.totalRevenue += Number(tx.total_amount || 0);
        acc.totalItems +=
          tx.items?.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0,
          ) || 0;
        return acc;
      },
      { totalRevenue: 0, totalItems: 0 },
    );
  }, [filteredTransactions]);

  const handleOpenDetails = (tx) => {
    setSelectedTx(tx);
    setDetailsModalOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsModalOpen(false);
    setSelectedTx(null);
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setStartDate("");
    setEndDate("");
  };

  const formatIdr = (val) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    })
      .format(Number(val))
      .replace("IDR", "Rp");
  };

  const formatDate = (val) => {
    if (!val) return "—";
    const date = new Date(val);
    if (isNaN(date.getTime())) return val;
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1
                  className="text-xl font-semibold text-[#141B2B]"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  Transaction History
                </h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Review, filter, and inspect past sales transactions.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition disabled:opacity-50"
              >
                <span
                  className={`material-symbols-outlined text-[19px] ${loading ? "animate-spin" : ""}`}
                >
                  refresh
                </span>
                Refresh
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                <span className="material-symbols-outlined mt-0.5 text-[20px] text-red-500">
                  error
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-700">
                    Failed to load transactions
                  </p>
                  <p className="mt-0.5 text-xs text-red-600">{error}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    close
                  </span>
                </button>
              </div>
            )}

            {/* Row 1: Summary Stats */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <SummaryCard
                icon="receipt_long"
                iconColor="text-indigo-600 bg-indigo-50"
                label="Total Sales Count"
                value={filteredTransactions.length}
                sub="transactions listed"
              />
              <SummaryCard
                icon="payments"
                iconColor="text-emerald-600 bg-emerald-50"
                label="Total Sales Value"
                value={formatIdr(summary.totalRevenue)}
                sub="revenue generated"
              />
              <SummaryCard
                icon="shopping_bag"
                iconColor="text-amber-600 bg-amber-50"
                label="Total Items Sold"
                value={summary.totalItems}
                sub="units sold"
              />
            </div>

            {/* Row 2: Filtering Section */}
            <div className="mb-6 rounded-xl border border-[#E2E8F0] bg-white p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 items-end">
                {/* Search query */}
                <div className="relative">
                  <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#94A3B8]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by code/product..."
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-10 pr-4 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label
                    htmlFor="start_date"
                    className="block text-xs font-semibold text-[#64748B] mb-1.5"
                  >
                    Start Date
                  </label>
                  <input
                    id="start_date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label
                    htmlFor="end_date"
                    className="block text-xs font-semibold text-[#64748B] mb-1.5"
                  >
                    End Date
                  </label>
                  <input
                    id="end_date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F]"
                  />
                </div>

                {/* Reset filters */}
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="h-10 rounded-lg border border-[#E2E8F0] bg-white text-sm font-semibold text-[#64748B] hover:bg-[#F8FAFC] transition"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Row 3: Table Section */}
            <div className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
              {loading ? (
                <TableLoader />
              ) : filteredTransactions.length === 0 ? (
                <EmptyState onReset={handleResetFilters} />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px]">
                      <thead>
                        <tr className="border-b border-[#E2E8F0] bg-[#F9F9FF] text-left">
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Date & Time
                          </th>
                          <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Transaction Code
                          </th>
                          <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Items Count
                          </th>
                          <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Total Amount
                          </th>
                          <th className="px-5 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E2E8F0]">
                        {paginatedTransactions.map((tx) => {
                          const itemsCount =
                            tx.items?.reduce(
                              (sum, item) => sum + item.quantity,
                              0,
                            ) || 0;
                          return (
                            <tr
                              key={tx.id}
                              className="bg-white hover:bg-[#F9F9FF] transition-colors"
                            >
                              <td className="px-5 py-4 text-sm text-[#141B2B]">
                                {formatDate(tx.created_at)}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-[#00685F] font-mono">
                                {tx.transaction_code}
                              </td>
                              <td className="px-5 py-4 text-center text-sm text-[#141B2B]">
                                {itemsCount} units
                              </td>
                              <td className="px-5 py-4 text-right text-sm font-bold text-[#141B2B]">
                                {formatIdr(tx.total_amount)}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleOpenDetails(tx)}
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E8F5F3] hover:text-[#00685F] transition"
                                  title="View details"
                                >
                                  <span className="material-symbols-outlined text-[20px]">
                                    visibility
                                  </span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {(() => {
                    const totalEntries = filteredTransactions.length;
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

      {/* Details Modal */}
      <DetailsModal
        isOpen={detailsModalOpen}
        tx={selectedTx}
        productMap={productMap}
        onClose={handleCloseDetails}
        formatIdr={formatIdr}
        formatDate={formatDate}
      />
    </div>
  );
}

function SummaryCard({ icon, iconColor, label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3.5">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
        >
          <span className="material-symbols-outlined text-[22px]">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#64748B]">{label}</p>
          <h3
            className="mt-1 text-lg font-bold text-[#141B2B]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            {value}
          </h3>
          <p className="text-[10px] text-[#94A3B8] mt-0.5">{sub}</p>
        </div>
      </div>
    </div>
  );
}

function TableLoader() {
  return (
    <div className="divide-y divide-[#E2E8F0]">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="flex items-center gap-6 px-5 py-5">
          <div className="h-4 w-40 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-32 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-4 w-20 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="ml-auto h-4 w-24 animate-pulse rounded bg-[#E2E8F0]" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onReset }) {
  return (
    <div className="flex min-h-[350px] flex-col items-center justify-center text-center p-6">
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-[#94A3B8]">
        <span className="material-symbols-outlined text-[24px]">
          receipt_long
        </span>
      </div>
      <h3 className="text-sm font-semibold text-[#141B2B]">
        No transactions found
      </h3>
      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
        Try adjusting your filters or date range to see past transactions.
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 rounded-lg bg-[#00685F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00574F] transition"
      >
        Clear Filters
      </button>
    </div>
  );
}

function DetailsModal({
  isOpen,
  tx,
  productMap,
  onClose,
  formatIdr,
  formatDate,
}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !tx) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px] print:hidden"
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white shadow-2xl print:shadow-none print:rounded-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5 print:hidden">
          <h2 className="text-base font-bold text-[#141B2B]">
            Transaction Detail
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Invoice Info */}
        <div className="p-6 space-y-5">
          <div className="flex justify-between items-start border-b border-dashed border-[#E2E8F0] pb-4">
            <div>
              <p className="text-xs text-[#64748B]">Invoice Code</p>
              <h3 className="text-base font-extrabold text-[#00685F] font-mono mt-0.5">
                {tx.transaction_code}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#64748B]">Transaction Date</p>
              <p className="text-sm font-semibold text-[#141B2B] mt-0.5">
                {formatDate(tx.created_at)}
              </p>
            </div>
          </div>

          {/* Purchased Items List */}
          <div>
            <span className="block text-xs font-bold text-[#64748B] mb-3 uppercase tracking-wide">
              Purchased Items
            </span>
            <div className="max-h-56 overflow-y-auto space-y-3 pr-1">
              {tx.items?.map((item) => {
                const prod = productMap.get(item.product_id);
                return (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div className="min-w-0 pr-4">
                      <p className="font-semibold text-[#141B2B] truncate">
                        {prod?.name || "Unknown Product"}
                      </p>
                      <p className="text-[11px] text-[#94A3B8] font-mono mt-0.5">
                        {prod?.product_code || `ID: ${item.product_id}`} &bull;{" "}
                        {item.quantity} x {formatIdr(item.unit_price)}
                      </p>
                    </div>
                    <span className="font-bold text-[#141B2B] shrink-0">
                      {formatIdr(item.subtotal)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-dashed border-[#E2E8F0]" />

          {/* Pricing Calculation summary */}
          <div className="flex justify-between items-center text-base">
            <span className="font-bold text-[#64748B]">Total Paid</span>
            <span className="text-lg font-extrabold text-[#00685F]">
              {formatIdr(tx.total_amount)}
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC] rounded-b-2xl print:hidden">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-[#00685F] px-5 text-xs font-bold text-white transition hover:bg-[#00574F]"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            Print Receipt
          </button>
        </div>
      </div>

      {/* Thermal Receipt for printing */}
      <div id="thermal-receipt" className="hidden print:block font-mono">
        <div className="text-center">
          <h2 className="text-sm font-bold uppercase">CoStore</h2>
          <p className="text-[10px]">Nyawit Store</p>
          <p className="text-[10px]">Jakarta, Indonesia</p>
          <p className="my-1">================================</p>
        </div>

        <div className="text-[10px] space-y-0.5 text-left">
          <p>
            TXID: <span className="font-bold">{tx.transaction_code}</span>
          </p>
          <p>DATE: {formatDate(tx.created_at)}</p>
        </div>

        <p className="my-1">--------------------------------</p>

        <div className="space-y-1 text-[10px] text-left">
          {tx.items?.map((item) => {
            const prod = productMap.get(item.product_id);
            return (
              <div key={item.id} className="flex flex-col">
                <span className="font-semibold">
                  {prod?.name || "Unknown Item"}
                </span>
                <div className="flex justify-between pl-2">
                  <span>
                    {item.quantity} x {formatIdr(item.unit_price)}
                  </span>
                  <span>{formatIdr(item.subtotal)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className="my-1">--------------------------------</p>

        <div className="text-[10px] space-y-1 text-left">
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatIdr(tx.total_amount)}</span>
          </div>
          <div className="flex justify-between">
            <span>PAYMENT STATUS</span>
            <span>PAID</span>
          </div>
        </div>

        <p className="my-1">================================</p>

        <div className="text-center text-[10px] mt-2">
          <p className="font-bold">THANK YOU</p>
          <p>TERIMAKASIH BANYAK</p>
        </div>
      </div>
    </div>
  );
}
