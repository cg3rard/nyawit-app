// Default high-quality verified retail product photos for CoStore catalog
const DEFAULT_PRODUCT_IMAGES = {
  "BEV-COF-01": "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500&auto=format&fit=crop&q=80", // Ground Coffee
  "DAI-MLK-01": "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&auto=format&fit=crop&q=80", // Fresh Milk
  "SNK-CHT-01": "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80", // Potato Chips
  "GRO-NDL-01": "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80", // Instant Noodles
  "BEV-POC-01": "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80", // Sport Isotonic Drink
  "SNK-SLV-01": "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=80", // Chocolate Bar
  "BAK-ROT-01": "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80", // Toast Bread
  "PC-BIO-01":  "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80", // Body Wash / Soap
  "BEV-AQU-01": "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=500&auto=format&fit=crop&q=80", // Mineral Water Bottle
  "GRO-NUT-01": "https://images.unsplash.com/photo-1589733955941-5eeaf752f6dd?w=500&auto=format&fit=crop&q=80", // Hazelnut Spread / Jam
  "PC-SEN-01":  "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=500&auto=format&fit=crop&q=80", // Toothpaste / Oral Care
  "SNK-ORE-01": "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=80", // Cookies
};

export function getProductImage(product) {
  if (!product) return null;
  
  // 1. Check user-uploaded custom photo in localStorage
  if (product.product_code) {
    const custom = localStorage.getItem(`product_photo_${product.product_code}`);
    if (custom) return custom;
    
    // 2. Check predefined catalog images by product code
    if (DEFAULT_PRODUCT_IMAGES[product.product_code]) {
      return DEFAULT_PRODUCT_IMAGES[product.product_code];
    }
  }

  return null;
}
