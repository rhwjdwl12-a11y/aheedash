"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Bell, X, Home, FolderKanban, Calendar, Wallet, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const PAGE_TITLES: Record<string, string> = {
  "/": "홈",
  "/projects": "프로젝트",
  "/roadmap": "로드맵",
  "/calendar": "캘린더",
  "/finance": "정산",
  "/notes": "메모",
  "/settings": "설정",
};

const BOTTOM_NAV = [
  { href: "/", label: "홈", icon: Home },
  { href: "/projects", label: "프로젝트", icon: FolderKanban },
  { href: "/calendar", label: "캘린더", icon: Calendar },
  { href: "/finance", label: "정산", icon: Wallet },
  { href: "/settings", label: "설정", icon: Settings },
];

interface MobileHeaderProps {
  userEmail?: string;
}

export default function MobileHeader({ userEmail }: MobileHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const title = Object.entries(PAGE_TITLES).find(([key]) =>
    key === "/" ? pathname === "/" : pathname.startsWith(key)
  )?.[1] ?? "아희 대시보드";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* 상단 헤더 */}
      <header
        className="md:hidden flex items-center justify-between px-4 h-12 shrink-0"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderBottom: "0.5px solid var(--border)",
        }}
      >
        <button onClick={() => setMenuOpen(true)} className="p-1">
          <Menu size={20} style={{ color: "var(--text-primary)" }} />
        </button>
        <span style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
          {title}
        </span>
        <button className="p-1">
          <Bell size={18} style={{ color: "var(--text-meta)" }} />
        </button>
      </header>

      {/* 모바일 드로어 메뉴 */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: "rgba(61,47,32,0.3)" }}
            onClick={() => setMenuOpen(false)}
          />
          <div
            className="absolute left-0 top-0 bottom-0 w-64 flex flex-col"
            style={{ backgroundColor: "var(--bg-surface)" }}
          >
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>아희 대시보드</p>
              <button onClick={() => setMenuOpen(false)}>
                <X size={18} style={{ color: "var(--text-meta)" }} />
              </button>
            </div>
            <nav className="flex flex-col gap-0.5 px-3 py-3 flex-1">
              {Object.entries(PAGE_TITLES).map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2.5 rounded-md text-sm"
                  style={{
                    backgroundColor: isActive(href) ? "var(--neutral-bg)" : "transparent",
                    color: isActive(href) ? "var(--text-primary)" : "var(--text-secondary)",
                    fontWeight: isActive(href) ? 500 : 400,
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>
            <div className="px-5 py-4" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
              <p className="text-xs mb-2" style={{ color: "var(--text-meta)" }}>{userEmail}</p>
              <button
                onClick={handleLogout}
                className="text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 탭바 */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderTop: "0.5px solid var(--border)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {BOTTOM_NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5"
          >
            <Icon
              size={20}
              style={{ color: isActive(href) ? "var(--text-primary)" : "var(--text-meta)" }}
            />
            <span
              style={{
                fontSize: 10,
                color: isActive(href) ? "var(--text-primary)" : "var(--text-meta)",
              }}
            >
              {label}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}
