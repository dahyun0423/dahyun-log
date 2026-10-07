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

type Sql = ReturnType<typeof postgres>;

/*
 * 요청마다 연결을 새로 열고, 끝나면 닫는다.
 * 서버리스(Vercel)는 요청 사이에 서버가 잠들었다 깨는데, 그 사이 DB 쪽이 연결을 끊어 버린다.
 * 연결을 계속 들고 있으면 "죽은 연결"에 쿼리를 보내고 답을 영원히 기다리게 된다 → 그래서 매번 새로.
 * (Supabase Transaction pooler 주소는 prepared statement를 못 써서 prepare: false)
 */
async function withDb<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
  const sql = postgres(process.env.DATABASE_URL!, {
    prepare: false,
    ssl: "require",
    max: 1,
    connect_timeout: 10, // 10초 안에 못 붙으면 포기 (무한 대기 방지)
    onnotice: () => {}, // "테이블 이미 있음" 같은 안내 메시지는 로그에 안 찍기
  });
  try {
    await ensureTable(sql);
    return await work(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

// 테이블이 없으면 만든다 — 한 번 성공하면 이 서버에선 다시 확인 안 함
let tableReady = false;
async function ensureTable(sql: Sql) {
  if (tableReady) return;
  await sql`
    CREATE TABLE IF NOT EXISTS notes (
      id         TEXT PRIMARY KEY,
      title      TEXT NOT NULL,
      lesson     TEXT,
      blocks     JSONB NOT NULL DEFAULT '[]',
      markdown   TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  tableReady = true;
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

export function listNotes(): Promise<NoteSummary[]> {
  return withDb(async (sql) => {
    const rows = (await sql`
      SELECT id, title, lesson, updated_at FROM notes ORDER BY updated_at DESC`) as unknown as Row[];
    return rows.map(toNote).map(({ id, title, lesson, updatedAt }) => ({ id, title, lesson, updatedAt }));
  });
}

export function readNote(id: string): Promise<Note | null> {
  return withDb(async (sql) => {
    const rows = (await sql`SELECT * FROM notes WHERE id = ${id}`) as unknown as Row[];
    return rows[0] ? toNote(rows[0]) : null;
  });
}

// 있으면 고치고 없으면 만든다 (upsert)
export function writeNote(note: Omit<Note, "updatedAt">, markdown: string): Promise<string> {
  return withDb(async (sql) => {
    const rows = (await sql`
      INSERT INTO notes (id, title, lesson, blocks, markdown, updated_at)
      VALUES (${note.id}, ${note.title}, ${note.lesson}, ${sql.json(note.blocks as postgres.JSONValue)}, ${markdown}, now())
      ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title, lesson = EXCLUDED.lesson, blocks = EXCLUDED.blocks,
        markdown = EXCLUDED.markdown, updated_at = now()
      RETURNING updated_at`) as unknown as { updated_at: string }[];
    return new Date(rows[0].updated_at).toISOString();
  });
}
