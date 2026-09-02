"use client";

import { useActionState, useMemo, useState } from "react";
import type { Category, Supplier, Product } from "@/lib/types";
import { getCategoryLabels } from "@/lib/category-config";
import { calcPreservedWeight, calcUnitCostPer100g, formatKRW, formatUnitCost } from "@/lib/calc";
import { saveProduct, type ProductFormState } from "./actions";

const NEW_SUPPLIER_VALUE = "__new__";

interface ProductFormProps {
  categories: Category[];
  suppliers: Supplier[];
  product?: Product;
}

export default function ProductForm({ categories, suppliers, product }: ProductFormProps) {
  const initialState: ProductFormState = { error: null };
  const [state, formAction, pending] = useActionState(saveProduct, initialState);

  const [categoryId, setCategoryId] = useState(product?.category_id ?? categories[0]?.id ?? "");
  const [supplierSelect, setSupplierSelect] = useState(product?.supplier_id ?? "");
  const [purchasePrice, setPurchasePrice] = useState(product?.purchase_price?.toString() ?? "");
  const [purchaseWeight, setPurchaseWeight] = useState(product?.purchase_weight?.toString() ?? "");
  const [yieldRate, setYieldRate] = useState(product?.yield_rate?.toString() ?? "");

  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const labels = useMemo(() => getCategoryLabels(categoryName), [categoryName]);

  const previewPreservedWeight = useMemo(() => {
    const w = Number(purchaseWeight);
    const y = yieldRate === "" ? null : Number(yieldRate);
    if (Number.isNaN(w) || w <= 0) return null;
    return calcPreservedWeight(w, y);
  }, [purchaseWeight, yieldRate]);

  const previewUnitCost = useMemo(() => {
    const p = Number(purchasePrice);
    const w = Number(purchaseWeight);
    const y = yieldRate === "" ? null : Number(yieldRate);
    if (Number.isNaN(p) || Number.isNaN(w) || w <= 0) return null;
    return calcUnitCostPer100g(p, w, y);
  }, [purchasePrice, purchaseWeight, yieldRate]);

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">카테고리</label>
          <select
            name="category_id"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">거래처</label>
          <select
            value={supplierSelect}
            onChange={(e) => setSupplierSelect(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">선택하세요</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
            <option value={NEW_SUPPLIER_VALUE}>+ 신규 거래처 입력</option>
          </select>
          {/* 실제 제출값: __new__ 선택 시 비워서 new_supplier_name 으로 대체 처리 */}
          <input
            type="hidden"
            name="supplier_id"
            value={supplierSelect === NEW_SUPPLIER_VALUE ? "" : supplierSelect}
          />
          {supplierSelect === NEW_SUPPLIER_VALUE && (
            <input
              type="text"
              name="new_supplier_name"
              placeholder="신규 거래처명"
              className="w-full mt-2 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              required
            />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">제품명</label>
          <input
            type="text"
            name="product_name"
            defaultValue={product?.product_name ?? ""}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">원산지</label>
          <input
            type="text"
            name="origin"
            defaultValue={product?.origin ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">{labels.specLabel}</label>
          <input
            type="text"
            name="spec"
            defaultValue={product?.spec ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">사이즈</label>
          <input
            type="text"
            name="size"
            defaultValue={product?.size ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">등급</label>
          <input
            type="text"
            name="grade"
            defaultValue={product?.grade ?? ""}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">거래지속상황</label>
          <select
            name="status"
            defaultValue={product?.status ?? "거래중"}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="거래중">거래중</option>
            <option value="거래중단">거래중단</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">{labels.purchasePriceLabel}</label>
          <input
            type="number"
            step="0.01"
            name="purchase_price"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">{labels.purchaseWeightLabel}</label>
          <input
            type="number"
            step="0.01"
            name="purchase_weight"
            value={purchaseWeight}
            onChange={(e) => setPurchaseWeight(e.target.value)}
            required
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">{labels.yieldRateLabel}</label>
          <input
            type="number"
            step="0.01"
            name="yield_rate"
            value={yieldRate}
            onChange={(e) => setYieldRate(e.target.value)}
            className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-neutral-500">보존중량 (자동계산)</div>
          <div className="text-lg font-semibold text-neutral-900">
            {previewPreservedWeight !== null ? `${formatKRW(previewPreservedWeight)} g` : "-"}
          </div>
        </div>
        <div>
          <div className="text-xs text-neutral-500">100g당 원가 (자동계산)</div>
          <div className="text-lg font-semibold text-neutral-900">
            {previewUnitCost !== null ? `${formatUnitCost(previewUnitCost)} 원` : "-"}
          </div>
        </div>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-neutral-900 text-white text-sm font-medium px-5 py-2 hover:bg-neutral-800 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "저장"}
        </button>
      </div>
    </form>
  );
}
