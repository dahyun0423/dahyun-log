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
  folderId: string | null; // 들어 있는 폴더 (맨 바깥이면 null)
  blocks: unknown[];
  updatedAt: string;
};

export type NoteSummary = Pick<Note, "id" | "title" | "lesson" | "folderId" | "updatedAt">;

// 옵시디언 폴더처럼 — 폴더 안에 폴더도 둘 수 있다
export type Folder = { id: string; name: string; parentId: string | null };

type Sql = ReturnType<typeof postgres>;

/*
 * 요청마다 연결을 새로 열고, 끝나면 닫는다.
 * 서버리스(Vercel)는 요청 사이에 서버가 잠들었다 깨는데, 그 사이 DB 쪽이 연결을 끊어 버린다.
 * 연결을 계속 들고 있으면 "죽은 연결"에 쿼리를 보내고 답을 영원히 기다리게 된다 → 그래서 매번 새로.
 * (Supabase Transaction pooler 주소는 prepared statement를 못 써서 prepare: false)
 */
export async function withDb<T>(work: (sql: Sql) => Promise<T>): Promise<T> {
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
  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      parent_id  TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  // 처음엔 없던 칸이라 나중에 추가 (이미 있으면 건너뜀)
  await sql`ALTER TABLE notes ADD COLUMN IF NOT EXISTS folder_id TEXT`;
  // 퀴즈 복습 기록 — 문제마다 상자 번호와 다음 복습 날짜
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_progress (
      id         TEXT PRIMARY KEY,
      box        INT NOT NULL DEFAULT 1,
      due_at     TIMESTAMPTZ NOT NULL,
      correct    INT NOT NULL DEFAULT 0,
      wrong      INT NOT NULL DEFAULT 0,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`;
  tableReady = true;
}

// id에 ../ 같은 이상한 값이 들어오는 걸 막는다 → 소문자·숫자·하이픈만 허용
export function isValidId(id: string) {
  return /^[a-z0-9-]{1,80}$/.test(id);
}

type Row = {
  id: string;
  title: string;
  lesson: string | null;
  folder_id: string | null;
  blocks?: unknown[];
  updated_at: string;
};

const toNote = (r: Row): Note => ({
  id: r.id,
  title: r.title,
  lesson: r.lesson,
  folderId: r.folder_id ?? null,
  blocks: r.blocks ?? [],
  updatedAt: new Date(r.updated_at).toISOString(),
});

export function listNotes(): Promise<NoteSummary[]> {
  return withDb(async (sql) => {
    const rows = (await sql`
      SELECT id, title, lesson, folder_id, updated_at FROM notes ORDER BY updated_at DESC`) as unknown as Row[];
    return rows.map(toNote).map(({ id, title, lesson, folderId, updatedAt }) => ({ id, title, lesson, folderId, updatedAt }));
  });
}

export function readNote(id: string): Promise<Note | null> {
  return withDb(async (sql) => {
    const rows = (await sql`SELECT * FROM notes WHERE id = ${id}`) as unknown as Row[];
    return rows[0] ? toNote(rows[0]) : null;
  });
}

// 있으면 고치고 없으면 만든다 (upsert)
// 내용 저장 — 폴더 위치는 건드리지 않는다 (옮기기는 moveNote)
export function writeNote(note: Omit<Note, "updatedAt" | "folderId">, markdown: string): Promise<string> {
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

// 새 자유 페이지 (폴더 안에 만들 수도 있다)
export function createNote(folderId: string | null): Promise<string> {
  const id = `p-${Date.now()}`;
  return withDb(async (sql) => {
    await sql`INSERT INTO notes (id, title, folder_id) VALUES (${id}, ${"제목 없음"}, ${folderId})`;
    return id;
  });
}

// 페이지를 다른 폴더로 옮기기 (null = 맨 바깥)
export function moveNote(id: string, folderId: string | null) {
  return withDb((sql) => sql`UPDATE notes SET folder_id = ${folderId} WHERE id = ${id}`);
}

export function deleteNote(id: string) {
  return withDb((sql) => sql`DELETE FROM notes WHERE id = ${id}`);
}

/* ---------- 폴더 ---------- */

type FolderRow = { id: string; name: string; parent_id: string | null };

export function listFolders(): Promise<Folder[]> {
  return withDb(async (sql) => {
    const rows = (await sql`SELECT id, name, parent_id FROM folders ORDER BY name`) as unknown as FolderRow[];
    return rows.map((r) => ({ id: r.id, name: r.name, parentId: r.parent_id }));
  });
}

export function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const id = `f-${Date.now()}`;
  return withDb(async (sql) => {
    await sql`INSERT INTO folders (id, name, parent_id) VALUES (${id}, ${name}, ${parentId})`;
    return { id, name, parentId };
  });
}

// 이름 바꾸기 / 다른 폴더 안으로 옮기기
export function updateFolder(id: string, change: { name?: string; parentId?: string | null }) {
  return withDb(async (sql) => {
    if (change.name !== undefined) await sql`UPDATE folders SET name = ${change.name} WHERE id = ${id}`;
    if (change.parentId !== undefined) {
      // 자기 자신이나 자기 하위 폴더 안으로는 못 옮긴다 (빙글빙글 도는 구조가 됨)
      let cursor = change.parentId;
      while (cursor) {
        if (cursor === id) throw new Error("자기 안으로는 옮길 수 없어요");
        const [row] = (await sql`SELECT parent_id FROM folders WHERE id = ${cursor}`) as unknown as FolderRow[];
        cursor = row?.parent_id ?? null;
      }
      await sql`UPDATE folders SET parent_id = ${change.parentId} WHERE id = ${id}`;
    }
  });
}

// 폴더 지우기 — 안에 있던 페이지와 하위 폴더는 한 칸 바깥으로 꺼낸다 (내용은 안 지움)
export function deleteFolder(id: string) {
  return withDb(async (sql) => {
    const [row] = (await sql`SELECT parent_id FROM folders WHERE id = ${id}`) as unknown as FolderRow[];
    const parent = row?.parent_id ?? null;
    await sql.begin(async (tx) => {
      await tx`UPDATE notes SET folder_id = ${parent} WHERE folder_id = ${id}`;
      await tx`UPDATE folders SET parent_id = ${parent} WHERE parent_id = ${id}`;
      await tx`DELETE FROM folders WHERE id = ${id}`;
    });
  });
}
