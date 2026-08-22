import CartItem from "./CartItem";

export default function Cart({
  items,
  onIncrease,
  onDecrease,
  onSetQuantity,
  onRemove,
}) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1F3FF]">
          <span className="material-symbols-outlined text-[28px] text-[#64748B]">
            shopping_cart
          </span>
        </div>

        <h3 className="text-sm font-semibold text-[#141B2B]">
          Your cart is empty
        </h3>

        <p className="mt-1 max-w-xs text-xs leading-relaxed text-[#64748B]">
          Select a product from the catalog to start a new sale.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto bg-[#F9F9FF] p-3">
      {items.map((item) => (
        <CartItem
          key={item.id}
          item={item}
          onIncrease={onIncrease}
          onDecrease={onDecrease}
          onSetQuantity={onSetQuantity}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
}
