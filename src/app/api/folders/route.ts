import { isLoggedIn, unauthorized } from "@/lib/auth";
import { createFolder, isValidId, listFolders } from "@/lib/notes";

// 폴더 목록 — @GetMapping("/api/folders")
export async function GET(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  return Response.json(await listFolders());
}

// 폴더 만들기 — @PostMapping("/api/folders")  { name, parentId? }
export async function POST(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  const { name, parentId = null } = (await req.json()) as { name?: string; parentId?: string | null };
  const clean = name?.trim();
  if (!clean) return Response.json({ message: "폴더 이름이 필요해요" }, { status: 400 });
  if (parentId !== null && !isValidId(parentId)) return Response.json({ message: "잘못된 상위 폴더" }, { status: 400 });
  return Response.json(await createFolder(clean.slice(0, 60), parentId), { status: 201 });
}
