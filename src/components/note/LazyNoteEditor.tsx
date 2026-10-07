"use client";

import dynamic from "next/dynamic";

// 에디터는 브라우저에서만 동작 → 서버 렌더링에서 제외
const LazyNoteEditor = dynamic(() => import("./NoteEditor"), {
  ssr: false,
  loading: () => <p className="px-6 py-4 text-t6 text-fg-tertiary">에디터 준비 중…</p>,
});

export default LazyNoteEditor;
