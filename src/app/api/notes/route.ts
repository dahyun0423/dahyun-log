import { isLoggedIn, unauthorized } from "@/lib/auth";
import { listNotes, writeNote } from "@/lib/notes";

// 내 노트 목록 — @GetMapping("/api/notes")
export async function GET(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  return Response.json(await listNotes());
}

// 새 자유 페이지 만들기 — @PostMapping("/api/notes")
export async function POST(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  const id = `p-${Date.now()}`;
  await writeNote({ id, title: "제목 없음", lesson: null, blocks: [] }, "");
  return Response.json({ id }, { status: 201 });
}
