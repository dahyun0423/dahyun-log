import ReviewSession from "@/components/quiz/ReviewSession";
import { getQuestionBank } from "@/lib/quiz";

export const metadata = { title: "오늘의 복습 — dahyun.log" };

export default async function ReviewPage() {
  const bank = await getQuestionBank();
  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-10">
      <p className="text-t7 font-semibold text-success">🔁 반복 학습</p>
      <h1 className="mt-2 text-t1 font-bold tracking-[-0.02em]">오늘의 복습</h1>
      <p className="mt-2 text-t6 text-fg-tertiary">
        맞힌 문제는 1일 → 3일 → 7일 → 14일 → 30일 뒤에 다시, 틀린 문제는 금방 다시 나와요. 문제 은행 {bank.length}개.
      </p>
      <ReviewSession bank={bank} />
    </div>
  );
}
