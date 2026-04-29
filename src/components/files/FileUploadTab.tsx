"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { uploadFile, deleteFile, getSignedUrl } from "@/app/actions/files";
import type { FileAttachment } from "@/types/database";

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  ppt: "📊",
  pptx: "📊",
  jpg: "🖼️",
  jpeg: "🖼️",
  png: "🖼️",
  gif: "🖼️",
  webp: "🖼️",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

interface FileUploadTabProps {
  projectId: string;
  files: FileAttachment[];
}

export default function FileUploadTab({ projectId, files: initialFiles }: FileUploadTabProps) {
  const [files, setFiles] = useState(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      if (accepted.length === 0) return;
      setUploading(true);

      for (const file of accepted) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("project_id", projectId);
        const result = await uploadFile(fd);
        if (result?.error) toast.error(result.error);
        else toast.success(`${file.name} 업로드 완료`);
      }
      setUploading(false);
    },
    [projectId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
    },
  });

  async function handlePreview(file: FileAttachment) {
    const imgTypes = ["jpg", "jpeg", "png", "gif", "webp"];
    const isImage = imgTypes.includes(file.file_type ?? "");
    const isPdf = file.file_type === "pdf";

    if (!isImage && !isPdf) {
      toast.info("PPT/PPTX는 미리보기를 지원하지 않습니다. 다운로드해주세요.");
      return;
    }

    const result = await getSignedUrl(file.storage_path);
    if (result?.error) { toast.error(result.error); return; }
    setPreviewUrl(result.url!);
    setPreviewType(file.file_type ?? "");
  }

  async function handleDownload(file: FileAttachment) {
    const result = await getSignedUrl(file.storage_path);
    if (result?.error) { toast.error(result.error); return; }
    const a = document.createElement("a");
    a.href = result.url!;
    a.download = file.filename;
    a.click();
  }

  async function handleDelete(file: FileAttachment) {
    if (!confirm(`${file.filename}을 삭제하시겠습니까?`)) return;
    setFiles((prev) => prev.filter((f) => f.id !== file.id));
    await deleteFile(file.id, file.storage_path, projectId);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 드롭존 */}
      <div
        {...getRootProps()}
        className="rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
        style={{
          padding: 32,
          border: `1.5px dashed ${isDragActive ? "var(--client-dankook)" : "var(--border)"}`,
          backgroundColor: isDragActive ? "var(--success-bg)" : "var(--bg-surface)",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ fontSize: 24 }}>{uploading ? "⏳" : "📁"}</p>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          {uploading ? "업로드 중..." : isDragActive ? "파일을 여기에 놓으세요" : "파일을 끌어 놓거나 클릭해서 업로드"}
        </p>
        <p style={{ fontSize: 11, color: "var(--text-meta)" }}>PPT, PPTX, PDF, 이미지 지원</p>
      </div>

      {/* 파일 목록 */}
      {files.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "0.5px solid var(--border)" }}
        >
          {files.map((file, i) => (
            <div
              key={file.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--neutral-bg)] transition-colors"
              style={{
                borderTop: i > 0 ? "0.5px solid var(--border-soft)" : "none",
                backgroundColor: "var(--bg-surface)",
              }}
            >
              <span style={{ fontSize: 20 }}>{FILE_ICONS[file.file_type ?? ""] ?? "📎"}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: 13, color: "var(--text-primary)" }}>
                  {file.filename}
                </p>
                <p style={{ fontSize: 11, color: "var(--text-meta)" }}>
                  {file.file_size ? formatSize(file.file_size) : ""} ·{" "}
                  {new Date(file.uploaded_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePreview(file)}
                  style={{ fontSize: 11, color: "var(--text-meta)", cursor: "pointer" }}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  미리보기
                </button>
                <button
                  onClick={() => handleDownload(file)}
                  style={{ fontSize: 11, color: "var(--text-meta)", cursor: "pointer" }}
                  className="hover:text-[var(--text-primary)] transition-colors"
                >
                  다운로드
                </button>
                <button
                  onClick={() => handleDelete(file)}
                  style={{ fontSize: 11, color: "var(--text-meta)", cursor: "pointer" }}
                  className="hover:text-[var(--warning-text)] transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 미리보기 모달 */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(61,47,32,0.5)" }}
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="max-w-3xl max-h-[85vh] overflow-auto rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {["jpg", "jpeg", "png", "gif", "webp"].includes(previewType ?? "") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="미리보기" className="max-w-full rounded-xl" />
            ) : (
              <iframe src={previewUrl} className="w-[700px] h-[85vh] rounded-xl" title="PDF 미리보기" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
