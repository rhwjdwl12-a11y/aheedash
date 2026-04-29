"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Check, X } from "lucide-react";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import KanbanBoard from "@/components/projects/KanbanBoard";
import FileUploadTab from "@/components/files/FileUploadTab";
import { deleteProject, updateProject } from "@/app/actions/projects";
import type { Project, Client, Task, FileAttachment, Profile } from "@/types/database";

const DDAY_COLORS = {
  urgent: "var(--warning-text)",
  warning: "var(--client-seojeong)",
  normal: "var(--text-meta)",
};

type Tab = "개요" | "태스크" | "파일" | "일정" | "메모";

interface ProjectDetailClientProps {
  project: Project;
  client: Client | null;
  tasks: Task[];
  files?: FileAttachment[];
  profiles?: Profile[];
  memberIds?: string[];
  taskAssignees?: Record<string, string[]>;
}

export default function ProjectDetailClient({
  project,
  client,
  tasks,
  files = [],
  profiles = [],
  memberIds = [],
  taskAssignees = {},
}: ProjectDetailClientProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("태스크");
  const TABS: Tab[] = ["개요", "태스크", "파일", "일정", "메모"];

  // 프로젝트명 인라인 편집
  const [title, setTitle] = useState(project.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editTitleValue, setEditTitleValue] = useState(project.title);
  const [savingTitle, setSavingTitle] = useState(false);

  async function handleSaveTitle() {
    const v = editTitleValue.trim();
    if (!v) { toast.error("프로젝트명을 입력해주세요."); return; }
    if (v === title) { setEditingTitle(false); return; }
    setSavingTitle(true);
    const result = await updateProject(project.id, { title: v });
    if (result?.error) toast.error(result.error);
    else {
      setTitle(v);
      setEditingTitle(false);
      toast.success("프로젝트명이 변경되었습니다");
      router.refresh();
    }
    setSavingTitle(false);
  }

  function cancelEditTitle() {
    setEditTitleValue(title);
    setEditingTitle(false);
  }

  const ddayStr = project.deadline ? formatDday(project.deadline) : null;
  const ddayColor = project.deadline
    ? DDAY_COLORS[getDdayColor(project.deadline)]
    : "var(--text-meta)";
  const clientColor = client?.color ?? "#8B7E6A";

  async function handleDelete() {
    if (!confirm("이 프로젝트를 삭제하시겠습니까?")) return;
    const result = await deleteProject(project.id);
    if (result?.error) toast.error(result.error);
    else router.push("/projects");
  }

  return (
    <div className="flex flex-col gap-5 max-w-5xl">
      {/* 헤더 카드 */}
      <div
        className="rounded-xl overflow-hidden flex"
        style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
      >
        <div style={{ width: 4, backgroundColor: clientColor, flexShrink: 0 }} />
        <div className="p-5 flex-1">
          {/* 뱃지 행 */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {client && (
              <span
                className="rounded px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: clientColor + "22", color: clientColor }}
              >
                {client.name}
              </span>
            )}
            {project.type && (
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--border-soft)", color: "var(--text-meta)" }}
              >
                {project.type}
              </span>
            )}
            {project.duration_type && (
              <span
                className="rounded px-2 py-0.5 text-xs"
                style={{ backgroundColor: "var(--neutral-bg)", color: "var(--neutral-text)" }}
              >
                {project.duration_type}
              </span>
            )}
            <span
              className="rounded px-2 py-0.5 text-xs"
              style={{ backgroundColor: "var(--success-bg)", color: "var(--success-text)" }}
            >
              {project.status}
            </span>
            <button
              onClick={handleDelete}
              className="ml-auto text-xs hover:text-[var(--warning-text)] transition-colors"
              style={{ color: "var(--text-meta)" }}
            >
              삭제
            </button>
          </div>

          {/* 제목 (인라인 편집 가능) */}
          <div className="mb-4">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={editTitleValue}
                  onChange={(e) => setEditTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveTitle();
                    if (e.key === "Escape") cancelEditTitle();
                  }}
                  className="flex-1 rounded-md px-2 py-1 outline-none"
                  style={{
                    fontSize: 18,
                    fontWeight: 500,
                    color: "var(--text-primary)",
                    border: "0.5px solid var(--border)",
                    backgroundColor: "var(--bg-base)",
                  }}
                />
                <button
                  onClick={handleSaveTitle}
                  disabled={savingTitle}
                  className="p-1.5 rounded-md hover:opacity-80 disabled:opacity-40"
                  style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
                  title="저장"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={cancelEditTitle}
                  className="p-1.5 rounded-md hover:bg-[var(--neutral-bg)]"
                  style={{ color: "var(--text-meta)" }}
                  title="취소"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditTitleValue(title);
                  setEditingTitle(true);
                }}
                className="group flex items-center gap-2 text-left hover:bg-[var(--neutral-bg)] rounded-md px-2 py-1 -mx-2 transition-colors"
                title="클릭해서 편집"
              >
                <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
                  {title}
                </h1>
                <Pencil
                  size={13}
                  style={{ color: "var(--text-meta)" }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </button>
            )}
          </div>

          {/* 메타 4컬럼 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaItem label="시작일" value={project.start_date ? formatDate(project.start_date) : "-"} />
            <MetaItem
              label="마감일"
              value={project.deadline ? formatDate(project.deadline) : "-"}
              sub={ddayStr}
              subColor={ddayColor}
            />
            <MetaItem
              label="견적"
              value={project.budget ? `${project.budget.toLocaleString("ko-KR")}원` : "-"}
            />
            <MetaItem
              label="진행률"
              value={`${project.progress}%`}
              progressBar={project.progress}
              progressColor={clientColor}
            />
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-3.5 py-1.5 rounded-md text-sm whitespace-nowrap transition-colors"
            style={{
              backgroundColor: tab === t ? "var(--text-primary)" : "var(--bg-surface)",
              color: tab === t ? "var(--bg-base)" : "var(--text-secondary)",
              border: tab === t ? "none" : "0.5px solid var(--border)",
              fontWeight: tab === t ? 500 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "태스크" && (
        <KanbanBoard
          tasks={tasks}
          projectId={project.id}
          profiles={profiles}
          taskAssignees={taskAssignees}
          /* 본인이 소유자가 아니면 멤버 풀에 본인 포함 (자기는 자기 task에 자기 할당 가능) */
          projectMemberIds={[
            project.user_id,
            ...memberIds,
          ]}
        />
      )}

      {tab === "개요" && (
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
        >
          <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)", marginBottom: 12 }}>
            프로젝트 설명
          </h3>
          {project.description ? (
            <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
              {project.description}
            </p>
          ) : (
            <p style={{ fontSize: 13, color: "var(--text-meta)" }}>설명이 없습니다.</p>
          )}

          {client && (
            <div className="mt-5 pt-5" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
              <h4 style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8 }}>
                클라이언트
              </h4>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: clientColor }} />
                <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{client.name}</span>
                {client.phone && (
                  <span style={{ fontSize: 12, color: "var(--text-meta)" }}>· {client.phone}</span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "파일" && (
        <FileUploadTab projectId={project.id} files={files} />
      )}

      {(tab === "일정" || tab === "메모") && (
        <div
          className="flex items-center justify-center rounded-xl"
          style={{ minHeight: 200, backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
        >
          <p style={{ fontSize: 13, color: "var(--text-meta)" }}>{tab} — 곧 추가됩니다</p>
        </div>
      )}
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { month: "numeric", day: "numeric" });
}

function MetaItem({
  label,
  value,
  sub,
  subColor,
  progressBar,
  progressColor,
}: {
  label: string;
  value: string;
  sub?: string | null;
  subColor?: string;
  progressBar?: number;
  progressColor?: string;
}) {
  return (
    <div>
      <p style={{ fontSize: 10, color: "var(--text-meta)", marginBottom: 3 }}>{label}</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{value}</p>
      {sub && (
        <p style={{ fontSize: 11, color: subColor ?? "var(--text-meta)", marginTop: 1 }}>{sub}</p>
      )}
      {progressBar !== undefined && (
        <div
          className="mt-1.5 rounded-full overflow-hidden"
          style={{ height: 3, backgroundColor: "var(--border-soft)" }}
        >
          <div
            className="h-full rounded-full"
            style={{ width: `${progressBar}%`, backgroundColor: progressColor ?? "var(--client-dankook)" }}
          />
        </div>
      )}
    </div>
  );
}
