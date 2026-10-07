import { createHmac, timingSafeEqual } from "node:crypto";

/*
 * 아주 작은 로그인 — 사용자는 나 하나, 비밀번호도 하나.
 *
 * 로그인에 성공하면 "세션 토큰"을 httpOnly 쿠키로 준다.
 *   토큰 = 내용(만료 시각) + "." + 서명
 *   서명 = 내용을 AUTH_SECRET으로 HMAC-SHA256 한 값
 * 서버만 AUTH_SECRET을 알기 때문에, 누가 쿠키를 고쳐도 서명이 안 맞아 거절된다. (JWT와 같은 원리)
 */

export const SESSION_COOKIE = "dahyun_session";
export const SESSION_DAYS = 30;

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET 환경 변수가 없어요");
  return s;
}

const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

// 길이가 달라도 시간 차이로 정답을 짐작 못 하게 비교 (timing attack 방지)
function safeEqual(a: string, b: string) {
  const ha = createHmac("sha256", "cmp").update(a).digest();
  const hb = createHmac("sha256", "cmp").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function checkPassword(input: string) {
  const answer = process.env.SITE_PASSWORD;
  if (!answer) return false;
  return safeEqual(input, answer);
}

export function createSessionToken() {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({ exp })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function isValidSession(token: string | undefined) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, "base64url").toString()) as { exp: number };
    return Date.now() < exp;
  } catch {
    return false;
  }
}

// Route Handler에서 쓰기: 요청 쿠키를 보고 로그인 여부 판단
export function isLoggedIn(req: Request) {
  const cookie = req.headers.get("cookie") ?? "";
  const token = cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);
  return isValidSession(token);
}

export const unauthorized = () => Response.json({ message: "로그인이 필요해요" }, { status: 401 });
