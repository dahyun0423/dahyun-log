import postgres from "postgres";

/*
 * 내 노트 저장소 — Supabase Postgres의 notes 테이블.
 * 로컬(localhost)과 배포 사이트가 같은 DB를 쓰기 때문에 어디서 써도 같은 노트가 보인다.
 * 레슨 노트의 id = 레슨 slug, 자유 페이지의 id = "p-" + 숫자
 */
export type Note = {
  id: string;
  title: string;
  lesson: string | null; // 연결된 레슨 slug (자유 페이지면 null)
  blocks: unknown[];
  updatedAt: string;
};

export type NoteSummary = Pick<Note, "id" | "title" | "lesson" | "updatedAt">;

// DB 연결은 처음 쓸 때 만든다 (빌드할 때 DATABASE_URL이 없어도 안 터지게)
// Supabase "Transaction pooler" 주소(포트 6543)는 prepared statement를 못 써서 prepare: false
let client: ReturnType<typeof postgres> | null = null;
function sql() {
  if (!client) client = postgres(process.env.DATABASE_URL!, { prepare: false, ssl: "require", max: 1 });
  return client;
}

// 테이블이 없으면 만든다 — 서버가 뜬 뒤 한 번만
let ready: Promise<unknown> | null = null;
function ensureTable() {
  ready ??= sql()`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      lesson     TEXT,
      blocks     JSONB NOT NULL DEFAULT '[]',
      markdown   TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`.catch((e) => {
    ready = null; // 실패하면 다음 요청 때 다시 시도
    throw e;
  });
  return ready;
}

// id에 ../ 같은 이상한 값이 들어오는 걸 막는다 → 소문자·숫자·하이픈만 허용
export function isValidId(id: string) {
  return /^[a-z0-9-]{1,80}$/.test(id);
}

type Row = { id: string; title: string; lesson: string | null; blocks?: unknown[]; updated_at: string };

const toNote = (r: Row): Note => ({
  id: r.id,
  title: r.title,
  lesson: r.lesson,
  blocks: r.blocks ?? [],
  updatedAt: new Date(r.updated_at).toISOString(),
});

export async function listNotes(): Promise<NoteSummary[]> {
  await ensureTable();
  const rows = (await sql()`
    SELECT id, title, lesson, updated_at FROM notes ORDER BY updated_at DESC`) as unknown as Row[];
  return rows.map(toNote).map(({ id, title, lesson, updatedAt }) => ({ id, title, lesson, updatedAt }));
}

export async function readNote(id: string): Promise<Note | null> {
  await ensureTable();
  const rows = (await sql()`SELECT * FROM notes WHERE id = ${id}`) as unknown as Row[];
  return rows[0] ? toNote(rows[0]) : null;
}

// 있으면 고치고 없으면 만든다 (upsert)
export async function writeNote(note: Omit<Note, "updatedAt">, markdown: string) {
  await ensureTable();
  const rows = (await sql()`
    INSERT INTO notes (id, title, lesson, blocks, markdown, updated_at)
    VALUES (${note.id}, ${note.title}, ${note.lesson}, ${sql().json(note.blocks as postgres.JSONValue)}, ${markdown}, now())
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title, lesson = EXCLUDED.lesson, blocks = EXCLUDED.blocks,
      markdown = EXCLUDED.markdown, updated_at = now()
    RETURNING updated_at`) as unknown as { updated_at: string }[];
  return new Date(rows[0].updated_at).toISOString();
}
