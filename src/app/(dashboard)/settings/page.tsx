import { createClient } from "@/lib/supabase/server";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: clients } = await supabase.from("clients").select("*").order("name");

  return (
    <SettingsClient
      user={user}
      clients={clients ?? []}
    />
  );
}
