"use client";

import { useCallback, useEffect, useState } from "react";
import type { Folder, NoteSummary } from "@/lib/notes";

// 노트가 바뀌었다고 다른 화면(사이드바·홈)에 알리는 신호
export const NOTES_CHANGED = "notes:changed";
export const notifyNotesChanged = () => window.dispatchEvent(new Event(NOTES_CHANGED));

/*
 * 내 노트·폴더 목록 + 로그인 여부
 *   status: "loading" → 확인 중 / "guest" → 로그인 안 함 / "me" → 로그인함
 */
export function useMyNotes() {
  const [status, setStatus] = useState<"loading" | "guest" | "me">("loading");
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const load = useCallback(async () => {
    const [res, folderRes] = await Promise.all([fetch("/api/notes"), fetch("/api/folders")]);
    if (res.status === 401) {
      setStatus("guest");
      setNotes([]);
      setFolders([]);
      return;
    }
    if (res.ok) {
      setNotes(await res.json());
      if (folderRes.ok) setFolders(await folderRes.json());
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

  return { status, notes, folders };
}

/* 노트·폴더를 바꾸는 요청 — 성공하면 사이드바·홈에 다시 불러오라고 알린다 */
async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.ok) notifyNotesChanged();
  return res;
}

export const notesApi = {
  createPage: async (folderId: string | null) => {
    const res = await send("/api/notes", "POST", { folderId });
    return res.ok ? ((await res.json()) as { id: string }).id : null;
  },
  movePage: (id: string, folderId: string | null) => send(`/api/notes/${id}`, "PATCH", { folderId }),
  deletePage: (id: string) => send(`/api/notes/${id}`, "DELETE"),
  createFolder: (name: string, parentId: string | null) => send("/api/folders", "POST", { name, parentId }),
  renameFolder: (id: string, name: string) => send(`/api/folders/${id}`, "PATCH", { name }),
  moveFolder: (id: string, parentId: string | null) => send(`/api/folders/${id}`, "PATCH", { parentId }),
  deleteFolder: (id: string) => send(`/api/folders/${id}`, "DELETE"),
};
