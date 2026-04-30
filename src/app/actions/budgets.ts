"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function listBudgetItems(projectId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("project_budgets")
    .select("*")
    .eq("project_id", projectId)
    .order("order_index", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return { error: error.message, items: [] };
  return { items: data ?? [] };
}

export async function createBudgetItem(data: {
  project_id: string;
  group_name?: string;
  item_name?: string;
  unit_price?: number;
  quantity?: number;
  qty_unit?: string;
  count?: number;
  count_unit?: string;
  vat_included?: boolean;
  note?: string;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("project_budgets")
    .select("order_index")
    .eq("project_id", data.project_id)
    .order("order_index", { ascending: false })
    .limit(1);
  const nextIndex = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;

  const { data: row, error } = await supabase
    .from("project_budgets")
    .insert({
      project_id: data.project_id,
      group_name: data.group_name ?? "",
      item_name: data.item_name ?? "",
      unit_price: data.unit_price ?? 0,
      quantity: data.quantity ?? 1,
      qty_unit: data.qty_unit ?? "",
      count: data.count ?? 1,
      count_unit: data.count_unit ?? "회",
      vat_included: data.vat_included ?? false,
      note: data.note ?? "",
      order_index: nextIndex,
    })
    .select()
    .single();

  if (error) return { error: error.message };
  revalidatePath(`/projects/${data.project_id}`);
  return { success: true, item: row };
}

export async function updateBudgetItem(
  id: string,
  _projectId: string,
  data: Partial<{
    group_name: string;
    item_name: string;
    unit_price: number;
    quantity: number;
    qty_unit: string;
    count: number;
    count_unit: string;
    vat_included: boolean;
    note: string;
  }>
) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_budgets").update(data).eq("id", id);
  if (error) return { error: error.message };
  // UI는 이미 낙관적 업데이트됨 — 페이지 재빌드 생략 (성능 개선)
  return { success: true };
}

export async function deleteBudgetItem(id: string, projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_budgets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updateBusinessAmount(projectId: string, amount: number | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ business_amount: amount, updated_at: new Date().toISOString() })
    .eq("id", projectId);
  if (error) return { error: error.message };
  return { success: true };
}
