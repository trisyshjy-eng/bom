import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  calcUnitCostPer100g,
  formatKRW,
  formatUnitCost,
  formatSignedKRW,
  formatSignedUnitCost,
} from "@/lib/calc";
import type { PriceHistory } from "@/lib/types";
import { isOverseasPurchaseEligible } from "@/lib/overseas-purchase";

interface SearchParams {
  category?: string;
  supplier?: string;
  q?: string;
  origin?: string;
  grade?: string;
  status?: string;
  sort?: string;
  recentDays?: string;
  yieldMin?: string;
  yieldMax?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("suppliers").select("*").order("name"),
  ]);

  let query = supabase
    .from("products")
    .select("*, category:categories(*), supplier:suppliers(*)");

  if (sp.category) query = query.eq("category_id", sp.category);
  if (sp.supplier) query = query.eq("supplier_id", sp.supplier);
  if (sp.q) query = query.ilike("product_name", `%${sp.q}%`);
  if (sp.origin) query = query.ilike("origin", `%${sp.origin}%`);
  if (sp.grade) query = query.ilike("grade", `%${sp.grade}%`);
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.yieldMin) query = query.gte("yield_rate", Number(sp.yieldMin));
  if (sp.yieldMax) query = query.lte("yield_rate", Number(sp.yieldMax));
  if (sp.recentDays) {
    const since = new Date();
    since.setDate(since.getDate() - Number(sp.recentDays));
    query = query.gte("updated_at", since.toISOString());
  }

  switch (sp.sort) {
    case "unit_cost_asc":
      query = query.order("unit_cost_per_100g", { ascending: true, nullsFirst: false });
      break;
    case "unit_cost_desc":
      query = query.order("unit_cost_per_100g", { ascending: false, nullsFirst: false });
      break;
    case "origin_asc":
      query = query.order("origin", { ascending: true, nullsFirst: false });
      break;
    case "origin_desc":
      query = query.order("origin", { ascending: false, nullsFirst: false });
      break;
    case "grade_asc":
      query = query.order("grade", { ascending: true, nullsFirst: false });
      break;
    case "grade_desc":
      query = query.order("grade", { ascending: false, nullsFirst: false });
      break;
    case "yield_asc":
      query = query.order("yield_rate", { ascending: true, nullsFirst: false });
      break;
    case "yield_desc":
      query = query.order("yield_rate", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("updated_at", { ascending: false });
  }

  const { data: products } = await query;

  const productIds = (products ?? []).map((p) => p.id);
  const latestHistoryByProduct = new Map<
    string,
    Pick<PriceHistory, "previous_price" | "changed_price" | "price_diff" | "changed_date">
  >();
  if (productIds.length > 0) {
    const { data: histories } = await supabase
      .from("price_history")
      .select("product_id, previous_price, changed_price, price_diff, changed_date, created_at")
      .in("product_id", productIds)
      .order("changed_date", { ascending: false })
      .order("created_at", { ascending: false });

    for (const h of histories ?? []) {
      if (!latestHistoryByProduct.has(h.product_id)) {
        latestHistoryByProduct.set(h.product_id, h);
      }
    }
  }

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    Object.entries(merged).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return `/products${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="max-w-[1800px] mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-900">원물/제품 목록</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/products/import"
            className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
          >
            엑셀 업로드
          </Link>
          <Link
            href="/products/new"
            className="rounded-md bg-neutral-900 text-white text-sm font-medium px-4 py-2 hover:bg-neutral-800"
          >
            + 신규 등록
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
        <Link
          href={buildHref({ category: undefined })}
          className={`px-3 py-1.5 rounded-full text-sm ${
            !sp.category ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
          }`}
        >
          전체
        </Link>
        {(categories ?? []).map((c) => (
          <Link
            key={c.id}
            href={buildHref({ category: c.id })}
            className={`px-3 py-1.5 rounded-full text-sm ${
              sp.category === c.id ? "bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-600"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <form className="flex flex-wrap gap-3 items-end" action="/products" method="get">
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <FilterField label="제품명">
          <input name="q" defaultValue={sp.q ?? ""} className="filter-input" />
        </FilterField>
        <FilterField label="거래처">
          <select name="supplier" defaultValue={sp.supplier ?? ""} className="filter-input">
            <option value="">전체</option>
            {(suppliers ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="원산지">
          <input name="origin" defaultValue={sp.origin ?? ""} className="filter-input" />
        </FilterField>
        <FilterField label="등급">
          <input name="grade" defaultValue={sp.grade ?? ""} className="filter-input" />
        </FilterField>
        <FilterField label="수율(%)">
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              name="yieldMin"
              placeholder="최소"
              defaultValue={sp.yieldMin ?? ""}
              className="filter-input w-20"
            />
            <span className="text-neutral-400">~</span>
            <input
              type="number"
              step="0.01"
              name="yieldMax"
              placeholder="최대"
              defaultValue={sp.yieldMax ?? ""}
              className="filter-input w-20"
            />
          </div>
        </FilterField>
        <FilterField label="거래상태">
          <select name="status" defaultValue={sp.status ?? ""} className="filter-input">
            <option value="">전체</option>
            <option value="거래중">거래중</option>
            <option value="거래중단">거래중단</option>
          </select>
        </FilterField>
        <FilterField label="정렬">
          <select name="sort" defaultValue={sp.sort ?? ""} className="filter-input">
            <option value="">최근 업데이트순</option>
            <option value="unit_cost_asc">100g당 원가 낮은순</option>
            <option value="unit_cost_desc">100g당 원가 높은순</option>
            <option value="origin_asc">원산지 오름차순 (가나다)</option>
            <option value="origin_desc">원산지 내림차순</option>
            <option value="grade_asc">등급 오름차순 (가나다)</option>
            <option value="grade_desc">등급 내림차순</option>
            <option value="yield_asc">수율 낮은순</option>
            <option value="yield_desc">수율 높은순</option>
          </select>
        </FilterField>
        <FilterField label="최근 변동">
          <select name="recentDays" defaultValue={sp.recentDays ?? ""} className="filter-input">
            <option value="">전체 기간</option>
            <option value="7">최근 7일</option>
            <option value="30">최근 30일</option>
            <option value="90">최근 90일</option>
          </select>
        </FilterField>
        <button
          type="submit"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          필터 적용
        </button>
      </form>

      <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
        <table className="min-w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">제품명</th>
              <th className="px-4 py-2 font-medium">카테고리</th>
              <th className="px-4 py-2 font-medium">거래처</th>
              <th className="px-4 py-2 font-medium">원산지</th>
              <th className="px-4 py-2 font-medium">특성</th>
              <th className="px-4 py-2 font-medium">원물사이즈</th>
              <th className="px-4 py-2 font-medium">등급</th>
              <th className="px-4 py-2 font-medium">구매유형</th>
              <th className="px-4 py-2 font-medium text-right">매입가</th>
              <th className="px-4 py-2 font-medium text-right">매입중량</th>
              <th className="px-4 py-2 font-medium text-right">박스수량</th>
              <th className="px-4 py-2 font-medium text-right">총매입가</th>
              <th className="px-4 py-2 font-medium text-right">계약단가</th>
              <th className="px-4 py-2 font-medium text-right">1box당중량</th>
              <th className="px-4 py-2 font-medium text-right">총박스수량</th>
              <th className="px-4 py-2 font-medium text-right">달러구매가</th>
              <th className="px-4 py-2 font-medium text-right">수율</th>
              <th className="px-4 py-2 font-medium text-right">보존중량</th>
              <th className="px-4 py-2 font-medium text-right">100g당 원가</th>
              <th className="px-4 py-2 font-medium text-right">이전단가</th>
              <th className="px-4 py-2 font-medium text-right">변동단가</th>
              <th className="px-4 py-2 font-medium text-right">상승단가</th>
              <th className="px-4 py-2 font-medium text-right">변동차액</th>
              <th className="px-4 py-2 font-medium">입고일</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2 font-medium">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={26} className="px-4 py-10 text-center text-neutral-400">
                  조건에 맞는 원물/제품이 없습니다.
                </td>
              </tr>
            )}
            {(products ?? []).map((p) => {
              const history = latestHistoryByProduct.get(p.id);
              const previousUnitCost = history
                ? calcUnitCostPer100g(history.previous_price ?? 0, p.purchase_weight, p.yield_rate)
                : null;
              const currentUnitCost = p.unit_cost_per_100g;
              const unitCostRise =
                history && previousUnitCost !== null && currentUnitCost !== null
                  ? Math.round((currentUnitCost - previousUnitCost) * 100) / 100
                  : null;
              const priceDiff = history?.price_diff ?? null;

              return (
                <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                  <td className="px-4 py-2">
                    <Link href={`/products/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                      {p.product_name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-neutral-600">{p.category?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.supplier?.name ?? "-"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.origin ?? "-"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.spec ?? "-"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.size ?? "-"}</td>
                  <td className="px-4 py-2 text-neutral-600">{p.grade ?? "-"}</td>
                  <td className="px-4 py-2">
                    {isOverseasPurchaseEligible(p.product_name) ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.purchase_type === "해외직구매"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-neutral-100 text-neutral-600"
                        }`}
                      >
                        {p.purchase_type}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">{formatKRW(p.purchase_price)} 원</td>
                  <td className="px-4 py-2 text-right">{formatKRW(p.purchase_weight)} g</td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.purchase_type === "국내구매" ? formatKRW(p.box_quantity) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right font-medium">
                    {formatKRW(p.total_purchase_price)} 원
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.purchase_type === "해외직구매" ? formatUnitCost(p.contract_unit_price) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.purchase_type === "해외직구매" ? `${formatKRW(p.box_weight)} g` : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.purchase_type === "해외직구매" ? formatKRW(p.box_count) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {p.purchase_type === "해외직구매" ? formatUnitCost(p.usd_exchange_rate) : "-"}
                  </td>
                  <td className="px-4 py-2 text-right">{p.yield_rate !== null ? `${p.yield_rate}%` : "-"}</td>
                  <td className="px-4 py-2 text-right">{formatKRW(p.preserved_weight)} g</td>
                  <td className="px-4 py-2 text-right font-medium">{formatUnitCost(p.unit_cost_per_100g)} 원</td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {history ? `${formatUnitCost(previousUnitCost)} 원` : "-"}
                  </td>
                  <td className="px-4 py-2 text-right text-neutral-500">
                    {history ? `${formatUnitCost(currentUnitCost)} 원` : "-"}
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      unitCostRise !== null && unitCostRise > 0
                        ? "text-red-600"
                        : unitCostRise !== null && unitCostRise < 0
                          ? "text-blue-600"
                          : "text-neutral-500"
                    }`}
                  >
                    {formatSignedUnitCost(unitCostRise)} 원
                  </td>
                  <td
                    className={`px-4 py-2 text-right ${
                      priceDiff !== null && priceDiff > 0
                        ? "text-red-600"
                        : priceDiff !== null && priceDiff < 0
                          ? "text-blue-600"
                          : "text-neutral-500"
                    }`}
                  >
                    {formatSignedKRW(priceDiff)} 원
                  </td>
                  <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                    {history ? new Date(history.changed_date).toLocaleDateString("ko-KR") : "-"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "거래중"
                          ? "bg-green-100 text-green-700"
                          : "bg-neutral-200 text-neutral-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-500 whitespace-nowrap">
                    {new Date(p.updated_at).toLocaleDateString("ko-KR")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        금액은 {formatKRW(0)} 형식(천단위 콤마), 100g당 원가는 소수점 둘째 자리까지 표기됩니다. 이전단가/변동단가/상승단가는
        최근 매입가 변동 시점의 100g당 단가 기준이며, 변동차액은 매입가(원) 자체의 증감액입니다. 변동 이력이 없는 제품은
        &quot;-&quot;로 표시됩니다. 매입가는 1box 기준 단가이며, 총매입가는 매입가×박스수량으로 자동 계산됩니다(박스수량 미입력 시
        매입가와 동일). 쭈꾸미(주꾸미) 해외직구매의 경우 매입가/매입중량은 계약단가×1box당중량×총박스수량×달러구매가로
        자동 계산된 값입니다.
      </p>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-500">
      {label}
      {children}
    </label>
  );
}
