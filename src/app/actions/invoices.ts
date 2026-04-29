"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createInvoice(data: {
  project_id: string;
  amount: number;
  status: "예정" | "청구" | "입금" | "연체";
  issued_at?: string;
  paid_at?: string;
  memo?: string;
}) {
  const supabase = await createClient();
  const { error } = await supabase.from("invoices").insert({
    project_id: data.project_id,
    amount: data.amount,
    status: data.status,
    issued_at: data.issued_at || null,
    paid_at: data.paid_at || null,
    memo: data.memo || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/finance");
  return { success: true };
}

export async function updateInvoiceStatus(
  id: string,
  status: "예정" | "청구" | "입금" | "연체",
  paid_at?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status, paid_at: paid_at ?? null })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/finance");
  return { success: true };
}
