import Link from "next/link";
import type { Question } from "@/data/quiz";
import QuizRunner from "@/components/quiz/QuizRunner";

// 레슨 끝 확인 퀴즈 — 푼 문제는 복습 일정에 들어간다
export default function LessonQuiz({ questions }: { questions: Question[] }) {
  if (questions.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="mb-1 border-l-4 border-success pl-3 text-t3 font-bold">✅ 확인 퀴즈</h2>
      <p className="mb-4 text-t7 text-fg-tertiary">
        푼 문제는{" "}
        <Link href="/review" className="font-semibold text-primary">
          🔁 오늘의 복습
        </Link>
        에 들어가요. 맞히면 1일 → 3일 → 7일 → 14일 → 30일 뒤에, 틀리면 금방 다시 나와요.
      </p>
      <QuizRunner title={`${questions.length}문제로 확인`} tag="✅ 확인" questions={questions} />
    </section>
  );
}
