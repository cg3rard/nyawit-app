"""
dataset/generate_data.py
Generates 80 balanced, realistic synthetic training pairs for fine-tuning the POS Inventory AI.
Outputs to dataset/dataset.json in standard ChatML messages format.
"""

import json
import os
import random
from typing import List, Dict, Any

# Ensure reproducible generation
random.seed(42)

OUTPUT_DIR = "backend/dataset"
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "dataset.json")

SYSTEM_PROMPT = (
    "Kamu adalah POS Inventory Assistant. Berikan output JSON valid dengan key: "
    "action, recommendation, dan rationale."
)

# Realistic Indonesian retail FMCG products
PRODUCTS = [
    # Minuman
    "Susu UHT Cokelat 1L", "Teh Botol Kotak 250ml", "Kopi Hitam Sachet 10x20g",
    "Air Mineral 600ml", "Soda Lemon Kaleng 330ml", "Jus Jeruk 1L", "Kopi Susu Gula Aren 200ml",
    # Makanan Pokok & Instan
    "Mie Instan Goreng 85g", "Mie Kuah Kari Spesial 75g", "Beras Pandan Wangi 5kg",
    "Minyak Goreng Pouch 2L", "Telur Ayam Negeri 1kg", "Tepung Terigu Serbaguna 1kg",
    "Gula Pasir Kristal 1kg", "Kecap Manis 550ml", "Saus Sambal Botol 335ml",
    # Snack & Biskuit
    "Biskuit Kaleng Aneka Rasa 300g", "Kripik Singkong Balado 150g", "Cokelat Batang 50g",
    "Kacang Kulit Gurih 200g", "Wafer Cokelat Renyah 120g", "Snack Rumput Laut 20g",
    # Perlengkapan Rumah & Personal Care
    "Sabun Mandi Batang 100g", "Sabun Cair Pouch 450ml", "Shampoo Anti-Dandruff 180ml",
    "Pasta Gigi Fresh 120g", "Deterjen Bubuk 800g", "Pembersih Lantai Citrus 750ml",
    "Tisu Kering 250 sheets", "Cairan Cuci Piring Jeruk Nipis 700ml"
]

def calculate_metrics(stock: int, recent_7d: List[int], prior_7d: List[int]):
    """Calculates SMA, trend, and DOI identically to engine/metrics.py."""
    sma_7 = sum(recent_7d) / 7.0
    sma_prior = sum(prior_7d) / 7.0

    if sma_prior == 0.0:
        trend_pct = 100.0 if sma_7 > 0 else 0.0
    else:
        trend_pct = ((sma_7 - sma_prior) / sma_prior) * 100.0

    doi = 999.0 if sma_7 == 0.0 else stock / max(sma_7, 0.01)

    # Classification
    if stock == 0 or doi <= 3.0:
        status = "Merah"
    elif doi <= 7.0 and trend_pct >= 0.0:
        status = "Merah"
    elif (trend_pct <= -25.0 and doi >= 21.0) or (sma_7 == 0.0 and stock > 0):
        status = "Kuning"
    else:
        status = "Hijau"

    return sma_7, trend_pct, doi, status

def generate_red_scenario(product: str) -> Dict[str, Any]:
    """Generates low stock + steady/surging demand records."""
    daily_sales = random.randint(5, 14)
    recent_7d = [max(1, daily_sales + random.randint(-2, 3)) for _ in range(7)]
    prior_7d = [max(1, daily_sales + random.randint(-4, 1)) for _ in range(7)]

    # Force low stock (DOI <= 3 days)
    sma_estimate = sum(recent_7d) / 7.0
    stock = max(1, int(sma_estimate * random.uniform(0.3, 2.5)))

    sma_7, trend, doi, status = calculate_metrics(stock, recent_7d, prior_7d)

    reorder_qty = max(20, int(sma_7 * 14)) # 14-day supply
    actions = ["RESTOCK_URGENT", "REORDER_SEGERA", "ORDER_SUPPLIER", "RESTOCK_PRIORITAS"]
    action = random.choice(actions)

    recommendations = [
        f"Terbitkan purchase order (PO) darurat sebanyak {reorder_qty} pcs ke supplier utama hari ini.",
        f"Segera pesan ulang minimal {reorder_qty} pcs dan minta pengiriman prioritas.",
        f"Lakukan pemesanan restock sebanyak {reorder_qty} pcs untuk mengamankan persediaan 2 minggu ke depan."
    ]

    rationales = [
        f"Stok tersisa {stock} pcs hanya cukup untuk {doi:.1f} hari ke depan dengan tren penjualan {trend:+.1f}%.",
        f"Perputaran barang tinggi ({sma_7:.1f} pcs/hari) dan persediaan kritis di bawah batas aman ({doi:.1f} hari).",
        f"Risiko stockout tinggi dalam {doi:.1f} hari karena permintaan stabil ({trend:+.1f}%) sedangkan sisa stok menipis."
    ]

    return create_training_entry(
        product, status, stock, sma_7, trend, doi,
        action, random.choice(recommendations), random.choice(rationales)
    )

