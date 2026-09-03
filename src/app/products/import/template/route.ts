import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IMPORT_COLUMNS, type ImportField } from "@/lib/import-template";
import { buildCsv } from "@/lib/csv";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: categories } = await supabase
    .from("categories")
    .select("name")
    .order("sort_order");

  const header = IMPORT_COLUMNS.map((c) => c.header);
  const example = IMPORT_COLUMNS.map((c) => c.example);

  const overseasExampleValues: Partial<Record<ImportField, string | number>> = {
    category: "수산물",
    supplier: "글로벌해산",
    product_name: "쭈꾸미",
    origin: "베트남",
    purchase_type: "해외직구매",
    contract_unit_price: 2.5,
    box_weight: 10000,
    box_count: 20,
    usd_exchange_rate: 1350,
    status: "거래중",
  };
  const overseasExample = IMPORT_COLUMNS.map((c) => overseasExampleValues[c.field] ?? "");

  const guideRow = [
    "# 위 예시 행(주꾸미/쭈꾸미)은 실제 업로드 전에 삭제하거나 값을 덮어써 주세요.",
    `# 사용 가능한 카테고리: ${(categories ?? []).map((c) => c.name).join(" / ")}`,
    "# 거래상태: 거래중 / 거래중단 (미입력 시 거래중)",
    "# 거래처는 기존 이름과 다르면 새로 자동 등록됩니다. 이 안내 행(#으로 시작)은 업로드 시 자동으로 무시됩니다.",
    "# 구매유형: 국내구매(기본값) / 해외직구매. 해외직구매는 제품명이 '쭈꾸미' 또는 '주꾸미'인 행만 가능합니다.",
    "# 해외직구매 행은 매입가/매입중량을 비워두고 계약단가·1box당중량·총박스수량·달러구매가만 입력하면",
    "#   매입가/매입중량이 자동 계산됩니다 (두 번째 예시 행 참고).",
  ];

  const csv = buildCsv([header, example, overseasExample, ...guideRow.map((g) => [g])]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wonmul_upload_template.csv"',
    },
  });
}
