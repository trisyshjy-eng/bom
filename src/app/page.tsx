import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatKRW, formatUnitCost } from "@/lib/calc";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: products }, { data: recentHistory }] = await Promise.all([
    supabase.from("products").select("*, category:categories(*)"),
    supabase
      .from("price_history")
      .select("*, product:products(id, product_name)")
      .order("changed_date", { ascending: false })
      .limit(50),
  ]);

  const allProducts = products ?? [];
  const totalCount = allProducts.length;
  const activeCount = allProducts.filter((p) => p.status === "거래중").length;
  const inactiveCount = totalCount - activeCount;

  const categoryCounts = new Map<string, number>();
  allProducts.forEach((p) => {
    const name = p.category?.name ?? "미분류";
    categoryCounts.set(name, (categoryCounts.get(name) ?? 0) + 1);
  });

  const topMovers = [...(recentHistory ?? [])]
    .filter((h) => h.price_diff !== null)
    .sort((a, b) => Math.abs(b.price_diff as number) - Math.abs(a.price_diff as number))
    .slice(0, 5);

  const recentUpdated = [...allProducts]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-xl font-semibold text-neutral-900">대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="전체 제품 수" value={`${totalCount}건`} />
        <SummaryCard label="거래중" value={`${activeCount}건`} />
        <SummaryCard label="거래중단" value={`${inactiveCount}건`} />
        <SummaryCard label="카테고리 수" value={`${categoryCounts.size}개`} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">카테고리별 제품 수</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-4 grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...categoryCounts.entries()].map(([name, count]) => (
            <div key={name}>
              <div className="text-xs text-neutral-500">{name}</div>
              <div className="text-lg font-semibold text-neutral-900">{count}건</div>
            </div>
          ))}
          {categoryCounts.size === 0 && (
            <div className="text-sm text-neutral-400">등록된 제품이 없습니다.</div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">최근 단가 변동 Top 5</h2>
          <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
            {topMovers.length === 0 && (
              <p className="px-4 py-6 text-sm text-neutral-400">최근 단가 변동 이력이 없습니다.</p>
            )}
            {topMovers.map((h) => (
              <Link
                key={h.id}
                href={`/products/${h.product_id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <div className="text-sm font-medium text-neutral-900">
                    {h.product?.product_name ?? "-"}
                  </div>
                  <div className="text-xs text-neutral-400">{h.changed_date}</div>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    (h.price_diff ?? 0) > 0 ? "text-red-600" : "text-blue-600"
                  }`}
                >
                  {(h.price_diff ?? 0) > 0 ? "+" : ""}
                  {formatKRW(h.price_diff)} 원
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900">최근 업데이트된 제품</h2>
          <div className="rounded-lg border border-neutral-200 bg-white divide-y divide-neutral-100">
            {recentUpdated.length === 0 && (
              <p className="px-4 py-6 text-sm text-neutral-400">등록된 제품이 없습니다.</p>
            )}
            {recentUpdated.map((p) => (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-neutral-50"
              >
                <div>
                  <div className="text-sm font-medium text-neutral-900">{p.product_name}</div>
                  <div className="text-xs text-neutral-400">
                    {p.category?.name} · {new Date(p.updated_at).toLocaleDateString("ko-KR")}
                  </div>
                </div>
                <div className="text-sm text-neutral-600">
                  {formatUnitCost(p.unit_cost_per_100g)} 원/100g
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-2xl font-semibold text-neutral-900 mt-1">{value}</div>
    </div>
  );
}
