"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function listProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name")
    .order("display_name", { ascending: true });
  if (error) return { error: error.message, profiles: [] };
  return { profiles: data ?? [] };
}

export async function listProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_members")
    .select("user_id")
    .eq("project_id", projectId);
  if (error) return { error: error.message, memberIds: [] as string[] };
  return { memberIds: (data ?? []).map((m) => m.user_id as string) };
}

export async function setProjectMembers(projectId: string, userIds: string[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  // 소유자 본인은 자동 멤버이므로 제외
  const filtered = Array.from(new Set(userIds)).filter((id) => id !== user.id);

  // 기존 멤버 모두 삭제
  await supabase.from("project_members").delete().eq("project_id", projectId);

  if (filtered.length > 0) {
    const rows = filtered.map((uid) => ({
      project_id: projectId,
      user_id: uid,
      role: "member",
    }));
    const { error } = await supabase.from("project_members").insert(rows);
    if (error) return { error: error.message };
  }

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function listTaskAssignees(projectId: string) {
  const supabase = await createClient();
  // 해당 프로젝트의 모든 task의 assignees를 한 번에 가져오기
  const { data: tasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("project_id", projectId);

  const taskIds = (tasks ?? []).map((t) => t.id as string);
  if (taskIds.length === 0) return { assignees: {} as Record<string, string[]> };

  const { data } = await supabase
    .from("task_assignees")
    .select("task_id, user_id")
    .in("task_id", taskIds);

  const map: Record<string, string[]> = {};
  for (const row of data ?? []) {
    const tid = row.task_id as string;
    const uid = row.user_id as string;
    if (!map[tid]) map[tid] = [];
    map[tid].push(uid);
  }
  return { assignees: map };
}

export async function setTaskAssignees(taskId: string, userIds: string[], _projectId: string) {
  const supabase = await createClient();
  const filtered = Array.from(new Set(userIds));

  await supabase.from("task_assignees").delete().eq("task_id", taskId);

  if (filtered.length > 0) {
    const rows = filtered.map((uid) => ({ task_id: taskId, user_id: uid }));
    const { error } = await supabase.from("task_assignees").insert(rows);
    if (error) return { error: error.message };
  }

  return { success: true };
}
