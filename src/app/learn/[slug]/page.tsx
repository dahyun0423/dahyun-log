import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Tag from "@/components/Tag";
import LearnSplit from "@/components/LearnSplit";
import LazyNoteEditor from "@/components/note/LazyNoteEditor";
import { categories } from "@/data/categories";
import { getLesson, getLessons, getLessonSlugs } from "@/lib/lessons";

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
  const all = await getLessons();
  const i = all.findIndex((l) => l.slug === slug);
  const prev = all[i - 1];
  const next = all[i + 1];

  return (
    <LearnSplit
      lesson={
        <article className="px-6 py-8 md:px-12">
          <div className="flex items-center gap-2">
            <Tag>{categories.find((c) => c.slug === lesson.category)?.name}</Tag>
            <span className="text-t7 text-fg-tertiary">
              {lesson.week}주차 레슨 · 약 {lesson.minutes}분
            </span>
          </div>
          <h1 className="mt-3 text-t2 font-bold tracking-[-0.02em]">{lesson.title}</h1>
          <p className="mt-2 text-t5 text-fg-tertiary">{lesson.summary}</p>

          <div className="mt-6 rounded-lg border border-line-subtle p-5">
            <p className="text-t7 font-bold text-fg-tertiary">이 레슨을 마치면</p>
            <ul className="mt-2 space-y-1.5">
              {lesson.goals.map((g) => (
                <li key={g} className="flex gap-2 text-t6 text-fg-secondary">
                  <span className="font-bold text-primary">✓</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>

          <div className="lesson">
            <Content />
          </div>

          <nav className="mt-14 grid grid-cols-2 gap-3">
            {prev ? (
              <Link href={`/learn/${prev.slug}`} className="rounded-lg bg-surface-subtle p-4 hover:bg-line-subtle">
                <p className="text-t7 text-fg-tertiary">← 이전 레슨</p>
                <p className="mt-1 truncate text-t6 font-semibold">{prev.title}</p>
              </Link>
            ) : (
              <span />
            )}
            {next && (
              <Link href={`/learn/${next.slug}`} className="rounded-lg bg-surface-subtle p-4 text-right hover:bg-line-subtle">
                <p className="text-t7 text-fg-tertiary">다음 레슨 →</p>
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
