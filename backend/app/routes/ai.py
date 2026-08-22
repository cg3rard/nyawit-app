import json
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from engine.metrics import InventoryEngine, InventoryMetrics
from app.database import get_db
from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem

router = APIRouter(tags=["AI"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MOCK_DATA_PATH = os.path.join(BASE_DIR, "mock_data.json")
ADAPTER_PATH = os.path.join(BASE_DIR, "lora_inventory_adapter")
BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

llm_pipeline = None

def get_product_insights_data(db: Session, product: Product, days: int = 14):
    """
    Mengambil data penjualan harian produk untuk masa 'days' hari terakhir (termasuk hari ini/D-0).
    Membagi data ke dalam recent period dan prior period.
    """
    from datetime import date, datetime, timedelta
    from sqlalchemy import func
    
    latest_datetime = db.query(func.max(Transaction.created_at)).scalar()
    ref_date = latest_datetime.date() if latest_datetime else date.today()

    start_date = ref_date - timedelta(days=days-1)
    end_date = ref_date

    sales_rows = (
        db.query(
            func.date(Transaction.created_at).label("sales_date"),
            func.sum(TransactionItem.quantity).label("total_qty")
        )
        .join(TransactionItem, TransactionItem.transaction_id == Transaction.id)
        .filter(TransactionItem.product_id == product.id)
        .filter(Transaction.created_at >= datetime.combine(start_date, datetime.min.time()))
        .filter(Transaction.created_at <= datetime.combine(end_date, datetime.max.time()))
        .group_by(func.date(Transaction.created_at))
        .all()
    )

    sales_map = {}
    for row in sales_rows:
        if not row.sales_date:
            continue
        
        if isinstance(row.sales_date, str):
            try:
                d_norm = datetime.strptime(row.sales_date[:10], "%Y-%m-%d").date()
            except ValueError:
                continue
        elif isinstance(row.sales_date, datetime):
            d_norm = row.sales_date.date()
        else:
            d_norm = row.sales_date
            
        sales_map[d_norm] = int(row.total_qty or 0)

    recent_count = (days + 1) // 2
    prior_count = days - recent_count

    sales_prior_list = []
    for i in range(days - 1, recent_count - 1, -1):
        day = ref_date - timedelta(days=i)
        sales_prior_list.append(sales_map.get(day, 0))

    sales_recent_list = []
    for i in range(recent_count - 1, -1, -1):
        day = ref_date - timedelta(days=i)
        sales_recent_list.append(sales_map.get(day, 0))

    return {
        "product_name": product.name,
        "current_stock": product.stock,
        "sales_recent_7d": sales_recent_list,
        "sales_prior_7d": sales_prior_list
    }

def get_product_status_and_recommendation(db: Session, product: Product, days: int = 14):
    """
    Evaluasi status produk dengan mempertimbangkan masa kedaluwarsa dan apakah produk baru masuk.
    """
    from datetime import date, datetime, timedelta
    from sqlalchemy import func
    from app.models.stock_movement import StockMovement
    
    payload = get_product_insights_data(db, product, days=days)
    
    metrics = InventoryEngine.calculate_metrics(
        product_name=payload["product_name"],
        current_stock=payload["current_stock"],
        sales_recent_7d=payload["sales_recent_7d"],
        sales_prior_7d=payload["sales_prior_7d"]
    )
    
    latest_datetime = db.query(func.max(Transaction.created_at)).scalar()
    ref_date = latest_datetime.date() if latest_datetime else date.today()
    
    first_movement_time = db.query(func.min(StockMovement.created_at)).filter(StockMovement.product_id == product.id).scalar()
    is_new_product = False
    if first_movement_time:
        if ref_date - first_movement_time.date() <= timedelta(days=7):
            is_new_product = True
    else:
        is_new_product = True
        
    days_to_expiry = None
    is_expiry_near = False
    is_expiry_far = True
    
    if product.expiry_date:
        days_to_expiry = (product.expiry_date - ref_date).days
        if days_to_expiry <= 30:
            is_expiry_near = True
            is_expiry_far = False
            
    status = metrics.status
    ai_output = None
    
    if is_expiry_near:
        status = "Kuning"
        days_str = f"{days_to_expiry} days remaining" if days_to_expiry >= 0 else "already expired"
        ai_output = {
            "action": "CLEARANCE_DISCOUNT",
            "recommendation": "Apply a 30% clearance discount or buy-1-get-1 bundling promotion.",
            "rationale": f"Product is nearing expiration date ({days_str} on {product.expiry_date.strftime('%Y-%m-%d')}). Immediate clearance discount recommended."
        }
    elif status == "Kuning" and (is_new_product or is_expiry_far):
        status = "Hijau"
        if is_new_product:
            rationale_text = "Newly introduced product; initial sales fluctuation is normal and does not require clearance discount."
        else:
            rationale_text = "Product has long expiration period remaining; no immediate clearance pressure."
            
        ai_output = {
            "action": "ROUTINE_MONITORING",
            "recommendation": "Continue regular sales monitoring and maintain standard inventory replenishment.",
            "rationale": rationale_text
        }
    else:
        ai_output = get_llm_recommendation(metrics.prompt_payload, metrics.status)
        
    original_doi = metrics.days_of_inventory
    capped_doi = original_doi
    
    if days_to_expiry is not None:
        limit_days = max(0, days_to_expiry)
        if original_doi > limit_days:
            capped_doi = float(limit_days)
            
    if status != metrics.status or capped_doi != metrics.days_of_inventory:
        metrics = InventoryMetrics(
            product_name=metrics.product_name,
            current_stock=metrics.current_stock,
            sma_7=metrics.sma_7,
            sma_prior=metrics.sma_prior,
            trend_pct=metrics.trend_pct,
            days_of_inventory=capped_doi,
            status=status,
            prompt_payload=metrics.prompt_payload
        )
        
    return metrics, ai_output, payload["sales_recent_7d"], payload["sales_prior_7d"], original_doi, days_to_expiry

def get_llm_recommendation(prompt_payload: str, status: str) -> Dict[str, str]:
    global llm_pipeline

    if not os.path.exists(ADAPTER_PATH):
        if status == "Merah":
            return {
                "action": "RESTOCK_URGENT",
                "recommendation": "Issue an urgent emergency purchase order (PO) to the primary supplier today.",
                "rationale": "Critical stock level is below safe operational threshold with active customer demand."
            }
        elif status == "Kuning":
            return {
                "action": "PROMO_DISCOUNT",
                "recommendation": "Apply a 20% bundling discount or relocate items to the checkout display shelf.",
                "rationale": "Significant sales velocity decline observed over the past 7 days with excess inventory."
            }
        else:
            return {
                "action": "MAINTAIN_STOCK",
                "recommendation": "Maintain regular replenishment cycle according to weekly schedule.",
                "rationale": "Inventory turnover rate and stock levels are within optimal operational bounds."
            }

    if llm_pipeline is None:
        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import PeftModel

            tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID)
            base_model = AutoModelForCausalLM.from_pretrained(
                BASE_MODEL_ID,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
                device_map="auto" if torch.cuda.is_available() else None
            )
            model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
            model.eval()
            llm_pipeline = (tokenizer, model)
        except Exception as e:
            if status == "Merah":
                return {
                    "action": "RESTOCK_URGENT",
                    "recommendation": "Issue an urgent emergency purchase order (PO) to the primary supplier today.",
                    "rationale": "Critical stock level is below safe operational threshold with active customer demand."
                }
            elif status == "Kuning":
                return {
                    "action": "PROMO_DISCOUNT",
                    "recommendation": "Apply a 20% bundling discount or relocate items to the checkout display shelf.",
                    "rationale": "Significant sales velocity decline observed over the past 7 days with excess inventory."
                }
            else:
                return {
                    "action": "MAINTAIN_STOCK",
                    "recommendation": "Maintain regular replenishment cycle according to weekly schedule.",
                    "rationale": "Inventory turnover rate and stock levels are within optimal operational bounds."
                }

    tokenizer, model = llm_pipeline
    messages = [
        {"role": "system", "content": "You are a POS Inventory Assistant. Provide valid JSON output with keys: action, recommendation, and rationale."},
        {"role": "user", "content": prompt_payload}
    ]

    import torch
    text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = tokenizer([text], return_tensors="pt")
    if torch.cuda.is_available():
        inputs = inputs.to("cuda")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.1,
            do_sample=False
        )

    response_text = tokenizer.decode(outputs[0][len(inputs.input_ids[0]):], skip_special_tokens=True)
    
    try:
        raw_res = json.loads(response_text)
        return normalize_ai_output_to_english(raw_res, status)
    except Exception:
        return normalize_ai_output_to_english({"action": "MANUAL_EVALUATION", "recommendation": response_text, "rationale": "Parsed from model output."}, status)

