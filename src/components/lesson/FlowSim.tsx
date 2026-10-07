"use client";

import { useEffect, useRef, useState } from "react";

/*
 * 단계별 흐름 시뮬레이터
 * nodes : 가로로 늘어선 상자들 (예: 브라우저 → API → 서버 → DB)
 * steps : 한 단계마다 어느 상자에 있는지(at) + 설명(say) + 오가는 데이터(packet)
 */
type Node = { id: string; label: string; sub?: string };
type Step = { at: string; say: string; packet?: string; tone?: "ok" | "error" };

type Props = {
  title: string;
  nodes: Node[];
  steps: Step[];
  startLabel?: string;
};

export default function FlowSim({ title, nodes, steps, startLabel = "요청 보내기" }: Props) {
  const [index, setIndex] = useState(-1); // -1 = 아직 시작 전
  const [auto, setAuto] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const step = index >= 0 ? steps[index] : null;
  const activeNode = step ? nodes.findIndex((n) => n.id === step.at) : -1;
  const visited = new Set(steps.slice(0, index + 1).map((s) => s.at));
  const done = index === steps.length - 1;
  const playing = auto && !done; // 마지막 단계에 닿으면 자동으로 멈춘 것으로 본다

  // 자동 재생: 1.6초마다 다음 단계
  useEffect(() => {
    if (!playing) return;
    timer.current = setTimeout(() => setIndex((i) => i + 1), index < 0 ? 0 : 1600);
    return () => clearTimeout(timer.current);
  }, [playing, index]);

  function play() {
    setIndex(-1);
    setAuto(true);
  }
  function next() {
    setAuto(false);
    setIndex((i) => (i >= steps.length - 1 ? 0 : i + 1));
  }

  return (
    <figure className="not-prose my-8 rounded-xl bg-surface-subtle p-5">
      <figcaption className="flex items-center gap-2">
        <span className="rounded-full bg-primary px-2 py-0.5 text-[12px] font-semibold text-fg-on-primary">실습</span>
        <span className="text-t5 font-bold">{title}</span>
      </figcaption>

      {/* 상자들 */}
      <ol className="mt-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${nodes.length}, minmax(0, 1fr))` }}>
        {nodes.map((n, i) => {
          const active = i === activeNode;
          return (
            <li
              key={n.id}
              className={`rounded-lg border bg-surface px-2 py-3 text-center motion-safe:transition-all motion-safe:duration-300 ${
                active
                  ? "-translate-y-1 border-primary bg-primary-subtle shadow-md"
                  : visited.has(n.id)
                    ? "border-line-strong"
                    : "border-line-subtle opacity-60"
              }`}
            >
              <p className={`text-t6 font-bold ${active ? "text-primary-strong" : ""}`}>{n.label}</p>
              {n.sub && <p className="mt-0.5 truncate text-[12px] text-fg-tertiary">{n.sub}</p>}
            </li>
          );
        })}
      </ol>

      {/* 상자 아래 선로 + 움직이는 점 (요청이 지금 어디 있는지) */}
      <div className="relative mt-3 h-3">
        <div className="absolute top-1/2 right-[12%] left-[12%] h-0.5 -translate-y-1/2 rounded-full bg-line" />
        {activeNode >= 0 && (
          <span
            className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_0_5px_var(--primary-subtle)] motion-safe:transition-[left] motion-safe:duration-500 motion-safe:ease-[var(--ease-smooth)]"
            style={{ left: `${((activeNode + 0.5) / nodes.length) * 100}%` }}
          />
        )}
      </div>

      {/* 현재 단계 설명 */}
      <div className="mt-3 min-h-24 rounded-lg bg-surface p-4" aria-live="polite">
        {step ? (
          <div key={index} className="motion-safe:animate-[fade-up_300ms_var(--ease-smooth)]">
            <p className="text-t7 font-semibold text-fg-tertiary">
              {index + 1} / {steps.length}
            </p>
            <p className={`mt-1 text-t6 ${step.tone === "error" ? "text-error" : "text-fg"}`}>{step.say}</p>
            {step.packet && (
              <pre className="mt-2 overflow-x-auto rounded-sm bg-surface-subtle px-3 py-2 font-mono text-[12px] leading-5 whitespace-pre text-fg-secondary">
                {step.packet}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-t6 text-fg-tertiary">대기 중 — 아래 버튼을 눌러 흐름을 따라가 보세요.</p>
        )}
        {/* 진행 막대 */}
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-subtle">
          <div
            className="h-full bg-primary motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${((index + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={play}
          disabled={playing}
          className="rounded-md bg-primary px-4 py-2.5 text-t6 font-bold text-fg-on-primary transition-transform duration-100 hover:bg-primary-hover active:scale-[0.97] disabled:bg-surface disabled:text-fg-disabled"
        >
          {playing ? "진행 중…" : done ? "다시 보기" : startLabel}
        </button>
        <button
          onClick={next}
          className="rounded-md bg-surface px-4 py-2.5 text-t6 font-bold text-fg transition-transform duration-100 active:scale-[0.97]"
        >
          한 단계씩 →
        </button>
      </div>
    </figure>
  );
}
