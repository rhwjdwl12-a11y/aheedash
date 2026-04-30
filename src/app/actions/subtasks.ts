"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function listSubtasks(taskId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("subtasks")
    .select("*")
    .eq("task_id", taskId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error: error.message, subtasks: [] };
  return { subtasks: data ?? [] };
}

export async function createSubtask(data: {
  task_id: string;
  title: string;
  projectId: string;
}) {
  if (!data.title.trim()) return { error: "제목을 입력해주세요." };
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("subtasks")
    .select("order_index")
    .eq("task_id", data.task_id)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data: row, error } = await supabase
    .from("subtasks")
    .insert({
      task_id: data.task_id,
      title: data.title.trim(),
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${data.projectId}`);
  return { success: true, subtask: row };
}

export async function updateSubtask(
  id: string,
  projectId: string,
  data: Partial<{ title: string; is_done: boolean }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("subtasks").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteSubtask(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("subtasks").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}
