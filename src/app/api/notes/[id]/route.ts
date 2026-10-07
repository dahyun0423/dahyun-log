import { isValidId, readNote, writeNote, READ_ONLY, type Note } from "@/lib/notes";

/*
 * 노트 API — Spring으로 치면
 *   @GetMapping("/api/notes/{id}")  → GET
 *   @PutMapping("/api/notes/{id}")  → PUT
 */

export async function GET(_req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });

  const note = await readNote(id);
  if (!note) return Response.json({ message: "아직 없는 노트" }, { status: 404 });
  return Response.json(note);
}

type PutBody = Pick<Note, "title" | "lesson" | "blocks"> & { markdown: string };

export async function PUT(req: Request, ctx: RouteContext<"/api/notes/[id]">) {
  if (READ_ONLY) return Response.json({ message: "배포 사이트는 읽기 전용" }, { status: 403 });

  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });

  const body = (await req.json()) as PutBody;
  if (!Array.isArray(body.blocks) || typeof body.title !== "string") {
    return Response.json({ message: "blocks, title이 필요해요" }, { status: 400 });
  }

  const note: Note = {
    id,
    title: body.title.trim() || "제목 없음",
    lesson: body.lesson ?? null,
    blocks: body.blocks,
    updatedAt: new Date().toISOString(),
  };
  await writeNote(note, body.markdown ?? "");
  return Response.json({ updatedAt: note.updatedAt });
}
