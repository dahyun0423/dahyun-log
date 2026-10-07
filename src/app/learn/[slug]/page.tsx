import { Suspense } from "react";
import { notFound } from "next/navigation";
import Tag from "@/components/Tag";
import LearnSplit from "@/components/LearnSplit";
import LazyNoteEditor from "@/components/note/LazyNoteEditor";
import { categories } from "@/data/categories";
import { getLesson, getLessonSlugs } from "@/lib/lessons";
import { READ_ONLY } from "@/lib/notes";

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

  return (
    <LearnSplit
      lesson={
        <article className="px-6 py-8 md:px-12">
          <div className="flex items-center gap-2">
            <Tag>{categories.find((c) => c.slug === lesson.category)?.name}</Tag>
            <span className="text-t7 text-fg-tertiary">{lesson.week}주차 레슨</span>
          </div>
          <h1 className="mt-3 text-t2 font-bold tracking-[-0.02em]">{lesson.title}</h1>
          <p className="mt-2 text-t5 text-fg-tertiary">{lesson.summary}</p>
          <hr className="my-6 border-line-subtle" />
          <Content />
        </article>
      }
      note={
        <LazyNoteEditor
          id={slug}
          lesson={slug}
          defaultTitle={lesson.title}
          titleEditable={false}
          questions={lesson.questions}
          readOnly={READ_ONLY}
        />
      }
    />
  );
}

export function generateStaticParams() {
  return getLessonSlugs().map((slug) => ({ slug }));
}
