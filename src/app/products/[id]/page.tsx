import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCategoryLabels } from "@/lib/category-config";
import { formatKRW, formatUnitCost } from "@/lib/calc";
import { isOverseasPurchaseEligible } from "@/lib/overseas-purchase";
import PriceHistoryChart from "./PriceHistoryChart";
import NoteCell from "./NoteCell";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: product } = await supabase
    .from("products")
    .select("*, category:categories(*), supplier:suppliers(*)")
    .eq("id", id)
    .maybeSingle();

  if (!product) notFound();

  const { data: history } = await supabase
    .from("price_history")
    .select("*")
    .eq("product_id", id)
    .order("changed_date", { ascending: false })
    .order("created_at", { ascending: false });

  const labels = getCategoryLabels(product.category?.name);
  const historyRows = history ?? [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        ← 목록으로
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-neutral-500">{product.category?.name ?? "-"}</div>
          <h1 className="text-2xl font-semibold text-neutral-900">{product.product_name}</h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-neutral-500">
            <span>{product.supplier?.name ?? "-"}</span>
            <span
              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                product.status === "거래중"
                  ? "bg-green-100 text-green-700"
                  : "bg-neutral-200 text-neutral-600"
              }`}
            >
              {product.status}
            </span>
          </div>
        </div>
        <Link
          href={`/products/${product.id}/edit`}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          수정
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoItem label="원산지" value={product.origin ?? "-"} />
        <InfoItem label={labels.specLabel} value={product.spec ?? "-"} />
        <InfoItem label="사이즈" value={product.size ?? "-"} />
        <InfoItem label="등급" value={product.grade ?? "-"} />
      </div>

      {isOverseasPurchaseEligible(product.product_name) && (
        <div className="rounded-lg border border-neutral-200 bg-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <InfoItem label="구매유형" value={product.purchase_type} />
          {product.purchase_type === "해외직구매" && (
            <>
              <InfoItem label="계약단가" value={formatUnitCost(product.contract_unit_price)} />
              <InfoItem label="1box당 중량" value={`${formatKRW(product.box_weight)} g`} />
              <InfoItem label="총박스수량" value={formatKRW(product.box_count)} />
              <InfoItem label="달러구매가" value={formatUnitCost(product.usd_exchange_rate)} />
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border border-neutral-200 bg-white p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <InfoItem label={labels.purchasePriceLabel} value={`${formatKRW(product.purchase_price)} 원`} />
        <InfoItem label={labels.purchaseWeightLabel} value={`${formatKRW(product.purchase_weight)} g`} />
        {product.purchase_type === "국내구매" && (
          <InfoItem label="박스수량" value={product.box_quantity !== null ? formatKRW(product.box_quantity) : "1(기본값)"} />
        )}
        <InfoItem
          label="총매입가"
          value={`${formatKRW(product.total_purchase_price)} 원`}
          highlight
        />
        <InfoItem
          label={labels.yieldRateLabel}
          value={product.yield_rate !== null ? `${product.yield_rate}%` : "-"}
        />
        <InfoItem label="보존중량" value={`${formatKRW(product.preserved_weight)} g`} />
        <InfoItem
          label="100g당 원가"
          value={`${formatUnitCost(product.unit_cost_per_100g)} 원`}
          highlight
        />
        <InfoItem label="최종작성자" value={product.last_editor ?? "-"} />
        <InfoItem label="업데이트 일자" value={new Date(product.updated_at).toLocaleString("ko-KR")} />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">단가 추이</h2>
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <PriceHistoryChart
            history={historyRows}
            currentUnitCost={product.unit_cost_per_100g}
            currentDate={product.updated_at.slice(0, 10)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-neutral-900">단가 변동 이력</h2>
        <div className="rounded-lg border border-neutral-200 bg-white overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500">
                <th className="px-4 py-2 font-medium">변동일</th>
                <th className="px-4 py-2 font-medium">이전단가</th>
                <th className="px-4 py-2 font-medium">변동단가</th>
                <th className="px-4 py-2 font-medium">변동차액</th>
                <th className="px-4 py-2 font-medium">100g당 원가</th>
                <th className="px-4 py-2 font-medium">작성자</th>
                <th className="px-4 py-2 font-medium">비고</th>
              </tr>
            </thead>
            <tbody>
              {historyRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-400">
                    아직 단가 변동 이력이 없습니다.
                  </td>
                </tr>
              )}
              {historyRows.map((h) => (
                <tr key={h.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-2 whitespace-nowrap">{h.changed_date}</td>
                  <td className="px-4 py-2 whitespace-nowrap">
                    {h.previous_price !== null ? `${formatKRW(h.previous_price)} 원` : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium">
                    {formatKRW(h.changed_price)} 원
                  </td>
                  <td
                    className={`px-4 py-2 whitespace-nowrap font-medium ${
                      h.price_diff !== null && h.price_diff > 0
                        ? "text-red-600"
                        : h.price_diff !== null && h.price_diff < 0
                          ? "text-blue-600"
                          : "text-neutral-500"
                    }`}
                  >
                    {h.price_diff !== null
                      ? `${h.price_diff > 0 ? "+" : ""}${formatKRW(h.price_diff)} 원`
                      : "-"}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap">{formatUnitCost(h.unit_cost_per_100g)} 원</td>
                  <td className="px-4 py-2 whitespace-nowrap">{h.changed_by ?? "-"}</td>
                  <td className="px-4 py-2">
                    <NoteCell historyId={h.id} initialNote={h.note} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function InfoItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={highlight ? "text-lg font-semibold text-neutral-900" : "text-sm text-neutral-800"}>
        {value}
      </div>
    </div>
  );
}
