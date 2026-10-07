"use client";

import { useCallback, useEffect, useState } from "react";
import type { NoteSummary } from "@/lib/notes";

// 노트가 바뀌었다고 다른 화면(사이드바·홈)에 알리는 신호
export const NOTES_CHANGED = "notes:changed";
export const notifyNotesChanged = () => window.dispatchEvent(new Event(NOTES_CHANGED));

/*
 * 내 노트 목록 + 로그인 여부
 *   status: "loading" → 확인 중 / "guest" → 로그인 안 함 / "me" → 로그인함
 */
export function useMyNotes() {
  const [status, setStatus] = useState<"loading" | "guest" | "me">("loading");
  const [notes, setNotes] = useState<NoteSummary[]>([]);

  const load = useCallback(async () => {
    const res = await fetch("/api/notes");
    if (res.status === 401) {
      setStatus("guest");
      setNotes([]);
      return;
    }
    if (res.ok) {
      setNotes(await res.json());
      setStatus("me");
    }
  }, []);

  useEffect(() => {
    // 처음 한 번 + 노트가 바뀌었다는 신호가 올 때마다 다시 불러오기
    const run = () => void load();
    const first = setTimeout(run, 0);
    window.addEventListener(NOTES_CHANGED, run);
    return () => {
      clearTimeout(first);
      window.removeEventListener(NOTES_CHANGED, run);
    };
  }, [load]);

  return { status, notes };
}
