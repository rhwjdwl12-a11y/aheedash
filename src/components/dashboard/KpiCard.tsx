interface KpiCardProps {
  label: string;
  value: string | number;
  accentColor?: string;
  sub?: string;
}

export default function KpiCard({ label, value, accentColor, sub }: KpiCardProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
      }}
    >
      <p style={{ fontSize: 11, color: "var(--text-meta)", marginBottom: 6 }}>{label}</p>
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
      {sub && (
        <p style={{ fontSize: 11, color: "var(--text-meta)", marginTop: 4 }}>{sub}</p>
      )}
    </div>
  );
}
