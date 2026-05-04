"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface TopBarProps {
  userName: string;
  userInitials: string;
  isAdmin?: boolean;
  notificationCount?: number;
}

interface SearchResult {
  type: "project" | "task";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
}

export default function TopBar({ userName, userInitials, isAdmin, notificationCount = 0 }: TopBarProps) {
  const router = useRouter();
  const [showProfile, setShowProfile] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // 검색 (디바운스)
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const supabase = createClient();
      const [{ data: projects }, { data: tasks }] = await Promise.all([
        supabase.from("projects").select("id,title,status").ilike("title", `%${query}%`).limit(5),
        supabase.from("tasks").select("id,title,project_id,status").ilike("title", `%${query}%`).limit(5),
      ]);
      const r: SearchResult[] = [];
      for (const p of (projects ?? []) as { id: string; title: string; status: string }[]) {
        r.push({ type: "project", id: p.id, title: p.title, subtitle: p.status, href: `/projects/${p.id}` });
      }
      for (const t of (tasks ?? []) as { id: string; title: string; project_id: string; status: string }[]) {
        r.push({ type: "task", id: t.id, title: t.title, subtitle: t.status, href: `/projects/${t.project_id}` });
      }
      setResults(r);
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // 키보드 단축키 (Ctrl+K / Cmd+K)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
      if (e.key === "Escape") {
        setShowSearch(false);
        setShowProfile(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="hidden md:flex items-center justify-end gap-3 px-6 h-14 shrink-0"
      style={{ borderBottom: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)" }}>
      {/* 검색 */}
      <div ref={searchRef} className="relative">
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 h-9 rounded-lg w-64"
          style={{
            backgroundColor: "var(--bg-surface)",
            border: "0.5px solid var(--border)",
            color: "var(--text-meta)",
          }}
        >
          <Search size={14} />
          <span style={{ fontSize: 12 }}>검색 (프로젝트, 업무 등)</span>
          <span className="ml-auto rounded px-1.5 py-0.5"
            style={{ fontSize: 10, backgroundColor: "var(--neutral-bg)", color: "var(--text-meta)" }}>
            ⌘K
          </span>
        </button>

        {showSearch && (
          <div className="absolute right-0 top-full mt-1 w-96 rounded-lg overflow-hidden z-50"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              boxShadow: "0 8px 24px rgba(61,47,32,0.12)",
            }}>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="프로젝트 또는 태스크 검색..."
              className="w-full px-3 py-2.5 outline-none"
              style={{
                fontSize: 13,
                color: "var(--text-primary)",
                borderBottom: "0.5px solid var(--border-soft)",
                backgroundColor: "transparent",
              }}
            />
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <p className="px-3 py-3" style={{ fontSize: 12, color: "var(--text-meta)" }}>검색 중...</p>
              ) : results.length === 0 && query.trim() ? (
                <p className="px-3 py-3" style={{ fontSize: 12, color: "var(--text-meta)" }}>결과 없음</p>
              ) : (
                results.map((r) => (
                  <Link
                    key={`${r.type}-${r.id}`}
                    href={r.href}
                    onClick={() => { setShowSearch(false); setQuery(""); }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--neutral-bg)]"
                  >
                    <span className="rounded px-1.5 py-0.5"
                      style={{
                        fontSize: 9,
                        backgroundColor: r.type === "project" ? "var(--client-aheeplan)22" : "var(--client-dankook)22",
                        color: r.type === "project" ? "var(--client-aheeplan)" : "var(--client-dankook)",
                        fontWeight: 500,
                      }}>
                      {r.type === "project" ? "프로젝트" : "태스크"}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-primary)" }} className="flex-1 truncate">
                      {r.title}
                    </span>
                    {r.subtitle && (
                      <span style={{ fontSize: 10, color: "var(--text-meta)" }}>{r.subtitle}</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* 알림 */}
      <button className="relative p-2 rounded-lg hover:bg-[var(--neutral-bg)]" title={`마감 임박 ${notificationCount}건`}>
        <Bell size={16} style={{ color: "var(--text-secondary)" }} />
        {notificationCount > 0 && (
          <span className="absolute top-1 right-1 rounded-full flex items-center justify-center"
            style={{
              minWidth: 14,
              height: 14,
              backgroundColor: "var(--warning-text)",
              color: "white",
              fontSize: 9,
              fontWeight: 600,
              padding: "0 3px",
            }}>
            {notificationCount}
          </span>
        )}
      </button>

      {/* 프로필 */}
      <div ref={profileRef} className="relative">
        <button
          onClick={() => setShowProfile((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-3 h-9 rounded-lg hover:bg-[var(--neutral-bg)]"
        >
          <div className="rounded-full flex items-center justify-center font-medium"
            style={{
              width: 28, height: 28,
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-base)",
              fontSize: 11,
            }}>
            {userInitials}
          </div>
          <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{userName}</span>
        </button>

        {showProfile && (
          <div className="absolute right-0 top-full mt-1 rounded-lg overflow-hidden z-50 min-w-[180px]"
            style={{
              backgroundColor: "var(--bg-surface)",
              border: "0.5px solid var(--border)",
              boxShadow: "0 8px 24px rgba(61,47,32,0.12)",
            }}>
            <div className="px-3 py-2.5" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-primary)" }}>{userName}</p>
              {isAdmin && (
                <p style={{ fontSize: 10, color: "var(--client-aheeplan)", marginTop: 2, fontWeight: 500 }}>
                  관리자
                </p>
              )}
            </div>
            <Link href="/settings"
              onClick={() => setShowProfile(false)}
              className="block px-3 py-2 hover:bg-[var(--neutral-bg)]"
              style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              설정
            </Link>
            <button onClick={handleLogout}
              className="block w-full text-left px-3 py-2 hover:bg-[var(--neutral-bg)]"
              style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