def generate_yellow_scenario(product: str) -> Dict[str, Any]:
    """Generates high stock + collapsing demand records (Dead Stock Risk)."""
    prior_sales = random.randint(6, 12)
    prior_7d = [max(3, prior_sales + random.randint(-2, 2)) for _ in range(7)]

    # Sharp drop in recent sales (>= 30% drop)
    drop_factor = random.uniform(0.1, 0.4)
    recent_7d = [max(0, int(prior_sales * drop_factor + random.randint(-1, 1))) for _ in range(7)]

    # Force high stock (DOI >= 25 days)
    stock = random.randint(70, 200)

    sma_7, trend, doi, status = calculate_metrics(stock, recent_7d, prior_7d)

    actions = ["PROMO_DISKON", "BUNDLING_PRODUK", "FLASH_SALE", "RELOKASI_DISPLAY"]
    action = random.choice(actions)

    discount = random.choice([15, 20, 25, 30])
    recommendations = [
        f"Terapkan diskon promosi {discount}% atau program Buy 2 Get 1 untuk mempercepat perputaran barang.",
        f"Buat paket bundling dengan produk fast-moving pelengkap dan beri potongan harga khusus.",
        f"Pindahkan produk ke rak display depan/area kasir dan pasang label promo flash sale {discount}%.",
        f"Jalankan program clearance diskon {discount}% sebelum barang menumpuk dan mendekati masa kedaluwarsa."
    ]

    rationales = [
        f"Penjualan anjlok {abs(trend):.1f}% dalam 7 hari terakhir dengan estimasi waktu habis mencapai {doi:.1f} hari.",
        f"Terindikasi risiko dead stock tinggi; stok menumpuk {stock} pcs di saat permintaan turun {abs(trend):.1f}%.",
        f"Perputaran barang melambat drastis ({sma_7:.1f} pcs/hari). Diperlukan tindakan promosi agar modal tidak tertahan {doi:.1f} hari."
    ]

    return create_training_entry(
        product, status, stock, sma_7, trend, doi,
        action, random.choice(recommendations), random.choice(rationales)
    )

def generate_green_scenario(product: str) -> Dict[str, Any]:
    """Generates healthy turnover + balanced inventory records."""
    base_sales = random.randint(4, 8)
    recent_7d = [max(2, base_sales + random.randint(-1, 2)) for _ in range(7)]
    prior_7d = [max(2, base_sales + random.randint(-2, 1)) for _ in range(7)]

    sma_estimate = sum(recent_7d) / 7.0
    # Healthy DOI (8 - 18 days)
    stock = int(sma_estimate * random.uniform(8.0, 16.0))

    sma_7, trend, doi, status = calculate_metrics(stock, recent_7d, prior_7d)

    actions = ["PERTAHANKAN_STOK", "MONITORING_RUTIN", "JAGA_KETERSEDIAAN"]
    action = random.choice(actions)

    recommendations = [
        "Pertahankan siklus replenishment reguler sesuai jadwal mingguan tanpa perlu tindakan promosi khusus.",
        "Lanjutkan monitoring penjualan rutin dan pastikan display rak tetap terisi rapi.",
        "Kondisi persediaan ideal. Masukkan ke jadwal pemesanan ulang standar pada siklus berikutnya."
    ]

    rationales = [
        f"Tingkat persediaan stabil mencukupi untuk {doi:.1f} hari ke depan dengan fluktuasi penjualan wajar ({trend:+.1f}%).",
        f"Rasio perputaran barang optimal ({sma_7:.1f} pcs/hari) dengan cadangan stok aman tanpa risiko kekurangan barang.",
        f"Stok {stock} pcs berada dalam batas wajar operasional harian dengan tren permintaan yang seimbang."
    ]

    return create_training_entry(
        product, status, stock, sma_7, trend, doi,
        action, random.choice(recommendations), random.choice(rationales)
    )

def create_training_entry(
    product: str, status: str, stock: int, sma_7: float,
    trend: float, doi: float, action: str, rec: str, rationale: str
) -> Dict[str, Any]:
    """Builds the final ChatML message pair."""
    user_prompt = (
        f"Produk: {product} | Status: {status} | Stok: {stock} pcs | "
        f"SMA_7: {sma_7:.1f} pcs/hari | Trend: {trend:+.1f}% | DOI: {doi:.1f} hari"
    )

    assistant_json = {
        "action": action,
        "recommendation": rec,
        "rationale": rationale
    }

    return {
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
            {"role": "assistant", "content": json.dumps(assistant_json, ensure_ascii=False)}
        ]
    }

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 80 Balanced samples: 28 Red (35%), 28 Yellow (35%), 24 Green (30%)
    dataset = []

    # Red Samples
    shuffled_prods = random.sample(PRODUCTS * 2, 28)
    for prod in shuffled_prods:
        dataset.append(generate_red_scenario(prod))

    # Yellow Samples
    shuffled_prods = random.sample(PRODUCTS * 2, 28)
    for prod in shuffled_prods:
        dataset.append(generate_yellow_scenario(prod))

    # Green Samples
    shuffled_prods = random.sample(PRODUCTS * 2, 24)
    for prod in shuffled_prods:
        dataset.append(generate_green_scenario(prod))

    # Shuffle overall dataset
    random.shuffle(dataset)

    # Write output
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(dataset, f, ensure_ascii=False, indent=2)

    # Print summary statistics
    red_cnt = sum(1 for d in dataset if "Status: Merah" in d["messages"][1]["content"])
    yellow_cnt = sum(1 for d in dataset if "Status: Kuning" in d["messages"][1]["content"])
    green_cnt = sum(1 for d in dataset if "Status: Hijau" in d["messages"][1]["content"])

    print(f"Dataset generation complete!")
    print(f"File saved to : {OUTPUT_FILE}")
    print(f"Total samples : {len(dataset)}")
    print(f"Distribution  : Merah={red_cnt} | Kuning={yellow_cnt} | Hijau={green_cnt}")
    print("\n--- Sample Entry ---")
    print(f"User Prompt:\n  {dataset[0]['messages'][1]['content']}")
    print(f"Model Target Response:\n  {dataset[0]['messages'][2]['content']}")

if __name__ == "__main__":
    main()