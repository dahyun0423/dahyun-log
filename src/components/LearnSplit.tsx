"use client";

import { useEffect, useState } from "react";

const NOTE_OPEN_KEY = "learn-note-open";

/*
 * 데스크톱: 왼쪽 레슨 | 오른쪽 노트 (노트는 › 로 접고 ‹ 로 펼친다)
 * 모바일: 탭으로 전환
 */
export default function LearnSplit({ lesson, note }: { lesson: React.ReactNode; note: React.ReactNode }) {
  const [tab, setTab] = useState<"lesson" | "note">("lesson");
  const [noteOpen, setNoteOpen] = useState(true);

  // 접었는지 펼쳤는지 기억 (다른 레슨으로 가도 유지)
  useEffect(() => {
    try {
      if (localStorage.getItem(NOTE_OPEN_KEY) === "false") {
        const restore = setTimeout(() => setNoteOpen(false), 0);
        return () => clearTimeout(restore);
      }
    } catch {
      /* 저장소를 못 쓰면 펼친 채로 */
    }
  }, []);

  function toggleNote() {
    setNoteOpen((open) => {
      try {
        localStorage.setItem(NOTE_OPEN_KEY, String(!open));
      } catch {
        /* 무시 */
      }
      return !open;
    });
  }

  const tabClass = (active: boolean) =>
    `flex-1 rounded-md py-2 text-t6 font-semibold ${active ? "bg-surface text-fg shadow-sm" : "text-fg-tertiary"}`;

  return (
    <div
      className={`md:grid md:h-screen motion-safe:md:transition-[grid-template-columns] motion-safe:md:duration-300 ${
        noteOpen ? "md:grid-cols-[1fr_1fr]" : "md:grid-cols-[1fr_44px]"
      }`}
    >
      <div className="sticky top-12 z-10 flex gap-1 bg-surface-subtle p-1 md:hidden">
        <button className={tabClass(tab === "lesson")} onClick={() => setTab("lesson")}>
          배우기
        </button>
        <button className={tabClass(tab === "note")} onClick={() => setTab("note")}>
          기록하기
        </button>
      </div>

      <section className={`${tab === "lesson" ? "block" : "hidden"} md:block md:overflow-y-auto md:border-r md:border-line-subtle`}>
        {/* 노트를 접으면 레슨이 너무 넓어지지 않게 가운데 정렬 */}
        <div className={noteOpen ? "" : "md:mx-auto md:max-w-3xl"}>{lesson}</div>
      </section>

      <section className={`${tab === "note" ? "block" : "hidden"} relative md:block md:overflow-y-auto`}>
        {/* 접기/펼치기 손잡이 (데스크톱만) */}
        <button
          onClick={toggleNote}
          title={noteOpen ? "내 노트 접기" : "내 노트 펼치기"}
          aria-expanded={noteOpen}
          className={`absolute top-3.5 z-10 hidden size-7 items-center justify-center rounded-sm text-t6 text-fg-tertiary hover:bg-surface-subtle hover:text-fg md:flex ${
            noteOpen ? "left-3" : "left-1/2 -translate-x-1/2"
          }`}
        >
          {noteOpen ? "›" : "‹"}
        </button>

        {/* 접었을 때: 세로 띠 전체를 눌러도 펼쳐진다 */}
        {!noteOpen && (
          <button
            onClick={toggleNote}
            className="hidden h-full w-full flex-col items-center pt-16 text-t7 font-semibold text-fg-tertiary hover:bg-surface-subtle md:flex"
          >
            <span className="[writing-mode:vertical-rl]">내 노트</span>
          </button>
        )}

        {/* 접어도 에디터는 그대로 두고 숨기기만 → 쓰던 내용·저장 상태 유지 */}
        <div className={noteOpen ? "" : "md:hidden"}>{note}</div>
      </section>
    </div>
  );
}
