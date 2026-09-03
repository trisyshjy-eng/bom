"use client";

import { useActionState } from "react";
import { createUserAdmin, type UserFormState } from "../actions";

const initialState: UserFormState = { error: null };

export default function NewUserForm() {
  const [state, formAction, pending] = useActionState(createUserAdmin, initialState);

  return (
    <form action={formAction} className="space-y-4 bg-white border border-neutral-200 rounded-lg p-6">
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">이메일</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">이름 (선택)</label>
        <input
          name="name"
          type="text"
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-700">임시 비밀번호</label>
        <input
          name="password"
          type="text"
          required
          minLength={8}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-400">8자 이상. 생성 후 본인 비밀번호로 변경하도록 안내하세요.</p>
      </div>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-neutral-900 text-white text-sm font-medium py-2 hover:bg-neutral-800 disabled:opacity-50"
      >
        {pending ? "생성 중..." : "계정 생성"}
      </button>
    </form>
  );
}
