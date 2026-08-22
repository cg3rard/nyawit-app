import json
import os
import sys
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

from engine.metrics import InventoryEngine

MOCK_DATA_PATH = "mock_data.json"
BASE_MODEL_ID = "Qwen/Qwen2.5-1.5B-Instruct"
ADAPTER_PATH = "./lora_inventory_adapter"

def load_model_and_tokenizer():
    """Memuat tokenizer, base model, dan adapter LoRA hasil fine-tuning."""
    print("Memuat base model dan tokenizer...")
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_ID, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    device = "cuda" if torch.cuda.is_available() else "cpu"
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_ID,
        dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        device_map="auto" if torch.cuda.is_available() else None,
        trust_remote_code=True,
    )

    print(f"Memuat fine-tuned LoRA adapter dari {ADAPTER_PATH}...")
    model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    if device == "cpu":
        model.to("cpu")
    model.eval()

    return tokenizer, model

def run_llm_inference(tokenizer, model, prompt_payload: str) -> dict:
    """Menjalankan inferensi statis pada fine-tuned LLM untuk menghasilkan rekomendasi JSON."""
    messages = [
        {
            "role": "system",
            "content": (
                "Kamu adalah POS Inventory Assistant. Berikan output JSON valid "
                "dengan key: action, recommendation, dan rationale."
            ),
        },
        {"role": "user", "content": prompt_payload},
    ]

    prompt_text = tokenizer.apply_chat_template(
        messages, tokenize=False, add_generation_prompt=True
    )
    inputs = tokenizer([prompt_text], return_tensors="pt").to(model.device)

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=150,
            temperature=0.1,
            do_sample=False,
        )

    generated_ids = outputs[0][len(inputs.input_ids[0]) :]
    response_text = tokenizer.decode(generated_ids, skip_special_tokens=True).strip()

    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        return {"raw_output": response_text, "error": "Invalid JSON format"}

def run_mock_verification():
    if not os.path.exists(MOCK_DATA_PATH):
        print(f"Error: File '{MOCK_DATA_PATH}' tidak ditemukan!")
        sys.exit(1)

    if not os.path.exists(ADAPTER_PATH):
        print(f"Error: Folder adapter '{ADAPTER_PATH}' tidak ditemukan!")
        sys.exit(1)

    with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
        mock_config = json.load(f)

    scenarios = mock_config.get("scenarios", {})
    if not scenarios:
        print("Error: Tidak ada skenario di dalam mock_data.json.")
        sys.exit(1)

    tokenizer, model = load_model_and_tokenizer()

    print("\n" + "=" * 65)
    print("        MEMULAI VERIFIKASI MOCK DATA MODE (JUDGE PANEL)        ")
    print("=" * 65)

    all_passed = True

    for key, scenario in scenarios.items():
        sc_id = scenario.get("scenario_id")
        sc_name = scenario.get("scenario_name")
        payload = scenario.get("payload")
        expected_status = scenario.get("expected_status")

        print(f"\n▶ [{sc_id}] {sc_name}")
        print(f"  Deskripsi       : {scenario.get('description')}")
        print(f"  Produk Diuji    : {payload['product_name']} (Stok: {payload['current_stock']} pcs)")

        metrics = InventoryEngine.calculate_metrics(
            product_name=payload["product_name"],
            current_stock=payload["current_stock"],
            sales_recent_7d=payload["sales_recent_7d"],
            sales_prior_7d=payload["sales_prior_7d"],
        )

        status_match = metrics.status == expected_status
        status_flag = "PASSED" if status_match else "FAILED"
        if not status_match:
            all_passed = False

        print(f"  SMA 7 Hari      : {metrics.sma_7:.2f} pcs/hari")
        print(f"  Tren Penjualan  : {metrics.trend_pct:+.1f}%")
        print(f"  Days of Inv(DOI): {metrics.days_of_inventory:.1f} hari")
        print(f"  Status Terdeteksi: {metrics.status} [Ekspektasi: {expected_status}] -> {status_flag}")

        print("  Mengirim payload ke Fine-Tuned LLM...")
        ai_recommendation = run_llm_inference(tokenizer, model, metrics.prompt_payload)

        print("  Hasil Analisis AI:")
        print(f"    - Action        : {ai_recommendation.get('action')}")
        print(f"    - Rekomendasi   : {ai_recommendation.get('recommendation')}")
        print(f"    - Justifikasi   : {ai_recommendation.get('rationale')}")
        print("-" * 65)

    print("\n" + "=" * 65)
    if all_passed:
        print(" HASIL: SEMUA SKENARIO MOCK MODE BERHASIL TERVERIFIKASI (100%) ")
    else:
        print(" HASIL: TERDAPAT STATUS YANG TIDAK SESUAI DENGAN EKSPEKTASI ")
    print("=" * 65)

if __name__ == "__main__":
    run_mock_verification()