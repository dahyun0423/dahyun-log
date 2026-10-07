// 퀴즈 타입과 복습 간격 — 브라우저·서버 공용 (파일 읽기 없음)

// 레슨 meta에 직접 쓰는 문제
export type QuizItem = {
  q: string;
  choices: string[];
  answer: number; // choices의 정답 위치 (0부터)
  why: string; // 정답 해설
};

// 문제 은행의 한 문제
export type Question = QuizItem & {
  id: string; // "레슨slug:q0" (직접), ":d" (진단서), ":a0" (비유 카드)
  slug: string;
  lessonTitle: string;
  kind: "hand" | "diagnosis" | "analogy";
};

export type Progress = { id: string; box: number; dueAt: string; correct: number; wrong: number };

/*
 * 반복 학습(라이트너 상자 방식)
 *   맞히면 다음 상자로 → 복습 간격이 길어진다: 1일 → 3일 → 7일 → 14일 → 30일
 *   틀리면 1번 상자로 → 10분 뒤 다시
 */
export const BOX_DAYS = [1, 3, 7, 14, 30];
export const NEW_PER_DAY = 5; // 하루에 새로 들어오는 문제 수

export function nextSchedule(prev: Pick<Progress, "box"> | null, correct: boolean, now = Date.now()) {
  if (!correct) return { box: 1, dueAt: new Date(now + 10 * 60 * 1000).toISOString() };
  const box = prev ? Math.min(prev.box + 1, BOX_DAYS.length) : 1;
  return { box, dueAt: new Date(now + BOX_DAYS[box - 1] * 24 * 60 * 60 * 1000).toISOString() };
}

// 보기 순서를 섞되, 정답 위치를 함께 옮긴다
// salt가 같으면 항상 같은 순서 (서버·브라우저 화면이 어긋나지 않게). 복습 화면은 날짜를 salt로 → 날마다 순서가 바뀜
export function shuffleChoices(item: QuizItem, salt: string): QuizItem {
  let h = 2166136261;
  for (const c of salt) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const rand = () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
  const order = item.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return { ...item, choices: order.map((i) => item.choices[i]), answer: order.indexOf(item.answer) };
}
