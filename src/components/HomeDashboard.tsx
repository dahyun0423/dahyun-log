"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Progress } from "@/data/quiz";
import Tag from "@/components/Tag";
import { categories } from "@/data/categories";
import { roadmap } from "@/data/roadmap";
import { basicsTopics, isBasics } from "@/data/basics";
import type { Lesson } from "@/lib/lessons";
import { useMyNotes } from "@/lib/useMyNotes";

// 홈 화면 — 내 노트 진행 상황은 로그인해야 보여서 브라우저에서 불러온다
export default function HomeDashboard({ lessons: all }: { lessons: Lesson[] }) {
  const { status, notes } = useMyNotes();
  // 오늘 복습할 문제 수 (로그인했을 때만)
  const [dueCount, setDueCount] = useState<number | null>(null);
  useEffect(() => {
    void fetch("/api/quiz").then(async (r) => {
      if (!r.ok) return;
      const rows = (await r.json()) as Progress[];
      const now = Date.now();
      setDueCount(rows.filter((p) => new Date(p.dueAt).getTime() <= now).length);
    });
  }, []);
  const lessons = all.filter((l) => !isBasics(l));
  const cards = all.filter(isBasics);

  const noted = new Set(notes.filter((n) => n.lesson).map((n) => n.lesson));
  // 이어서 할 레슨 = 아직 노트를 안 쓴 첫 레슨
  const next = lessons.find((l) => !noted.has(l.slug));
  const week = next?.week ?? lessons.at(-1)?.week ?? 1;
  const thisWeek = roadmap.find((w) => w.week === week);
  const recent = notes.slice(0, 5);
  // 오늘의 기초 카드 = 아직 노트를 안 쓴 첫 카드
  const card = cards.find((c) => !noted.has(c.slug));
  const cardTopic = basicsTopics.find((t) => t.slug === card?.topic);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-10">
      <Tag>{week}주차</Tag>
      <h1 className="mt-3 text-t1 font-bold tracking-[-0.02em]">{thisWeek?.theme}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "레슨", value: `${lessons.length}개` },
          { label: "기초 카드", value: `${cards.filter((c) => noted.has(c.slug)).length}/${cards.length}` },
          { label: "노트 쓴 레슨", value: `${lessons.filter((l) => noted.has(l.slug)).length}개` },
          { label: "내 페이지", value: `${notes.filter((n) => !n.lesson).length}개` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-surface-subtle p-4">
            <p className="text-t7 text-fg-tertiary">{s.label}</p>
            <p className="mt-1 text-t3 font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {next && (
        <Link
          href={`/learn/${next.slug}`}
          className="mt-8 block rounded-xl bg-primary p-6 text-fg-on-primary transition-transform duration-100 active:scale-[0.98]"
        >
          <p className="text-t7 font-semibold opacity-80">이어서 하기</p>
          <p className="mt-1 text-t3 font-bold">{next.title}</p>
          <p className="mt-1 text-t6 opacity-90">{next.summary}</p>
        </Link>
      )}

      <Link
        href="/review"
        className="mt-3 flex items-center gap-4 rounded-xl border border-line p-5 transition-transform duration-100 hover:bg-surface-subtle active:scale-[0.98]"
      >
        <span className="text-t2">🔁</span>
        <span className="flex-1">
          <span className="block text-t7 font-semibold text-primary">오늘의 복습</span>
          <span className="mt-0.5 block text-t5 font-bold">
            {dueCount === null ? "반복해서 풀수록 오래 남아요" : dueCount > 0 ? `복습할 문제 ${dueCount}개` : "오늘 복습 끝 · 새 문제 풀기"}
          </span>
        </span>
        <span className="text-fg-tertiary">→</span>
      </Link>

      {card && (
        <Link
          href={`/learn/${card.slug}`}
          className="mt-3 flex items-center gap-4 rounded-xl border border-line p-5 transition-transform duration-100 hover:bg-surface-subtle active:scale-[0.98]"
        >
          <span className="text-t2">{cardTopic?.icon}</span>
          <span className="flex-1">
            <span className="block text-t7 font-semibold text-success">오늘의 기초 카드 · {card.minutes}분</span>
            <span className="mt-0.5 block text-t5 font-bold">{card.title}</span>
          </span>
          <span className="text-fg-tertiary">→</span>
        </Link>
      )}

      <h2 className="mt-12 text-t4 font-bold">이번 주 레슨</h2>
      <ul className="mt-2">
        {lessons
          .filter((l) => l.week === week)
          .map((l) => (
            <li key={l.slug}>
              <Link
                href={`/learn/${l.slug}`}
                className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface-subtle"
              >
                <span className={`size-2 shrink-0 rounded-full ${noted.has(l.slug) ? "bg-primary" : "bg-line-strong"}`} />
                <span className="flex-1">
                  <span className="block text-t5 font-semibold">{l.title}</span>
                  <span className="block text-t7 text-fg-tertiary">
                    {categories.find((c) => c.slug === l.category)?.name} · {l.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
      </ul>

      <h2 className="mt-12 text-t4 font-bold">최근 기록</h2>
      {status === "guest" ? (
        <p className="mt-3 rounded-lg bg-surface-subtle p-5 text-t6 text-fg-tertiary">
          <Link href="/login" className="font-semibold text-primary">
            로그인
          </Link>
          하면 내 기록이 보여요.
        </p>
      ) : recent.length === 0 ? (
        <p className="mt-3 rounded-lg bg-surface-subtle p-5 text-t6 text-fg-tertiary">
          아직 기록이 없어요. 레슨을 열고 오른쪽 노트에 써보세요.
        </p>
      ) : (
        <ul className="mt-2">
          {recent.map((n) => (
            <li key={n.id}>
              <Link
                href={n.lesson ? `/learn/${n.lesson}` : `/pages/${n.id}`}
                className="-mx-3 flex justify-between rounded-lg px-3 py-3 text-t5 hover:bg-surface-subtle"
              >
                <span className="truncate font-semibold">{n.title}</span>
                <span className="shrink-0 text-t7 text-fg-tertiary">{n.updatedAt.slice(0, 10)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
