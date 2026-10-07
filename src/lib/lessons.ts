import fs from "node:fs";
import path from "node:path";
import type { CategorySlug } from "@/data/categories";

// 레슨 파일(src/content/lessons/*.mdx) 맨 위의 export const meta = {...}
export type LessonMeta = {
  title: string;
  week: number;
  order: number; // 같은 주 안에서의 순서
  category: CategorySlug;
  summary: string;
  minutes: number; // 예상 소요 시간
  goals: string[]; // "이 레슨을 마치면" 목록
  questions: string[]; // 노트 쪽에 미리 깔아줄 질문
};

export type Lesson = LessonMeta & { slug: string };

const LESSON_DIR = path.join(process.cwd(), "src/content/lessons");

// "_"로 시작하는 파일(템플릿)은 뺀다
export function getLessonSlugs(): string[] {
  return fs
    .readdirSync(LESSON_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export async function getLesson(slug: string) {
  const mod = (await import(`@/content/lessons/${slug}.mdx`)) as {
    default: React.ComponentType;
    meta: LessonMeta;
  };
  return { slug, Content: mod.default, ...mod.meta };
}

// 주차 → 순서대로 정렬
export async function getLessons(): Promise<Lesson[]> {
  const lessons = await Promise.all(
    getLessonSlugs().map(async (slug) => {
      const { meta } = (await import(`@/content/lessons/${slug}.mdx`)) as {
        meta: LessonMeta;
      };
      return { slug, ...meta };
    }),
  );
  return lessons.sort((a, b) => a.week - b.week || a.order - b.order);
}
