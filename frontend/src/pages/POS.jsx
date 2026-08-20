import { useEffect, useMemo, useState } from "react";
import { getProducts, createTransaction } from "../services/api";

import TopBar from "../components/layout/TopBar";
import MobileSidebar from "../components/layout/MobileSidebar";

import ProductGrid from "../components/pos/ProductGrid";
import Cart from "../components/pos/Cart";
import CartSummary from "../components/pos/CartSummary";

export default function POS() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [loading, setLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const [error, setError] = useState(null);
  const [checkoutSuccess, setCheckoutSuccess] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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
          "Failed to load products."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean);

    return [...new Set(values)];
  }, [products]);

  const addToCart = (product) => {
    if (product.stock <= 0) {
      return;
    }

    setCheckoutSuccess(null);

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) => item.id === product.id
      );

      if (existing) {
        if (existing.quantity >= product.stock) {
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
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
          stock: product.stock,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (item.id !== productId) {
          return item;
        }

        if (item.quantity >= item.stock) {
          return item;
        }

        return {
          ...item,
          quantity: item.quantity + 1,
        };
      })
    );
  };

  const decreaseQuantity = (productId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((currentCart) =>
      currentCart.filter((item) => item.id !== productId)
    );
  };

  const handleCheckout = async () => {
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

      setCheckoutSuccess(transaction);
      setCart([]);

      await loadProducts();
    } catch (err) {
      const message =
        err?.response?.data?.detail ||
        err?.message ||
        "Checkout failed.";

      setError(message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F9F9FF]">
      <MobileSidebar
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <TopBar
          onMenuOpen={() => setMobileSidebarOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          lowStockProducts={[]}
          expiryAlerts={[]}
        />

        <main className="flex min-h-0 flex-1 flex-col bg-[#F9F9FF] md:flex-row">
          {/* LEFT: PRODUCT AREA */}
          <section className="flex min-w-0 flex-1 flex-col border-r border-[#E2E8F0]">
            {/* Header */}
            <div className="border-b border-[#E2E8F0] bg-white px-4 py-4 lg:px-6">
              <div className="mb-4">
                <h1
                  className="text-xl font-semibold text-[#141B2B]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Point of Sale
                </h1>

                <p className="mt-1 text-sm text-[#64748B]">
                  Select products to start a new sale.
                </p>
              </div>

              {/* Categories */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                <CategoryButton
                  active={!selectedCategory}
                  label="All"
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
            </div>

            {/* Product content */}
            <div className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
              {loading ? (
                <ProductLoading />
              ) : error && products.length === 0 ? (
                <ProductError
                  message={error}
                  onRetry={loadProducts}
                />
              ) : (
                <ProductGrid
                  products={products}
                  searchQuery={searchQuery}
                  selectedCategory={selectedCategory}
                  onAddToCart={addToCart}
                />
              )}
            </div>
          </section>

          {/* RIGHT: CART */}
          <section className="flex w-full shrink-0 flex-col bg-white md:w-[380px]">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] px-4 py-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00685F]">
                  shopping_cart
                </span>

                <h2
                  className="text-base font-semibold text-[#141B2B]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Current Sale
                </h2>
              </div>

              <span className="rounded-full bg-[#F1F3FF] px-2.5 py-1 text-xs font-semibold text-[#64748B]">
                {cart.length} products
              </span>
            </div>

            {checkoutSuccess && (
              <div className="mx-3 mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-emerald-600">
                    check_circle
                  </span>

                  <div>
                    <p className="text-sm font-semibold text-emerald-800">
                      Sale completed
                    </p>

                    <p className="mt-0.5 text-xs text-emerald-700">
                      {checkoutSuccess.transaction_code}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {error && products.length > 0 && (
              <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-red-500">
                    error
                  </span>

                  <div>
                    <p className="text-xs font-semibold text-red-800">
                      Checkout failed
                    </p>

                    <p className="mt-0.5 text-xs text-red-700">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <Cart
              items={cart}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeFromCart}
            />

            <CartSummary
              items={cart}
              onCheckout={handleCheckout}
              isCheckingOut={isCheckingOut}
            />
          </section>
        </main>
      </div>
    </div>
  );
}

function CategoryButton({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-full border px-4 py-2 text-xs font-semibold transition-colors",
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
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
        <span className="material-symbols-outlined text-red-500">
          error
        </span>
      </div>

      <h3 className="text-sm font-semibold text-[#141B2B]">
        Failed to load products
      </h3>

      <p className="mt-1 max-w-sm text-xs text-[#64748B]">
        {message}
      </p>

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
