import fs from "node:fs";
import path from "node:path";
import type { Question } from "@/data/quiz";
import { getLessons } from "@/lib/lessons";

/*
 * 문제 은행 만들기
 *   1) 레슨 meta.quiz — 직접 쓴 문제
 *   2) <Diagnosis> — "이 증상의 처방은?" (다른 레슨의 처방을 오답으로)
 *   3) <Analogy> — "병원의 ○○는 웹에서?" (다른 비유를 오답으로)
 * 레슨이 늘면 2)·3) 문제도 저절로 늘어난다.
 */

const LESSON_DIR = path.join(process.cwd(), "src/content/lessons");

// 같은 문제는 항상 같은 오답이 나오도록 id로 정해지는 난수
function seeded(id: string) {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

function pickOthers<T>(pool: T[], exclude: T, n: number, id: string): T[] {
  const rand = seeded(id);
  const rest = [...new Set(pool.filter((x) => x !== exclude))];
  const out: T[] = [];
  while (out.length < n && rest.length) out.push(rest.splice(Math.floor(rand() * rest.length), 1)[0]);
  return out;
}

const attr = (src: string, name: string) => src.match(new RegExp(`${name}="([^"]+)"`))?.[1];

export async function getQuestionBank(): Promise<Question[]> {
  const lessons = await getLessons();
  const raw = new Map(lessons.map((l) => [l.slug, fs.readFileSync(path.join(LESSON_DIR, `${l.slug}.mdx`), "utf8")]));

  // 레슨마다 진단서·비유 카드 뽑기
  const diagnoses = lessons.flatMap((l) => {
    const block = raw.get(l.slug)!.match(/<Diagnosis[\s\S]*?\/>/)?.[0];
    const symptom = block && attr(block, "symptom");
    const fix = block && attr(block, "fix");
    return symptom && fix ? [{ slug: l.slug, title: l.title, symptom, fix }] : [];
  });
  const analogies = lessons.flatMap((l) =>
    [...raw.get(l.slug)!.matchAll(/\{\s*from:\s*"([^"]+)",\s*to:\s*"([^"]+)",\s*desc:\s*"([^"]+)"\s*\}/g)].map((m, i) => ({
      slug: l.slug,
      title: l.title,
      i,
      from: m[1],
      to: m[2],
      desc: m[3],
    })),
  );

  const bank: Question[] = [];

  for (const l of lessons) {
    (l.quiz ?? []).forEach((item, i) =>
      bank.push({ ...item, id: `${l.slug}:q${i}`, slug: l.slug, lessonTitle: l.title, kind: "hand" }),
    );
  }

  for (const d of diagnoses) {
    const id = `${d.slug}:d`;
    const wrong = pickOthers(diagnoses.map((x) => x.fix), d.fix, 3, id);
    if (wrong.length < 2) continue;
    bank.push({
      id,
      slug: d.slug,
      lessonTitle: d.title,
      kind: "diagnosis",
      q: `🩺 증상: "${d.symptom}" — 알맞은 처방은?`,
      choices: [d.fix, ...wrong],
      answer: 0,
      why: `「${d.title}」의 진단서 처방이다.`,
    });
  }

  for (const a of analogies) {
    const id = `${a.slug}:a${a.i}`;
    const wrong = pickOthers(analogies.map((x) => x.to), a.to, 3, id);
    if (wrong.length < 2) continue;
    bank.push({
      id,
      slug: a.slug,
      lessonTitle: a.title,
      kind: "analogy",
      q: `🗺 비유: "${a.from}"에 해당하는 것은?`,
      choices: [a.to, ...wrong],
      answer: 0,
      why: a.desc,
    });
  }

  return bank;
}
