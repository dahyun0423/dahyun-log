"use client";

import { useState } from "react";

// 데스크톱: 왼쪽 레슨 | 오른쪽 노트 / 모바일: 탭으로 전환
export default function LearnSplit({ lesson, note }: { lesson: React.ReactNode; note: React.ReactNode }) {
  const [tab, setTab] = useState<"lesson" | "note">("lesson");

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md py-2 text-t6 font-semibold ${active ? "bg-surface text-fg shadow-sm" : "text-fg-tertiary"}`;

  return (
    <div className="md:grid md:h-screen md:grid-cols-2">
      <div className="sticky top-12 z-10 flex gap-1 bg-surface-subtle p-1 md:hidden">
        <button className={tabClass(tab === "lesson")} onClick={() => setTab("lesson")}>
          배우기
        </button>
        <button className={tabClass(tab === "note")} onClick={() => setTab("note")}>
          기록하기
        </button>
      </div>
      <section className={`${tab === "lesson" ? "block" : "hidden"} md:block md:overflow-y-auto md:border-r md:border-line-subtle`}>
        {lesson}
      </section>
      <section className={`${tab === "note" ? "block" : "hidden"} md:block md:overflow-y-auto`}>{note}</section>
    </div>
  );
}