def normalize_ai_output_to_english(ai_output: Dict[str, str], status: str) -> Dict[str, str]:
    if not isinstance(ai_output, dict):
        return ai_output
    
    action = ai_output.get("action", "")
    rec = ai_output.get("recommendation", "")
    rat = ai_output.get("rationale", "")

    action_map = {
        "RESTOCK_URGENT": "RESTOCK_URGENT",
        "REORDER_SEGERA": "RESTOCK_URGENT",
        "ORDER_SUPPLIER": "RESTOCK_URGENT",
        "RESTOCK_PRIORITAS": "RESTOCK_URGENT",
        "PROMO_DISKON": "PROMO_DISCOUNT",
        "PROMO_DISCOUNT": "PROMO_DISCOUNT",
        "CLEARANCE_DISCOUNT": "CLEARANCE_DISCOUNT",
        "BUNDLING_PRODUK": "PROMO_DISCOUNT",
        "FLASH_SALE": "PROMO_DISCOUNT",
        "RELOKASI_DISPLAY": "PROMO_DISCOUNT",
        "PERTAHANKAN_STOK": "MAINTAIN_STOCK",
        "MAINTAIN_STOCK": "MAINTAIN_STOCK",
        "MONITORING_RUTIN": "ROUTINE_MONITORING",
        "ROUTINE_MONITORING": "ROUTINE_MONITORING",
    }
    action = action_map.get(action, action)

    rec_translations = [
        ("Terbitkan purchase order (PO) darurat ke supplier utama hari ini.", "Issue an urgent emergency purchase order (PO) to the primary supplier today."),
        ("Terbitkan purchase order (PO) darurat", "Issue an emergency purchase order (PO)"),
        ("ke supplier utama hari ini", "to the primary supplier today"),
        ("Lakukan pemesanan restock sebanyak", "Place a restock order of"),
        ("untuk mengamankan persediaan", "to secure inventory for the next"),
        ("2 minggu ke depan", "2 weeks"),
        ("Terapkan diskon bundling 20%", "Apply a 20% bundling discount"),
        ("atau relokasi barang ke rak display kasir", "or relocate items to the checkout display shelf"),
        ("Terapkan diskon cuci gudang sebesar 30%", "Apply a 30% clearance discount"),
        ("atau promo bundling beli 1 gratis 1", "or buy-1-get-1 bundling promotion"),
        ("Pertahankan siklus replenishment reguler sesuai jadwal mingguan", "Maintain regular replenishment cycle according to weekly schedule"),
        ("Lanjutkan pemantauan penjualan rutin dan jaga ketersediaan stok standar", "Continue regular sales monitoring and maintain standard inventory replenishment"),
        ("Segera pesan ulang minimal", "Promptly reorder at least"),
        ("dan minta pengiriman prioritas", "and request priority delivery"),
        ("pcs", "units"),
    ]
    for id_text, en_text in rec_translations:
        rec = rec.replace(id_text, en_text)

    rat_translations = [
        ("Sisa stok kritis berada di bawah batas aman operasional dengan permintaan aktif.", "Critical stock level is below safe operational threshold with active customer demand."),
        ("Sisa stok kritis berada di bawah batas aman operasional dengan permintaan aktif", "Critical stock level is below safe operational threshold with active customer demand"),
        ("Stok tersisa", "Remaining stock of"),
        ("hanya cukup untuk", "is only sufficient for"),
        ("hari ke depan dengan tren penjualan", "days ahead with sales trend"),
        ("Perputaran barang tinggi", "High inventory turnover rate"),
        ("dan persediaan kritis di bawah batas aman", "and inventory level is below safe threshold"),
        ("Risiko stockout tinggi dalam", "High stockout risk within"),
        ("karena permintaan stabil", "due to steady demand"),
        ("sedangkan sisa stok menipis", "while remaining stock is low"),
        ("Terjadi penurunan penjualan signifikan dalam 7 hari terakhir dengan persediaan menumpuk", "Significant sales velocity decline observed over the past 7 days with excess inventory"),
        ("Produk mendekati tanggal kedaluwarsa", "Product is nearing expiration date"),
        ("Diperlukan diskon untuk menghabiskan stok secepatnya", "Discount needed to accelerate inventory turnover"),
        ("Produk baru masuk sehingga fluktuasi awal penjualan wajar dan belum memerlukan tindakan promosi diskon", "Newly introduced product; initial sales fluctuation is normal and does not require clearance discount"),
        ("Masa kedaluwarsa produk masih lama", "Product has long expiration period remaining"),
        ("sehingga tidak ada desakan untuk melakukan cuci gudang melalui diskon", "no immediate clearance pressure"),
        ("Tingkat perputaran barang dan persediaan berada pada batas optimal", "Inventory turnover rate and stock levels are within optimal operational bounds"),
        ("hari lagi", "days remaining"),
        ("sudah kedaluwarsa", "already expired"),
        ("pada", "on"),
        ("hari", "days"),
        ("pcs/hari", "units/day"),
        ("pcs", "units"),
    ]
    for id_text, en_text in rat_translations:
        rat = rat.replace(id_text, en_text)

    return {
        "action": action,
        "recommendation": rec,
        "rationale": rat
    }

