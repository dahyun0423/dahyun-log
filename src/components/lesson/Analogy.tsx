// 비유 카드: "홀 = 프론트엔드" 처럼 아는 것 ↔ 새 개념을 짝지어 보여준다
type Pair = { from: string; to: string; desc: string };

export default function Analogy({ pairs }: { pairs: Pair[] }) {
  return (
    <div className="my-6 grid gap-2 sm:grid-cols-2">
      {pairs.map((p) => (
        <div key={p.to} className="rounded-lg border border-line-subtle p-4">
          <p className="text-t5 font-bold">
            {p.from} <span className="text-fg-tertiary">=</span> <span className="text-primary">{p.to}</span>
          </p>
          <p className="mt-1 text-t6 text-fg-secondary">{p.desc}</p>
        </div>
      ))}
    </div>
  );
}
