"use client";

import { useActionState, useMemo, useState } from "react";
import type { Category, Supplier, Product, PurchaseType } from "@/lib/types";
import { getCategoryLabels } from "@/lib/category-config";
import {
  calcPreservedWeight,
  calcUnitCostPer100g,
  calcUnitPriceFromTotal,
  calcTotalPurchasePrice,
  formatKRW,
  formatUnitCost,
} from "@/lib/calc";
import { saveProduct, type ProductFormState } from "./actions";
import { isOverseasPurchaseEligible } from "@/lib/overseas-purchase";

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
  const [productName, setProductName] = useState(product?.product_name ?? "");
  const [purchasePrice, setPurchasePrice] = useState(product?.purchase_price?.toString() ?? "");
  const [purchaseWeight, setPurchaseWeight] = useState(product?.purchase_weight?.toString() ?? "");
  const [boxQuantity, setBoxQuantity] = useState(product?.box_quantity?.toString() ?? "");
  const [yieldRate, setYieldRate] = useState(product?.yield_rate?.toString() ?? "");

  const [purchaseType, setPurchaseType] = useState<PurchaseType>(product?.purchase_type ?? "국내구매");
  const [calcTotalPrice, setCalcTotalPrice] = useState("");

  const categoryName = categories.find((c) => c.id === categoryId)?.name;
  const labels = useMemo(() => getCategoryLabels(categoryName), [categoryName]);

  const isOverseasEligible = isOverseasPurchaseEligible(productName);
  const isOverseas = isOverseasEligible && purchaseType === "해외직구매";

  const previewPreservedWeight = useMemo(() => {
    const w = Number(purchaseWeight);
    if (Number.isNaN(w) || w <= 0) return null;
    const y = yieldRate === "" ? null : Number(yieldRate);
    return calcPreservedWeight(w, y);
  }, [purchaseWeight, yieldRate]);

  const previewUnitCost = useMemo(() => {
    const p = Number(purchasePrice);
    const w = Number(purchaseWeight);
    if (Number.isNaN(p)) return null;
    if (Number.isNaN(w) || w <= 0) return null;
    const y = yieldRate === "" ? null : Number(yieldRate);
    return calcUnitCostPer100g(p, w, y);
  }, [purchasePrice, purchaseWeight, yieldRate]);

  const previewTotalPurchasePrice = useMemo(() => {
    const p = Number(purchasePrice);
    if (Number.isNaN(p)) return null;
    const qty = boxQuantity === "" ? null : Number(boxQuantity);
    if (qty !== null && (Number.isNaN(qty) || qty <= 0)) return null;
    return calcTotalPurchasePrice(p, qty);
  }, [purchasePrice, boxQuantity]);

  const handleCalcUnitPrice = () => {
    const total = Number(calcTotalPrice);
    const qty = Number(boxQuantity);
    if (Number.isNaN(total) || total <= 0) return;
    if (Number.isNaN(qty) || qty <= 0) return;
    setPurchasePrice(String(calcUnitPriceFromTotal(total, qty)));
  };

  return (
    <form action={formAction} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      {!isOverseasEligible && <input type="hidden" name="purchase_type" value="국내구매" />}

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
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
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

        {isOverseasEligible && (
          <div className="space-y-1">
            <label className="text-sm font-medium text-neutral-700">구매유형</label>
            <select
              name="purchase_type"
              value={purchaseType}
              onChange={(e) => setPurchaseType(e.target.value as PurchaseType)}
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="국내구매">국내구매</option>
              <option value="해외직구매">해외직구매</option>
            </select>
          </div>
        )}

        {isOverseas && (
          <div className="sm:col-span-2 space-y-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
            <div className="text-xs font-medium text-neutral-500">
              1BOX매입가 계산기 (총구매가격 ÷ 박스수량, 선택 입력)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">총구매가격</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcTotalPrice}
                  onChange={(e) => setCalcTotalPrice(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-500">박스수량</label>
                <input
                  type="number"
                  step="1"
                  value={boxQuantity}
                  onChange={(e) => setBoxQuantity(e.target.value)}
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleCalcUnitPrice}
              className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              1BOX매입가 계산해서 채우기
            </button>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-sm font-medium text-neutral-700">
            {isOverseas ? "1BOX매입가(원)" : labels.purchasePriceLabel}
          </label>
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
          <label className="text-sm font-medium text-neutral-700">
            {isOverseas ? "1BOX매입중량(G)" : labels.purchaseWeightLabel}
          </label>
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
          <label className="text-sm font-medium text-neutral-700">박스수량</label>
          <input
            type="number"
            step="1"
            name="box_quantity"
            value={boxQuantity}
            onChange={(e) => setBoxQuantity(e.target.value)}
            required={isOverseas}
            placeholder={isOverseas ? undefined : "미입력 시 1로 계산"}
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
          <div className="text-xs text-neutral-500">총매입가 (자동계산)</div>
          <div className="text-lg font-semibold text-neutral-900">
            {previewTotalPurchasePrice !== null ? `${formatKRW(previewTotalPurchasePrice)} 원` : "-"}
          </div>
          <div className="text-[11px] text-neutral-400 mt-0.5">
            {isOverseas ? "1BOX매입가(원)" : labels.purchasePriceLabel} × 박스수량
          </div>
        </div>
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
