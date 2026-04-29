import { createClient } from "@/lib/supabase/server";
import FinanceClient from "@/components/finance/FinanceClient";
import type { Invoice, Project, Client } from "@/types/database";

export default async function FinancePage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: projects }, { data: clients }] = await Promise.all([
    supabase.from("invoices").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("title"),
    supabase.from("clients").select("*").order("name"),
  ]);

  return (
    <FinanceClient
      invoices={(invoices as Invoice[]) ?? []}
      projects={(projects as Project[]) ?? []}
      clients={(clients as Client[]) ?? []}
    />
  );
}
