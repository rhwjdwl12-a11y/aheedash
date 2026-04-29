"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home, FolderKanban, GanttChart, Calendar,
  Wallet, StickyNote, Settings, LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/roadmap", label: "로드맵", icon: GanttChart },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/finance", label: "정산", icon: Wallet },
  { href: "/notes", label: "메모", icon: StickyNote },
  { href: "/settings", label: "설정", icon: Settings },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const initials = userName
    ? userName.slice(0, 2).toUpperCase()
    : userEmail?.slice(0, 2).toUpperCase() ?? "DW";

  const displayName = userName || userEmail?.split("@")[0] || "사용자";

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="hidden md:flex flex-col w-[220px] shrink-0 h-screen sticky top-0"
      style={{ backgroundColor: "var(--bg-surface)", borderRight: "0.5px solid var(--border)" }}
    >
      {/* 로고 */}
      <div className="px-5 pt-6 pb-4" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>아희 대시보드</p>
        <p style={{ fontSize: 11, color: "var(--text-meta)", marginTop: 2 }}>메뉴</p>
      </div>

      {/* 네비게이션 */}
      <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
            style={{
              backgroundColor: isActive(href) ? "var(--neutral-bg)" : "transparent",
              color: isActive(href) ? "var(--text-primary)" : "var(--text-secondary)",
              fontWeight: isActive(href) ? 500 : 400,
            }}
          >
            <Icon size={15} />
            {label}
          </Link>
        ))}
      </nav>

      {/* 사용자 정보 */}
      <div className="px-4 py-4" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0"
            style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-primary)" }}
          >
            {initials}
          </div>
          <span
            className="text-xs flex-1 truncate"
            style={{ color: "var(--text-secondary)" }}
          >
            {displayName}
          </span>
          <button
            onClick={handleLogout}
            className="p-1 rounded transition-colors hover:bg-[var(--neutral-bg)]"
            title="로그아웃"
          >
            <LogOut size={13} style={{ color: "var(--text-meta)" }} />
          </button>
        </div>
      </div>
    </aside>
  );
}
