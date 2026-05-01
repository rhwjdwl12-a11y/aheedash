"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import NewProjectModal from "@/components/projects/NewProjectModal";
import { reorderProjects } from "@/app/actions/projects";
import type { Project, Client, Profile } from "@/types/database";

interface ProjectsClientProps {
  projects: Project[];
  clients: Client[];
  profiles?: Profile[];
  currentUserId?: string;
}

const STATUSES = ["전체", "진행중", "검토", "완료", "보류"] as const;

const DURATION_GROUPS: { key: "단기" | "중기" | "장기" | "기타"; label: string; color: string }[] = [
  { key: "단기", label: "단기", color: "var(--client-aheeplan)" },
  { key: "중기", label: "중기", color: "var(--client-dankook)" },
  { key: "장기", label: "장기", color: "var(--client-seojeong)" },
  { key: "기타", label: "기간 미지정", color: "var(--text-meta)" },
];

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

export default function ProjectsClient({ projects: initialProjects, clients, profiles = [], currentUserId = "" }: ProjectsClientProps) {
  const [projects, setProjects] = useState(initialProjects);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [filterClient, setFilterClient] = useState<string>("전체");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  // 필터 적용
  const filtered = projects.filter((p) => {
    if (filterStatus !== "전체" && p.status !== filterStatus) return false;
    if (filterClient !== "전체" && p.client_id !== filterClient) return false;
    return true;
  });

  // 그룹화 (단기/중기/장기/기타) + 정렬
  const grouped = useMemo(() => {
    const map: Record<string, Project[]> = { 단기: [], 중기: [], 장기: [], 기타: [] };
    for (const p of filtered) {
      const key = (p.duration_type ?? "기타") as keyof typeof map;
      if (!map[key]) map["기타"].push(p);
      else map[key].push(p);
    }
    // display_order 우선, 그 다음 created_at desc
    for (const k of Object.keys(map)) {
      map[k].sort((a, b) => {
        if (a.display_order !== b.display_order) return a.display_order - b.display_order;
        return b.created_at.localeCompare(a.created_at);
      });
    }
    return map;
  }, [filtered]);

  async function handleMove(group: string, idx: number, direction: -1 | 1) {
    const list = grouped[group];
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= list.length) return;

    const a = list[idx];
    const b = list[newIdx];

    // 위치 스왑 (display_order 값 교환)
    const reorderedList = [...list];
    [reorderedList[idx], reorderedList[newIdx]] = [reorderedList[newIdx], reorderedList[idx]];

    // 재할당 (0..N)
    const updates = reorderedList.map((p, i) => ({ id: p.id, display_order: i }));

    // 낙관적 업데이트
    setProjects((prev) =>
      prev.map((p) => {
        const u = updates.find((x) => x.id === p.id);
        return u ? { ...p, display_order: u.display_order } : p;
      })
    );

    const res = await reorderProjects(updates);
    if (res?.error) {
      toast.error(res.error);
      // 롤백
      setProjects((prev) =>
        prev.map((p) =>
          p.id === a.id ? { ...p, display_order: a.display_order }
            : p.id === b.id ? { ...p, display_order: b.display_order } : p
        )
      );
    }
  }

  const selectStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-secondary)",
    fontSize: 12,
    borderRadius: 6,
    padding: "5px 8px",
  };

  const totalCount = filtered.length;

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>프로젝트</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-80"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          + 새 프로젝트
        </button>
      </div>

      {/* 필터 바 */}
      <div className="flex flex-wrap gap-2">
        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} style={selectStyle}>
          <option value="전체">전체 담당업체</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={selectStyle}>
          {STATUSES.map((s) => <option key={s} value={s}>{s === "전체" ? "전체 상태" : s}</option>)}
        </select>
      </div>

      {totalCount === 0 ? (
        <div
          className="flex flex-col items-center justify-center gap-3 rounded-xl"
          style={{ minHeight: 240, backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
        >
          <p style={{ fontSize: 13, color: "var(--text-meta)" }}>프로젝트가 없습니다</p>
          <button
            onClick={() => setShowModal(true)}
            className="rounded-md px-3.5 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-secondary)" }}
          >
            + 첫 프로젝트 추가
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {DURATION_GROUPS.map(({ key, label, color }) => {
            const list = grouped[key] ?? [];
            if (list.length === 0) return null;
            return (
              <section key={key}>
                {/* 섹션 헤더 */}
                <div className="flex items-center gap-2 mb-2.5">
                  <span
                    className="inline-block rounded-full"
                    style={{ width: 8, height: 8, backgroundColor: color }}
                  />
                  <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                    {label}
                  </h2>
                  <span
                    className="rounded-full px-1.5 py-0.5"
                    style={{ fontSize: 10, backgroundColor: "var(--neutral-bg)", color: "var(--text-secondary)" }}
                  >
                    {list.length}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 12,
                  }}
                >
                  {list.map((p, idx) => (
                    <ProjectCardWithReorder
                      key={p.id}
                      project={p}
                      client={p.client_id ? clientMap[p.client_id] : null}
                      isFirst={idx === 0}
                      isLast={idx === list.length - 1}
                      onMoveUp={() => handleMove(key, idx, -1)}
                      onMoveDown={() => handleMove(key, idx, 1)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {showModal && (
        <NewProjectModal
          clients={clients}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

function ProjectCardWithReorder({
  project,
  client,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  project: Project;
  client?: Client | null;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const ddayStr = project.deadline ? formatDday(project.deadline) : null;
  const ddayColor = project.deadline
    ? DDAY_COLORS[getDdayColor(project.deadline)]
    : "var(--text-meta)";
  const clientColor = client?.color ?? "#8B7E6A";
  const statusStyle = STATUS_BADGE[project.status] ?? STATUS_BADGE["진행중"];

  return (
    <div
      className="rounded-lg overflow-hidden transition-shadow hover:shadow-sm relative group"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "0.5px solid var(--border)",
        display: "flex",
      }}
    >
      <div style={{ width: 3, backgroundColor: clientColor, flexShrink: 0 }} />

      <Link href={`/projects/${project.id}`} className="flex-1 min-w-0">
        <div className="flex flex-col gap-2 p-3 cursor-pointer">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {client && (
                <span
                  className="rounded px-1.5 py-0.5"
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

          <p className="truncate" style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>
            {project.title}
          </p>

          <div>
            <div
              className="w-full rounded-full overflow-hidden"
              style={{ height: 3, backgroundColor: "var(--border-soft)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${project.progress}%`, backgroundColor: clientColor }}
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
      </Link>

      {/* 우선순위 화살표 */}
      <div
        className="flex flex-col gap-0.5 px-1.5 py-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ borderLeft: "0.5px solid var(--border-soft)" }}
      >
        <button
          onClick={(e) => { e.preventDefault(); onMoveUp(); }}
          disabled={isFirst}
          className="p-1 rounded hover:bg-[var(--neutral-bg)] disabled:opacity-30 disabled:hover:bg-transparent"
          title="위로"
        >
          <ChevronUp size={12} style={{ color: "var(--text-secondary)" }} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); onMoveDown(); }}
          disabled={isLast}
          className="p-1 rounded hover:bg-[var(--neutral-bg)] disabled:opacity-30 disabled:hover:bg-transparent"
          title="아래로"
        >
          <ChevronDown size={12} style={{ color: "var(--text-secondary)" }} />
        </button>
      </div>
    </div>
  );
}
