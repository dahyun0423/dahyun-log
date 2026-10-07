import Link from "next/link";
import Tag from "@/components/Tag";
import { categories } from "@/data/categories";
import { roadmap } from "@/data/roadmap";
import { getLessons } from "@/lib/lessons";
import { listNotes } from "@/lib/notes";

export default async function Home() {
  const lessons = await getLessons();
  const notes = listNotes();

  const noted = new Set(notes.filter((n) => n.lesson).map((n) => n.lesson));
  // 이어서 할 레슨 = 아직 노트를 안 쓴 첫 레슨
  const next = lessons.find((l) => !noted.has(l.slug));
  const week = next?.week ?? lessons.at(-1)?.week ?? 1;
  const thisWeek = roadmap.find((w) => w.week === week);
  const recent = notes.slice(0, 5);

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-10">
      <Tag>{week}주차</Tag>
      <h1 className="mt-3 text-t1 font-bold tracking-[-0.02em]">{thisWeek?.theme}</h1>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "레슨", value: `${lessons.length}개` },
          { label: "노트 쓴 레슨", value: `${noted.size}개` },
          { label: "내 페이지", value: `${notes.length - noted.size}개` },
        ].map((s) => (
          <div key={s.label} className="rounded-lg bg-surface-subtle p-4">
            <p className="text-t7 text-fg-tertiary">{s.label}</p>
            <p className="mt-1 text-t3 font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {next && (
        <Link
          href={`/learn/${next.slug}`}
          className="mt-8 block rounded-xl bg-primary p-6 text-fg-on-primary transition-transform duration-100 active:scale-[0.98]"
        >
          <p className="text-t7 font-semibold opacity-80">이어서 하기</p>
          <p className="mt-1 text-t3 font-bold">{next.title}</p>
          <p className="mt-1 text-t6 opacity-90">{next.summary}</p>
        </Link>
      )}

      <h2 className="mt-12 text-t4 font-bold">이번 주 레슨</h2>
      <ul className="mt-2">
        {lessons
          .filter((l) => l.week === week)
          .map((l) => (
            <li key={l.slug}>
              <Link
                href={`/learn/${l.slug}`}
                className="-mx-3 flex items-center gap-3 rounded-lg px-3 py-3 hover:bg-surface-subtle"
              >
                <span className={`size-2 shrink-0 rounded-full ${noted.has(l.slug) ? "bg-primary" : "bg-line-strong"}`} />
                <span className="flex-1">
                  <span className="block text-t5 font-semibold">{l.title}</span>
                  <span className="block text-t7 text-fg-tertiary">
                    {categories.find((c) => c.slug === l.category)?.name} · {l.summary}
                  </span>
                </span>
              </Link>
            </li>
          ))}
      </ul>

      <h2 className="mt-12 text-t4 font-bold">최근 기록</h2>
      {recent.length === 0 ? (
        <p className="mt-3 rounded-lg bg-surface-subtle p-5 text-t6 text-fg-tertiary">
          아직 기록이 없어요. 레슨을 열고 오른쪽 노트에 써보세요.
        </p>
      ) : (
        <ul className="mt-2">
          {recent.map((n) => (
            <li key={n.id}>
              <Link
                href={n.lesson ? `/learn/${n.lesson}` : `/pages/${n.id}`}
                className="-mx-3 flex justify-between rounded-lg px-3 py-3 text-t5 hover:bg-surface-subtle"
              >
                <span className="truncate font-semibold">{n.title}</span>
                <span className="shrink-0 text-t7 text-fg-tertiary">{n.updatedAt.slice(0, 10)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
