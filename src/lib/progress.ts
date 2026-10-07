import { nextSchedule, type Progress } from "@/data/quiz";
import { withDb } from "@/lib/notes";

type Row = { id: string; box: number; due_at: string; correct: number; wrong: number };
const toProgress = (r: Row): Progress => ({
  id: r.id,
  box: r.box,
  dueAt: new Date(r.due_at).toISOString(),
  correct: r.correct,
  wrong: r.wrong,
});

export function listProgress(): Promise<Progress[]> {
  return withDb(async (sql) => {
    const rows = (await sql`SELECT id, box, due_at, correct, wrong FROM quiz_progress`) as unknown as Row[];
    return rows.map(toProgress);
  });
}

// 답 하나 기록 → 다음 복습 날짜 계산
export function recordAnswer(id: string, correct: boolean): Promise<Progress> {
  return withDb(async (sql) => {
    const [prev] = (await sql`SELECT id, box, due_at, correct, wrong FROM quiz_progress WHERE id = ${id}`) as unknown as Row[];
    const { box, dueAt } = nextSchedule(prev ?? null, correct);
    const [row] = (await sql`
      INSERT INTO quiz_progress (id, box, due_at, correct, wrong, updated_at)
      VALUES (${id}, ${box}, ${dueAt}, ${correct ? 1 : 0}, ${correct ? 0 : 1}, now())
      ON CONFLICT (id) DO UPDATE SET
        box = EXCLUDED.box, due_at = EXCLUDED.due_at,
        correct = quiz_progress.correct + EXCLUDED.correct,
        wrong = quiz_progress.wrong + EXCLUDED.wrong,
        updated_at = now()
      RETURNING id, box, due_at, correct, wrong`) as unknown as Row[];
    return toProgress(row);
  });
}