class TransactionPayload(BaseModel):
    product_name: str = Field(..., example="Kopi Tubruk Spesial 200g")
    current_stock: int = Field(..., ge=0, example=5)
    sales_recent_7d: List[int] = Field(..., min_items=7, max_items=7, example=[8, 9, 7, 10, 8, 9, 8])
    sales_prior_7d: List[int] = Field(..., min_items=7, max_items=7, example=[5, 4, 6, 5, 5, 6, 5])

class EvaluationResponse(BaseModel):
    product_name: str
    status: str
    metrics: Dict[str, Any]
    prompt_used: str
    ai_recommendation: Dict[str, str]

@router.get("/api/mock/scenarios")
def get_available_scenarios(
    days: int = Query(14, ge=7),
    db: Session = Depends(get_db)
):
    """Mengembalikan daftar skenario mock data yang tersedia untuk panitia."""
    scenarios_list = []
    available_keys = []
    
    if os.path.exists(MOCK_DATA_PATH):
        try:
            with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
            scenarios = data.get("scenarios", {})
            for k, v in scenarios.items():
                available_keys.append(k)
                scenarios_list.append({
                    "key": k,
                    "id": v.get("scenario_id"),
                    "name": v.get("scenario_name") + " (Demo)",
                    "expected_status": v.get("expected_status"),
                    "description": v.get("description"),
                    "category": "Demo"
                })
        except Exception as e:
            print(f"Error loading mock scenarios: {e}")
            
    try:
        products = db.query(Product).order_by(Product.id.asc()).all()
        for p in products:
            key = f"db_{p.id}"
            metrics, _, _, _, _, _ = get_product_status_and_recommendation(db, p, days=days)
            available_keys.append(key)
            scenarios_list.append({
                "key": key,
                "id": p.product_code,
                "name": p.name,
                "expected_status": metrics.status,
                "description": f"Category: {p.category or 'General'} | Current Stock: {p.stock} pcs | Status: {metrics.status}",
                "category": p.category or "General"
            })
    except Exception as e:
        print(f"Error loading products: {e}")
        
    return {
        "available_keys": available_keys,
        "scenarios": scenarios_list
    }

