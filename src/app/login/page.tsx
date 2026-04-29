"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "이메일 또는 비밀번호가 올바르지 않습니다."
        : "로그인 중 오류가 발생했습니다.");
    } else {
      router.push("/");
      router.refresh();
    }
    setLoading(false);
  }

  async function handleGoogle() {
    const supabase = createClient();
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error) toast.error("Google 로그인 중 오류가 발생했습니다.");
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div
        className="w-full max-w-[320px] rounded-xl p-8"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "0.5px solid var(--border)",
          boxShadow: "0 2px 12px rgba(61,47,32,0.06)",
        }}
      >
        {/* 로고 */}
        <div className="mb-6 text-center">
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
            아희 대시보드
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-meta)", marginTop: 4 }}>
            프로젝트 관리 대시보드
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              이메일
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="hello@example.com"
              className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-1"
              style={{
                border: "0.5px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-md px-3 py-2 text-sm outline-none focus:ring-1"
              style={{
                border: "0.5px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md py-2 text-sm font-medium mt-1 transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{
              backgroundColor: "var(--text-primary)",
              color: "var(--bg-base)",
            }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="relative my-4 flex items-center gap-3">
          <div className="flex-1" style={{ height: "0.5px", backgroundColor: "var(--border)" }} />
          <span style={{ fontSize: 11, color: "var(--text-meta)" }}>또는</span>
          <div className="flex-1" style={{ height: "0.5px", backgroundColor: "var(--border)" }} />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full rounded-md py-2 text-sm font-medium flex items-center justify-center gap-2 transition-colors hover:bg-[var(--neutral-bg)]"
          style={{
            border: "0.5px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 계속하기
        </button>

        <p className="text-center mt-5" style={{ fontSize: 12, color: "var(--text-meta)" }}>
          처음이신가요?{" "}
          <Link href="/signup" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
