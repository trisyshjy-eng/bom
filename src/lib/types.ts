export type ProductStatus = "거래중" | "거래중단";
export type PurchaseType = "국내구매" | "해외직구매";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  supplier_id: string;
  product_name: string;
  origin: string | null;
  spec: string | null;
  size: string | null;
  grade: string | null;
  purchase_price: number;
  purchase_weight: number;
  yield_rate: number | null;
  preserved_weight: number;
  unit_cost_per_100g: number | null;
  purchase_type: PurchaseType;
  contract_unit_price: number | null;
  box_weight: number | null;
  box_count: number | null;
  usd_exchange_rate: number | null;
  status: ProductStatus;
  last_editor: string | null;
  updated_at: string;
  created_at: string;
}

export interface ProductWithRelations extends Product {
  category: Category | null;
  supplier: Supplier | null;
}

export interface PriceHistory {
  id: string;
  product_id: string;
  changed_price: number;
  previous_price: number | null;
  price_diff: number | null;
  unit_cost_per_100g: number | null;
  changed_date: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}
