import random
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

from app.database import SessionLocal
from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem
from app.models.stock_movement import StockMovement, MovementType

PRODUCTS = [
    {
        "product_code": "BEV-COF-01",
        "name": "Arabica Toraja Ground Coffee 250g",
        "category": "Beverages",
        "purchase_price": 35000,
        "selling_price": 48000,
        "initial_stock": 850,
        "expiry_date": "2027-04-15"
    },
    {
        "product_code": "DAI-MLK-01",
        "name": "Ultra Milk Full Cream 1000ml",
        "category": "Dairy & Fresh",
        "purchase_price": 16500,
        "selling_price": 21500,
        "initial_stock": 920,
        "expiry_date": "2026-11-20"
    },
    {
        "product_code": "SNK-CHT-01",
        "name": "Chitato BBQ Potato Chips 68g",
        "category": "Snacks",
        "purchase_price": 8500,
        "selling_price": 12500,
        "initial_stock": 1100,
        "expiry_date": "2027-02-10"
    },
    {
        "product_code": "GRO-NDL-01",
        "name": "Indomie Goreng Spesial 85g",
        "category": "Groceries",
        "purchase_price": 2800,
        "selling_price": 3500,
        "initial_stock": 1200,
        "expiry_date": "2027-06-30"
    },
    {
        "product_code": "BEV-POC-01",
        "name": "Pocari Sweat Ion Drink 500ml",
        "category": "Beverages",
        "purchase_price": 6500,
        "selling_price": 8500,
        "initial_stock": 780,
        "expiry_date": "2026-12-15"
    },
    {
        "product_code": "SNK-SLV-01",
        "name": "SilverQueen Chunky Bar Cashew 95g",
        "category": "Snacks",
        "purchase_price": 19000,
        "selling_price": 26000,
        "initial_stock": 750,
        "expiry_date": "2027-03-25"
    },
    {
        "product_code": "BAK-ROT-01",
        "name": "Sari Roti Tawar Gandum Double Soft",
        "category": "Bakery",
        "purchase_price": 14000,
        "selling_price": 18500,
        "initial_stock": 710,
        "expiry_date": "2026-08-27"
    },
    {
        "product_code": "PC-BIO-01",
        "name": "Biore Guard Body Foam Active Clean 450ml",
        "category": "Personal Care",
        "purchase_price": 22000,
        "selling_price": 29500,
        "initial_stock": 890,
        "expiry_date": "2028-01-10"
    },
    {
        "product_code": "BEV-AQU-01",
        "name": "Aqua Mineral Water 600ml",
        "category": "Beverages",
        "purchase_price": 3000,
        "selling_price": 4500,
        "initial_stock": 1150,
        "expiry_date": "2027-10-01"
    },
    {
        "product_code": "GRO-NUT-01",
        "name": "Nutella Hazelnut Spread 350g",
        "category": "Groceries",
        "purchase_price": 42000,
        "selling_price": 56000,
        "initial_stock": 740,
        "expiry_date": "2027-05-18"
    },
    {
        "product_code": "PC-SEN-01",
        "name": "Sensodyne Fresh Mint Toothpaste 100g",
        "category": "Personal Care",
        "purchase_price": 28000,
        "selling_price": 36500,
        "initial_stock": 820,
        "expiry_date": "2027-08-12"
    },
    {
        "product_code": "SNK-ORE-01",
        "name": "Oreo Vanilla Sandwich Cookies 133g",
        "category": "Snacks",
        "purchase_price": 7500,
        "selling_price": 10500,
        "initial_stock": 980,
        "expiry_date": "2027-04-05"
    }
]

def seed_30d():
    db = SessionLocal()
    try:
        print("--- 1. Resetting database tables ---")
        db.query(TransactionItem).delete()
        db.query(Transaction).delete()
        db.query(StockMovement).delete()
        db.query(Product).delete()
        db.commit()
        print("Reset complete.")

        print("\n--- 2. Creating Products & Initial Stock Adjustments ---")
        today = date.today()
        ref_start_date = today - timedelta(days=31)
        ref_start_datetime = datetime.combine(ref_start_date, datetime.min.time()) + timedelta(hours=8)

        products_list = []
        for p in PRODUCTS:
            product = Product(
                product_code=p["product_code"],
                name=p["name"],
                category=p["category"],
                purchase_price=Decimal(p["purchase_price"]),
                selling_price=Decimal(p["selling_price"]),
                stock=p["initial_stock"],
                expiry_date=datetime.strptime(p["expiry_date"], "%Y-%m-%d").date()
            )
            db.add(product)
            db.flush()
            products_list.append(product)

            movement = StockMovement(
                product_id=product.id,
                movement_type=MovementType.ADJUSTMENT,
                quantity=p["initial_stock"],
                stock_before=0,
                stock_after=p["initial_stock"],
                reason="Initial stock adjustment",
                created_at=ref_start_datetime
            )
            db.add(movement)

        db.commit()
        print(f"Created {len(products_list)} products with initial stock.")

        print("\n--- 3. Simulating 30 Days of Random Sales Transactions ---")
        total_revenue = Decimal("0.00")
        total_trxs = 0

        for day_offset in range(30, -1, -1):
            current_date = today - timedelta(days=day_offset)
            
            num_trxs = random.randint(5, 15)
            for t_idx in range(num_trxs):
                trx_code = f"TRX-{current_date.strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
                
                hour = random.randint(8, 21)
                minute = random.randint(0, 59)
                second = random.randint(0, 59)
                trx_time = datetime.combine(current_date, datetime.min.time()) + timedelta(
                    hours=hour, minutes=minute, seconds=second
                )

                sampled_products = random.sample(products_list, random.randint(1, 4))
                
                trx_amount = Decimal("0.00")
                trx_items = []
                movements = []

                for p in sampled_products:
                    qty = random.randint(1, 4)
                    
                    if p.stock < qty:
                        continue
                        
                    subtotal = p.selling_price * qty
                    trx_amount += subtotal

                    trx_items.append(TransactionItem(
                        product_id=p.id,
                        quantity=qty,
                        unit_price=p.selling_price,
                        subtotal=subtotal
                    ))

                    stock_before = p.stock
                    p.stock -= qty
                    stock_after = p.stock

                    movements.append(StockMovement(
                        product_id=p.id,
                        movement_type=MovementType.OUT,
                        quantity=qty,
                        stock_before=stock_before,
                        stock_after=stock_after,
                        reason=f"Sales {trx_code}",
                        created_at=trx_time
                    ))

                if not trx_items:
                    continue

                transaction = Transaction(
                    transaction_code=trx_code,
                    total_amount=trx_amount,
                    created_at=trx_time
                )
                db.add(transaction)
                db.flush()

                for item in trx_items:
                    item.transaction_id = transaction.id
                    db.add(item)
                for mov in movements:
                    db.add(mov)

                total_revenue += trx_amount
                total_trxs += 1

        db.commit()
        
        print("\n--- Final Stock Count Verification ---")
        for p in products_list:
            print(f"- {p.name}: {p.stock} pcs remaining")

        print("\n==========================================")
        print("30-Day Seeding Completed Successfully!")
        print(f"Total Transactions Generated: {total_trxs}")
        print(f"Total Revenue: Rp {total_revenue:,.2f}")
        print("==========================================")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_30d()
