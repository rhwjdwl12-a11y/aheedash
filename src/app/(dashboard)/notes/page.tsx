import { createClient } from "@/lib/supabase/server";
import NotesPageClient from "./NotesPageClient";
import type { StickyNote } from "@/types/database";

export default async function NotesPage() {
  const supabase = await createClient();

  const [{ data: active }, { data: done }, { data: archived }] = await Promise.all([
    supabase
      .from("sticky_notes")
      .select("*")
      .is("archived_at", null)
      .eq("is_completed", false)
      .order("created_at", { ascending: false }),
    supabase
      .from("sticky_notes")
      .select("*")
      .is("archived_at", null)
      .eq("is_completed", true)
      .order("completed_at", { ascending: false }),
    supabase
      .from("sticky_notes")
      .select("*")
      .not("archived_at", "is", null)
      .order("archived_at", { ascending: false }),
  ]);

  return (
    <NotesPageClient
      activeNotes={(active as StickyNote[]) ?? []}
      doneNotes={(done as StickyNote[]) ?? []}
      archivedNotes={(archived as StickyNote[]) ?? []}
    />
  );
}
