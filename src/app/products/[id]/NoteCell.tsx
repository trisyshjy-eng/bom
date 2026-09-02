"use client";

import { useState, useTransition } from "react";
import { updatePriceHistoryNote } from "../actions";

export default function NoteCell({ historyId, initialNote }: { historyId: string; initialNote: string | null }) {
  const [editing, setEditing] = useState(false);
  const [savedNote, setSavedNote] = useState(initialNote ?? "");
  const [value, setValue] = useState(initialNote ?? "");
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-left text-neutral-600 hover:text-neutral-900 underline decoration-dotted underline-offset-2"
      >
        {savedNote || "메모 추가"}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded border border-neutral-300 px-2 py-1 text-sm w-40"
        autoFocus
      />
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updatePriceHistoryNote(historyId, value);
            setSavedNote(value.trim());
            setEditing(false);
          })
        }
        className="text-xs text-neutral-900 font-medium disabled:opacity-50"
      >
        저장
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-400">
        취소
      </button>
    </div>
  );
}
