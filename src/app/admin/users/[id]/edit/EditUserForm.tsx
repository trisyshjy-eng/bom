"use client";

import { useActionState } from "react";
import type { User } from "@supabase/supabase-js";
import { updateUserAdmin, type UserFormState } from "../../actions";

const initialState: UserFormState = { error: null };

export default function EditUserForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(updateUserAdmin, initialState);
  const name = (user.user_metadata as { name?: string } | null)?.name ?? "";

  return (
    <form action={formAction} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-6">
      <input type="hidden" name="id" value={user.id} />

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">이메일</label>
        <input
          name="email"
          type="email"
          defaultValue={user.email ?? ""}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">이름 (선택)</label>
        <input
          name="name"
          type="text"
          defaultValue={name}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">새 비밀번호 (선택)</label>
        <input
          name="password"
          type="text"
          minLength={8}
          placeholder="변경하지 않으려면 비워두세요"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "저장"}
      </button>
    </form>
  );
}
