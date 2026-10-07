import { writeNote, READ_ONLY } from "@/lib/notes";

// 새 자유 페이지 만들기 — @PostMapping("/api/notes")
export async function POST() {
  if (READ_ONLY) return Response.json({ message: "배포 사이트는 읽기 전용" }, { status: 403 });

  const now = new Date();
  const id = `p-${now.getTime()}`;
  await writeNote(
    { id, title: "제목 없음", lesson: null, blocks: [], updatedAt: now.toISOString() },
    "",
  );
  return Response.json({ id }, { status: 201 });
}
