type TagProps = {
  children: React.ReactNode;
  tone?: "primary" | "neutral" | "success" | "warning";
};

// TDS Badge(Weak) — 알약 모양, 12px / 600
const toneClass = {
  primary: "bg-primary-subtle text-primary-strong",
  neutral: "bg-surface-subtle text-fg-secondary",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
};

export default function Tag({ children, tone = "primary" }: TagProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[12px] leading-[18px] font-semibold ${toneClass[tone]}`}
    >
      {children}
    </span>
  );
}
