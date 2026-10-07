import { isLoggedIn, unauthorized } from "@/lib/auth";
import { deleteFolder, isValidId, updateFolder } from "@/lib/notes";

// 이름 바꾸기 / 옮기기 — @PatchMapping("/api/folders/{id}")  { name?, parentId? }
export async function PATCH(req: Request, ctx: RouteContext<"/api/folders/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  const body = (await req.json()) as { name?: string; parentId?: string | null };
  if (!isValidId(id) || (body.parentId && !isValidId(body.parentId))) {
    return Response.json({ message: "잘못된 id" }, { status: 400 });
  }
  const name = body.name?.trim();
  if (body.name !== undefined && !name) return Response.json({ message: "이름이 비었어요" }, { status: 400 });
  try {
    await updateFolder(id, { name: name?.slice(0, 60), parentId: body.parentId });
  } catch (e) {
    return Response.json({ message: (e as Error).message }, { status: 400 });
  }
  return Response.json({ ok: true });
}

// 폴더 지우기 — 안의 페이지는 지우지 않고 바깥으로 꺼낸다
export async function DELETE(req: Request, ctx: RouteContext<"/api/folders/[id]">) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id } = await ctx.params;
  if (!isValidId(id)) return Response.json({ message: "잘못된 id" }, { status: 400 });
  await deleteFolder(id);
  return Response.json({ ok: true });
}
