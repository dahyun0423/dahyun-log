// 환경 변수와 DB 연결을 "값을 보여주지 않고" 점검한다
//   실행: node --env-file=.env.local scripts/check-env.mjs
import postgres from "postgres";

const report = (name, ok, why = "") => console.log(`${ok ? "✅" : "❌"} ${name}${why ? " — " + why : ""}`);

for (const name of ["SITE_PASSWORD", "AUTH_SECRET", "DATABASE_URL"]) {
  const v = process.env[name];
  if (!v) { report(name, false, "없음"); continue; }
  if (v !== v.trim()) { report(name, false, "앞뒤에 공백이 있어요"); continue; }
  report(name, true, `${v.length}자`);
}

const url = process.env.DATABASE_URL ?? "";
if (url) {
  report("DB 주소: postgresql://로 시작", /^postgres(ql)?:\/\//.test(url));
  report("DB 주소: pooler 6543 포트", url.includes("pooler.supabase.com:6543"));
  report("DB 주소: /postgres로 끝남", url.endsWith("/postgres"));
  report("DB 주소: [YOUR-PASSWORD] 없음", !url.includes("[") && !url.includes("YOUR-PASSWORD"));

  try {
    const sql = postgres(url.trim(), { prepare: false, ssl: "require", max: 1, connect_timeout: 10 });
    await sql`select 1`;
    await sql.end();
    report("DB 연결", true);
  } catch (e) {
    // 에러 메시지엔 주소(비밀번호 포함)가 들어갈 수 있어서 코드만 출력
    report("DB 연결", false, `에러 코드 ${e?.code ?? "알 수 없음"}`);
  }
}
