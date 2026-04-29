"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Client } from "@/types/database";

interface SettingsClientProps {
  user: User | null;
  clients: Client[];
}

const CLIENT_COLORS = [
  { label: "주황", value: "#B85C2D" },
  { label: "초록", value: "#5A7D4F" },
  { label: "금색", value: "#C9A96E" },
  { label: "보라", value: "#7B5EA7" },
  { label: "파랑", value: "#3B6FA0" },
];

// 빠른 추가용 기본 담당업체
const DEFAULT_VENDORS = [
  { name: "아희", color: "#B85C2D" },
  { name: "GPI", color: "#3B6FA0" },
];

export default function SettingsClient({ user, clients: initialClients }: SettingsClientProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [newClientName, setNewClientName] = useState("");
  const [newClientColor, setNewClientColor] = useState("#B85C2D");
  const [saving, setSaving] = useState(false);

  const initialName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "";
  const [nickname, setNickname] = useState(initialName);
  const [savingNickname, setSavingNickname] = useState(false);

  const displayName = nickname || "-";

  async function handleSaveNickname() {
    const trimmed = nickname.trim();
    if (!trimmed) { toast.error("닉네임을 입력해주세요."); return; }
    setSavingNickname(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { full_name: trimmed, name: trimmed },
    });
    if (error) toast.error(error.message);
    else {
      toast.success("닉네임이 변경되었습니다.");
      router.refresh();
    }
    setSavingNickname(false);
  }

  async function handleAddClient(name?: string, color?: string) {
    const finalName = (name ?? newClientName).trim();
    const finalColor = color ?? newClientColor;
    if (!finalName) { toast.error("담당업체 이름을 입력해주세요."); return; }
    if (clients.some((c) => c.name === finalName)) {
      toast.error("이미 등록된 담당업체입니다.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("clients").insert({
      user_id: user!.id,
      name: finalName,
      color: finalColor,
    }).select().single();
    if (error) toast.error(error.message);
    else {
      toast.success(`${finalName} 추가됨`);
      setClients((prev) => [...prev, data as Client]);
      if (!name) setNewClientName("");
    }
    setSaving(false);
  }

  async function handleDeleteClient(id: string) {
    if (!confirm("담당업체를 삭제하시겠습니까?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) toast.error(error.message);
    else setClients((prev) => prev.filter((c) => c.id !== id));
  }

  const inputStyle = {
    border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)", borderRadius: 6, padding: "7px 10px",
    fontSize: 13, outline: "none", fontFamily: "inherit",
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>설정</h1>

      {/* 계정 정보 */}
      <Section title="계정 정보">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center font-medium"
            style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-primary)" }}
          >
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{displayName}</p>
            <p style={{ fontSize: 12, color: "var(--text-meta)" }}>{user?.email}</p>
          </div>
        </div>

        {/* 닉네임 변경 */}
        <div className="flex flex-col gap-1.5 mt-2">
          <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
            닉네임
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveNickname()}
              placeholder="표시할 이름을 입력하세요"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={handleSaveNickname}
              disabled={savingNickname || nickname.trim() === initialName.trim()}
              className="rounded-md px-3.5 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
              style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)", whiteSpace: "nowrap" }}
            >
              {savingNickname ? "저장 중..." : "저장"}
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--text-meta)" }}>
            사이드바와 모바일 메뉴에 표시되는 이름입니다.
          </p>
        </div>
      </Section>

      {/* 담당업체 관리 */}
      <Section title="담당업체 관리">
        {/* 빠른 추가 (기본 업체) */}
        <div className="flex flex-wrap gap-2 mb-3">
          <span style={{ fontSize: 11, color: "var(--text-meta)", alignSelf: "center" }}>
            빠른 추가:
          </span>
          {DEFAULT_VENDORS.map((v) => {
            const exists = clients.some((c) => c.name === v.name);
            return (
              <button
                key={v.name}
                onClick={() => handleAddClient(v.name, v.color)}
                disabled={exists || saving}
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs hover:opacity-80 disabled:opacity-40"
                style={{
                  border: "0.5px solid var(--border)",
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: v.color }}
                />
                {exists ? `${v.name} ✓` : `+ ${v.name}`}
              </button>
            );
          })}
        </div>

        {/* 추가 폼 */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newClientName}
            onChange={(e) => setNewClientName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddClient(undefined, undefined)}
            placeholder="담당업체 이름"
            style={{ ...inputStyle, flex: 1 }}
          />
          <select
            value={newClientColor}
            onChange={(e) => setNewClientColor(e.target.value)}
            style={{ ...inputStyle, width: 140 }}
          >
            {CLIENT_COLORS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button
            onClick={() => handleAddClient(undefined, undefined)}
            disabled={saving}
            className="rounded-md px-3.5 py-2 text-sm font-medium hover:opacity-80 disabled:opacity-40"
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)", whiteSpace: "nowrap" }}
          >
            추가
          </button>
        </div>

        {/* 담당업체 목록 */}
        {clients.length === 0 ? (
          <p style={{ fontSize: 13, color: "var(--text-meta)" }}>담당업체가 없습니다</p>
        ) : (
          <div className="flex flex-col gap-2">
            {clients.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5"
                style={{ backgroundColor: "var(--bg-base)", border: "0.5px solid var(--border-soft)" }}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                  <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{c.name}</span>
                  {c.contact_person && (
                    <span style={{ fontSize: 11, color: "var(--text-meta)" }}>· {c.contact_person}</span>
                  )}
                </div>
                <button
                  onClick={() => handleDeleteClient(c.id)}
                  style={{ fontSize: 11, color: "var(--text-meta)", cursor: "pointer" }}
                  className="hover:text-[var(--warning-text)] transition-colors"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Supabase 연결 안내 */}
      <Section title="연결 상태">
        <div
          className="rounded-lg px-4 py-3"
          style={{ backgroundColor: "var(--success-bg)", border: "0.5px solid var(--border-soft)" }}
        >
          <p style={{ fontSize: 13, color: "var(--success-text)" }}>
            ✓ Supabase 연결됨 · {user?.email}
          </p>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4"
      style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
    >
      <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>{title}</h2>
      {children}
    </div>
  );
}
