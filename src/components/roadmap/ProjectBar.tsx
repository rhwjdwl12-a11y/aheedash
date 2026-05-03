"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { differenceInDays, parseISO, format } from "date-fns";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import type { Project, Client } from "@/types/database";

const OPACITY = { 단기: 1, 중기: 0.85, 장기: 0.6 };
const DDAY_COLORS = {
  urgent: "var(--warning-text)",
  warning: "var(--client-seojeong)",
  normal: "var(--text-meta)",
};

interface ProjectBarProps {
  project: Project;
  client: Client | null;
  startMonth: number;
  endMonth: number;
  year: number;
}

/** #RRGGBB → rgba(r,g,b,a) */
function hexToRgba(hex: string, alpha: number) {
  const m = hex.replace("#", "").match(/.{1,2}/g);
  if (!m || m.length < 3) return `rgba(0,0,0,${alpha})`;
  const [r, g, b] = m.map((x) => parseInt(x, 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function ProjectBar({
  project,
  client,
  startMonth,
  endMonth,
}: ProjectBarProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState(false);

  if (!project.start_date || !project.deadline) return null;

  const clientColor = client?.color ?? "#8B7E6A";
  const opacity = OPACITY[project.duration_type ?? "단기"] ?? 1;

  const start = parseISO(project.start_date);
  const end = parseISO(project.deadline);
  const days = differenceInDays(end, start);

  // 막대 안 텍스트 (제목 + 기간) — 막대 두꺼워졌으니 더 많이 노출
  let label = "";
  if (days >= 30) {
    label = `${project.title} · ${format(start, "M.d")}~${format(end, "M.d")}`;
  } else if (days >= 14) {
    label = project.title;
  } else if (days >= 7) {
    label = project.title.slice(0, 4);
  }

  const ddayStr = formatDday(project.deadline);
  const ddayColor = DDAY_COLORS[getDdayColor(project.deadline)];
  const ddayDiff = differenceInDays(end, new Date());
  const tooltipText =
    `${format(start, "yyyy.MM.dd")} ~ ${format(end, "yyyy.MM.dd")} · ${days}일` +
    (ddayDiff <= 7 ? ` · ${ddayStr}` : "");

  return (
    <div
      style={{
        gridColumn: `${startMonth + 2} / ${endMonth + 3}`,
        height: 26,
        borderRadius: 5,
        backgroundColor: clientColor,
        opacity,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: "0 10px",
        overflow: "hidden",
        position: "relative",
        minWidth: 4,
        boxShadow: `0 1px 2px ${hexToRgba(clientColor, 0.2)}`,
        transition: "transform 0.15s, box-shadow 0.15s",
      }}
      onClick={() => router.push(`/projects/${project.id}`)}
      onMouseEnter={(e) => {
        setTooltip(true);
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 6px ${hexToRgba(clientColor, 0.35)}`;
      }}
      onMouseLeave={(e) => {
        setTooltip(false);
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 1px 2px ${hexToRgba(clientColor, 0.2)}`;
      }}
    >
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "white",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {label}
        </span>
      )}

      {tooltip && (
        <div
          className="absolute z-30 rounded-md px-2.5 py-1.5 pointer-events-none"
          style={{
            bottom: "calc(100% + 6px)",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "var(--text-primary)",
            color: "var(--bg-base)",
            fontSize: 11,
            whiteSpace: "nowrap",
            boxShadow: "0 2px 8px rgba(61,47,32,0.2)",
          }}
        >
          <p style={{ fontWeight: 500, marginBottom: 2 }}>{project.title}</p>
          <p style={{ opacity: 0.8 }}>
            {tooltipText} {ddayDiff <= 7 && <span style={{ color: ddayColor }}>●</span>}
          </p>
        </div>
      )}
    </div>
  );
}