@router.post("/api/mock/simulate", response_model=EvaluationResponse)
def simulate_mock_scenario(
    scenario: str = Query(..., description="Key skenario: 'red_risk', 'yellow_risk', 'green_safe', atau 'db_<id>'"),
    days: int = Query(14, ge=7),
    db: Session = Depends(get_db)
):
    """
    Endpoint khusus panitia untuk melakukan cross-checking tanpa input hardware.
    Menerima key preset skenario atau key database produk dan langsung menjalankan inferensi penuh.
    """
    if scenario.startswith("db_"):
        try:
            product_id = int(scenario.split("_")[1])
        except (ValueError, IndexError):
            raise HTTPException(status_code=400, detail="Format key database tidak valid.")
            
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Produk dengan ID {product_id} tidak ditemukan.")
            
        metrics, ai_output, sales_recent_7d, sales_prior_7d, original_doi, days_to_expiry = get_product_status_and_recommendation(db, product, days=days)
        expiry_date_str = product.expiry_date.strftime("%Y-%m-%d") if product.expiry_date else None
    else:
        if not os.path.exists(MOCK_DATA_PATH):
            raise HTTPException(status_code=404, detail="File mock_data.json tidak ditemukan.")

        with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        scenario_data = data.get("scenarios", {}).get(scenario)
        if not scenario_data:
            raise HTTPException(
                status_code=400, 
                detail=f"Skenario '{scenario}' tidak valid. Pilihan: {list(data.get('scenarios', {}).keys())}"
            )
        payload = scenario_data["payload"]

        metrics: InventoryMetrics = InventoryEngine.calculate_metrics(
            product_name=payload["product_name"],
            current_stock=payload["current_stock"],
            sales_recent_7d=payload["sales_recent_7d"],
            sales_prior_7d=payload["sales_prior_7d"]
        )
        ai_output = get_llm_recommendation(metrics.prompt_payload, metrics.status)
        sales_recent_7d = payload["sales_recent_7d"]
        sales_prior_7d = payload["sales_prior_7d"]
        original_doi = metrics.days_of_inventory
        days_to_expiry = None
        expiry_date_str = None

    return EvaluationResponse(
        product_name=metrics.product_name,
        status=metrics.status,
        metrics={
            "current_stock": metrics.current_stock,
            "sma_7_daily": metrics.sma_7,
            "sma_prior_daily": metrics.sma_prior,
            "sales_trend_pct": f"{metrics.trend_pct:+}%",
            "days_of_inventory": metrics.days_of_inventory,
            "sales_recent_7d": sales_recent_7d,
            "sales_prior_7d": sales_prior_7d,
            "expiry_date": expiry_date_str,
            "days_to_expiry": days_to_expiry,
            "original_days_of_inventory": original_doi
        },
        prompt_used=metrics.prompt_payload,
        ai_recommendation=ai_output
    )

