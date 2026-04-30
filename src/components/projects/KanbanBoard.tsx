"use client";

import { useState } from "react";
import { DndContext, DragEndEvent, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Pencil, Check, ChevronDown, ChevronRight, GitBranch, Plus, Trash2 } from "lucide-react";
import { createTask, updateTask, updateTaskStatus, deleteTask } from "@/app/actions/tasks";
import { setTaskAssignees } from "@/app/actions/members";
import { createSubtask, updateSubtask, deleteSubtask } from "@/app/actions/subtasks";
import { formatDday, getDdayColor } from "@/lib/utils/dday";
import MemberPicker from "@/components/shared/MemberPicker";
import SubtaskList from "@/components/projects/SubtaskList";
import type { Task, Profile, Subtask } from "@/types/database";

const COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "할 일" },
  { key: "doing", label: "진행중" },
  { key: "review", label: "검토" },
  { key: "done", label: "완료" },
];

const DDAY_COLORS = {
  urgent: "var(--warning-text)",
  warning: "var(--client-seojeong)",
  normal: "var(--text-meta)",
};

interface KanbanBoardProps {
  tasks: Task[];
  projectId: string;
  profiles?: Profile[];
  /** 프로젝트 소유자 + 멤버 id 목록 (이 풀 안에서만 담당자 지정) */
  projectMemberIds?: string[];
  /** taskId → user_id[] */
  taskAssignees?: Record<string, string[]>;
  /** taskId → subtasks[] */
  subtasksByTask?: Record<string, Subtask[]>;
  currentUserId?: string;
}

