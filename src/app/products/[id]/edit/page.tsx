import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProductForm from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, { data: categories }, { data: suppliers }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    supabase.from("categories").select("*").order("sort_order"),
    supabase.from("suppliers").select("*").order("name"),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 mb-4"
      >
        ← 목록으로
      </Link>
      <h1 className="text-xl font-semibold text-neutral-900 mb-6">원물/제품 수정</h1>
      <ProductForm categories={categories ?? []} suppliers={suppliers ?? []} product={product} />
    </div>
  );
}
