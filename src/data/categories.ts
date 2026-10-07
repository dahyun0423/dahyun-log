export type CategorySlug = "server" | "infra" | "ai" | "frontend" | "devlog";

export type Category = {
  slug: CategorySlug;
  name: string;
  description: string;
};

// 우선순위 순서: 서버·인프라·AI가 메인, 프론트는 부가
export const categories: Category[] = [
  { slug: "server", name: "서버", description: "HTTP, 인증, DB, API 설계" },
  { slug: "infra", name: "인프라", description: "Docker, Nginx, CI/CD, 배포·모니터링" },
  { slug: "ai", name: "AI 서버", description: "FastAPI, LLM, 임베딩, 평가" },
  { slug: "frontend", name: "프론트엔드", description: "JS, TypeScript, React, 이 사이트" },
  { slug: "devlog", name: "당당 개발일지", description: "주차별로 만든 것과 막힌 것" },
];
