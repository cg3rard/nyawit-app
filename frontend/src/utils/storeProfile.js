export function getStoreSettings() {
  try {
    const saved = localStorage.getItem("costore_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        storeName: parsed.storeName || "CoStore",
        ownerName: parsed.ownerName || "Nyawit",
        storeEmail: parsed.storeEmail || "nyawit@costore.app",
        storeAddress: parsed.storeAddress || "Jl. Sudirman No. 88, Jakarta Selatan",
        storePhone: parsed.storePhone || "+62 812-3456-7890",
        receiptHeader: parsed.receiptHeader || "CoStore Retail & Convenience",
        receiptFooter: parsed.receiptFooter || "Thank you for shopping with us! Please come again.",
        currency: parsed.currency || "IDR (Rp)",
        lowStockThreshold: Number(parsed.lowStockThreshold) || 5,
        autoPrintReceipt: parsed.autoPrintReceipt !== undefined ? Boolean(parsed.autoPrintReceipt) : true,
        soundEffects: parsed.soundEffects !== undefined ? Boolean(parsed.soundEffects) : true,
        enableAIRecommendations: parsed.enableAIRecommendations !== undefined ? Boolean(parsed.enableAIRecommendations) : true,
      };
    }
  } catch (e) {
    // ignore
  }
  return {
    storeName: "CoStore",
    ownerName: "Nyawit",
    storeEmail: "nyawit@costore.app",
    storeAddress: "Jl. Sudirman No. 88, Jakarta Selatan",
    storePhone: "+62 812-3456-7890",
    receiptHeader: "CoStore Retail & Convenience",
    receiptFooter: "Thank you for shopping with us! Please come again.",
    currency: "IDR (Rp)",
    lowStockThreshold: 5,
    autoPrintReceipt: true,
    soundEffects: true,
    enableAIRecommendations: true,
  };
}

export function getStoreProfile() {
  return getStoreSettings();
}

export function getInitials(name) {
  if (!name) return "NY";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
