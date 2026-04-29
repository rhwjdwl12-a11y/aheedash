"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { StickyNote } from "@/types/database";

const COLOR_MAP: Record<string, StickyNote["color_key"]> = {
  긴급: "pink",
  단국대: "green",
  아희플랜: "yellow",
  서정대: "beige",
  개인: "beige",
  일반: "yellow",
};

export async function createNote(data: {
  content: string;
  category: string;
  due_label?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const color_key = COLOR_MAP[data.category] ?? "yellow";
  const rotation = Math.random() * 3 - 1.5;

  const { error } = await supabase.from("sticky_notes").insert({
    user_id: user.id,
    content: data.content,
    category: data.category,
    due_label: data.due_label || null,
    color_key,
    rotation,
    is_completed: false,
  });

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}

export async function toggleNote(id: string, is_completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sticky_notes")
    .update({
      is_completed,
      completed_at: is_completed ? new Date().toISOString() : null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}

export async function updateNoteContent(id: string, content: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sticky_notes")
    .update({ content })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}

export async function updateNoteColor(id: string, color_key: StickyNote["color_key"]) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sticky_notes")
    .update({ color_key })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}

export async function deleteNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sticky_notes").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}

export async function archiveNote(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sticky_notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { success: true };
}

export async function archiveCompletedNotes() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("sticky_notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("is_completed", true)
    .is("archived_at", null);

  if (error) return { error: error.message };
  revalidatePath("/");
  revalidatePath("/notes");
  return { success: true };
}
