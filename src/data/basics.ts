// 기초 트랙 — 9주 레슨과 따로, 매일 10분씩 쌓는 짧은 카드
export type BasicsTopic = "habits" | "devtools" | "dev" | "collab";

export const basicsTopics: { slug: BasicsTopic; name: string; icon: string; description: string }[] = [
  { slug: "habits", name: "내 개발 습관", icon: "🪞", description: "실제 대화·작업 기록에서 찾은 내 강점과 고칠 습관" },
  { slug: "devtools", name: "개발자 도구", icon: "🔍", description: "F12를 열고 화면·요청·저장소를 직접 들여다보기" },
  { slug: "dev", name: "개발 기초", icon: "⌨️", description: "터미널, npm, 환경 변수, 로그" },
  { slug: "collab", name: "협업 기초", icon: "🤝", description: "커밋, 브랜치, PR, 코드 리뷰, 이슈" },
];

// 기초 카드인가? (브라우저 코드에서도 쓰므로 파일 읽기가 없는 여기에 둔다)
export const isBasics = (l: { track?: "main" | "basics" }) => l.track === "basics";
