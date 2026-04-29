import Link from "next/link";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import type { Project, Client } from "@/types/database";

const DDAY_COLORS = {
  urgent: "var(--warning-text)",
  warning: "var(--client-seojeong)",
  normal: "var(--text-meta)",
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  진행중: { bg: "var(--success-bg)", text: "var(--success-text)" },
  검토: { bg: "var(--sticker-yellow)", text: "var(--neutral-text)" },
  완료: { bg: "var(--border-soft)", text: "var(--text-meta)" },
  보류: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
};

interface ProjectCardProps {
  project: Project;
  client?: Client | null;
}

export default function ProjectCard({ project, client }: ProjectCardProps) {
  const ddayStr = project.deadline ? formatDday(project.deadline) : null;
  const ddayColor = project.deadline
    ? DDAY_COLORS[getDdayColor(project.deadline)]
    : "var(--text-meta)";
  const clientColor = client?.color ?? "#8B7E6A";
  const statusStyle = STATUS_BADGE[project.status] ?? STATUS_BADGE["진행중"];

  return (
    <Link href={`/projects/${project.id}`}>
      <div
        className="rounded-lg overflow-hidden transition-shadow hover:shadow-sm cursor-pointer"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          display: "flex",
        }}
      >
        {/* 클라이언트 색상 액센트 바 */}
        <div style={{ width: 3, backgroundColor: clientColor, flexShrink: 0 }} />

        <div className="flex flex-col gap-2 p-3 flex-1 min-w-0">
          {/* 상단 뱃지 + D-day */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {client && (
                <span
                  className="rounded px-1.5 py-0.5 text-xs"
                  style={{
                    backgroundColor: clientColor + "22",
                    color: clientColor,
                    fontSize: 10,
                    fontWeight: 500,
                  }}
                >
                  {client.name}
                </span>
              )}
              {project.type && (
                <span
                  className="rounded px-1.5 py-0.5"
                  style={{
                    fontSize: 10,
                    backgroundColor: "var(--border-soft)",
                    color: "var(--text-meta)",
                  }}
                >
                  {project.type}
                </span>
              )}
              <span
                className="rounded px-1.5 py-0.5"
                style={{
                  fontSize: 10,
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.text,
                }}
              >
                {project.status}
              </span>
            </div>
            {ddayStr && (
              <span style={{ fontSize: 11, color: ddayColor, fontWeight: 500, flexShrink: 0 }}>
                {ddayStr}
              </span>
            )}
          </div>

          {/* 제목 */}
          <p
            className="truncate"
            style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}
          >
            {project.title}
          </p>

          {/* 진행률 */}
          <div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, backgroundColor: "var(--border-soft)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${project.progress}%`,
                  backgroundColor: clientColor,
                }}
              />
            </div>
            <p style={{ fontSize: 11, color: "var(--text-meta)", marginTop: 4 }}>
              {project.progress}%
              {project.deadline && (
                <span> · 마감 {new Date(project.deadline).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" })}</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
