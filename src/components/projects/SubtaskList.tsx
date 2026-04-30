"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Trash2, Plus, GitBranch } from "lucide-react";
import {
  listSubtasks,
  createSubtask,
  updateSubtask,
  deleteSubtask,
} from "@/app/actions/subtasks";
import type { Subtask } from "@/types/database";

interface SubtaskListProps {
  taskId: string;
  projectId: string;
}

export default function SubtaskList({ taskId, projectId }: SubtaskListProps) {
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const res = await listSubtasks(taskId);
      if (!cancelled) {
        setSubtasks((res.subtasks as Subtask[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [taskId]);

  async function handleAdd() {
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await createSubtask({
      task_id: taskId,
      title: newTitle,
      projectId,
    });
    if (res?.error) toast.error(res.error);
    else if (res?.subtask) {
      setSubtasks((prev) => [...prev, res.subtask as Subtask]);
      setNewTitle("");
    }
    setAdding(false);
  }

  async function handleToggle(s: Subtask) {
    const next = !s.is_done;
    setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_done: next } : x)));
    const res = await updateSubtask(s.id, projectId, { is_done: next });
    if (res?.error) {
      toast.error(res.error);
      setSubtasks((prev) => prev.map((x) => (x.id === s.id ? { ...x, is_done: !next } : x)));
    }
  }

  async function handleEditTitle(id: string, value: string) {
    const v = value.trim();
    if (!v) return;
    setSubtasks((prev) => prev.map((x) => (x.id === id ? { ...x, title: v } : x)));
    await updateSubtask(id, projectId, { title: v });
  }

  async function handleDelete(id: string) {
    const prev = subtasks;
    setSubtasks((p) => p.filter((x) => x.id !== id));
    const res = await deleteSubtask(id, projectId);
    if (res?.error) {
      toast.error(res.error);
      setSubtasks(prev);
    }
  }

  const inputStyle = {
    border: "0.5px solid var(--border)",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    borderRadius: 6,
    padding: "6px 9px",
    fontSize: 12,
    width: "100%",
    outline: "none",
    fontFamily: "inherit",
  };

  const doneCount = subtasks.filter((s) => s.is_done).length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-1.5" style={{ fontSize: 11, color: "var(--text-meta)", fontWeight: 500 }}>
          <GitBranch size={11} />
          세부 일정 {subtasks.length > 0 && `(${doneCount}/${subtasks.length})`}
        </label>
      </div>

      {/* 진행률 바 */}
      {subtasks.length > 0 && (
        <div className="w-full rounded-full overflow-hidden" style={{ height: 2, backgroundColor: "var(--border-soft)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(doneCount / subtasks.length) * 100}%`,
              backgroundColor: "var(--client-dankook)",
            }}
          />
        </div>
      )}

      {/* 목록 */}
      {loading ? (
        <p style={{ fontSize: 11, color: "var(--text-meta)", padding: "4px 0" }}>불러오는 중...</p>
      ) : (
        <ul
          className="flex flex-col gap-1 ml-2 pl-2.5"
          style={{ borderLeft: "1.5px dashed var(--border)" }}
        >
          {subtasks.length === 0 && (
            <li style={{ fontSize: 11, color: "var(--text-meta)", padding: "2px 0" }}>
              세부 일정 없음
            </li>
          )}
          {subtasks.map((s) => (
            <li key={s.id} className="flex items-center gap-1.5 group">
              <button
                onClick={() => handleToggle(s)}
                className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 transition-colors"
                style={{
                  backgroundColor: s.is_done ? "var(--text-primary)" : "transparent",
                  border: "0.5px solid var(--border)",
                }}
              >
                {s.is_done && <Check size={9} style={{ color: "var(--bg-base)" }} />}
              </button>
              <input
                type="text"
                defaultValue={s.title}
                onBlur={(e) => {
                  if (e.target.value !== s.title) handleEditTitle(s.id, e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                }}
                className="flex-1 bg-transparent outline-none truncate"
                style={{
                  fontSize: 12,
                  color: "var(--text-primary)",
                  textDecoration: s.is_done ? "line-through" : "none",
                  opacity: s.is_done ? 0.5 : 1,
                  padding: "2px 4px",
                  borderRadius: 4,
                }}
              />
              <button
                onClick={() => handleDelete(s.id)}
                className="p-0.5 rounded shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[var(--neutral-bg)]"
              >
                <Trash2 size={10} style={{ color: "var(--text-meta)" }} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* 추가 입력 */}
      <div className="flex gap-1.5 mt-1">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="세부 일정 추가 후 Enter"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button
          onClick={handleAdd}
          disabled={adding || !newTitle.trim()}
          className="rounded-md px-2 hover:opacity-80 disabled:opacity-40"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}
