"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
import { notifyNotesChanged, useMyNotes } from "@/lib/useMyNotes";
import { roadmap } from "@/data/roadmap";

export default function Sidebar({ lessons }: { lessons: Lesson[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false); // 모바일 메뉴
  const [creating, setCreating] = useState(false);
  const { status, notes } = useMyNotes();

  const notedLessons = new Set(notes.filter((n) => n.lesson).map((n) => n.lesson));
  const pages = notes.filter((n) => !n.lesson);

  async function createPage() {
    setCreating(true);
    const res = await fetch("/api/notes", { method: "POST" });
    setCreating(false);
    if (!res.ok) return;
    const { id } = await res.json();
    setOpen(false);
    router.push(`/pages/${id}`);
    notifyNotesChanged();
  }

  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    notifyNotesChanged();
    router.push("/");
  }

  const item = (active: boolean) =>
    `flex items-center gap-2 rounded-sm px-2 py-1.5 text-t6 transition-colors duration-100 ${
      active ? "bg-line text-fg font-semibold" : "text-fg-secondary hover:bg-line-subtle"
    }`;

  return (
    <>
      {/* 모바일 상단 바 */}
      <div className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-line-subtle bg-surface px-4 md:hidden">
        <button onClick={() => setOpen(!open)} aria-label="메뉴" className="text-t4">
          ☰
        </button>
        <span className="text-t6 font-bold">dahyun.log</span>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} fixed inset-0 top-12 z-10 overflow-y-auto bg-surface-subtle md:sticky md:top-0 md:block md:h-screen md:w-64 md:shrink-0 md:border-r md:border-line-subtle`}
      >
        <div className="px-3 py-4">
          <Link href="/" onClick={() => setOpen(false)} className="hidden px-2 pb-4 text-t5 font-bold md:block">
            dahyun.log
          </Link>

          <Link href="/" onClick={() => setOpen(false)} className={item(pathname === "/")}>
            🏠 홈
          </Link>
          {status === "me" && (
            <button onClick={createPage} disabled={creating} className={`${item(false)} w-full`}>
              ＋ 새 페이지
            </button>
          )}

          <p className="mt-6 mb-1 px-2 text-t7 font-semibold text-fg-tertiary">9주 학습</p>
          {roadmap.map((w) => {
            const weekLessons = lessons.filter((l) => l.week === w.week);
            return (
              <details key={w.week} open={weekLessons.some((l) => pathname === `/learn/${l.slug}`) || w.week === 1}>
                <summary className={`${item(false)} cursor-pointer list-none`}>
                  <span className="text-fg-tertiary">▸</span>
                  {w.week}주차 · {w.theme}
                </summary>
                <div className="ml-4">
                  {weekLessons.length === 0 ? (
                    <p className="px-2 py-1 text-t7 text-fg-disabled">레슨 준비 중</p>
                  ) : (
                    weekLessons.map((l) => (
                      <Link
                        key={l.slug}
                        href={`/learn/${l.slug}`}
                        onClick={() => setOpen(false)}
                        className={item(pathname === `/learn/${l.slug}`)}
                      >
                        {/* 노트를 쓴 레슨은 파란 점 */}
                        <span
                          className={`size-1.5 shrink-0 rounded-full ${notedLessons.has(l.slug) ? "bg-primary" : "bg-line-strong"}`}
                        />
                        <span className="truncate">{l.title}</span>
                      </Link>
                    ))
                  )}
                </div>
              </details>
            );
          })}

          <p className="mt-6 mb-1 px-2 text-t7 font-semibold text-fg-tertiary">내 페이지</p>
          {status === "guest" && <p className="px-2 py-1 text-t7 text-fg-disabled">로그인하면 보여요</p>}
          {status === "me" && pages.length === 0 && (
            <p className="px-2 py-1 text-t7 text-fg-disabled">＋ 새 페이지로 시작</p>
          )}
          {pages.map((p) => (
            <Link
              key={p.id}
              href={`/pages/${p.id}`}
              onClick={() => setOpen(false)}
              className={item(pathname === `/pages/${p.id}`)}
            >
              📄 <span className="truncate">{p.title}</span>
            </Link>
          ))}

          <div className="mt-8 border-t border-line-subtle pt-3">
            {status === "me" ? (
              <button onClick={logout} className={`${item(false)} w-full`}>
                로그아웃
              </button>
            ) : status === "guest" ? (
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} onClick={() => setOpen(false)} className={item(false)}>
                🔑 로그인
              </Link>
            ) : null}
          </div>
        </div>
      </aside>
    </>
  );
}
