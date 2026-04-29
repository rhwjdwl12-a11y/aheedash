"use client";

import { useState } from "react";
import ProjectCard from "@/components/dashboard/ProjectCard";
import NewProjectModal from "@/components/projects/NewProjectModal";
import type { Project, Client, Profile } from "@/types/database";

interface ProjectsClientProps {
  projects: Project[];
  clients: Client[];
  profiles?: Profile[];
  currentUserId?: string;
}

const STATUSES = ["전체", "진행중", "검토", "완료", "보류"] as const;
const DURATIONS = ["전체", "단기", "중기", "장기"] as const;

export default function ProjectsClient({ projects, clients, profiles = [], currentUserId = "" }: ProjectsClientProps) {
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("전체");
  const [filterClient, setFilterClient] = useState<string>("전체");
  const [filterDuration, setFilterDuration] = useState<string>("전체");
  const [sort, setSort] = useState<string>("최신순");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  let filtered = projects.filter((p) => {
    if (filterStatus !== "전체" && p.status !== filterStatus) return false;
    if (filterClient !== "전체" && p.client_id !== filterClient) return false;
    if (filterDuration !== "전체" && p.duration_type !== filterDuration) return false;
    return true;
  });

  if (sort === "최신순") filtered = [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
  else if (sort === "마감순") filtered = [...filtered].sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""));
  else if (sort === "진행률순") filtered = [...filtered].sort((a, b) => b.progress - a.progress);

  const selectStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-surface)",
    color: "var(--text-secondary)",
    fontSize: 12,
    borderRadius: 6,
    padding: "5px 8px",
  };

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
        <select value={filterDuration} onChange={(e) => setFilterDuration(e.target.value)} style={selectStyle}>
          {DURATIONS.map((d) => <option key={d} value={d}>{d === "전체" ? "전체 기간" : d}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={selectStyle}>
          <option value="최신순">최신순</option>
          <option value="마감순">마감순</option>
          <option value="진행률순">진행률순</option>
        </select>
      </div>

      {/* 프로젝트 그리드 */}
      {filtered.length === 0 ? (
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 12,
          }}
        >
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              client={p.client_id ? clientMap[p.client_id] : null}
            />
          ))}
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
