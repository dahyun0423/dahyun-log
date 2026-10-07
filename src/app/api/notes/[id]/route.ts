import { isLoggedIn, unauthorized } from "@/lib/auth";
import { deleteNote, isValidId, moveNote, readNote, writeNote, type Note } from "@/lib/notes";

/*
 * 노트 API — Spring으로 치면
 *   @GetMapping("/api/notes/{id}")  → GET
 *   @PutMapping("/api/notes/{id}")  → PUT    (내용 저장)
 *   @PatchMapping("/api/notes/{id}") → PATCH  (다른 폴더로 옮기기)
 *   @DeleteMapping("/api/notes/{id}") → DELETE
 * 둘 다 로그인한 사람(나)만 가능
 */

export async function GET(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });

  const note = await readNote(id);
  if (!note) return Response.json({ message: "아직 없는 노트" }, { status: 404 });
  return Response.json(note);
}

type PutBody = Pick<Note, "title" | "lesson" | "blocks"> & { markdown: string };

export async function PUT(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });

  const body = (await req.json()) as PutBody;
  if (!Array.isArray(body.blocks) || typeof body.title !== "string") {
    return Response.json({ message: "blocks, title이 필요해요" }, { status: 400 });
  }

  const updatedAt = await writeNote(
    { id, title: body.title.trim() || "제목 없음", lesson: body.lesson ?? null, blocks: body.blocks },
    body.markdown ?? "",
  );
  return Response.json({ updatedAt });
}

// 다른 폴더로 옮기기  { folderId: "f-123" | null }
export async function PATCH(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  const { folderId } = (await req.json()) as { folderId: string | null };
  if (!isValidId(id) || (folderId !== null && !isValidId(folderId))) {
    return Response.json({ message: "잘못된 id" }, { status: 400 });
  }
  await moveNote(id, folderId);
  return Response.json({ ok: true });
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });
  await deleteNote(id);
  return Response.json({ ok: true });
}
