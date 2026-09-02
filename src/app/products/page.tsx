import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKRW, formatUnitCost } from "@/lib/calc";

interface SearchParams {
  category?: string;
  supplier?: string;
  q?: string;
  origin?: string;
  grade?: string;
  status?: string;
  sort?: string;
  recentDays?: string;
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
  if (sp.recentDays) {
    const since = new Date();
    since.setDate(since.getDate() - Number(sp.recentDays));
    query = query.gte("updated_at", since.toISOString());
  }

  if (sp.sort === "unit_cost_asc") {
    query = query.order("unit_cost_per_100g", { ascending: true, nullsFirst: false });
  } else if (sp.sort === "unit_cost_desc") {
    query = query.order("unit_cost_per_100g", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  const { data: products } = await query;

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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
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
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left text-neutral-500">
              <th className="px-4 py-2 font-medium">제품명</th>
              <th className="px-4 py-2 font-medium">카테고리</th>
              <th className="px-4 py-2 font-medium">거래처</th>
              <th className="px-4 py-2 font-medium">원산지</th>
              <th className="px-4 py-2 font-medium">등급</th>
              <th className="px-4 py-2 font-medium text-right">100g당 원가</th>
              <th className="px-4 py-2 font-medium">상태</th>
              <th className="px-4 py-2 font-medium">업데이트</th>
            </tr>
          </thead>
          <tbody>
            {(products ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-neutral-400">
                  조건에 맞는 원물/제품이 없습니다.
                </td>
              </tr>
            )}
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-2">
                  <Link href={`/products/${p.id}`} className="font-medium text-neutral-900 hover:underline">
                    {p.product_name}
                  </Link>
                </td>
                <td className="px-4 py-2 text-neutral-600">{p.category?.name ?? "-"}</td>
                <td className="px-4 py-2 text-neutral-600">{p.supplier?.name ?? "-"}</td>
                <td className="px-4 py-2 text-neutral-600">{p.origin ?? "-"}</td>
                <td className="px-4 py-2 text-neutral-600">{p.grade ?? "-"}</td>
                <td className="px-4 py-2 text-right font-medium">{formatUnitCost(p.unit_cost_per_100g)} 원</td>
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
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-neutral-400">
        금액은 {formatKRW(0)} 형식(천단위 콤마), 100g당 원가는 소수점 둘째 자리까지 표기됩니다.
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
