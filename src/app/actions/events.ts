"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createEvent(data: {
  title: string;
  project_id?: string;
  event_date: string;
  end_date?: string;
  all_day?: boolean;
  type: "마감" | "미팅" | "제출" | "기타";
  reminder_d3?: boolean;
  reminder_d1?: boolean;
  memo?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase.from("events").insert({
    user_id: user.id,
    title: data.title,
    project_id: data.project_id || null,
    event_date: data.event_date,
    end_date: data.end_date || null,
    all_day: data.all_day ?? false,
    type: data.type,
    reminder_d3: data.reminder_d3 ?? true,
    reminder_d1: data.reminder_d1 ?? true,
    memo: data.memo || null,
  });

  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/");
  return { success: true };
}

export async function updateEvent(
  id: string,
  data: Partial<{
    title: string;
    project_id: string;
    event_date: string;
    end_date: string;
    all_day: boolean;
    type: string;
    reminder_d3: boolean;
    reminder_d1: boolean;
    memo: string;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").update(data).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  return { success: true };
}
