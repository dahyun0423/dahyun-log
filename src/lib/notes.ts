import fs from "node:fs";
import path from "node:path";

/*
 * 내 노트 저장소 — 레포의 notes/ 폴더에 파일로 저장한다.
 *   notes/<id>.json : 에디터가 다시 열 때 쓰는 원본 (블록 구조)
 *   notes/<id>.md   : GitHub에서 바로 읽히는 마크다운 사본
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

export const NOTES_DIR = path.join(process.cwd(), "notes");

// 배포 사이트(Vercel)는 파일을 쓸 수 없어서 읽기 전용
export const READ_ONLY = process.env.VERCEL === "1";

// id에 ../ 같은 게 들어오면 다른 폴더 파일을 건드릴 수 있다 → 소문자·숫자·하이픈만 허용
export function isValidId(id: string) {
  return /^[a-z0-9-]{1,80}$/.test(id);
}

const fileOf = (id: string, ext: "json" | "md") => path.join(NOTES_DIR, `${id}.${ext}`);

// 사이드바용 목록 (동기 읽기 → 빌드 때 미리 그릴 수 있음)
export function listNotes(): NoteSummary[] {
  if (!fs.existsSync(NOTES_DIR)) return [];
  return fs
    .readdirSync(NOTES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const { id, title, lesson, updatedAt } = JSON.parse(
        fs.readFileSync(path.join(NOTES_DIR, f), "utf8"),
      ) as Note;
      return { id, title, lesson, updatedAt };
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function readNote(id: string): Promise<Note | null> {
  try {
    return JSON.parse(await fs.promises.readFile(fileOf(id, "json"), "utf8")) as Note;
  } catch {
    return null; // 아직 안 쓴 노트
  }
}

export async function writeNote(note: Note, markdown: string) {
  await fs.promises.mkdir(NOTES_DIR, { recursive: true });
  await fs.promises.writeFile(fileOf(note.id, "json"), JSON.stringify(note, null, 2));
  await fs.promises.writeFile(fileOf(note.id, "md"), `# ${note.title}\n\n${markdown}`);
}
