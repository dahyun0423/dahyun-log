"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NEW_PER_DAY, type Progress, type Question } from "@/data/quiz";
import QuizCard from "@/components/quiz/QuizCard";

type Status = "loading" | "guest" | "ready";

/*
 * 오늘 풀 문제 고르기
 *   1) 복습 날짜가 지난 문제 (틀린 적 많은 것 먼저)
 *   2) 새 문제 — 노트를 쓴 레슨(=공부한 레슨)에서, 하루 5개까지
 *   틀린 문제는 이번 판 끝에 한 번 더
 */
function buildQueue(bank: Question[], progress: Progress[], studied: Set<string>, now: number) {
  const seen = new Map(progress.map((p) => [p.id, p]));
  const due = bank
    .filter((q) => seen.has(q.id) && new Date(seen.get(q.id)!.dueAt).getTime() <= now)
    .sort((a, b) => seen.get(b.id)!.wrong - seen.get(a.id)!.wrong);
  const fresh = bank.filter((q) => !seen.has(q.id) && studied.has(q.slug)).slice(0, NEW_PER_DAY);
  return { due, fresh };
}

export default function ReviewSession({ bank }: { bank: Question[] }) {
  const [status, setStatus] = useState<Status>("loading");
  const [progress, setProgress] = useState<Progress[]>([]);
  const [studied, setStudied] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<Question[] | null>(null);
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState({ right: 0, wrong: 0 });
  const [retried, setRetried] = useState<Set<string>>(new Set());
  const [answered, setAnswered] = useState(false);
  const [today, setToday] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    void (async () => {
      const [p, n] = await Promise.all([fetch("/api/quiz"), fetch("/api/notes")]);
      if (p.status === 401) return setStatus("guest");
      setProgress(await p.json());
      if (n.ok) setStudied(new Set(((await n.json()) as { lesson: string | null }[]).map((x) => x.lesson ?? "")));
      setToday(new Date().toISOString().slice(0, 10));
      setNow(Date.now());
      setStatus("ready");
    })();
  }, []);

  const plan = useMemo(
    () => (status === "ready" ? buildQueue(bank, progress, studied, now) : null),
    [status, bank, progress, studied, now],
  );

  if (status === "loading") return <p className="mt-10 text-t6 text-fg-tertiary">복습 기록 불러오는 중…</p>;

  if (status === "guest")
    return (
      <div className="mt-10 rounded-lg bg-surface-subtle p-6">
        <p className="text-t5 font-bold">로그인하면 복습 일정이 기록돼요</p>
        <p className="mt-1 text-t6 text-fg-tertiary">레슨 끝 확인 퀴즈는 로그인 없이도 풀 수 있어요.</p>
        <Link href="/login?next=/review" className="mt-4 inline-block rounded-md bg-primary px-4 py-2.5 text-t6 font-bold text-fg-on-primary">
          로그인
        </Link>
      </div>
    );

  // 시작 화면
  if (!queue) {
    const total = plan!.due.length + plan!.fresh.length;
    const nextDue = progress.map((p) => p.dueAt).sort()[0];
    return (
      <div className="mt-8">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "복습할 문제", value: plan!.due.length },
            { label: "새 문제", value: plan!.fresh.length },
            { label: "지금까지 푼 문제", value: progress.length },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-surface-subtle p-4">
              <p className="text-t7 text-fg-tertiary">{s.label}</p>
              <p className="mt-1 text-t3 font-bold">{s.value}개</p>
            </div>
          ))}
        </div>
        {total > 0 ? (
          <button
            onClick={() => setQueue([...plan!.due, ...plan!.fresh])}
            className="mt-6 h-14 w-full rounded-md bg-primary text-t5 font-bold text-fg-on-primary active:scale-[0.98]"
          >
            {total}문제 시작
          </button>
        ) : (
          <div className="mt-6 rounded-lg border border-line-subtle p-5 text-t6 text-fg-secondary">
            오늘은 복습할 문제가 없어요 🎉
            {nextDue && <> 다음 복습: {new Date(nextDue).toLocaleDateString("ko-KR")}</>}
            <br />
            <span className="text-fg-tertiary">레슨 오른쪽 노트를 쓰면 그 레슨 문제가 새 문제로 들어와요. 레슨 끝 확인 퀴즈를 풀어도 바로 들어가요.</span>
          </div>
        )}
        <p className="mt-6 text-t7 text-fg-tertiary">
          상자: 1(1일) · 2(3일) · 3(7일) · 4(14일) · 5(30일). 맞히면 한 칸 위, 틀리면 1번으로.
        </p>
      </div>
    );
  }

  // 끝
  if (index >= queue.length)
    return (
      <div className="mt-8 rounded-xl bg-surface-subtle p-6 text-center">
        <p className="text-t2">🎉</p>
        <p className="mt-2 text-t4 font-bold">오늘 복습 끝</p>
        <p className="mt-1 text-t6 text-fg-secondary">
          맞힘 {score.right} · 틀림 {score.wrong}
        </p>
        <p className="mt-3 text-t7 text-fg-tertiary">맞힌 문제는 다음 상자로, 틀린 문제는 곧 다시 나와요.</p>
      </div>
    );

  const q = queue[index];
  return (
    <div className="mt-8">
      <div className="mb-3 flex items-center justify-between text-t7 text-fg-tertiary">
        <span>
          {index + 1} / {queue.length}
        </span>
        <span>
          ✓ {score.right} · ✗ {score.wrong}
        </span>
      </div>
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-surface-subtle">
        <div className="h-full bg-success transition-[width] duration-300" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <QuizCard
        key={`${q.id}-${index}`}
        question={q}
        salt={today}
        showSource
        onAnswered={(ok) => {
          setAnswered(true);
          setScore((s) => (ok ? { ...s, right: s.right + 1 } : { ...s, wrong: s.wrong + 1 }));
          // 틀린 문제는 이번 판 끝에 한 번 더 (한 번만)
          if (!ok && !retried.has(q.id)) {
            setRetried(new Set(retried).add(q.id));
            setQueue([...queue, q]);
          }
        }}
      />
      <button
        disabled={!answered}
        onClick={() => {
          setAnswered(false);
          setIndex(index + 1);
        }}
        className="mt-4 h-12 w-full rounded-md bg-primary text-t6 font-bold text-fg-on-primary disabled:bg-surface-subtle disabled:text-fg-disabled"
      >
        다음 →
      </button>
    </div>
  );
}
