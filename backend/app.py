import json
import os
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from engine.metrics import InventoryEngine, InventoryMetrics

app = FastAPI(
    title="POS Inventory AI Backend",
    description="Engine inferensi otomatis untuk deteksi restock dan dead stock berbasis moving average dan fine-tuned LLM.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MOCK_DATA_PATH = "mock_data.json"
ADAPTER_PATH = "./lora_inventory_adapter"
BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"

llm_pipeline = None

def get_llm_recommendation(prompt_payload: str, status: str) -> Dict[str, str]:
    """
    Menjalankan inferensi dari fine-tuned model lokal.
    Memiliki fallback berbasis rule jika runtime berjalan di lingkungan CPU/tanpa GPU.
    """
    global llm_pipeline

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

    if llm_pipeline is None:
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

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "POS Inventory AI Core Inference",
        "mock_mode_available": os.path.exists(MOCK_DATA_PATH)
    }

@app.get("/api/mock/scenarios")
def get_available_scenarios():
    """Mengembalikan daftar skenario mock data yang tersedia untuk panitia."""
    if not os.path.exists(MOCK_DATA_PATH):
        raise HTTPException(status_code=404, detail="File mock_data.json tidak ditemukan.")
    
    with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    scenarios = data.get("scenarios", {})
    return {
        "available_keys": list(scenarios.keys()),
        "scenarios": [
            {
                "key": k,
                "id": v.get("scenario_id"),
                "name": v.get("scenario_name"),
                "expected_status": v.get("expected_status"),
                "description": v.get("description")
            }
            for k, v in scenarios.items()
        ]
    }

@app.post("/api/mock/simulate", response_model=EvaluationResponse)
def simulate_mock_scenario(
    scenario: str = Query(..., description="Key skenario: 'red_risk', 'yellow_risk', atau 'green_safe'")
):
    """
    Endpoint khusus panitia untuk melakukan cross-checking tanpa input hardware.
    Menerima key preset skenario dan langsung menjalankan inferensi penuh.
    """
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

    return EvaluationResponse(
        product_name=metrics.product_name,
        status=metrics.status,
        metrics={
            "current_stock": metrics.current_stock,
            "sma_7_daily": metrics.sma_7,
            "sma_prior_daily": metrics.sma_prior,
            "sales_trend_pct": f"{metrics.trend_pct:+}%",
            "days_of_inventory": metrics.days_of_inventory
        },
        prompt_used=metrics.prompt_payload,
        ai_recommendation=ai_output
    )

@app.post("/api/inventory/evaluate", response_model=EvaluationResponse)
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
            "days_of_inventory": metrics.days_of_inventory
        },
        prompt_used=metrics.prompt_payload,
        ai_recommendation=ai_output
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)