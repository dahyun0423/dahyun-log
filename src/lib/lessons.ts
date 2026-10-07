import fs from "node:fs";
import path from "node:path";
import { basicsTopics, type BasicsTopic } from "@/data/basics";
import type { CategorySlug } from "@/data/categories";
import type { QuizItem } from "@/data/quiz";

// 레슨 파일(src/content/lessons/*.mdx) 맨 위의 export const meta = {...}
export type LessonMeta = {
  title: string;
  track?: "main" | "basics"; // main = 9주 레슨(기본), basics = 기초 카드
  topic?: BasicsTopic; // 기초 카드의 주제
  born?: string; // 이 레슨이 생긴 이유 — 내가 실제로 막힌 장면
  week: number;
  order: number; // 같은 주 안에서의 순서
  category: CategorySlug;
  summary: string;
  minutes: number; // 예상 소요 시간
  goals: string[]; // "이 레슨을 마치면" 목록
  questions: string[]; // 노트 쪽에 미리 깔아줄 질문
  quiz?: QuizItem[]; // 레슨 끝 확인 퀴즈 (복습 일정에 들어감)
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

// 9주 레슨은 주차 → 순서, 기초 카드는 순서대로
export async function getLessons(): Promise<Lesson[]> {
  const lessons = await Promise.all(
    getLessonSlugs().map(async (slug) => {
      const { meta } = (await import(`@/content/lessons/${slug}.mdx`)) as {
        meta: LessonMeta;
      };
      return { slug, ...meta };
    }),
  );
  // 기초 카드는 주제 순서(개발자 도구 → 개발 기초 → 협업)대로
  const topicRank = (l: Lesson) => basicsTopics.findIndex((t) => t.slug === l.topic);
  return lessons.sort((a, b) => a.week - b.week || topicRank(a) - topicRank(b) || a.order - b.order);
}

export { isBasics } from "@/data/basics";
