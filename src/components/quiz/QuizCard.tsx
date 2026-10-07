"use client";

import { useState } from "react";
import { shuffleChoices, type Question } from "@/data/quiz";

type Props = {
  question: Question;
  salt?: string; // 보기 섞는 기준 (복습 화면은 날짜)
  onAnswered?: (correct: boolean) => void;
  showSource?: boolean; // 어느 레슨 문제인지 표시
};

// 문제 하나 — 고르면 정답·해설을 보여주고, 로그인했으면 복습 일정에 기록
export default function QuizCard({ question, salt = "", onAnswered, showSource }: Props) {
  const item = shuffleChoices(question, question.id + salt);
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;
  const correct = picked === item.answer;

  function pick(i: number) {
    if (done) return;
    setPicked(i);
    const ok = i === item.answer;
    // 로그인 안 했으면 401 → 그냥 연습으로 끝
    void fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id, correct: ok }),
    }).catch(() => {});
    onAnswered?.(ok);
  }

  return (
    <div className="rounded-lg border border-line-subtle p-4">
      {showSource && <p className="mb-1 text-[12px] text-fg-tertiary">{question.lessonTitle}</p>}
      <p className="text-t6 font-semibold text-fg">{item.q}</p>
      <ul className="mt-3 space-y-1.5">
        {item.choices.map((c, i) => {
          const state = !done
            ? "border-line hover:bg-surface-subtle"
            : i === item.answer
              ? "border-success bg-success-bg text-fg"
              : i === picked
                ? "border-error bg-error-bg text-fg"
                : "border-line-subtle text-fg-tertiary";
          return (
            <li key={i}>
              <button
                onClick={() => pick(i)}
                disabled={done}
                className={`w-full rounded-md border px-3 py-2 text-left text-t6 transition-colors duration-100 ${state}`}
              >
                <span className="mr-2 font-bold text-fg-tertiary">{"①②③④⑤"[i]}</span>
                {c}
              </button>
            </li>
          );
        })}
      </ul>
      {done && (
        <p className={`mt-3 rounded-md px-3 py-2 text-t7 ${correct ? "bg-success-bg" : "bg-error-bg"}`}>
          <span className={`font-bold ${correct ? "text-success" : "text-error"}`}>{correct ? "정답 ✓ " : "아쉬워요 ✗ "}</span>
          {item.why}
        </p>
      )}
    </div>
  );
}
