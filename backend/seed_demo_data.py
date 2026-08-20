import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api"

PRODUCTS = [
    {
        "product_code": "BEV-COF-01",
        "name": "Arabica Toraja Ground Coffee 250g",
        "category": "Beverages",
        "purchase_price": 35000,
        "selling_price": 48000,
        "stock": 850,
        "expiry_date": "2027-04-15"
    },
    {
        "product_code": "DAI-MLK-01",
        "name": "Ultra Milk Full Cream 1000ml",
        "category": "Dairy & Fresh",
        "purchase_price": 16500,
        "selling_price": 21500,
        "stock": 920,
        "expiry_date": "2026-11-20"
    },
    {
        "product_code": "SNK-CHT-01",
        "name": "Chitato BBQ Potato Chips 68g",
        "category": "Snacks",
        "purchase_price": 8500,
        "selling_price": 12500,
        "stock": 1100,
        "expiry_date": "2027-02-10"
    },
    {
        "product_code": "GRO-NDL-01",
        "name": "Indomie Goreng Spesial 85g",
        "category": "Groceries",
        "purchase_price": 2800,
        "selling_price": 3500,
        "stock": 1200,
        "expiry_date": "2027-06-30"
    },
    {
        "product_code": "BEV-POC-01",
        "name": "Pocari Sweat Ion Drink 500ml",
        "category": "Beverages",
        "purchase_price": 6500,
        "selling_price": 8500,
        "stock": 780,
        "expiry_date": "2026-12-15"
    },
    {
        "product_code": "SNK-SLV-01",
        "name": "SilverQueen Chunky Bar Cashew 95g",
        "category": "Snacks",
        "purchase_price": 19000,
        "selling_price": 26000,
        "stock": 750,
        "expiry_date": "2027-03-25"
    },
    {
        "product_code": "BAK-ROT-01",
        "name": "Sari Roti Tawar Gandum Double Soft",
        "category": "Bakery",
        "purchase_price": 14000,
        "selling_price": 18500,
        "stock": 710,
        "expiry_date": "2026-08-27"  # Expiring soon for alert demo
    },
    {
        "product_code": "PC-BIO-01",
        "name": "Biore Guard Body Foam Active Clean 450ml",
        "category": "Personal Care",
        "purchase_price": 22000,
        "selling_price": 29500,
        "stock": 890,
        "expiry_date": "2028-01-10"
    },
    {
        "product_code": "BEV-AQU-01",
        "name": "Aqua Mineral Water 600ml",
        "category": "Beverages",
        "purchase_price": 3000,
        "selling_price": 4500,
        "stock": 1150,
        "expiry_date": "2027-10-01"
    },
    {
        "product_code": "GRO-NUT-01",
        "name": "Nutella Hazelnut Spread 350g",
        "category": "Groceries",
        "purchase_price": 42000,
        "selling_price": 56000,
        "stock": 740,
        "expiry_date": "2027-05-18"
    },
    {
        "product_code": "PC-SEN-01",
        "name": "Sensodyne Fresh Mint Toothpaste 100g",
        "category": "Personal Care",
        "purchase_price": 28000,
        "selling_price": 36500,
        "stock": 820,
        "expiry_date": "2027-08-12"
    },
    {
        "product_code": "SNK-ORE-01",
        "name": "Oreo Vanilla Sandwich Cookies 133g",
        "category": "Snacks",
        "purchase_price": 7500,
        "selling_price": 10500,
        "stock": 980,
        "expiry_date": "2027-04-05"
    }
]

def post_json(endpoint, payload):
    data_bytes = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=data_bytes,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def seed():
    print("--- 1. Creating Products ---")
    created_map = {}
    for p in PRODUCTS:
        status, data = post_json("/products/", p)
        if status == 201:
            created_map[p["product_code"]] = data["id"]
            print(f"Created: {p['name']} (ID: {data['id']}, Stock: {p['stock']})")
        else:
            print(f"Failed to create {p['name']}: {status} {data}")

    print("\n--- 2. Creating Realistic Sales Transactions ---")
    transactions = [
        # TRX 1 (~Rp 69.500)
        [
            {"code": "BEV-COF-01", "qty": 1},
            {"code": "DAI-MLK-01", "qty": 1},
        ],
        # TRX 2 (~Rp 24.000)
        [
            {"code": "GRO-NDL-01", "qty": 2},
            {"code": "BEV-AQU-01", "qty": 1},
            {"code": "SNK-CHT-01", "qty": 1},
        ],
        # TRX 3 (~Rp 74.500)
        [
            {"code": "GRO-NUT-01", "qty": 1},
            {"code": "BAK-ROT-01", "qty": 1},
        ],
        # TRX 4 (~Rp 45.000)
        [
            {"code": "SNK-SLV-01", "qty": 1},
            {"code": "BEV-POC-01", "qty": 1},
            {"code": "SNK-ORE-01", "qty": 1},
        ],
        # TRX 5 (~Rp 66.000)
        [
            {"code": "PC-BIO-01", "qty": 1},
            {"code": "PC-SEN-01", "qty": 1},
        ],
        # TRX 6 (~Rp 68.000)
        [
            {"code": "DAI-MLK-01", "qty": 2},
            {"code": "SNK-CHT-01", "qty": 2},
        ],
        # TRX 7 (~Rp 69.000)
        [
            {"code": "BEV-COF-01", "qty": 1},
            {"code": "SNK-ORE-01", "qty": 2},
        ],
        # TRX 8 (~Rp 44.000)
        [
            {"code": "GRO-NDL-01", "qty": 10},
            {"code": "BEV-AQU-01", "qty": 2},
        ],
        # TRX 9 (~Rp 86.000)
        [
            {"code": "GRO-NUT-01", "qty": 1},
            {"code": "DAI-MLK-01", "qty": 1},
            {"code": "BEV-POC-01", "qty": 1},
        ],
        # TRX 10 (~Rp 61.000)
        [
            {"code": "SNK-SLV-01", "qty": 2},
            {"code": "BEV-AQU-01", "qty": 2},
        ],
        # TRX 11 (~Rp 66.000)
        [
            {"code": "PC-SEN-01", "qty": 1},
            {"code": "PC-BIO-01", "qty": 1},
        ],
        # TRX 12 (~Rp 104.000)
        [
            {"code": "BEV-COF-01", "qty": 1},
            {"code": "GRO-NUT-01", "qty": 1},
        ],
    ]

    total_revenue = 0
    for idx, items in enumerate(transactions, 1):
        payload = {
            "items": [
                {"product_id": created_map[item["code"]], "quantity": item["qty"]}
                for item in items
                if item["code"] in created_map
            ]
        }
        status, trx_data = post_json("/transactions/", payload)
        if status == 201:
            amt = float(trx_data["total_amount"])
            total_revenue += amt
            print(f"TRX #{idx:02d}: {trx_data['transaction_code']} - Total: Rp {amt:,.0f}")
        else:
            print(f"Failed TRX #{idx}: {status} {trx_data}")

    print(f"\n==========================================")
    print(f"Demo Seeding Completed Successfully!")
    print(f"Total Revenue Generated: Rp {total_revenue:,.0f}")
    print(f"Total Transactions: {len(transactions)}")
    print(f"==========================================")

if __name__ == "__main__":
    seed()
