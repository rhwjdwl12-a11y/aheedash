import { createClient } from "@/lib/supabase/server";
import RoadmapChart from "@/components/roadmap/RoadmapChart";
import type { Project, Client } from "@/types/database";

export default async function RoadmapPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: clients }] = await Promise.all([
    supabase
      .from("projects")
      .select("*")
      .not("start_date", "is", null)
      .not("deadline", "is", null)
      .order("start_date"),
    supabase.from("clients").select("*").order("name"),
  ]);

  return (
    <RoadmapChart
      projects={(projects as Project[]) ?? []}
      clients={(clients as Client[]) ?? []}
    />
  );
}
