"use client";

import { useState } from "react";
import { getMonth, parseISO } from "date-fns";
import ProjectBar from "./ProjectBar";
import TodayLine from "./TodayLine";
import type { Project, Client } from "@/types/database";

const MONTHS = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const CURRENT_MONTH = new Date().getMonth();
const YEAR = new Date().getFullYear();
const LEFT_COL = 130; // 프로젝트명 컬럼 너비

const DURATION_FILTERS = ["전체", "단기", "중기", "장기"] as const;

interface RoadmapChartProps {
  projects: Project[];
  clients: Client[];
}

export default function RoadmapChart({ projects, clients }: RoadmapChartProps) {
  const [filterDuration, setFilterDuration] = useState<string>("전체");
  const [filterClientId, setFilterClientId] = useState<string>("전체");

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));

  const filtered = projects.filter((p) => {
    if (!p.start_date || !p.deadline) return false;
    if (filterDuration !== "전체" && p.duration_type !== filterDuration) return false;
    if (filterClientId !== "전체" && p.client_id !== filterClientId) return false;
    return true;
  });

  // 클라이언트별 그룹
  const groups = clients
    .map((c) => ({
      client: c,
      projects: filtered.filter((p) => p.client_id === c.id),
    }))
    .filter((g) => g.projects.length > 0);

  const noClientProjects = filtered.filter((p) => !p.client_id);
  if (noClientProjects.length > 0) {
    groups.push({
      client: { id: "", name: "미분류", color: "#8B7E6A" } as Client,
      projects: noClientProjects,
    });
  }

  function getBarMonths(project: Project) {
    if (!project.start_date || !project.deadline) return { start: 0, end: 0 };
    const start = Math.max(0, getMonth(parseISO(project.start_date)));
    const end = Math.min(11, getMonth(parseISO(project.deadline)));
    return { start, end };
  }

  const stats = {
    total: filtered.length,
    단기: filtered.filter((p) => p.duration_type === "단기").length,
    중기: filtered.filter((p) => p.duration_type === "중기").length,
    장기: filtered.filter((p) => p.duration_type === "장기").length,
  };

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>
            {YEAR} 연간 로드맵
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-meta)", marginTop: 3 }}>
            {stats.total}개 프로젝트 · 단기 {stats.단기} · 중기 {stats.중기} · 장기 {stats.장기}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="flex rounded-lg overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>
            {DURATION_FILTERS.map((d) => (
              <button
                key={d}
                onClick={() => setFilterDuration(d)}
                className="px-3 py-1.5 text-xs transition-colors"
                style={{
                  backgroundColor: filterDuration === d ? "var(--text-primary)" : "var(--bg-surface)",
                  color: filterDuration === d ? "var(--bg-base)" : "var(--text-secondary)",
                  borderRight: d !== "장기" ? "0.5px solid var(--border)" : "none",
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <select value={filterClientId} onChange={(e) => setFilterClientId(e.target.value)} style={selectStyle}>
            <option value="전체">전체 담당업체</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* 간트 차트 카드 */}
      <div
        className="overflow-x-auto"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div style={{ minWidth: 760 }}>
          {/* 월 헤더 */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `${LEFT_COL}px repeat(12, 1fr)`,
              gap: 0,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: "1px solid var(--border-soft)",
              position: "relative",
            }}
          >
            <div />
            {MONTHS.map((m, i) => {
              const isCurrent = i === CURRENT_MONTH;
              return (
                <div
                  key={m}
                  className="text-center relative"
                  style={{
                    fontSize: 11,
                    color: isCurrent ? "var(--client-aheeplan)" : "var(--text-meta)",
                    fontWeight: isCurrent ? 600 : 400,
                    paddingBottom: 4,
                  }}
                >
                  {m}
                  {isCurrent && (
                    <span
                      className="absolute left-1/2 -translate-x-1/2 mt-0.5"
                      style={{
                        backgroundColor: "var(--client-aheeplan)",
                        color: "white",
                        fontSize: 9,
                        padding: "1px 6px",
                        borderRadius: 3,
                        fontWeight: 500,
                        top: "100%",
                        whiteSpace: "nowrap",
                      }}
                    >
                      오늘
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 그룹별 행 */}
          <div className="relative" style={{ marginTop: 4 }}>
            <TodayLine year={YEAR} leftOffset={LEFT_COL} />

            {groups.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <p style={{ fontSize: 13, color: "var(--text-meta)" }}>
                  날짜가 설정된 프로젝트가 없습니다
                </p>
              </div>
            ) : (
              groups.map(({ client, projects: gProjects }) => (
                <div
                  key={client.id}
                  style={{
                    backgroundColor: "#FAF6EC",
                    borderRadius: 8,
                    padding: "10px 12px",
                    marginBottom: 10,
                  }}
                >
                  {/* 클라이언트 헤더 */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <div
                      className="rounded-full"
                      style={{ width: 10, height: 10, backgroundColor: client.color }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600, color: client.color }}>
                      {client.name}
                    </span>
                    <span style={{ fontSize: 11, color: "var(--text-meta)" }}>
                      · {gProjects.length}개
                    </span>
                  </div>

                  {/* 프로젝트 행 */}
                  {gProjects.map((p) => {
                    const { start, end } = getBarMonths(p);
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: `${LEFT_COL}px repeat(12, 1fr)`,
                          alignItems: "center",
                          height: 36,
                          gap: 0,
                        }}
                      >
                        {/* 프로젝트명 (sticky) */}
                        <div
                          className="sticky left-0 pr-2"
                          style={{ backgroundColor: "#FAF6EC", zIndex: 5 }}
                        >
                          <p
                            className="truncate"
                            style={{ fontSize: 12, color: "var(--text-secondary)" }}
                          >
                            {p.title}
                          </p>
                        </div>

                        {/* 빈 셀 + 막대 */}
                        {Array.from({ length: 12 }).map((_, monthIdx) => {
                          if (monthIdx === start) {
                            return (
                              <div
                                key={monthIdx}
                                style={{
                                  gridColumn: `${monthIdx + 2} / ${end + 3}`,
                                  padding: "0 2px",
                                }}
                              >
                                <ProjectBar
                                  project={p}
                                  client={clientMap[p.client_id ?? ""] ?? null}
                                  startMonth={start}
                                  endMonth={end}
                                  year={YEAR}
                                />
                              </div>
                            );
                          }
                          if (monthIdx > start && monthIdx <= end) return null;
                          return <div key={monthIdx} />;
                        })}
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {clients.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5">
              <div
                className="rounded-sm"
                style={{ width: 14, height: 5, backgroundColor: c.color }}
              />
              <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{c.name}</span>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 11, color: "var(--text-meta)" }}>
          진하게 = 단기 · 옅게 = 장기
        </p>
      </div>
    </div>
  );
}
