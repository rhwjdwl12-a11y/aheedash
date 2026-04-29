"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { updateProgress } from "./projects";

export async function createTask(data: {
  project_id: string;
  title: string;
  status?: "todo" | "doing" | "review" | "done";
  due_date?: string;
  assignee?: string;
  memo?: string;
}) {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tasks")
    .select("order_index")
    .eq("project_id", data.project_id)
    .eq("status", data.status ?? "todo")
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data: row, error } = await supabase
    .from("tasks")
    .insert({
      project_id: data.project_id,
      title: data.title,
      status: data.status ?? "todo",
      due_date: data.due_date || null,
      assignee: data.assignee?.trim() || null,
      memo: data.memo?.trim() || null,
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${data.project_id}`);
  return { success: true, task: row };
}

export async function updateTask(
  id: string,
  projectId: string,
  data: Partial<{
    title: string;
    assignee: string | null;
    memo: string | null;
    due_date: string | null;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateTaskStatus(
  id: string,
  status: "todo" | "doing" | "review" | "done",
  projectId: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", id);

  if (error) return { error: error.message };
  await updateProgress(projectId);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function reorderTasks(
  tasks: { id: string; order_index: number }[],
  projectId: string
) {
  const supabase = await createClient();
  await Promise.all(
    tasks.map(({ id, order_index }) =>
      supabase.from("tasks").update({ order_index }).eq("id", id)
    )
  );
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteTask(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { error: error.message };
  await updateProgress(projectId);
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
