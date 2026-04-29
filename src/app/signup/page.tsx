"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      toast.error("회원가입 중 오류가 발생했습니다: " + error.message);
    } else {
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div
          className="w-full max-w-[320px] rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
        >
          <div className="text-2xl mb-3">📬</div>
          <h2 style={{ fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
            이메일을 확인해주세요
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-meta)", marginTop: 8, lineHeight: 1.5 }}>
            {email}으로 확인 메일을 보냈습니다. 링크를 클릭하면 가입이 완료됩니다.
          </p>
          <Link
            href="/login"
            className="inline-block mt-5 text-sm font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </div>
    );
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
        <div className="mb-6 text-center">
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "var(--text-primary)" }}>
            아희 대시보드
          </h1>
          <p style={{ fontSize: 12, color: "var(--text-meta)", marginTop: 4 }}>
            새 계정 만들기
          </p>
        </div>

        <form onSubmit={handleSignup} className="flex flex-col gap-3">
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
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={{
                border: "0.5px solid var(--border)",
                backgroundColor: "var(--bg-base)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
              비밀번호 (6자 이상)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
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
            style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
          >
            {loading ? "처리 중..." : "회원가입"}
          </button>
        </form>

        <p className="text-center mt-5" style={{ fontSize: 12, color: "var(--text-meta)" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/login" style={{ color: "var(--text-secondary)", fontWeight: 500 }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
