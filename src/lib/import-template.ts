// 엑셀/CSV 일괄 업로드 템플릿의 컬럼 정의.
// 템플릿 생성(route.ts)과 업로드 파싱(actions.ts)이 이 정의를 공유한다.

export type ImportField =
  | "category"
  | "supplier"
  | "product_name"
  | "origin"
  | "spec"
  | "size"
  | "grade"
  | "purchase_price"
  | "purchase_weight"
  | "yield_rate"
  | "status";

export interface ImportColumn {
  header: string;
  field: ImportField;
  required: boolean;
  example: string | number;
}

export const IMPORT_COLUMNS: ImportColumn[] = [
  { header: "카테고리", field: "category", required: true, example: "수산물" },
  { header: "거래처", field: "supplier", required: true, example: "아토무역" },
  { header: "제품명", field: "product_name", required: true, example: "주꾸미" },
  { header: "원산지", field: "origin", required: false, example: "베트남" },
  { header: "특성/제품명", field: "spec", required: false, example: "원스킨/절단" },
  { header: "사이즈", field: "size", required: false, example: "M" },
  { header: "등급", field: "grade", required: false, example: "A" },
  { header: "매입가(원)", field: "purchase_price", required: true, example: 50000 },
  { header: "매입중량(g)", field: "purchase_weight", required: true, example: 10000 },
  { header: "수율_보존율(%)", field: "yield_rate", required: false, example: 80 },
  { header: "거래상태", field: "status", required: false, example: "거래중" },
];

export interface ParsedImportRow {
  rowNumber: number; // 엑셀 상 실제 행 번호 (헤더 제외, 1부터 시작하는 데이터 행 번호 아님 — 시트의 행 번호)
  category: string;
  supplier: string;
  product_name: string;
  origin: string;
  spec: string;
  size: string;
  grade: string;
  purchase_price: string;
  purchase_weight: string;
  yield_rate: string;
  status: string;
  errors: string[];
}

export interface ValidatedImportRow {
  rowNumber: number;
  category_name: string;
  supplier_name: string;
  product_name: string;
  origin: string | null;
  spec: string | null;
  size: string | null;
  grade: string | null;
  purchase_price: number;
  purchase_weight: number;
  yield_rate: number | null;
  status: "거래중" | "거래중단";
}

export function validateRow(
  raw: ParsedImportRow,
  validCategoryNames: Set<string>
): { ok: true; row: ValidatedImportRow } | { ok: false; errors: string[] } {
  const errors: string[] = [];

  const category = raw.category.trim();
  const supplier = raw.supplier.trim();
  const productName = raw.product_name.trim();

  if (!category) errors.push("카테고리 누락");
  else if (!validCategoryNames.has(category))
    errors.push(`카테고리 '${category}' 는 존재하지 않는 카테고리입니다`);

  if (!supplier) errors.push("거래처 누락");
  if (!productName) errors.push("제품명 누락");

  const purchasePrice = Number(raw.purchase_price);
  if (raw.purchase_price.trim() === "" || Number.isNaN(purchasePrice) || purchasePrice < 0)
    errors.push("매입가가 올바른 숫자가 아닙니다");

  const purchaseWeight = Number(raw.purchase_weight);
  if (raw.purchase_weight.trim() === "" || Number.isNaN(purchaseWeight) || purchaseWeight <= 0)
    errors.push("매입중량이 올바른 숫자가 아닙니다");

  let yieldRate: number | null = null;
  if (raw.yield_rate.trim() !== "") {
    yieldRate = Number(raw.yield_rate);
    if (Number.isNaN(yieldRate) || yieldRate <= 0 || yieldRate > 100)
      errors.push("수율/보존율은 0~100 사이 숫자여야 합니다");
  }

  const status = raw.status.trim() || "거래중";
  if (status !== "거래중" && status !== "거래중단")
    errors.push("거래상태는 '거래중' 또는 '거래중단' 이어야 합니다");

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    row: {
      rowNumber: raw.rowNumber,
      category_name: category,
      supplier_name: supplier,
      product_name: productName,
      origin: raw.origin.trim() || null,
      spec: raw.spec.trim() || null,
      size: raw.size.trim() || null,
      grade: raw.grade.trim() || null,
      purchase_price: purchasePrice,
      purchase_weight: purchaseWeight,
      yield_rate: yieldRate,
      status: status as "거래중" | "거래중단",
    },
  };
}
