import { useEffect, useState } from "react";

export default function AddToCartModal({
  isOpen,
  product,
  cart = [],
  onClose,
  onConfirm,
}) {
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const formatDate = (val) => {
    if (!val) return "";
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return val;
    return dateObj.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && product) {
      const batches = product.batches || [];
      const defaultBatch = batches.length > 0 ? batches[0] : product;
      setSelectedBatch(defaultBatch);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (selectedBatch && isOpen) {
      const cartItem = cart.find((item) => item.id === selectedBatch.id);
      setQuantity(cartItem ? cartItem.quantity : 1);
    }
  }, [selectedBatch, cart, isOpen]);

  if (!isOpen || !product || !selectedBatch) return null;

  const maxStock = selectedBatch.stock || 0;
  const price = Number(selectedBatch.selling_price || 0);
  const total = quantity * price;

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleIncrease = () => {
    if (quantity < maxStock) {
      setQuantity(quantity + 1);
    }
  };

  const handleInputChange = (e) => {
    let val = parseInt(e.target.value || 0);
    if (val < 1) val = 1;
    if (val > maxStock) val = maxStock;
    setQuantity(val);
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

  const storedPhoto = localStorage.getItem(`product_photo_${product.product_code}`);
  const isAlreadyInCart = cart.some((item) => item.id === selectedBatch.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-6 py-5">
          <h2 className="text-base font-bold text-[#141B2B]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            {isAlreadyInCart ? "Update Item Details" : "Add Item Details"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition hover:bg-[#F8FAFC] hover:text-[#475569]"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-5">
          <div className="flex items-center gap-4">
            {storedPhoto ? (
              <img
                src={storedPhoto}
                alt={product.name}
                className="h-16 w-16 shrink-0 rounded-lg object-cover border border-[#E2E8F0]"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-[#F1F3FF] text-[#00685F]">
                <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="truncate font-semibold text-[#141B2B] text-sm">{product.name}</h3>
              <p className="text-xs text-[#94A3B8] mt-0.5">{product.category}</p>
              <p className="text-xs font-semibold text-[#00685F] mt-1">{formatIdr(selectedBatch.selling_price)}</p>
            </div>
          </div>

          {product.batches && product.batches.length > 1 && (
            <div className="flex flex-col gap-2 border-t border-[#E2E8F0] pt-4">
              <label className="text-xs font-bold text-[#334155] uppercase tracking-wider">Select Batch (Expiry Date)</label>
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                {product.batches.map((batch) => {
                  const batchInCart = cart.find((item) => item.id === batch.id);
                  const inCartQty = batchInCart ? batchInCart.quantity : 0;
                  const isSelected = selectedBatch.id === batch.id;

                  return (
                    <button
                      key={batch.id}
                      type="button"
                      onClick={() => setSelectedBatch(batch)}
                      className={`flex flex-col rounded-xl border p-3 text-left transition ${
                        isSelected
                          ? "bg-[#E8F5F3] border-[#00685F] text-[#00685F]"
                          : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      <div className="flex justify-between items-center w-full font-semibold text-xs">
                        <span className={isSelected ? "text-[#00685F]" : "text-[#141B2B]"}>
                          {batch.expiry_date ? `Exp: ${formatDate(batch.expiry_date)}` : "No Expiry Date"}
                        </span>
                        <span className="font-mono text-[10px] text-[#94A3B8]">
                          #{batch.product_code.slice(0, 8)}
                        </span>
                      </div>
                      <div className="mt-1 flex justify-between w-full text-[10px] text-[#64748B]">
                        <span>Stock available: <strong>{batch.stock} units</strong></span>
                        {inCartQty > 0 && <span className="text-[#00685F] font-bold">({inCartQty} in cart)</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between text-xs text-[#64748B] border-t border-b border-[#E2E8F0] py-3">
            <span>Selected Batch Expiry:</span>
            <span className="font-semibold text-[#141B2B]">
              {selectedBatch.expiry_date ? formatDate(selectedBatch.expiry_date) : "No Expiry Date"}
            </span>
          </div>

          <div className="flex justify-between text-xs text-[#64748B] border-b border-[#E2E8F0] pb-3">
            <span>Available Stock (this batch):</span>
            <span className="font-semibold text-[#141B2B]">{maxStock} units</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-[#334155]">Quantity</span>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">remove</span>
              </button>

              <input
                type="number"
                min="1"
                max={maxStock}
                value={quantity}
                onChange={handleInputChange}
                className="h-10 w-20 text-center font-bold text-sm text-[#141B2B] rounded-lg border border-[#E2E8F0] focus:border-[#00685F] outline-none"
              />

              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= maxStock}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#64748B] transition hover:border-[#00685F] hover:text-[#00685F] disabled:opacity-40"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
            <span className="text-xs font-semibold text-[#64748B]">Total Price</span>
            <span className="text-base font-bold text-[#00685F]">{formatIdr(total)}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[#E2E8F0] px-6 py-4 bg-[#F8FAFC]">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#64748B] transition hover:bg-[#F8FAFC]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedBatch, quantity)}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-[#00685F] px-5 text-xs font-bold text-white transition hover:bg-[#00574F]"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isAlreadyInCart ? "edit" : "shopping_cart"}
            </span>
            {isAlreadyInCart ? "Update Quantity" : "Add to Cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
