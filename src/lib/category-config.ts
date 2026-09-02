// 카테고리별로 다른 라벨을 하나의 products 구조 위에서 렌더링하기 위한 설정.
// 구조(컬럼)는 동일하고, 화면 표시 라벨만 카테고리에 따라 바뀐다.

export interface CategoryFieldLabels {
  purchasePriceLabel: string;
  purchaseWeightLabel: string;
  yieldRateLabel: string;
  specLabel: string;
  showYieldRate: boolean;
}

const DEFAULT_LABELS: CategoryFieldLabels = {
  purchasePriceLabel: "매입가 (원)",
  purchaseWeightLabel: "매입중량 (g)",
  yieldRateLabel: "수율/보존율 (%)",
  specLabel: "특성/제품명",
  showYieldRate: true,
};

const CATEGORY_LABELS: Record<string, CategoryFieldLabels> = {
  수산물: {
    purchasePriceLabel: "1BOX 매입가 (원)",
    purchaseWeightLabel: "1BOX 매입중량 (g)",
    yieldRateLabel: "수율/보존율 (%)",
    specLabel: "특성/제품명",
    showYieldRate: true,
  },
  축산물: {
    purchasePriceLabel: "1BOX 매입가 (원)",
    purchaseWeightLabel: "1BOX 매입중량 (g)",
    yieldRateLabel: "수율/보존율 (%)",
    specLabel: "특성/제품명",
    showYieldRate: true,
  },
  "자체생산 소스류": {
    purchasePriceLabel: "원가 (총액, 원)",
    purchaseWeightLabel: "1회 생산량 (g)",
    yieldRateLabel: "수율/보존율 (%, 선택)",
    specLabel: "제품명 상세",
    showYieldRate: false,
  },
  "매입 소스류": {
    purchasePriceLabel: "매입가 (원)",
    purchaseWeightLabel: "매입중량 (g)",
    yieldRateLabel: "수율 (%, 선택)",
    specLabel: "판매 세부사항",
    showYieldRate: false,
  },
  기타가공제품: {
    purchasePriceLabel: "매입가 (원)",
    purchaseWeightLabel: "매입중량 (g)",
    yieldRateLabel: "수율/보존율 (%, 선택)",
    specLabel: "특성/제품명",
    showYieldRate: false,
  },
};

export function getCategoryLabels(categoryName: string | null | undefined): CategoryFieldLabels {
  if (!categoryName) return DEFAULT_LABELS;
  return CATEGORY_LABELS[categoryName] ?? DEFAULT_LABELS;
}
