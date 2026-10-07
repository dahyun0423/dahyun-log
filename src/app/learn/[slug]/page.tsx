import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Tag from "@/components/Tag";
import LearnSplit from "@/components/LearnSplit";
import LessonQuiz from "@/components/quiz/LessonQuiz";
import { getQuestionBank } from "@/lib/quiz";
import LazyNoteEditor from "@/components/note/LazyNoteEditor";
import { categories } from "@/data/categories";
import { basicsTopics } from "@/data/basics";
import { getLesson, getLessons, getLessonSlugs, isBasics } from "@/lib/lessons";

export default function LearnPage({ params }: PageProps<"/learn/[slug]">) {
  return (
    <Suspense>
      <Learn params={params} />
    </Suspense>
  );
}

async function Learn({ params }: { params: PageProps<"/learn/[slug]">["params"] }) {
  const { slug } = await params;
  if (!getLessonSlugs().includes(slug)) notFound();
  const { Content, ...lesson } = await getLesson(slug);
  // 이전/다음은 같은 트랙(9주 레슨끼리, 기초 카드는 같은 주제끼리)에서만
  const all = (await getLessons()).filter((l) =>
    isBasics(lesson) ? isBasics(l) && l.topic === lesson.topic : !isBasics(l),
  );
  const topic = basicsTopics.find((t) => t.slug === lesson.topic);
  // 이 레슨의 퀴즈: 직접 쓴 문제 + 진단서 문제 + 비유 문제 2개까지
  const mine = (await getQuestionBank()).filter((q) => q.slug === slug);
  const quiz = [
    ...mine.filter((q) => q.kind !== "analogy"),
    ...mine.filter((q) => q.kind === "analogy").slice(0, 2),
  ];
  const i = all.findIndex((l) => l.slug === slug);
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <LearnSplit
      lesson={
        <article className="px-6 py-8 md:px-12">
          <div className="flex items-center gap-2">
            {isBasics(lesson) ? (
              <>
                <Tag tone="success">
                  {topic?.icon} {topic?.name}
                </Tag>
                <span className="text-t7 text-fg-tertiary">기초 카드 · 약 {lesson.minutes}분</span>
              </>
            ) : (
              <>
                <Tag>{categories.find((c) => c.slug === lesson.category)?.name}</Tag>
                <span className="text-t7 text-fg-tertiary">
                  {lesson.week}주차 레슨 · 약 {lesson.minutes}분
                </span>
              </>
            )}
          </div>
          <h1 className="mt-3 text-t2 font-bold tracking-[-0.02em]">{lesson.title}</h1>
          <p className="mt-2 text-t5 text-fg-tertiary">{lesson.summary}</p>

          {/* 이 레슨이 생긴 이유 — 내가 실제로 막힌 장면 */}
          {lesson.born && (
            <blockquote className="mt-6 rounded-lg bg-warning-bg px-5 py-4">
              <p className="text-t7 font-bold text-warning">📍 이 레슨이 생긴 이유</p>
              <p className="mt-1 text-t6 text-fg">{lesson.born}</p>
            </blockquote>
          )}

          {/* 끝나면 할 수 있는 것 — 칩 */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {lesson.goals.map((g) => (
              <span key={g} className="rounded-full border border-line px-3 py-1 text-t7 text-fg-secondary">
                ☐ {g}
              </span>
            ))}
          </div>

          <div className="lesson">
            <Content />
          </div>

          <LessonQuiz questions={quiz} />

          <nav className="mt-14 grid grid-cols-2 gap-3">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="rounded-lg bg-surface-subtle p-4 hover:bg-line-subtle">
                <p className="text-t7 text-fg-tertiary">← 이전</p>
                <p className="mt-1 truncate text-t6 font-semibold">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/learn/${next.slug}`} className="rounded-lg bg-surface-subtle p-4 text-right hover:bg-line-subtle">
                <p className="text-t7 text-fg-tertiary">다음 →</p>
                <p className="mt-1 truncate text-t6 font-semibold">{next.title}</p>
              </Link>
            )}
          </nav>
        </article>
      }
      note={
        <LazyNoteEditor
          key={slug}
          id={slug}
          lesson={slug}
          defaultTitle={lesson.title}
          titleEditable={false}
          questions={lesson.questions}
        />
      }
    />
  );
}

export function generateStaticParams() {
  return getLessonSlugs().map((slug) => ({ slug }));
}
