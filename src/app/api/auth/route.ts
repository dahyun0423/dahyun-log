import { checkPassword, createSessionToken, isLoggedIn, SESSION_COOKIE, SESSION_DAYS } from "@/lib/auth";

// 지금 로그인 상태인가?  GET /api/auth
export async function GET(req: Request) {
  return Response.json({ loggedIn: isLoggedIn(req) });
}

// 로그인  POST /api/auth  { password }
export async function POST(req: Request) {
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  if (typeof password !== "string" || !checkPassword(password)) {
    return Response.json({ message: "비밀번호가 틀렸어요" }, { status: 401 });
  }
  const cookie = [
    `${SESSION_COOKIE}=${createSessionToken()}`,
    "Path=/",
    "HttpOnly", // 자바스크립트로 못 읽음 → XSS로 훔치기 어려움
    "SameSite=Lax", // 다른 사이트에서 몰래 보낸 요청엔 안 실림 → CSRF 완화
    `Max-Age=${SESSION_DAYS * 24 * 60 * 60}`,
    process.env.NODE_ENV === "production" ? "Secure" : "", // 배포에선 HTTPS로만
  ]
    .filter(Boolean)
    .join("; ");
  return Response.json({ loggedIn: true }, { headers: { "Set-Cookie": cookie } });
}

// 로그아웃  DELETE /api/auth
export async function DELETE() {
  return Response.json(
    { loggedIn: false },
    { headers: { "Set-Cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` } },
  );
}
