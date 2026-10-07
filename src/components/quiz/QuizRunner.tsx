"use client";

import { useEffect, useRef, useState } from "react";
import { shuffleChoices, type Question } from "@/data/quiz";

type Props = {
  title: string; // 카드 제목 (예: "확인 퀴즈")
  tag: string; // 왼쪽 위 작은 태그 (예: "✅ 확인", "🔁 복습")
  questions: Question[];
  salt?: string; // 보기 섞는 기준 (복습은 날짜 → 날마다 순서가 바뀜)
  showSource?: boolean; // 어느 레슨 문제인지 표시
  retryWrong?: boolean; // 틀린 문제를 이번 판 끝에 한 번 더
  endMessage?: React.ReactNode; // 끝 화면 아래에 덧붙일 내용
};

const AUTO_NEXT_MS = 1400; // 맞히면 이만큼 뒤 자동으로 다음 문제

// 한 문제씩 — 누르면 바로 채점, 맞히면 자동으로 다음, 틀리면 해설 읽고 "다음 →"
export default function QuizRunner({ title, tag, questions, salt = "", showSource, retryWrong, endMessage }: Props) {
  const [queue, setQueue] = useState(questions);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [retried, setRetried] = useState<Set<string>>(new Set());
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const finished = index >= queue.length;
  const question = finished ? null : queue[index];
  const item = question ? shuffleChoices(question, question.id + salt) : null;
  const correct = item !== null && picked === item.answer;

  function next() {
    clearTimeout(timer.current);
    setPicked(null);
    setIndex((i) => i + 1);
  }

  function pick(i: number) {
    if (picked !== null || !item || !question) return;
    setPicked(i);
    const ok = i === item.answer;
    // 로그인 안 했으면 401 → 기록 없이 연습으로 끝
    void fetch("/api/quiz", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: question.id, correct: ok }),
    }).catch(() => {});
    if (ok) {
      setScore((s) => s + 1);
      timer.current = setTimeout(next, AUTO_NEXT_MS);
    } else if (retryWrong && !retried.has(question.id)) {
      setRetried(new Set(retried).add(question.id));
      setQueue([...queue, question]);
    }
  }

  function restart() {
    setQueue(questions);
    setIndex(0);
    setPicked(null);
    setScore(0);
    setRetried(new Set());
  }

  if (questions.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-line-subtle bg-surface">
      {/* 머리 */}
      <div className="flex items-center gap-2 border-b border-line-subtle px-5 py-3.5">
        <span className="rounded-full bg-primary-subtle px-2 py-0.5 text-[12px] font-semibold text-primary-strong">{tag}</span>
        <span className="text-t5 font-bold">{title}</span>
      </div>

      <div className="px-5 py-5">
        <p className="text-t7 text-fg-tertiary">보기를 누르면 바로 채점돼요. 몇 번이든 다시 풀 수 있어요.</p>

        {finished ? (
          <div className="mt-5">
            <p className="text-t4 font-bold">
              완료! {score}/{queue.length}점{" "}
              <span className="text-fg-secondary">
                — {score === queue.length ? "완벽해요 🎉" : score >= queue.length / 2 ? "거의 다 왔어요. 틀린 건 복습에서 다시 만나요" : "레슨을 한 번 더 훑고 오면 금방 올라가요"}
              </span>
            </p>
            <button
              onClick={restart}
              className="mt-4 rounded-full bg-primary px-4 py-2 text-t6 font-bold text-fg-on-primary active:scale-[0.97]"
            >
              다시 풀기
            </button>
            {endMessage}
          </div>
        ) : (
          item &&
          question && (
            <>
              <div className="mt-4 flex items-center justify-between text-t7 text-fg-tertiary">
                <span>
                  문제 {index + 1} / {queue.length}
                  {showSource && <> · {question.lessonTitle}</>}
                </span>
                <span>점수 {score}</span>
              </div>
              <p key={`${question.id}-${index}`} className="mt-2 text-t4 font-bold motion-safe:animate-[fade-up_250ms_var(--ease-smooth)]">
                Q{index + 1}. {item.q}
              </p>

              {/* 보기 — 두 칸 알약 버튼 */}
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {item.choices.map((c, i) => {
                  const look =
                    picked === null
                      ? "border-line hover:border-primary hover:bg-primary-subtle"
                      : i === item.answer
                        ? "border-success bg-success-bg text-fg"
                        : i === picked
                          ? "border-error bg-error-bg text-fg"
                          : "border-line-subtle text-fg-tertiary";
                  return (
                    <button
                      key={i}
                      onClick={() => pick(i)}
                      disabled={picked !== null}
                      className={`rounded-full border px-4 py-2.5 text-left text-t6 transition-colors duration-100 active:scale-[0.98] ${look}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>

              {/* 채점 결과 */}
              {picked !== null && (
                <div className="mt-4 motion-safe:animate-[fade-up_200ms_var(--ease-smooth)]">
                  <p className={`text-t6 font-semibold ${correct ? "text-success" : "text-error"}`}>
                    {correct ? "정답이에요!" : "아깝다! 초록색이 정답이에요"}
                  </p>
                  <p className="mt-1 text-t6 text-fg-secondary">{item.why}</p>
                  {!correct && (
                    <button
                      onClick={next}
                      className="mt-3 rounded-full bg-surface-subtle px-4 py-2 text-t6 font-bold text-fg hover:bg-line-subtle"
                    >
                      다음 →
                    </button>
                  )}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
