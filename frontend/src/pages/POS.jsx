import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts, createTransaction } from "../services/api";
import { getStoreSettings } from "../utils/storeProfile";

import ProductGrid from "../components/pos/ProductGrid";
import Cart from "../components/pos/Cart";
import CartSummary from "../components/pos/CartSummary";
import PaymentModal from "../components/pos/PaymentModal";
import AddToCartModal from "../components/pos/AddToCartModal";

export default function POS() {
  const navigate = useNavigate();
  const searchInputRef = useRef(null);
  const [storeSettings, setStoreSettings] = useState(getStoreSettings);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  const [selectedProductForCart, setSelectedProductForCart] = useState(null);
  const [addToCartModalOpen, setAddToCartModalOpen] = useState(false);

  const [error, setError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [receiptToPrint, setReceiptToPrint] = useState(null);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await getProducts();
      setProducts(data);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Failed to load products.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();

    const handleSettingsUpdate = () => {
      setStoreSettings(getStoreSettings());
    };

    window.addEventListener("costore_settings_updated", handleSettingsUpdate);
    window.addEventListener("storage", handleSettingsUpdate);

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
    return () => {
      window.removeEventListener("costore_settings_updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleSettingsUpdate);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const categories = useMemo(() => {
    const values = products.map((product) => product.category).filter(Boolean);

    return Array.from(new Set(values));
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        searchQuery.trim().length === 0 ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.product_code.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory.length === 0 ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product) => {
    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex(
        (item) => item.id === product.id,
      );

      if (existingIndex > -1) {
        return currentCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          product_code: product.product_code,
          selling_price: product.selling_price,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  };

  const handleProductCardClick = (product) => {
    setSelectedProductForCart(product);
    setAddToCartModalOpen(true);
  };

  const handleConfirmAddToCart = (product, quantity) => {
    setCart((currentCart) => {
      const existingIndex = currentCart.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        return currentCart.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      }
      return [
        ...currentCart,
        {
          id: product.id,
          product_id: product.id,
          name: product.name,
          product_code: product.product_code,
          selling_price: product.selling_price,
          quantity: quantity,
          maxStock: product.stock,
        },
      ];
    });
    setAddToCartModalOpen(false);
    setSelectedProductForCart(null);
  };

  const updateQuantity = (productId, delta) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity + delta,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const decreaseQuantity = (productId) => {
    updateQuantity(productId, -1);
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId),
    );
  };

  const handleConfirmCheckout = async (paymentData) => {
    if (cart.length === 0 || isCheckingOut) {
      return;
    }

    try {
      setIsCheckingOut(true);
      setError(null);

      const payload = cart.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
      }));

      const transaction = await createTransaction(payload);
      const newTx = {
        ...transaction,
        payment_method: paymentData.payment_method,
        cash_received: paymentData.cash_received,
        change: paymentData.change,
      };

      setCheckoutSuccess(newTx);
      setCart([]);
      setPaymentModalOpen(false);

      if (storeSettings.autoPrintReceipt) {
        handlePrintReceipt(newTx);
      }

      await loadProducts();
    } catch (err) {
      const message =
        err?.response?.data?.detail || err?.message || "Checkout failed.";

      setError(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handlePrintReceipt = (tx) => {
    setReceiptToPrint(tx);
    setTimeout(() => {
      window.print();
    }, 100);
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

  const subtotal = cart.reduce(
    (sum, item) => sum + Number(item.selling_price) * Number(item.quantity),
    0,
  );

  return (
    <div className="flex h-screen flex-col bg-[#F9F9FF]">
      <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 lg:px-6">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-3 transition hover:opacity-85 text-left"
          title="Back to dashboard"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E8F5F3] p-1.5">
            <img src="/icons.png" alt="CoStore Logo" className="h-full w-full object-contain" />
          </div>

          <div>
            <h1
              className="text-xl font-bold tracking-tight text-[#00685F]"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              CoStore
            </h1>
            <p className="text-[10px] text-[#64748B] -mt-1 font-medium">
              Back to Main Dashboard
            </p>
          </div>
        </button>

        <div className="relative w-full max-w-lg mx-4">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[19px] text-[#64748B]">
            search
          </span>

          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or code..."
            className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] pl-10 pr-20 text-sm text-[#141B2B] outline-none transition-all placeholder:text-[#94A3B8] focus:border-[#00685F] focus:bg-white focus:ring-2 focus:ring-[#00685F]/10"
          />

          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-400 shadow-2xs">
            Shift + S
          </kbd>
        </div>

        <div>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 h-10 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            <span className="material-symbols-outlined text-[18px]">
              logout
            </span>
            Exit POS
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <main className="flex flex-1 flex-col min-w-0 bg-[#F9F9FF] border-r border-[#E2E8F0]">
          <div className="border-b border-[#E2E8F0] bg-white px-6 py-4 flex gap-2 overflow-x-auto shrink-0 scrollbar-none">
            <CategoryButton
              active={!selectedCategory}
              label="All Categories"
              onClick={() => setSelectedCategory("")}
            />

            {categories.map((category) => (
              <CategoryButton
                key={category}
                active={selectedCategory === category}
                label={category}
                onClick={() => setSelectedCategory(category)}
              />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <ProductLoading />
            ) : error && products.length === 0 ? (
              <ProductError message={error} onRetry={loadProducts} />
            ) : (
              <ProductGrid
                products={groupedProducts}
                searchQuery={searchQuery}
                selectedCategory={selectedCategory}
                onAddToCart={addToCart}
              />
            )}
          </div>
        </main>

        <aside className="flex w-full shrink-0 flex-col bg-white border-l border-[#E2E8F0] md:w-[440px] h-full justify-between">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685F]">
                  shopping_cart
                </span>

                <h2
                  className="text-base font-bold text-[#141B2B]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Current Sale
                </h2>
              </div>

              <span className="rounded-full bg-[#F1F3FF] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                {cart.length} items
              </span>
            </div>

            {checkoutSuccess && (
              <div className="mx-6 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[22px]">
                    check_circle
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Sale completed successfully
                    </p>

                    <p className="mt-0.5 text-xs text-emerald-700 font-mono">
                      {checkoutSuccess.transaction_code}
                    </p>

                    <button
                      type="button"
                      onClick={() => handlePrintReceipt(checkoutSuccess)}
                      className="mt-2.5 flex h-8 items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50"
                    >
                      <span className="material-symbols-outlined text-[15px]">print</span>
                      Print Receipt
                    </button>
                  </div>
                </div>
              </div>
            )}

            {error && products.length > 0 && (
              <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-[22px]">
                    error
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Checkout failed
                    </p>

                    <p className="mt-0.5 text-xs text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <Cart
                items={cart}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemove={removeFromCart}
              />
            </div>
          </div>

          <CartSummary
            items={cart}
            onCheckout={() => setPaymentModalOpen(true)}
            isCheckingOut={isCheckingOut}
          />
        </aside>
      </div>

      <PaymentModal
        isOpen={paymentModalOpen}
        totalAmount={subtotal}
        onClose={() => setPaymentModalOpen(false)}
        onConfirm={handleConfirmCheckout}
        isCheckingOut={isCheckingOut}
      />

      <AddToCartModal
        isOpen={addToCartModalOpen}
        product={selectedProductForCart}
        cart={cart}
        onClose={() => {
          setAddToCartModalOpen(false);
          setSelectedProductForCart(null);
        }}
        onConfirm={handleConfirmAddToCart}
      />

      {receiptToPrint && (
        <div id="thermal-receipt" className="hidden print:block font-mono">
          <div className="text-center">
            <h2 className="text-sm font-bold uppercase">{storeSettings.storeName || "CoStore"}</h2>
            <p className="text-[10px] font-semibold">{storeSettings.receiptHeader || "CoStore Retail & Convenience"}</p>
            <p className="text-[10px]">{storeSettings.storeAddress || "Jakarta, Indonesia"}</p>
            {storeSettings.storePhone && <p className="text-[10px]">{storeSettings.storePhone}</p>}
            <p className="my-1">================================</p>
          </div>

          <div className="text-[10px] space-y-0.5 text-left">
            <p>TXID: <span className="font-bold">{receiptToPrint.transaction_code}</span></p>
            <p>DATE: {new Date(receiptToPrint.created_at).toLocaleString("id-ID")}</p>
            <p>CASHIER: {storeSettings.ownerName || "Nyawit"}</p>
          </div>

          <p className="my-1">--------------------------------</p>

          <div className="space-y-1 text-[10px] text-left">
            {receiptToPrint.items?.map((item) => {
              const prod = products.find((p) => p.id === item.product_id);
              return (
                <div key={item.id} className="flex flex-col">
                  <span className="font-semibold">{prod?.name || "Unknown Item"}</span>
                  <div className="flex justify-between pl-2">
                    <span>{item.quantity} x {formatIdr(item.unit_price || prod?.selling_price)}</span>
                    <span>{formatIdr(item.subtotal || (item.quantity * (item.unit_price || prod?.selling_price)))}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="my-1">--------------------------------</p>

          <div className="text-[10px] space-y-1 text-left">
            <div className="flex justify-between font-bold">
              <span>TOTAL</span>
              <span>{formatIdr(receiptToPrint.total_amount)}</span>
            </div>

            {receiptToPrint.payment_method === "cash" && (
              <>
                <div className="flex justify-between">
                  <span>CASH PAID</span>
                  <span>{formatIdr(receiptToPrint.cash_received || receiptToPrint.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CHANGE</span>
                  <span>{formatIdr(receiptToPrint.change || 0)}</span>
                </div>
              </>
            )}

            {receiptToPrint.payment_method === "qris" && (
              <div className="flex justify-between">
                <span>PAYMENT METHOD</span>
                <span>QRIS (PAID)</span>
              </div>
            )}
          </div>

          <p className="my-1">================================</p>

          <div className="text-center text-[10px] mt-2">
            <p className="font-semibold">{storeSettings.receiptFooter || "Thank you for shopping with us! Please come again."}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-full border px-4 py-2.5 text-xs font-bold transition-colors",
        active
          ? "border-[#00685F]/20 bg-[#E8F5F3] text-[#00685F]"
          : "border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#00685F] hover:text-[#00685F]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ProductLoading() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
        >
          <div className="aspect-square animate-pulse bg-[#E2E8F0]" />
          <div className="space-y-2 p-3">
            <div className="h-4 animate-pulse rounded bg-[#E2E8F0]" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-[#E2E8F0]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProductError({ message, onRetry }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-red-50">
        <span className="material-symbols-outlined text-red-500">error</span>
      </div>

      <h3 className="text-sm font-semibold text-[#141B2B]">
        Failed to load products
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[#64748B]">{message}</p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-[#00685F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00574F]"
      >
        Retry
      </button>
    </div>
  );
}
