import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IMPORT_COLUMNS } from "@/lib/import-template";
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
  const guideRow = [
    "# 위 예시 행(주꾸미)은 실제 업로드 전에 삭제하거나 값을 덮어써 주세요.",
    `# 사용 가능한 카테고리: ${(categories ?? []).map((c) => c.name).join(" / ")}`,
    "# 거래상태: 거래중 / 거래중단 (미입력 시 거래중)",
    "# 거래처는 기존 이름과 다르면 새로 자동 등록됩니다. 이 안내 행(#으로 시작)은 업로드 시 자동으로 무시됩니다.",
  ];

  const csv = buildCsv([header, example, ...guideRow.map((g) => [g])]);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="wonmul_upload_template.csv"',
    },
  });
}
