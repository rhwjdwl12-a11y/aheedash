import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string | number;
  /** 아이콘 (lucide-react) */
  icon?: LucideIcon;
  /** 아이콘 색상 토큰 */
  iconColor?: string;
  /** 아이콘 박스 배경 (보통 iconColor + 22) */
  iconBg?: string;
  /** 변화량 텍스트 (예: "+2 오늘 추가") */
  change?: string;
  changeColor?: string;
  accentColor?: string;
  sub?: string;
}

export default function KpiCard({
  label,
  value,
  icon: Icon,
  iconColor = "var(--text-primary)",
  iconBg,
  change,
  changeColor,
  accentColor,
  sub,
}: KpiCardProps) {
  const computedIconBg = iconBg ?? `${iconColor.startsWith("#") ? iconColor : "var(--neutral-bg)"}22`;
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
      }}
    >
      {Icon && (
        <div
          className="rounded-lg flex items-center justify-center shrink-0"
          style={{
            width: 40,
            height: 40,
            backgroundColor: computedIconBg,
            color: iconColor,
          }}
        >
          <Icon size={18} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p style={{ fontSize: 11, color: "var(--text-meta)", marginBottom: 4 }}>{label}</p>
        <p
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: accentColor ?? "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {(change || sub) && (
          <p style={{ fontSize: 11, color: changeColor ?? "var(--text-meta)", marginTop: 4 }}>
            {change ?? sub}
          </p>
        )}
      </div>
    </div>
  );
}
