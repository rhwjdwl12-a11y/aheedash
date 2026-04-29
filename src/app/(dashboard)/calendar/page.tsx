import { createClient } from "@/lib/supabase/server";
import CalendarClient from "@/components/calendar/CalendarClient";
import type { Event, Project } from "@/types/database";

export default async function CalendarPage() {
  const supabase = await createClient();
  const [{ data: events }, { data: projects }] = await Promise.all([
    supabase.from("events").select("*").order("event_date"),
    supabase.from("projects").select("*").order("title"),
  ]);

  return (
    <div className="flex flex-col gap-4 max-w-6xl">
      <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>캘린더</h1>
      <CalendarClient
        events={(events as Event[]) ?? []}
        projects={(projects as Project[]) ?? []}
      />
    </div>
  );
}
