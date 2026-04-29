"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function uploadFile(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요합니다." };

  const file = formData.get("file") as File;
  const projectId = formData.get("project_id") as string;
  if (!file || !projectId) return { error: "파일 또는 프로젝트 ID가 없습니다." };

  const ext = file.name.split(".").pop() ?? "";
  const path = `${user.id}/${projectId}/${Date.now()}_${file.name}`;

  const { error: uploadError } = await supabase.storage
    .from("project-files")
    .upload(path, file);

  if (uploadError) return { error: uploadError.message };

  const { error: dbError } = await supabase.from("files").insert({
    project_id: projectId,
    filename: file.name,
    storage_path: path,
    file_type: ext.toLowerCase(),
    file_size: file.size,
  });

  if (dbError) return { error: dbError.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function deleteFile(fileId: string, storagePath: string, projectId: string) {
  const supabase = await createClient();

  await supabase.storage.from("project-files").remove([storagePath]);
  const { error } = await supabase.from("files").delete().eq("id", fileId);

  if (error) return { error: error.message };
  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function getSignedUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("project-files")
    .createSignedUrl(storagePath, 3600);

  if (error) return { error: error.message };
  return { url: data.signedUrl };
}
