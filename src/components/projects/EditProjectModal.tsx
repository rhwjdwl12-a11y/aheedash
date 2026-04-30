"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateProject } from "@/app/actions/projects";
import { setProjectMembers } from "@/app/actions/members";
import MemberPicker from "@/components/shared/MemberPicker";
import type { Project, Client, Profile } from "@/types/database";

interface EditProjectModalProps {
  project: Project;
  clients: Client[];
  profiles: Profile[];
  memberIds: string[];
  onClose: () => void;
}

const TYPES = ["제안서", "기획안", "결과보고서", "기타"] as const;
const DURATIONS = ["단기", "중기", "장기"] as const;
const STATUSES = ["진행중", "검토", "완료", "보류"] as const;

export default function EditProjectModal({
  project,
  clients,
  profiles,
  memberIds: initialMemberIds,
  onClose,
}: EditProjectModalProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [memberIds, setMemberIds] = useState<string[]>(initialMemberIds);
  const [form, setForm] = useState({
    title: project.title,
    client_id: project.client_id ?? "",
    type: project.type ?? "",
    duration_type: project.duration_type ?? "",
    status: project.status,
    start_date: project.start_date ?? "",
    deadline: project.deadline ?? "",
    budget: project.budget ? project.budget.toLocaleString("ko-KR") : "",
    description: project.description ?? "",
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function formatBudget(v: string) {
    const num = v.replace(/[^0-9]/g, "");
    return num ? parseInt(num).toLocaleString("ko-KR") : "";
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error("프로젝트 제목을 입력해주세요.");
      return;
    }
    setSaving(true);

    const [r1, r2] = await Promise.all([
      updateProject(project.id, {
        title: form.title,
        client_id: form.client_id || (null as unknown as string),
        type: (form.type || null) as unknown as string,
        duration_type: (form.duration_type || null) as unknown as string,
        status: form.status,
        start_date: (form.start_date || null) as unknown as string,
        deadline: (form.deadline || null) as unknown as string,
        budget: (form.budget ? parseInt(form.budget.replace(/,/g, "")) : null) as unknown as number,
        description: (form.description || null) as unknown as string,
      }),
      setProjectMembers(project.id, memberIds),
    ]);

    if (r1?.error) toast.error(r1.error);
    else if (r2?.error) toast.error(r2.error);
    else {
      toast.success("프로젝트가 수정되었습니다");
      router.refresh();
      onClose();
    }
    setSaving(false);
  }

  const inputStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "8px 10px",
    fontSize: 13,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(61,47,32,0.25)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl flex flex-col"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          boxShadow: "0 8px 32px rgba(61,47,32,0.12)",
        }}
      >
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            프로젝트 편집
          </h3>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <Field label="프로젝트 제목 *">
            <input
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="프로젝트 이름"
              style={inputStyle}
            />
          </Field>

          <Field label="담당업체">
            <select
              value={form.client_id}
              onChange={(e) => set("client_id", e.target.value)}
              style={inputStyle}
            >
              <option value="">선택 안 함</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="유형">
              <select value={form.type} onChange={(e) => set("type", e.target.value)} style={inputStyle}>
                <option value="">선택</option>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="기간유형">
              <select value={form.duration_type} onChange={(e) => set("duration_type", e.target.value)} style={inputStyle}>
                <option value="">선택</option>
                {DURATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </Field>
          </div>

          <Field label="상태">
            <div className="flex flex-wrap gap-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("status", s)}
                  className="px-3 py-1 rounded-md text-xs"
                  style={{
                    backgroundColor: form.status === s ? "var(--text-primary)" : "var(--neutral-bg)",
                    color: form.status === s ? "var(--bg-base)" : "var(--text-secondary)",
                    fontWeight: form.status === s ? 500 : 400,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="시작일">
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => set("start_date", e.target.value)}
                style={inputStyle}
              />
            </Field>
            <Field label="마감일">
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => set("deadline", e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <Field label="견적 금액 (원)">
            <input
              type="text"
              value={form.budget}
              onChange={(e) => set("budget", formatBudget(e.target.value))}
              placeholder="1,500,000"
              style={inputStyle}
            />
          </Field>

          <Field label="공유 담당자 (참여자)">
            <MemberPicker
              profiles={profiles}
              selectedIds={memberIds}
              onChange={setMemberIds}
              ownerId={project.user_id}
              placeholder="담당자 선택"
            />
          </Field>

          <Field label="설명">
            <textarea
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="프로젝트 설명..."
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
          </Field>
        </div>

        <div
          className="flex gap-2 px-5 py-3 shrink-0"
          style={{ borderTop: "0.5px solid var(--border-soft)" }}
        >
          <button
            onClick={onClose}
            className="flex-1 rounded-md py-2 text-sm hover:bg-[var(--neutral-bg)]"
            style={{ color: "var(--text-secondary)" }}
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title.trim()}
            className="flex-1 rounded-md py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label style={{ fontSize: 11, color: "var(--text-meta)", fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  );
}