@router.post("/api/inventory/evaluate", response_model=EvaluationResponse)
def evaluate_custom_transaction(tx: TransactionPayload):
    """
    Endpoint standar untuk menerima data transaksi kasir secara dinamis.
    """
    metrics: InventoryMetrics = InventoryEngine.calculate_metrics(
        product_name=tx.product_name,
        current_stock=tx.current_stock,
        sales_recent_7d=tx.sales_recent_7d,
        sales_prior_7d=tx.sales_prior_7d
    )

    ai_output = get_llm_recommendation(metrics.prompt_payload, metrics.status)

    return EvaluationResponse(
        product_name=metrics.product_name,
        status=metrics.status,
        metrics={
            "current_stock": metrics.current_stock,
            "sma_7_daily": metrics.sma_7,
            "sma_prior_daily": metrics.sma_prior,
            "sales_trend_pct": f"{metrics.trend_pct:+}%",
            "days_of_inventory": metrics.days_of_inventory,
            "sales_recent_7d": tx.sales_recent_7d,
            "sales_prior_7d": tx.sales_prior_7d
        },
        prompt_used=metrics.prompt_payload,
        ai_recommendation=ai_output
    )

@router.post("/api/inventory/evaluate-all", response_model=List[EvaluationResponse])
def evaluate_all_products(
    days: int = Query(14, ge=7),
    db: Session = Depends(get_db)
):
    """
    Evaluasi semua produk yang ada di database sekaligus.
    """
    products = db.query(Product).order_by(Product.id.asc()).all()
    results = []
    for p in products:
        metrics, ai_output, sales_recent_7d, sales_prior_7d, original_doi, days_to_expiry = get_product_status_and_recommendation(db, p, days=days)
        results.append(
            EvaluationResponse(
                product_name=metrics.product_name,
                status=metrics.status,
                metrics={
                    "current_stock": metrics.current_stock,
                    "sma_7_daily": metrics.sma_7,
                    "sma_prior_daily": metrics.sma_prior,
                    "sales_trend_pct": f"{metrics.trend_pct:+}%",
                    "days_of_inventory": metrics.days_of_inventory,
                    "sales_recent_7d": sales_recent_7d,
                    "sales_prior_7d": sales_prior_7d,
                    "expiry_date": p.expiry_date.strftime("%Y-%m-%d") if p.expiry_date else None,
                    "days_to_expiry": days_to_expiry,
                    "original_days_of_inventory": original_doi
                },
                prompt_used=metrics.prompt_payload,
                ai_recommendation=ai_output
            )
        )
    return results
