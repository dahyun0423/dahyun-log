// 9주 로드맵 — 당당 개발계획서 일정(2026.10.8 ~ 12.9)에 맞춤
export type Week = {
  week: number;
  period: string;
  theme: string;
  server: string; // 메인: 서버·인프라·AI
  frontend: string; // 부가: 이 사이트에 추가할 기능
};

export const roadmap: Week[] = [
  { week: 1, period: "10.8 – 10.14", theme: "기획 확정 · 환경 구성", server: "팀 GitHub(Org·규칙·템플릿)·공공데이터 키, HTTP·REST, Docker/Compose로 Spring·FastAPI·Postgres 띄우기", frontend: "디자인 토큰, 홈, MDX 글 1편, Vercel 배포" },
  { week: 2, period: "10.15 – 10.21", theme: "기반 기능", server: "JWT·httpOnly 쿠키, 카카오 OAuth, Flyway 마이그레이션", frontend: "글 목록을 날짜순·카테고리별로" },
  { week: 3, period: "10.22 – 10.28", theme: "기록 · 알림", server: "Redis 예약 큐, Web Push(VAPID), Service Worker", frontend: "카테고리 페이지 /category/[slug]" },
  { week: 4, period: "10.29 – 11.4", theme: "식사 기록 · AI 보조", server: "FastAPI, Structured Output, pgvector 음식명 매칭", frontend: "⌘K 검색 (클라이언트 상태)" },
  { week: 5, period: "11.5 – 11.11", theme: "정리 · 리포트 · 중간 데모", server: "트랜잭션·인덱스, 리포트 PDF, 평가 데이터", frontend: "용어집 페이지" },
  { week: 6, period: "11.12 – 11.18", theme: "진료 후 · 산후", server: "근거 검증기, 타임아웃·서킷 브레이커", frontend: "다크모드 토글, 퀴즈(useReducer)" },
  { week: 7, period: "11.19 – 11.25", theme: "사용자 테스트", server: "Nginx·HTTPS, GitHub Actions CI/CD", frontend: "SEO·OG 이미지, Lighthouse 개선" },
  { week: 8, period: "11.26 – 12.2", theme: "안정화", server: "블루그린 배포, 모니터링, k6 부하 테스트", frontend: "404·에러 페이지, Vitest 테스트" },
  { week: 9, period: "12.3 – 12.9", theme: "마무리", server: "결과 보고서, API 명세, 시연", frontend: "9주 회고 글" },
];
