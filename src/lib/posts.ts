import fs from "node:fs";
import path from "node:path";
import type { CategorySlug } from "@/data/categories";

// 글 파일(src/content/*.mdx) 맨 위에 export const meta = {...} 로 적는 정보
export type PostMeta = {
  title: string;
  date: string; // "2026-10-08"
  category: CategorySlug;
  week: number;
  summary: string;
};

export type Post = PostMeta & { slug: string };

const CONTENT_DIR = path.join(process.cwd(), "src/content");

// "_"로 시작하는 파일(템플릿)은 목록에서 뺀다
export function getSlugs(): string[] {
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((file) => file.endsWith(".mdx") && !file.startsWith("_"))
    .map((file) => file.replace(/\.mdx$/, ""));
}

export async function getPosts(): Promise<Post[]> {
  const posts = await Promise.all(
    getSlugs().map(async (slug) => {
      const { meta } = (await import(`@/content/${slug}.mdx`)) as {
        meta: PostMeta;
      };
      return { slug, ...meta };
    }),
  );
  // 최신 글이 위로
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
