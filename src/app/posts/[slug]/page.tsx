import Link from "next/link";
import { notFound } from "next/navigation";
import Tag from "@/components/Tag";
import { categories } from "@/data/categories";
import { getSlugs, type PostMeta } from "@/lib/posts";

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params;
  // 없는 글 주소면 404
  if (!getSlugs().includes(slug)) notFound();

  const { default: Content, meta } = (await import(`@/content/${slug}.mdx`)) as {
    default: React.ComponentType;
    meta: PostMeta;
  };
  const category = categories.find((c) => c.slug === meta.category);

  return (
    <article className="pt-12">
      <Link href="/" className="text-t6 font-semibold text-fg-tertiary hover:text-fg">
        ← 목록
      </Link>
      <div className="mt-6 flex items-center gap-2">
        <Tag>{category?.name}</Tag>
        <span className="text-t7 text-fg-tertiary">
          {meta.week}주차 · {meta.date}
        </span>
      </div>
      <h1 className="mt-3 text-t1 font-bold tracking-[-0.02em]">{meta.title}</h1>
      <p className="mt-3 text-t5 text-fg-tertiary">{meta.summary}</p>
      <hr className="my-8 border-line-subtle" />
      <Content />
    </article>
  );
}

// 빌드할 때 모든 글을 미리 HTML로 만든다
export function generateStaticParams() {
  return getSlugs().map((slug) => ({ slug }));
}
