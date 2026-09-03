// 해외직구매(계약단가×1box당중량×총박스수량×달러구매가) 입력 방식이 허용되는 제품명.
// "쭈꾸미"가 표준 표기이나 "주꾸미"로 표기되는 경우도 많아 둘 다 허용한다.

export const OVERSEAS_PURCHASE_PRODUCT_NAMES = ["쭈꾸미", "주꾸미"];

export function isOverseasPurchaseEligible(productName: string | null | undefined): boolean {
  if (!productName) return false;
  return OVERSEAS_PURCHASE_PRODUCT_NAMES.includes(productName.trim());
}
