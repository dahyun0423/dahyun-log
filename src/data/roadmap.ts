// 9주 로드맵 — 노션 마일스톤 기준, 주차는 금요일 멘토링에서 끊는다(2026.10.8 ~ 12.9 발표)
export type Week = {
  week: number;
  period: string;
  theme: string;
  server: string; // 메인: 서버·인프라·AI
  frontend: string; // 부가: 이 사이트에 추가할 기능
};

export const roadmap: Week[] = [
  { week: 1, period: "10.8 – 10.16(금)", theme: "기획 확정 · 환경 구성", server: "팀 GitHub(Org·규칙·템플릿)·공공데이터 키, 요구사항·MVP 확정, 와이어프레임, 레포 세팅 · 10/16 멘토링", frontend: "디자인 토큰, 홈, MDX 글 1편, Vercel 배포" },
  { week: 2, period: "10.17 – 10.23(금)", theme: "ERD · 유저 인터뷰 · 회원 기능", server: "백엔드·PWA 개념, Spring 첫 실행·docker-compose, 피그마 → ERD 완성(Flyway V1), 유저 인터뷰, 회원가입·로그인·마이(JWT·카카오), AI 서버 Start, iPhone 푸시 시험 · 10/23 멘토링", frontend: "글 목록을 날짜순·카테고리별로" },
  { week: 3, period: "10.24 – 10.30(금)", theme: "핵심 루프 ① 식사 → 알림 → 혈당", server: "식사 시작 API, Redis 예약·알림 스케줄러(ShedLock), Web Push(VAPID) 정식 연결, 혈당 저장 API(20~600), 오늘 화면 API, EC2+Nginx+Docker 서버 · 10/30 멘토링", frontend: "카테고리 페이지 /category/[slug]" },
  { week: 4, period: "10.31 – 11.6(금)", theme: "핵심 루프 ② · 식사 기록 · AI v1", server: "재알림·늦게 잼, 기록 조회·수정·삭제(audit), 식약처 DB 적재, 사진 → 음식 후보 Top-3(Structured Output), pgvector 음식명 매칭, 첫 배포(CD v1·HTTPS) · 11/6 멘토링", frontend: "⌘K 검색 (클라이언트 상태)" },
  { week: 5, period: "11.7 – 11.13(금)", theme: "진료 · 리포트 · 퍼블리싱 마감", server: "진료일·물어볼 것 API, 리포트 집계 API(그때 기준), 기준 버전 이력, AI 평가셋 점수, FE 퍼블리싱 마감(11/8) · 11/13 멘토링", frontend: "용어집 페이지" },
  { week: 6, period: "11.14 – 11.20(금)", theme: "API 마감 · FE 연동 · 1차 구현 완료", server: "API 개발 마감(11/15), FE API 연동 지원(11/16~20), 산후 전환·챗봇·커뮤니티(남은 범위), 핵심 기능 1차 구현 완료(11/20) · 11/20 멘토링", frontend: "다크모드 토글, 퀴즈(useReducer)" },
  { week: 7, period: "11.21 – 11.27(금)", theme: "데이터 삽입 · 사전 QA · 사용자 테스트", server: "데이터 삽입·사전 QA(디자인·기능, 11/21~25), 간호사·임당 경험자 사용자 테스트, Testcontainers 통합 테스트, 블루그린 CD v2 · 11/27 멘토링", frontend: "SEO·OG 이미지, Lighthouse 개선" },
  { week: 8, period: "11.28 – 12.4(금)", theme: "QA · 통합 테스트 · 부하 테스트", server: "QA, FE/BE 통합 테스트, Gatling 부하 테스트(혈당 저장·알림 지연 p95, EC2), Grafana 모니터링, 버그 수정 · 12/4 멘토링", frontend: "404·에러 페이지, Vitest 테스트" },
  { week: 9, period: "12.5 – 12.9(수)", theme: "마무리 · 발표", server: "최종 회귀 테스트, 배포 후 점검, API 명세·AI 평가 보고서, 시연 영상, 12/9 발표", frontend: "9주 회고 글" },
];
