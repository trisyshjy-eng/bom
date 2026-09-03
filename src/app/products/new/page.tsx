import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "../ProductForm";

export default async function NewProductPage() {
  const supabase = await createClient();

  const [{ data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("suppliers").select("*").order("name"),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4"
      >
        ← 목록으로
      </Link>
      <h1 className="text-xl font-semibold text-neutral-900 mb-6">원물/제품 신규 등록</h1>
      <ProductForm categories={categories ?? []} suppliers={suppliers ?? []} />
    </div>
  );
}
