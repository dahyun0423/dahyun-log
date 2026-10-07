import { isLoggedIn, unauthorized } from "@/lib/auth";
import { createNote, isValidId, listNotes } from "@/lib/notes";

// 내 노트 목록 — @GetMapping("/api/notes")
export async function GET(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  return Response.json(await listNotes());
}

// 새 자유 페이지 만들기 — @PostMapping("/api/notes")  { folderId?: "f-123" }
export async function POST(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  const { folderId = null } = (await req.json().catch(() => ({}))) as { folderId?: string | null };
  if (folderId !== null && !isValidId(folderId)) return Response.json({ message: "잘못된 폴더" }, { status: 400 });
  const id = await createNote(folderId);
  return Response.json({ id }, { status: 201 });
}
