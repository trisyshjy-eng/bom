"use client";

import { useState, useTransition } from "react";
import { deleteProduct } from "./actions";

export default function DeleteProductButton({ productId }: { productId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (pending) return;
    if (!confirm("정말 이 제품을 삭제하시겠습니까? 단가 변동 이력도 함께 삭제되며 되돌릴 수 없습니다.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteProduct(productId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "삭제 중..." : "삭제"}
      </button>
      {error && <span className="text-xs text-red-600 mt-1 whitespace-nowrap">{error}</span>}
    </div>
  );
}
