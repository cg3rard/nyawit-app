import { useState } from "react";
import MobileSidebar from "../components/layout/MobileSidebar";
import TopBar from "../components/layout/TopBar";

const FAQ_LIST = [
  {
    id: "pos-checkout",
    category: "POS & Sales",
    question: "How do I process a customer checkout in the POS?",
    answer:
      "Navigate to the POS page, browse or search for products, click on an item to select the quantity/batch, and click 'Add to Cart'. When the customer is ready, click 'Checkout', choose Cash or Digital payment, input the cash received (or use the quick cash suggestions), and confirm payment. You can also print the receipt immediately.",
  },
  {
    id: "stock-movements",
    category: "Inventory",
    question: "How does automated stock tracking and inventory movement work?",
    answer:
      "Every stock alteration creates an immutable Stock Movement record: IN (restocks/purchases), OUT (sales transactions or damages), and ADJUSTMENT (initial stock or stock opname corrections). This ensures an auditable history of all stock changes without manual bookkeeping.",
  },
  {
    id: "delete-product-lock",
    category: "Product Management",
    question: "Why does the system prevent deleting certain products?",
    answer:
      "To preserve financial integrity and past transaction history, products that have already been recorded in sales transactions cannot be deleted. Deleting them would corrupt historical sales totals and receipt lookups. If a product is discontinued, simply adjust its stock to 0.",
  },
  {
    id: "ai-insights",
    category: "AI Engine",
    question: "How does the AI Inventory Insights engine detect restock or dead stock?",
    answer:
      "The AI engine analyzes the last 14 days of daily sales velocity alongside current stock levels. It computes Simple Moving Average (SMA), Days of Inventory (DOI), and growth trends. If DOI drops below safe thresholds, it recommends urgent restocks. If DOI is excessively high with negative sales trends, it recommends promotional discounts to prevent dead stock.",
  },
  {
    id: "expiry-alerts",
    category: "Inventory",
    question: "How do Expiry Alerts work?",
    answer:
      "Products with specified expiry dates are automatically monitored. Items expiring within 7 days (or already expired) are highlighted on the Dashboard, in the top notification badge, and on the Products table so you can apply discounts or rotate stock (FEFO - First Expired, First Out).",
  },
  {
    id: "stock-adjustment",
    category: "Inventory",
    question: "How do I record stock adjustments for damaged or lost goods?",
    answer:
      "Go to the Inventory page or Products page, select 'Adjust Stock' or 'Stock Out', input the quantity, select the reason (e.g. Damage, Expired, Stock Opname Difference), and submit. The stock will be updated immediately with an audit record.",
  },
];

export default function Support() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [openFaqId, setOpenFaqId] = useState("pos-checkout");

  const categories = ["All", "POS & Sales", "Inventory", "Product Management", "AI Engine"];

  const filteredFaqs = FAQ_LIST.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar open={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery=""
          onSearchChange={() => {}}
          lowStockProducts={[]}
          expiryAlerts={[]}
        />

        <main className="flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-8 text-center sm:text-left">
              <h1
                className="text-2xl font-bold tracking-tight text-[#141B2B]"
                style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                Help Center & Knowledge Base
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Learn how to operate CoStore, troubleshoot common questions, and get support.
              </p>
            </div>

            <div className="mb-8 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm">
              <div className="relative mb-4">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  type="search"
                  placeholder="Search help articles, guides, or questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] pl-11 pr-4 text-sm text-[#141B2B] outline-none transition focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      selectedCategory === cat
                        ? "bg-[#00685F] text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <h2 className="text-base font-bold text-[#141B2B] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00685F]">help_outline</span>
                  Frequently Asked Questions
                </h2>

                {filteredFaqs.length === 0 ? (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-8 text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300 mb-2">search_off</span>
                    <p className="text-sm font-semibold text-slate-700">No matching help articles found</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your search keywords or category filter.</p>
                  </div>
                ) : (
                  filteredFaqs.map((faq) => {
                    const isOpen = openFaqId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-2xl border border-[#E2E8F0] bg-white shadow-sm overflow-hidden transition"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenFaqId(isOpen ? "" : faq.id)}
                          className="flex w-full items-center justify-between p-4 sm:p-5 text-left hover:bg-slate-50 transition"
                        >
                          <div className="pr-4">
                            <span className="text-[10px] font-extrabold uppercase tracking-wide text-[#00685F] mb-1 block">
                              {faq.category}
                            </span>
                            <h3 className="text-sm font-bold text-[#141B2B] leading-snug">
                              {faq.question}
                            </h3>
                          </div>
                          <span
                            className={`material-symbols-outlined text-slate-400 shrink-0 text-xl transition-transform duration-200 ${
                              isOpen ? "rotate-180 text-[#00685F]" : ""
                            }`}
                          >
                            expand_more
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-slate-100 bg-[#F8FAFC]/70 p-4 sm:p-5 text-xs sm:text-sm text-[#475569] leading-relaxed">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm mt-6">
                  <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#4648D4] text-xl">keyboard</span>
                    <h3 className="text-sm font-bold text-[#141B2B]">POS Operational Shortcuts</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Quick Product Search</span>
                      <kbd className="rounded bg-white px-2 py-0.5 font-bold shadow-xs border border-slate-200 text-slate-700">
                        Search Bar
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Quick Cash Selection</span>
                      <kbd className="rounded bg-white px-2 py-0.5 font-bold shadow-xs border border-slate-200 text-slate-700">
                        Exact Amount Button
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Print Receipt</span>
                      <kbd className="rounded bg-white px-2 py-0.5 font-bold shadow-xs border border-slate-200 text-slate-700">
                        Print Button / Ctrl + P
                      </kbd>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-slate-600">Clear Search Query</span>
                      <kbd className="rounded bg-white px-2 py-0.5 font-bold shadow-xs border border-slate-200 text-slate-700">
                        Esc
                      </kbd>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-slate-100">
                    <span className="material-symbols-outlined text-[#00685F] text-2xl">support_agent</span>
                    <div>
                      <h2 className="text-sm font-bold text-[#141B2B]">Direct Support Channels</h2>
                      <p className="text-[11px] text-[#64748B]">Need human assistance? Reach out to us directly.</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <a
                      href="mailto:support@costore.app"
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-[#00685F] hover:bg-emerald-50/40 transition group"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#00685F]">
                        <span className="material-symbols-outlined text-base">mail</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-800 group-hover:text-[#00685F]">Email Support</p>
                        <p className="text-[11px] text-slate-500 truncate">support@costore.app</p>
                      </div>
                    </a>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#10B981]">
                        <span className="material-symbols-outlined text-base">call</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Helpline / WhatsApp</p>
                        <p className="text-[11px] text-slate-500">+62 811-COSTORE-CARE</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white border border-slate-200 text-[#4F46E5]">
                        <span className="material-symbols-outlined text-base">schedule</span>
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">Operating Hours</p>
                        <p className="text-[11px] text-slate-500">Mon - Sun: 08:00 - 22:00 WIB</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 to-white p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-700 mb-2">
                    <span className="material-symbols-outlined text-lg">verified</span>
                    <span className="text-xs font-bold uppercase tracking-wider">Enterprise Reliability</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    CoStore is engineered with atomic database transactions to guarantee that every sale, stock deduction, and payment record remains balanced and immutable.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
