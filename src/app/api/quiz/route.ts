import { isLoggedIn, unauthorized } from "@/lib/auth";
import { listProgress, recordAnswer } from "@/lib/progress";

// 내 복습 기록 전체 — @GetMapping("/api/quiz")
export async function GET(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  return Response.json(await listProgress());
}

// 답 하나 기록 — @PostMapping("/api/quiz")  { id: "w1-02-http:q0", correct: true }
export async function POST(req: Request) {
  if (!isLoggedIn(req)) return unauthorized();
  const { id, correct } = (await req.json()) as { id?: string; correct?: boolean };
  if (typeof id !== "string" || !/^[a-z0-9:-]{1,100}$/.test(id) || typeof correct !== "boolean") {
    return Response.json({ message: "id, correct가 필요해요" }, { status: 400 });
  }
  return Response.json(await recordAnswer(id, correct));
}
