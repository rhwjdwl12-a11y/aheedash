"use client";

import { useState } from "react";
import { Check, Users } from "lucide-react";
import type { Profile } from "@/types/database";

interface MemberPickerProps {
  profiles: Profile[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** 소유자/현재 사용자 id (제외 또는 자동 표시용). 비워두면 모두 선택 가능 */
  ownerId?: string;
  label?: string;
  placeholder?: string;
}

export default function MemberPicker({
  profiles,
  selectedIds,
  onChange,
  ownerId,
  label,
  placeholder = "담당자 선택",
}: MemberPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const visible = profiles.filter((p) => {
    if (ownerId && p.id === ownerId) return false; // 본인은 자동 멤버이므로 목록에서 제외
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      (p.display_name ?? "").toLowerCase().includes(q) ||
      (p.email ?? "").toLowerCase().includes(q)
    );
  });

  const selected = profiles.filter((p) => selectedIds.includes(p.id));

  function toggle(id: string) {
    if (selectedIds.includes(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label style={{ fontSize: 11, color: "var(--text-meta)", fontWeight: 500 }}>
          {label}
        </label>
      )}

      {/* 선택된 칩 + 추가 버튼 */}
      <div
        className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer min-h-[34px]"
        style={{ border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)" }}
        onClick={() => setOpen((v) => !v)}
      >
        {selected.length === 0 ? (
          <span className="flex items-center gap-1.5" style={{ fontSize: 12, color: "var(--text-meta)" }}>
            <Users size={12} />
            {placeholder}
          </span>
        ) : (
          selected.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                fontSize: 11,
                backgroundColor: "var(--neutral-bg)",
                color: "var(--text-secondary)",
              }}
            >
              {p.display_name || p.email}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(p.id);
                }}
                style={{ color: "var(--text-meta)", lineHeight: 1 }}
              >
                ×
              </button>
            </span>
          ))
        )}
      </div>

      {/* 드롭다운 */}
      {open && (
        <div
          className="rounded-md flex flex-col gap-1 p-1.5 max-h-48 overflow-y-auto"
          style={{
            border: "0.5px solid var(--border)",
            backgroundColor: "var(--bg-surface)",
          }}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="이름·이메일 검색"
            className="rounded px-2 py-1 text-xs outline-none"
            style={{
              border: "0.5px solid var(--border-soft)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-primary)",
            }}
          />
          {visible.length === 0 ? (
            <p className="px-2 py-3 text-center" style={{ fontSize: 11, color: "var(--text-meta)" }}>
              가입된 사용자가 없습니다
            </p>
          ) : (
            visible.map((p) => {
              const checked = selectedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggle(p.id)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--neutral-bg)] text-left"
                >
                  <span
                    className="w-4 h-4 rounded flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: checked ? "var(--text-primary)" : "transparent",
                      border: "0.5px solid var(--border)",
                    }}
                  >
                    {checked && <Check size={11} style={{ color: "var(--bg-base)" }} />}
                  </span>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }} className="truncate">
                      {p.display_name || p.email?.split("@")[0]}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-meta)" }} className="truncate">
                      {p.email}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
