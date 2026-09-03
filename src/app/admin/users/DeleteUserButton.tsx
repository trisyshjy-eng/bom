"use client";

import { useState, useTransition } from "react";
import { deleteUserAdmin } from "./actions";

export default function DeleteUserButton({
  userId,
  disabled,
}: {
  userId: string;
  disabled?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = () => {
    if (disabled || pending) return;
    if (!confirm("정말 이 계정을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteUserAdmin(userId);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleDelete}
        disabled={disabled || pending}
        title={disabled ? "본인 계정은 삭제할 수 없습니다." : undefined}
        className="text-red-600 hover:text-red-800 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {pending ? "삭제 중..." : "삭제"}
      </button>
      {error && <span className="text-xs text-red-600 mt-1 whitespace-nowrap">{error}</span>}
    </div>
  );
}