function TaskCard({
  task,
  assigneeIds,
  profileMap,
  subtasks,
  projectId,
  onSubtasksChange,
  onDelete,
  onEdit,
}: {
  task: Task;
  assigneeIds: string[];
  profileMap: Record<string, Profile>;
  subtasks: Subtask[];
  projectId: string;
  onSubtasksChange: (taskId: string, next: Subtask[]) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newSubTitle, setNewSubTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const doneCount = subtasks.filter((s) => s.is_done).length;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const ddayStr = task.due_date ? formatDday(task.due_date) : null;
  const ddayColor = task.due_date ? DDAY_COLORS[getDdayColor(task.due_date)] : "var(--text-meta)";

  const assignees = assigneeIds
    .map((id) => profileMap[id])
    .filter(Boolean);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : task.status === "done" ? 0.7 : 1,
        backgroundColor: "var(--bg-surface)",
        border: task.status === "doing"
          ? `0.5px solid var(--client-dankook)`
          : "0.5px solid var(--border)",
        borderLeft: task.status === "doing" ? "2px solid var(--client-dankook)" : undefined,
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-1">
        <p
          style={{
            fontSize: 13,
            color: "var(--text-primary)",
            textDecoration: task.status === "done" ? "line-through" : "none",
            lineHeight: 1.4,
            flex: 1,
          }}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="p-0.5 rounded hover:bg-[var(--neutral-bg)] transition-colors"
            title="편집"
          >
            <Pencil size={11} style={{ color: "var(--text-meta)" }} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-xs hover:text-red-500 transition-colors"
            style={{ color: "var(--text-meta)", cursor: "pointer", padding: "0 2px" }}
          >
            ×
          </button>
        </div>
      </div>

      {/* 메모 미리보기 */}
      {task.memo && (
        <p
          style={{
            fontSize: 11, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.4,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}
        >
          {task.memo}
        </p>
      )}

      {/* 담당자 + D-day */}
      {(assignees.length > 0 || ddayStr) && (
        <div className="flex items-center justify-between gap-2 mt-1.5 flex-wrap">
          <div className="flex items-center gap-1 flex-wrap">
            {assignees.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center px-1.5 py-0.5 rounded"
                style={{
                  fontSize: 10,
                  backgroundColor: "var(--neutral-bg)",
                  color: "var(--text-secondary)",
                }}
              >
                {p.display_name || p.email?.split("@")[0]}
              </span>
            ))}
          </div>
          {ddayStr && <span style={{ fontSize: 10, color: ddayColor }}>{ddayStr}</span>}
        </div>
      )}

      {/* 세부 일정 인라인 박스 */}
      <div className="mt-1.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
          onPointerDown={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-[var(--neutral-bg)] transition-colors"
          style={{ fontSize: 10, color: "var(--text-meta)" }}
        >
          {expanded ? <ChevronDown size={9} /> : <ChevronRight size={9} />}
          <GitBranch size={9} />
          세부 일정 {subtasks.length > 0 ? `${doneCount}/${subtasks.length}` : "추가"}
        </button>

        {expanded && (
          <div
            className="mt-1.5 ml-1.5 pl-2 flex flex-col gap-1"
            style={{ borderLeft: "1.5px dashed var(--border)" }}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {subtasks.length > 0 && (
              <div className="w-full rounded-full overflow-hidden mb-0.5" style={{ height: 2, backgroundColor: "var(--border-soft)" }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(doneCount / subtasks.length) * 100}%`,
                    backgroundColor: "var(--client-dankook)",
                  }}
                />
              </div>
            )}

            {subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5 group">
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const next = !s.is_done;
                    onSubtasksChange(
                      task.id,
                      subtasks.map((x) => (x.id === s.id ? { ...x, is_done: next } : x))
                    );
                    const r = await updateSubtask(s.id, projectId, { is_done: next });
                    if (r?.error) toast.error(r.error);
                  }}
                  className="w-3 h-3 rounded flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: s.is_done ? "var(--text-primary)" : "transparent",
                    border: "0.5px solid var(--border)",
                  }}
                >
                  {s.is_done && <Check size={8} style={{ color: "var(--bg-base)" }} />}
                </button>
                <span
                  className="flex-1 truncate"
                  style={{
                    fontSize: 11,
                    color: "var(--text-secondary)",
                    textDecoration: s.is_done ? "line-through" : "none",
                    opacity: s.is_done ? 0.5 : 1,
                  }}
                >
                  {s.title}
                </span>
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    onSubtasksChange(task.id, subtasks.filter((x) => x.id !== s.id));
                    const r = await deleteSubtask(s.id, projectId);
                    if (r?.error) toast.error(r.error);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[var(--neutral-bg)]"
                >
                  <Trash2 size={9} style={{ color: "var(--text-meta)" }} />
                </button>
              </div>
            ))}

            {/* 빠른 추가 */}
            <div className="flex gap-1 mt-0.5">
              <input
                type="text"
                value={newSubTitle}
                onChange={(e) => setNewSubTitle(e.target.value)}
                onKeyDown={async (e) => {
                  e.stopPropagation();
                  if (e.key !== "Enter" || !newSubTitle.trim() || adding) return;
                  setAdding(true);
                  const r = await createSubtask({
                    task_id: task.id,
                    title: newSubTitle,
                    projectId,
                  });
                  if (r?.error) toast.error(r.error);
                  else if (r?.subtask) {
                    onSubtasksChange(task.id, [...subtasks, r.subtask as Subtask]);
                    setNewSubTitle("");
                  }
                  setAdding(false);
                }}
                placeholder="세부 일정 + Enter"
                className="flex-1 outline-none rounded px-1.5 py-0.5"
                style={{
                  fontSize: 11,
                  border: "0.5px solid var(--border-soft)",
                  backgroundColor: "var(--bg-base)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Column({
  column, tasks, assigneeMap, profileMap, subtasksMap, projectId, onSubtasksChange, onDelete, onAdd, onEdit,
}: {
  column: (typeof COLUMNS)[number];
  tasks: Task[];
  assigneeMap: Record<string, string[]>;
  profileMap: Record<string, Profile>;
  subtasksMap: Record<string, Subtask[]>;
  projectId: string;
  onSubtasksChange: (taskId: string, next: Subtask[]) => void;
  onDelete: (id: string) => void;
  onAdd: (status: Task["status"]) => void;
  onEdit: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.key}`,
    data: { type: "column", status: column.key },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-2 min-w-[200px] flex-1"
      style={{
        backgroundColor: isOver ? "var(--neutral-bg)" : "var(--bg-base)",
        borderRadius: 8,
        padding: 10,
        transition: "background-color 0.15s",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
            {column.label}
          </span>
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{ fontSize: 10, backgroundColor: "var(--border-soft)", color: "var(--text-meta)" }}
          >
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAdd(column.key)}
          style={{ fontSize: 16, color: "var(--text-meta)", lineHeight: 1, cursor: "pointer" }}
          className="hover:text-[var(--text-primary)] transition-colors"
        >
          +
        </button>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2 min-h-[60px]">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              assigneeIds={assigneeMap[task.id] ?? []}
              profileMap={profileMap}
              subtasks={subtasksMap[task.id] ?? []}
              projectId={projectId}
              onSubtasksChange={onSubtasksChange}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  );
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

export default function KanbanBoard({
  tasks: initialTasks,
  projectId,
  profiles = [],
  projectMemberIds = [],
  taskAssignees: initialAssignees = {},
  subtasksByTask: initialSubtasks = {},
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [assigneeMap, setAssigneeMap] = useState<Record<string, string[]>>(initialAssignees);
  const [subtasksMap, setSubtasksMap] = useState<Record<string, Subtask[]>>(initialSubtasks);

  function handleSubtasksChange(taskId: string, next: Subtask[]) {
    setSubtasksMap((m) => ({ ...m, [taskId]: next }));
  }
  const [addingTo, setAddingTo] = useState<Task["status"] | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [newAssigneeIds, setNewAssigneeIds] = useState<string[]>([]);

  const [editTitle, setEditTitle] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editAssigneeIds, setEditAssigneeIds] = useState<string[]>([]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // 프로젝트 멤버만 담당자 후보로 노출
  const memberPool = profiles.filter((p) => projectMemberIds.includes(p.id));
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p])) as Record<string, Profile>;

  function getColumnTasks(status: Task["status"]) {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.order_index - b.order_index);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    const draggedTask = tasks.find((t) => t.id === active.id);
    if (!draggedTask) return;

    // 드롭 대상 status 결정: 컬럼 droppable 또는 다른 task
    let newStatus: Task["status"] | null = null;
    const overData = over.data?.current as { type?: string; status?: Task["status"] } | undefined;
    if (overData?.type === "column" && overData.status) {
      newStatus = overData.status;
    } else {
      const targetTask = tasks.find((t) => t.id === over.id);
      if (targetTask) newStatus = targetTask.status;
    }

    if (!newStatus || newStatus === draggedTask.status) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggedTask.id ? { ...t, status: newStatus! } : t))
    );
    const result = await updateTaskStatus(draggedTask.id, newStatus, projectId);
    if (result?.error) {
      toast.error(result.error);
      // 롤백
      setTasks((prev) =>
        prev.map((t) => (t.id === draggedTask.id ? { ...t, status: draggedTask.status } : t))
      );
    }
  }

  function openAdd(status: Task["status"]) {
    setAddingTo(status);
    setNewTitle("");
    setNewMemo("");
    setNewAssigneeIds([]);
  }
  function closeAdd() { setAddingTo(null); }

  async function handleAddTask() {
    if (!newTitle.trim() || !addingTo) return;
    const result = await createTask({
      project_id: projectId,
      title: newTitle.trim(),
      status: addingTo,
      memo: newMemo,
    });
    if (result?.error) { toast.error(result.error); return; }
    if (result?.task) {
      const created = result.task as Task;
      setTasks((prev) => [...prev, created]);
      if (newAssigneeIds.length > 0) {
        await setTaskAssignees(created.id, newAssigneeIds, projectId);
        setAssigneeMap((m) => ({ ...m, [created.id]: newAssigneeIds }));
      }
    }
    closeAdd();
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditMemo(task.memo ?? "");
    setEditAssigneeIds(assigneeMap[task.id] ?? []);
  }
  function closeEdit() { setEditingTask(null); }

  async function handleSaveEdit() {
    if (!editingTask) return;
    if (!editTitle.trim()) { toast.error("제목을 입력해주세요."); return; }

    const data = {
      title: editTitle.trim(),
      memo: editMemo.trim() || null,
    };
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? { ...t, ...data } : t))
    );

    const [r1, r2] = await Promise.all([
      updateTask(editingTask.id, projectId, data),
      setTaskAssignees(editingTask.id, editAssigneeIds, projectId),
    ]);
    if (r1?.error) toast.error(r1.error);
    else if (r2?.error) toast.error(r2.error);
    else toast.success("저장되었습니다");

    setAssigneeMap((m) => ({ ...m, [editingTask.id]: editAssigneeIds }));
    closeEdit();
  }

  async function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setAssigneeMap((m) => { const c = { ...m }; delete c[id]; return c; });
    const result = await deleteTask(id, projectId);
    if (result?.error) toast.error(result.error);
  }

  return (
    <div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <Column
              key={col.key}
              column={col}
              tasks={getColumnTasks(col.key)}
              assigneeMap={assigneeMap}
              profileMap={profileMap}
              subtasksMap={subtasksMap}
              projectId={projectId}
              onSubtasksChange={handleSubtasksChange}
              onDelete={handleDelete}
              onAdd={openAdd}
              onEdit={openEdit}
            />
          ))}
        </div>
      </DndContext>

      {/* 추가 모달 */}
      {addingTo && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 md:items-center md:pb-0"
          style={{ backgroundColor: "rgba(61,47,32,0.2)" }}
          onClick={(e) => e.target === e.currentTarget && closeAdd()}
        >
          <div
            className="w-full max-w-sm rounded-xl p-4 flex flex-col gap-2.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              boxShadow: "0 8px 32px rgba(61,47,32,0.12)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              {COLUMNS.find((c) => c.key === addingTo)?.label}에 추가
            </p>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") closeAdd(); }}
              placeholder="태스크 제목"
              style={inputStyle}
            />
            <MemberPicker
              profiles={memberPool}
              selectedIds={newAssigneeIds}
              onChange={setNewAssigneeIds}
              label="담당자"
              placeholder="담당자 선택 (다중 가능)"
            />
            <textarea
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              placeholder="메모 (어떤 일인지 설명)"
              rows={3}
              style={{ ...inputStyle, resize: "none" }}
            />
            {memberPool.length === 0 && (
              <p style={{ fontSize: 10, color: "var(--text-meta)" }}>
                * 프로젝트에 공유된 담당자가 없습니다. 프로젝트 생성/편집 시 담당자를 추가하세요.
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={closeAdd}
                className="flex-1 py-2 rounded-md text-sm hover:bg-[var(--neutral-bg)]"
                style={{ color: "var(--text-secondary)" }}
              >취소</button>
              <button
                onClick={handleAddTask}
                disabled={!newTitle.trim()}
                className="flex-1 py-2 rounded-md text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
              >추가</button>
            </div>
          </div>
        </div>
      )}

      {/* 편집 모달 */}
      {editingTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4 md:items-center md:pb-0"
          style={{ backgroundColor: "rgba(61,47,32,0.2)" }}
          onClick={(e) => e.target === e.currentTarget && closeEdit()}
        >
          <div
            className="w-full max-w-sm rounded-xl p-4 flex flex-col gap-2.5"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              boxShadow: "0 8px 32px rgba(61,47,32,0.12)",
            }}
          >
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>
              태스크 편집
            </p>
            <input
              autoFocus
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="태스크 제목"
              style={inputStyle}
            />
            <MemberPicker
              profiles={memberPool}
              selectedIds={editAssigneeIds}
              onChange={setEditAssigneeIds}
              label="담당자"
              placeholder="담당자 선택"
            />
            <div className="flex flex-col gap-1">
              <label style={{ fontSize: 11, color: "var(--text-meta)" }}>
                메모 (어떤 일인지)
              </label>
              <textarea
                value={editMemo}
                onChange={(e) => setEditMemo(e.target.value)}
                placeholder="할일 설명을 입력하세요"
                rows={4}
                style={{ ...inputStyle, resize: "none" }}
              />
            </div>

            {/* 세부 일정 (서브태스크) */}
            <div className="pt-2.5" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
              <SubtaskList taskId={editingTask.id} projectId={projectId} />
            </div>

            <div className="flex gap-2 mt-1">
              <button
                onClick={closeEdit}
                className="flex-1 py-2 rounded-md text-sm hover:bg-[var(--neutral-bg)]"
                style={{ color: "var(--text-secondary)" }}
              >취소</button>
              <button
                onClick={handleSaveEdit}
                disabled={!editTitle.trim()}
                className="flex-1 py-2 rounded-md text-sm font-medium disabled:opacity-40"
                style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
              >저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
