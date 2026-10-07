// 레슨 맨 끝의 "핵심 문장" 카드
export default function KeySentence({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <section className="mt-14 rounded-xl bg-[var(--grey-900)] p-6 text-[var(--grey-50)]">
      <p className="text-t7 font-semibold text-[var(--grey-400)]">이 레슨의 핵심 문장</p>
      <p className="mt-2 text-t3 font-bold">“{children}”</p>
      {note && <p className="mt-3 text-t6 text-[var(--grey-300)]">{note}</p>}
    </section>
  );
}
