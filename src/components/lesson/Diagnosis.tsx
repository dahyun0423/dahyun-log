// 🩺 진단서 — 레슨 끝에 "증상 → 원인 → 처방"으로 한 장 정리 (당당 = 병원 세계관)
type Props = { symptom: string; cause: string; fix: string };

export default function Diagnosis({ symptom, cause, fix }: Props) {
  const rows = [
    { label: "증상", text: symptom, color: "text-error" },
    { label: "원인", text: cause, color: "text-warning" },
    { label: "처방", text: fix, color: "text-success" },
  ];
  return (
    <section className="mt-14 overflow-hidden rounded-xl border border-line">
      <div className="flex items-center justify-between bg-surface-subtle px-5 py-3">
        <p className="text-t6 font-bold">🩺 진단서</p>
        <p className="text-t7 text-fg-tertiary">내 노트에 내 말로 다시 써 보기</p>
      </div>
      <dl className="divide-y divide-line-subtle">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-4 px-5 py-3.5">
            <dt className={`w-9 shrink-0 text-t6 font-bold ${r.color}`}>{r.label}</dt>
            <dd className="text-t6 text-fg">{r.text}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
