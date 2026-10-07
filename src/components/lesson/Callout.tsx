// 핵심 / 주의 / 요약 상자
const styles = {
  핵심: { box: "bg-primary-subtle", label: "text-primary-strong" },
  주의: { box: "bg-warning-bg", label: "text-warning" },
  요약: { box: "bg-success-bg", label: "text-success" },
};

export default function Callout({ type = "핵심", children }: { type?: keyof typeof styles; children: React.ReactNode }) {
  const s = styles[type];
  return (
    <aside className={`my-6 rounded-lg p-5 ${s.box} [&_p]:my-1 [&_p]:text-fg`}>
      <p className={`text-t7 font-bold ${s.label}`}>{type}</p>
      {children}
    </aside>
  );
}
