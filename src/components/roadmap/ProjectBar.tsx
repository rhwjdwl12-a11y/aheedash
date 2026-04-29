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

export default function ProjectBar({
  project,
  client,
  startMonth,
  endMonth,
  year,
}: ProjectBarProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState(false);

  if (!project.start_date || !project.deadline) return null;

  const clientColor = client?.color ?? "#8B7E6A";
  const opacity = OPACITY[project.duration_type ?? "단기"] ?? 1;

  const start = parseISO(project.start_date);
  const end = parseISO(project.deadline);
  const days = differenceInDays(end, start);

  let label = "";
  if (days >= 60) {
    label = `${format(start, "M.d")} ~ ${format(end, "M.d")}`;
  } else if (days >= 20) {
    label = `${format(start, "M.d")}~${format(end, "M.d")}`;
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
        height: 16,
        borderRadius: 3,
        backgroundColor: clientColor,
        opacity,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        paddingLeft: 5,
        paddingRight: 5,
        overflow: "hidden",
        position: "relative",
        minWidth: 4,
      }}
      onClick={() => router.push(`/projects/${project.id}`)}
      onMouseEnter={() => setTooltip(true)}
      onMouseLeave={() => setTooltip(false)}
    >
      {label && (
        <span
          style={{
            fontSize: 9,
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
          <p style={{ opacity: 0.8 }}>{tooltipText}</p>
        </div>
      )}
    </div>
  );
}
