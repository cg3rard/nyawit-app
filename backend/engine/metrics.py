"""
engine/metrics.py
Module for calculating statistical inventory metrics and deterministic status classification.
"""

from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional

@dataclass(frozen=True)
class InventoryMetrics:
    product_name: str
    current_stock: int
    sma_7: float
    sma_prior: float
    trend_pct: float
    days_of_inventory: float
    status: str
    prompt_payload: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class InventoryEngine:
    """
    Deterministic rule engine calculating moving averages, sales trend,
    days of inventory (DOI), and threshold-based risk classification.
    """

    RED_DOI_CRITICAL = 3.0
    RED_DOI_ELEVATED = 7.0
    YELLOW_TREND_DROP = -25.0
    YELLOW_DOI_MIN = 21.0
    EPSILON = 0.01

    @classmethod
    def calculate_metrics(
        cls,
        product_name: str,
        current_stock: int,
        sales_recent_7d: List[int],
        sales_prior_7d: List[int]
    ) -> InventoryMetrics:
        """
        Calculates inventory metrics from 14 days of POS history.

        Args:
            product_name: Name/SKU of the item.
            current_stock: Remaining stock quantity.
            sales_recent_7d: Daily unit sales for the most recent 7 days (index 0 = oldest, 6 = today).
            sales_prior_7d: Daily unit sales for the prior 7-day comparison baseline.

        Returns:
            InventoryMetrics dataclass containing calculated numbers, status, and LLM-ready prompt.
        """
        if len(sales_recent_7d) == 0 or len(sales_prior_7d) == 0:
            raise ValueError("Both sales_recent_7d and sales_prior_7d must contain at least 1 record.")

        sma_7 = sum(sales_recent_7d) / float(len(sales_recent_7d))
        sma_prior = sum(sales_prior_7d) / float(len(sales_prior_7d))

        if sma_prior == 0.0:
            trend_pct = 100.0 if sma_7 > 0 else 0.0
        else:
            trend_pct = ((sma_7 - sma_prior) / sma_prior) * 100.0

        if sma_7 == 0.0:
            doi = 999.0 if current_stock > 0 else 0.0
        else:
            doi = current_stock / max(sma_7, cls.EPSILON)

        status = cls._classify_status(
            stock=current_stock,
            sma_7=sma_7,
            trend_pct=trend_pct,
            doi=doi
        )

        prompt_payload = (
            f"Produk: {product_name} | Status: {status} | Stok: {current_stock} pcs | "
            f"SMA_7: {sma_7:.1f} pcs/hari | Trend: {trend_pct:+.1f}% | DOI: {doi:.1f} hari"
        )

        return InventoryMetrics(
            product_name=product_name,
            current_stock=current_stock,
            sma_7=round(sma_7, 2),
            sma_prior=round(sma_prior, 2),
            trend_pct=round(trend_pct, 1),
            days_of_inventory=round(doi, 1),
            status=status,
            prompt_payload=prompt_payload
        )

    @classmethod
    def _classify_status(
        cls,
        stock: int,
        sma_7: float,
        trend_pct: float,
        doi: float
    ) -> str:
        """Evaluates boundary rules and assigns Green, Yellow, or Red status."""
        if stock == 0 or doi <= cls.RED_DOI_CRITICAL:
            return "Merah"
        if doi <= cls.RED_DOI_ELEVATED and trend_pct >= 0.0:
            return "Merah"

        if (trend_pct <= cls.YELLOW_TREND_DROP and doi >= cls.YELLOW_DOI_MIN) or (sma_7 == 0.0 and stock > 0):
            return "Kuning"

        return "Hijau"

if __name__ == "__main__":
    test_cases = [
        {
            "name": "Scenario 1: Kopi Tubruk 200g (Restock / Red)",
            "product_name": "Kopi Tubruk 200g",
            "current_stock": 5,
            "recent_7d": [8, 9, 7, 10, 8, 9, 8],
            "prior_7d": [5, 4, 6, 5, 5, 6, 5]
        },
        {
            "name": "Scenario 2: Minyak Goreng 2L (Dead Stock / Yellow)",
            "product_name": "Minyak Goreng 2L",
            "current_stock": 140,
            "recent_7d": [1, 0, 1, 0, 1, 0, 1],
            "prior_7d": [6, 7, 5, 6, 7, 6, 8]
        },
        {
            "name": "Scenario 3: Sabun Mandi 100g (Balanced / Green)",
            "product_name": "Sabun Mandi 100g",
            "current_stock": 45,
            "recent_7d": [3, 4, 3, 4, 3, 4, 3],
            "prior_7d": [3, 3, 4, 3, 3, 4, 3]
        }
    ]

    print("=== RUNNING INVENTORY ENGINE VERIFICATION ===\n")
    for case in test_cases:
        result = InventoryEngine.calculate_metrics(
            product_name=case["product_name"],
            current_stock=case["current_stock"],
            sales_recent_7d=case["recent_7d"],
            sales_prior_7d=case["prior_7d"]
        )
        print(f"[{case['name']}]")
        print(f"  Status    : {result.status}")
        print(f"  SMA_7     : {result.sma_7} pcs/day (Prior: {result.sma_prior})")
        print(f"  Trend     : {result.trend_pct}%")
        print(f"  DOI       : {result.days_of_inventory} days")
        print(f"  LLM Prompt: {result.prompt_payload}\n")