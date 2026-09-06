// DB의 generated column과 동일한 로직을 프론트 실시간 미리보기용으로 재현한다.
// 실제 저장 값은 서버(DB)에서 재계산되므로 이 함수는 미리보기 전용이다.

export function calcPreservedWeight(
  purchaseWeight: number,
  yieldRate: number | null
): number {
  if (yieldRate === null || Number.isNaN(yieldRate)) return purchaseWeight;
  return Math.round(purchaseWeight * (yieldRate / 100) * 100) / 100;
}

export function calcUnitCostPer100g(
  purchasePrice: number,
  purchaseWeight: number,
  yieldRate: number | null
): number | null {
  const preservedWeight = calcPreservedWeight(purchaseWeight, yieldRate);
  if (!preservedWeight) return null;
  return Math.round((purchasePrice / preservedWeight) * 100 * 100) / 100;
}

// 쭈꾸미 해외직구매 전용: 계약단가 × 1box당중량 × 총박스수량 × 달러구매가(환율)
export function calcOverseasTotalPrice(
  contractUnitPrice: number,
  boxWeight: number,
  boxCount: number,
  usdExchangeRate: number
): number {
  return Math.round(contractUnitPrice * boxWeight * boxCount * usdExchangeRate * 100) / 100;
}

export function calcOverseasTotalWeight(boxWeight: number, boxCount: number): number {
  return Math.round(boxWeight * boxCount * 100) / 100;
}

// 총구매가격(원) ÷ 박스수량 = 1box당 매입가(원)
export function calcUnitPriceFromTotal(totalPrice: number, boxQuantity: number): number {
  return Math.round((totalPrice / boxQuantity) * 100) / 100;
}

// 매입가는 1box 기준 단가이므로 박스수량을 곱해 총매입가를 계산한다 (박스수량 미입력 시 매입가와 동일).
export function calcTotalPurchasePrice(
  purchasePrice: number,
  boxQuantity: number | null
): number {
  const qty = boxQuantity === null || Number.isNaN(boxQuantity) || boxQuantity <= 0 ? 1 : boxQuantity;
  return Math.round(purchasePrice * qty * 100) / 100;
}

export function calcPriceDiff(
  changedPrice: number,
  previousPrice: number | null
): number | null {
  if (previousPrice === null || Number.isNaN(previousPrice)) return null;
  return Math.round((changedPrice - previousPrice) * 100) / 100;
}

export function formatKRW(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return new Intl.NumberFormat("ko-KR").format(value);
}

export function formatUnitCost(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return value.toFixed(2);
}

export function formatSignedKRW(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value === 0) return formatKRW(0);
  const formatted = formatKRW(Math.abs(value));
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

export function formatSignedUnitCost(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  if (value === 0) return formatUnitCost(0);
  const formatted = formatUnitCost(Math.abs(value));
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}
