"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createProject(data: {
  title: string;
  client_id?: string;
  type?: string;
  duration_type?: string;
  start_date?: string;
  deadline?: string;
  budget?: number;
  description?: string;
  member_ids?: string[];
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      title: data.title,
      client_id: data.client_id || null,
      type: (data.type as never) || null,
      duration_type: (data.duration_type as never) || null,
      start_date: data.start_date || null,
      deadline: data.deadline || null,
      budget: data.budget || null,
      description: data.description || null,
      status: "진행중",
      progress: 0,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  // 멤버 추가 (소유자 본인 제외)
  if (data.member_ids && data.member_ids.length > 0) {
    const memberIds = Array.from(new Set(data.member_ids)).filter((id) => id !== user.id);
    if (memberIds.length > 0) {
      const rows = memberIds.map((uid) => ({
        project_id: project.id,
        user_id: uid,
        role: "member",
      }));
      await supabase.from("project_members").insert(rows);
    }
  }

  revalidatePath("/");
  revalidatePath("/projects");
  return { success: true, id: project.id };
}

export async function updateProject(
  id: string,
  data: Partial<{
    title: string;
    client_id: string;
    type: string;
    status: string;
    duration_type: string;
    start_date: string;
    deadline: string;
    budget: number;
    fee: number;
    progress: number;
    description: string;
    notes: string;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  return { success: true };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { success: true };
}

export async function reorderProjects(orders: { id: string; display_order: number }[]) {
  const supabase = await createClient();
  const results = await Promise.all(
    orders.map((o) =>
      supabase.from("projects").update({ display_order: o.display_order }).eq("id", o.id)
    )
  );
  const firstError = results.find((r) => r.error);
  if (firstError?.error) return { error: firstError.error.message };
  return { success: true };
}

export async function updateProgress(projectId: string) {
  const supabase = await createClient();
  const { data: tasks } = await supabase
    .from("tasks")
    .select("status")
    .eq("project_id", projectId);

  if (!tasks || tasks.length === 0) {
    await supabase.from("projects").update({ progress: 0 }).eq("id", projectId);
    return;
  }

  const done = tasks.filter((t) => t.status === "done").length;
  const progress = Math.round((done / tasks.length) * 100);

  await supabase
    .from("projects")
    .update({ progress, updated_at: new Date().toISOString() })
    .eq("id", projectId);

  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
}
