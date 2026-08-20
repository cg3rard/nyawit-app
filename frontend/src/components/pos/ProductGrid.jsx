import ProductCard from "./ProductCard";

export default function ProductGrid({
  products,
  searchQuery,
  selectedCategory,
  onAddToCart,
}) {
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch =
      !query ||
      product.name.toLowerCase().includes(query) ||
      product.product_code.toLowerCase().includes(query);

    const matchesCategory =
      !selectedCategory ||
      product.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  if (filteredProducts.length === 0) {
    return (
      <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#E8F5F3]">
          <span className="material-symbols-outlined text-[24px] text-[#00685F]">
            search_off
          </span>
        </div>

        <h3 className="text-sm font-semibold text-[#141B2B]">
          No products found
        </h3>

        <p className="mt-1 max-w-xs text-xs text-[#64748B]">
          Try another search or select a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {filteredProducts.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={onAddToCart}
        />
      ))}
    </div>
  );
}
