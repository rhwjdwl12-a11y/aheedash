import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectDetailClient from "./ProjectDetailClient";
import type { Project, Client, Task, FileAttachment, Profile } from "@/types/database";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: project },
    { data: clients },
    { data: tasks },
    { data: files },
    { data: profiles },
    { data: members },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.from("clients").select("*"),
    supabase.from("tasks").select("*").eq("project_id", id).order("order_index"),
    supabase.from("files").select("*").eq("project_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("profiles").select("id, email, display_name").order("display_name"),
    supabase.from("project_members").select("user_id").eq("project_id", id),
  ]);

  if (!project) return notFound();

  const typedProject = project as unknown as Project;
  const typedClients = (clients as unknown as Client[]) ?? [];
  const client = typedClients.find((c) => c.id === typedProject.client_id) ?? null;
  const taskList = (tasks as unknown as Task[]) ?? [];

  // task_assignees 한 번에 fetch
  const taskIds = taskList.map((t) => t.id);
  const taskAssignees: Record<string, string[]> = {};
  const subtasksByTask: Record<string, import("@/types/database").Subtask[]> = {};
  if (taskIds.length > 0) {
    const [{ data: assignees }, { data: subs }] = await Promise.all([
      supabase.from("task_assignees").select("task_id, user_id").in("task_id", taskIds),
      supabase.from("subtasks").select("*").in("task_id", taskIds).order("order_index"),
    ]);
    for (const r of (assignees ?? []) as { task_id: string; user_id: string }[]) {
      if (!taskAssignees[r.task_id]) taskAssignees[r.task_id] = [];
      taskAssignees[r.task_id].push(r.user_id);
    }
    for (const s of (subs ?? []) as import("@/types/database").Subtask[]) {
      if (!subtasksByTask[s.task_id]) subtasksByTask[s.task_id] = [];
      subtasksByTask[s.task_id].push(s);
    }
  }

  return (
    <ProjectDetailClient
      project={typedProject}
      client={client}
      clients={typedClients}
      tasks={taskList}
      files={(files as unknown as FileAttachment[]) ?? []}
      profiles={(profiles as Profile[]) ?? []}
      memberIds={((members as { user_id: string }[]) ?? []).map((m) => m.user_id)}
      taskAssignees={taskAssignees}
      subtasksByTask={subtasksByTask}
    />
  );
}
