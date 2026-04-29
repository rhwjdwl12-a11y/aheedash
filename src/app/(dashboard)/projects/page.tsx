import { createClient } from "@/lib/supabase/server";
import ProjectsClient from "./ProjectsClient";
import type { Project, Client, Profile } from "@/types/database";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: projects }, { data: clients }, { data: profiles }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("name"),
    supabase.from("profiles").select("id, email, display_name").order("display_name"),
  ]);

  return (
    <ProjectsClient
      projects={(projects as Project[]) ?? []}
      clients={(clients as Client[]) ?? []}
      profiles={(profiles as Profile[]) ?? []}
      currentUserId={user?.id ?? ""}
    />
  );
}
