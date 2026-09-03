"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { calcOverseasTotalPrice, calcOverseasTotalWeight } from "@/lib/calc";
import { isOverseasPurchaseEligible } from "@/lib/overseas-purchase";
import type { PurchaseType } from "@/lib/types";

export interface ProductFormState {
  error: string | null;
}

async function resolveSupplierId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  supplierId: string,
  newSupplierName: string
): Promise<{ id: string | null; error: string | null }> {
  if (supplierId) return { id: supplierId, error: null };

  const name = newSupplierName.trim();
  if (!name) return { id: null, error: "거래처를 선택하거나 신규 거래처명을 입력하세요." };

  const { data: existing } = await supabase
    .from("suppliers")
    .select("id")
    .eq("name", name)
    .maybeSingle();

  if (existing) return { id: existing.id, error: null };

  const { data: created, error } = await supabase
    .from("suppliers")
    .insert({ name })
    .select("id")
    .single();

  if (error || !created) return { id: null, error: "거래처 생성에 실패했습니다." };
  return { id: created.id, error: null };
}

export async function saveProduct(
  _prevState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const id = String(formData.get("id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const supplierId = String(formData.get("supplier_id") ?? "");
  const newSupplierName = String(formData.get("new_supplier_name") ?? "");
  const productName = String(formData.get("product_name") ?? "").trim();
  const origin = String(formData.get("origin") ?? "").trim() || null;
  const spec = String(formData.get("spec") ?? "").trim() || null;
  const size = String(formData.get("size") ?? "").trim() || null;
  const grade = String(formData.get("grade") ?? "").trim() || null;
  const yieldRateRaw = String(formData.get("yield_rate") ?? "").trim();
  const status = String(formData.get("status") ?? "거래중");
  const purchaseTypeRaw = String(formData.get("purchase_type") ?? "국내구매");

  if (!categoryId) return { error: "카테고리를 선택하세요." };
  if (!productName) return { error: "제품명을 입력하세요." };

  const purchaseType: PurchaseType = purchaseTypeRaw === "해외직구매" ? "해외직구매" : "국내구매";
  if (purchaseType === "해외직구매" && !isOverseasPurchaseEligible(productName)) {
    return { error: "해외직구매는 '쭈꾸미'(주꾸미) 제품만 등록할 수 있습니다." };
  }

  const yieldRate = yieldRateRaw === "" ? null : Number(yieldRateRaw);
  if (yieldRate !== null && (Number.isNaN(yieldRate) || yieldRate <= 0 || yieldRate > 100))
    return { error: "수율/보존율은 0~100 사이 값이어야 합니다." };

  let purchasePrice: number;
  let purchaseWeight: number;
  let contractUnitPrice: number | null = null;
  let boxWeight: number | null = null;
  let boxCount: number | null = null;
  let usdExchangeRate: number | null = null;
  let boxQuantity: number | null = null;

  if (purchaseType === "해외직구매") {
    contractUnitPrice = Number(formData.get("contract_unit_price") ?? "");
    boxWeight = Number(formData.get("box_weight") ?? "");
    boxCount = Number(formData.get("box_count") ?? "");
    usdExchangeRate = Number(formData.get("usd_exchange_rate") ?? "");

    if (Number.isNaN(contractUnitPrice) || contractUnitPrice < 0)
      return { error: "계약단가를 올바르게 입력하세요." };
    if (Number.isNaN(boxWeight) || boxWeight <= 0)
      return { error: "1box당 중량을 올바르게 입력하세요." };
    if (Number.isNaN(boxCount) || boxCount <= 0)
      return { error: "총박스수량을 올바르게 입력하세요." };
    if (Number.isNaN(usdExchangeRate) || usdExchangeRate <= 0)
      return { error: "달러구매가를 올바르게 입력하세요." };

    purchaseWeight = calcOverseasTotalWeight(boxWeight, boxCount);
    purchasePrice = calcOverseasTotalPrice(contractUnitPrice, boxWeight, boxCount, usdExchangeRate);
  } else {
    const purchasePriceRaw = String(formData.get("purchase_price") ?? "");
    const purchaseWeightRaw = String(formData.get("purchase_weight") ?? "");
    purchasePrice = Number(purchasePriceRaw);
    purchaseWeight = Number(purchaseWeightRaw);

    if (Number.isNaN(purchasePrice) || purchasePrice < 0)
      return { error: "매입가를 올바르게 입력하세요." };
    if (Number.isNaN(purchaseWeight) || purchaseWeight <= 0)
      return { error: "매입중량을 올바르게 입력하세요." };

    const boxQuantityRaw = String(formData.get("box_quantity") ?? "").trim();
    if (boxQuantityRaw !== "") {
      boxQuantity = Number(boxQuantityRaw);
      if (Number.isNaN(boxQuantity) || boxQuantity <= 0 || !Number.isInteger(boxQuantity))
        return { error: "박스수량은 1 이상의 정수여야 합니다." };
    }
  }

  const { id: resolvedSupplierId, error: supplierError } = await resolveSupplierId(
    supabase,
    supplierId,
    newSupplierName
  );
  if (supplierError || !resolvedSupplierId) return { error: supplierError };

  const editorLabel = user.user_metadata?.name ?? user.email ?? "알수없음";

  const payload = {
    category_id: categoryId,
    supplier_id: resolvedSupplierId,
    product_name: productName,
    origin,
    spec,
    size,
    grade,
    purchase_price: purchasePrice,
    purchase_weight: purchaseWeight,
    box_quantity: boxQuantity,
    yield_rate: yieldRate,
    purchase_type: purchaseType,
    contract_unit_price: contractUnitPrice,
    box_weight: boxWeight,
    box_count: boxCount,
    usd_exchange_rate: usdExchangeRate,
    status,
    last_editor: editorLabel,
  };

  let savedId = id;

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) return { error: `저장에 실패했습니다: ${error.message}` };
  } else {
    const { data, error } = await supabase.from("products").insert(payload).select("id").single();
    if (error || !data) return { error: `저장에 실패했습니다: ${error?.message ?? ""}` };
    savedId = data.id;
  }

  revalidatePath("/products");
  revalidatePath(`/products/${savedId}`);
  revalidatePath("/");
  redirect(`/products/${savedId}`);
}

export async function updatePriceHistoryNote(historyId: string, note: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("price_history")
    .update({ note: note.trim() || null })
    .eq("id", historyId);
  if (error) throw new Error(error.message);
}
