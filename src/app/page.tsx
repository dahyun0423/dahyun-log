import Link from "next/link";
import Tag from "@/components/Tag";
import { categories } from "@/data/categories";
import { roadmap } from "@/data/roadmap";
import { getPosts } from "@/lib/posts";

const principles = [
  { title: "확인한 것만", body: "버전·수치·날짜는 공식 문서를 찾아 확인하고 출처를 남긴다." },
  { title: "막힌 것도 같이", body: "된 것만 쓰지 않는다. 에러와 헤맨 과정, 아직 모르는 것을 함께 적는다." },
  { title: "당당에 붙여서", body: "개념을 공중에 띄우지 않고, 당당의 어느 코드에 쓰였는지로 설명한다." },
];

export default async function Home() {
  const posts = await getPosts();
  // 진행 중 주차 = 가장 최근 글의 주차 (글을 써야 진도가 나간다)
  const week = posts[0]?.week ?? 1;

  return (
    <>
      {/* Hero */}
      <section className="pt-16 pb-12">
        <Tag>{week}주차 진행 중</Tag>
        <h1 className="mt-4 text-t1 font-bold tracking-[-0.02em]">
          모르는 것을
          <br />
          하나씩 채웁니다
        </h1>
        <p className="mt-4 text-t5 text-fg-secondary">
          임신성 당뇨 관리 서비스 <strong className="text-fg">당당</strong>을 만들면서
          서버·인프라·AI를 중심으로 공부한 9주의 기록입니다.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-3">
          {[
            { label: "쓴 글", value: `${posts.length}편` },
            { label: "진행", value: `${week} / 9주` },
            { label: "주제", value: `${categories.length}개` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-surface-subtle p-4">
              <p className="text-t7 text-fg-tertiary">{s.label}</p>
              <p className="mt-1 text-t3 font-bold">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 최근 글 */}
      <section className="py-8">
        <h2 className="text-t4 font-bold">최근 글</h2>
        {posts.length === 0 ? (
          <p className="mt-4 rounded-lg bg-surface-subtle p-5 text-t6 text-fg-tertiary">
            아직 쓴 글이 없어요. src/content/_template.mdx를 복사해서 첫 글을 써보세요.
          </p>
        ) : (
          <ul className="mt-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/posts/${post.slug}`}
                  className="-mx-3 block rounded-lg px-3 py-4 transition-colors duration-100 hover:bg-surface-subtle active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2">
                    <Tag tone="neutral">
                      {categories.find((c) => c.slug === post.category)?.name}
                    </Tag>
                    <span className="text-t7 text-fg-tertiary">
                      {post.week}주차 · {post.date}
                    </span>
                  </div>
                  <p className="mt-2 text-t5 font-semibold">{post.title}</p>
                  <p className="mt-1 text-t6 text-fg-tertiary">{post.summary}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 주제 */}
      <section className="py-8">
        <h2 className="text-t4 font-bold">주제</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {categories.map((c, i) => {
            const count = posts.filter((p) => p.category === c.slug).length;
            return (
              <div
                key={c.slug}
                id={c.slug}
                className="scroll-mt-20 rounded-lg border border-line-subtle p-5"
              >
                <div className="flex items-center justify-between">
                  <p className="text-t5 font-bold">{c.name}</p>
                  {i < 3 ? <Tag>메인</Tag> : <Tag tone="neutral">부가</Tag>}
                </div>
                <p className="mt-1 text-t6 text-fg-tertiary">{c.description}</p>
                <p className="mt-3 text-t7 font-semibold text-fg-secondary">{count}편</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* 9주 로드맵 */}
      <section className="py-8">
        <h2 className="text-t4 font-bold">9주 로드맵</h2>
        <ol className="mt-4 space-y-2">
          {roadmap.map((w) => {
            const isNow = w.week === week;
            const isDone = w.week < week;
            return (
              <li
                key={w.week}
                className={`rounded-lg p-4 ${isNow ? "bg-primary-subtle" : "bg-surface-subtle"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-t6 font-bold ${isNow ? "text-primary-strong" : ""}`}>
                    {w.week}주차
                  </span>
                  <span className="text-t7 text-fg-tertiary">{w.period}</span>
                  {isDone && <Tag tone="success">완료</Tag>}
                </div>
                <p className="mt-1 text-t5 font-semibold">{w.theme}</p>
                <p className="mt-2 text-t6 text-fg-secondary">
                  <span className="font-semibold text-fg">서버·인프라·AI</span> {w.server}
                </p>
                <p className="mt-0.5 text-t6 text-fg-tertiary">
                  <span className="font-semibold">프론트</span> {w.frontend}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* 쓰는 방식 */}
      <section className="py-8">
        <h2 className="text-t4 font-bold">쓰는 방식</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {principles.map((p) => (
            <div key={p.title} className="rounded-lg border border-line-subtle p-5">
              <p className="text-t5 font-bold">{p.title}</p>
              <p className="mt-2 text-t6 text-fg-tertiary">{p.body}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
