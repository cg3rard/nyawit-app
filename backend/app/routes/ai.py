import json
import os
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

# Import Engine & Metrics
from engine.metrics import InventoryEngine, InventoryMetrics
from app.database import get_db
from app.models.product import Product
from app.models.transaction import Transaction, TransactionItem

router = APIRouter(tags=["AI"])

# Resolve absolute paths relative to backend root directory
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MOCK_DATA_PATH = os.path.join(BASE_DIR, "mock_data.json")
ADAPTER_PATH = os.path.join(BASE_DIR, "lora_inventory_adapter")
BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

# Lazy-loaded LLM inference engine
llm_pipeline = None



def get_product_insights_data(db: Session, product: Product, days: int = 14):
    """
    Mengambil data penjualan harian produk untuk masa 'days' hari terakhir (termasuk hari ini/D-0).
    Membagi data ke dalam recent period dan prior period.
    """
    from datetime import date, datetime, timedelta
    from sqlalchemy import func
    
    # Ambil tanggal referensi transaksi terakhir
    latest_datetime = db.query(func.max(Transaction.created_at)).scalar()
    ref_date = latest_datetime.date() if latest_datetime else date.today()

    # Masa days hari penuh termasuk hari ini/ref_date
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

    # Bagi menjadi dua bagian: recent dan prior
    recent_count = (days + 1) // 2
    prior_count = days - recent_count

    # Prior: dari days-1 s/d recent_count
    sales_prior_list = []
    for i in range(days - 1, recent_count - 1, -1):
        day = ref_date - timedelta(days=i)
        sales_prior_list.append(sales_map.get(day, 0))

    # Recent: dari recent_count-1 s/d 0
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
    
    # 1. Ambil data penjualan historis
    payload = get_product_insights_data(db, product, days=days)
    
    # 2. Kalkulasi metrik dasar
    metrics = InventoryEngine.calculate_metrics(
        product_name=payload["product_name"],
        current_stock=payload["current_stock"],
        sales_recent_7d=payload["sales_recent_7d"],
        sales_prior_7d=payload["sales_prior_7d"]
    )
    
    # 3. Tentukan tanggal referensi (ref_date)
    latest_datetime = db.query(func.max(Transaction.created_at)).scalar()
    ref_date = latest_datetime.date() if latest_datetime else date.today()
    
    # 4. Deteksi apakah produk baru masuk (oldest stock movement dalam 7 hari terakhir)
    first_movement_time = db.query(func.min(StockMovement.created_at)).filter(StockMovement.product_id == product.id).scalar()
    is_new_product = False
    if first_movement_time:
        if ref_date - first_movement_time.date() <= timedelta(days=7):
            is_new_product = True
    else:
        is_new_product = True
        
    # 5. Deteksi masa kedaluwarsa
    days_to_expiry = None
    is_expiry_near = False
    is_expiry_far = True
    
    if product.expiry_date:
        days_to_expiry = (product.expiry_date - ref_date).days
        if days_to_expiry <= 30:
            is_expiry_near = True
            is_expiry_far = False
            
    # 6. Override status dan rekomendasi jika status awal adalah Kuning (Dead Stock) atau jika mendekati kedaluwarsa
    status = metrics.status
    ai_output = None
    
    if is_expiry_near:
        # Jika mendekati tanggal kedaluwarsa, wajib diskon promo (Kuning)
        status = "Kuning"
        days_str = f"{days_to_expiry} hari lagi" if days_to_expiry >= 0 else "sudah kedaluwarsa"
        ai_output = {
            "action": "PROMO_DISKON",
            "recommendation": "Terapkan diskon cuci gudang sebesar 30% atau promo bundling beli 1 gratis 1.",
            "rationale": f"Produk mendekati tanggal kedaluwarsa ({days_str} pada {product.expiry_date.strftime('%Y-%m-%d')}). Diperlukan diskon untuk menghabiskan stok secepatnya."
        }
    elif status == "Kuning" and (is_new_product or is_expiry_far):
        # Penjualan lambat tetapi exp masih jauh atau produk baru -> pertahankan Hijau
        status = "Hijau"
        if is_new_product:
            rationale_text = "Produk baru masuk sehingga fluktuasi awal penjualan wajar dan belum memerlukan tindakan promosi diskon."
        else:
            rationale_text = "Masa kedaluwarsa produk masih lama (atau tidak diatur), sehingga tidak ada desakan untuk melakukan cuci gudang melalui diskon."
            
        ai_output = {
            "action": "MONITORING_RUTIN",
            "recommendation": "Lanjutkan pemantauan penjualan rutin dan jaga ketersediaan stok standar.",
            "rationale": rationale_text
        }
    else:
        ai_output = get_llm_recommendation(metrics.prompt_payload, metrics.status)
        
    # 7. Ambil original days of inventory dan terapkan batas (cap) agar tidak melebihi days_to_expiry
    original_doi = metrics.days_of_inventory
    capped_doi = original_doi
    
    if days_to_expiry is not None:
        # Capping: Days of inventory tidak boleh melebihi sisa hari kedaluwarsa
        # Jika sisa hari kedaluwarsa sudah minus (kedaluwarsa), maka sellable days of inventory adalah 0
        limit_days = max(0, days_to_expiry)
        if original_doi > limit_days:
            capped_doi = float(limit_days)
            
    # Perbarui objek metrics jika status atau days_of_inventory berubah
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
    """
    Menjalankan inferensi dari fine-tuned model lokal.
    Memiliki fallback berbasis rule jika runtime berjalan di lingkungan CPU/tanpa GPU atau adapter tidak ada.
    """
    global llm_pipeline

    # Fallback deterministic jika adapter belum di-load / mode demo cepat
    if not os.path.exists(ADAPTER_PATH):
        if status == "Merah":
            return {
                "action": "RESTOCK_URGENT",
                "recommendation": "Terbitkan purchase order (PO) darurat ke supplier utama hari ini.",
                "rationale": "Sisa stok kritis berada di bawah batas aman operasional dengan permintaan aktif."
            }
        elif status == "Kuning":
            return {
                "action": "PROMO_DISKON",
                "recommendation": "Terapkan diskon bundling 20% atau relokasi barang ke rak display kasir.",
                "rationale": "Terjadi penurunan penjualan signifikan dalam 7 hari terakhir dengan persediaan menumpuk."
            }
        else:
            return {
                "action": "PERTAHANKAN_STOK",
                "recommendation": "Pertahankan siklus replenishment reguler sesuai jadwal mingguan.",
                "rationale": "Tingkat perputaran barang dan persediaan berada pada batas optimal."
            }

    # Inisialisasi model lokal saat pertama kali dipanggil
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
            # Fallback jika library gagal dimuat atau gagal inisialisasi model (misal memori habis)
            print(f"Warning: Gagal memuat fine-tuned model local ({e}). Menggunakan fallback rules.")
            if status == "Merah":
                return {
                    "action": "RESTOCK_URGENT",
                    "recommendation": "Terbitkan purchase order (PO) darurat ke supplier utama hari ini.",
                    "rationale": "Sisa stok kritis berada di bawah batas aman operasional dengan permintaan aktif."
                }
            elif status == "Kuning":
                return {
                    "action": "PROMO_DISKON",
                    "recommendation": "Terapkan diskon bundling 20% atau relokasi barang ke rak display kasir.",
                    "rationale": "Terjadi penurunan penjualan signifikan dalam 7 hari terakhir dengan persediaan menumpuk."
                }
            else:
                return {
                    "action": "PERTAHANKAN_STOK",
                    "recommendation": "Pertahankan siklus replenishment reguler sesuai jadwal mingguan.",
                    "rationale": "Tingkat perputaran barang dan persediaan berada pada batas optimal."
                }

    tokenizer, model = llm_pipeline
    messages = [
        {"role": "system", "content": "Kamu adalah POS Inventory Assistant. Berikan output JSON valid dengan key: action, recommendation, dan rationale."},
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
        return json.loads(response_text)
    except Exception:
        return {"action": "EVALUASI_MANUAL", "recommendation": response_text, "rationale": "Parsed from raw model output."}


# ==============================================================================
# SCHEMA DEFINITION (PYDANTIC)
# ==============================================================================

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


# ==============================================================================
# ENDPOINTS
# ==============================================================================

@router.get("/api/mock/scenarios")
def get_available_scenarios(
    days: int = Query(14, ge=7),
    db: Session = Depends(get_db)
):
    """Mengembalikan daftar skenario mock data yang tersedia untuk panitia."""
    scenarios_list = []
    available_keys = []
    
    # 1. Load mock data if it exists
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
            
    # 2. Load database products
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
                "description": f"Kategori: {p.category or 'Umum'} | Stok Saat Ini: {p.stock} pcs | Indikasi: {metrics.status}",
                "category": p.category or "Umum"
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

        # Kalkulasi metrik deterministik
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
