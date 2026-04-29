"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { toast } from "sonner";
import { createInvoice, updateInvoiceStatus } from "@/app/actions/invoices";
import type { Invoice, Project, Client } from "@/types/database";

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  예정: { bg: "var(--border-soft)", text: "var(--text-meta)" },
  청구: { bg: "var(--sticker-yellow)", text: "var(--neutral-text)" },
  입금: { bg: "var(--success-bg)", text: "var(--success-text)" },
  연체: { bg: "var(--warning-bg)", text: "var(--warning-text)" },
};

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
const STATUSES = ["전체", "예정", "청구", "입금", "연체"] as const;

function formatMoney(n: number) {
  if (n >= 10000) return `${Math.round(n / 10000)}만원`;
  return `${n.toLocaleString("ko-KR")}원`;
}

interface FinanceClientProps {
  invoices: Invoice[];
  projects: Project[];
  clients: Client[];
}

export default function FinanceClient({ invoices, projects, clients }: FinanceClientProps) {
  const [statusFilter, setStatusFilter] = useState<string>("전체");
  const [showModal, setShowModal] = useState(false);
  const [newForm, setNewForm] = useState({
    project_id: "", amount: "", status: "예정" as Invoice["status"],
    issued_at: "", paid_at: "", memo: "",
  });
  const [saving, setSaving] = useState(false);

  const clientMap = Object.fromEntries(clients.map((c) => [c.id, c]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const thisYear = String(now.getFullYear());

  const monthlyBilled = invoices
    .filter((i) => i.issued_at?.startsWith(thisMonth))
    .reduce((s, i) => s + i.amount, 0);
  const monthlyPaid = invoices
    .filter((i) => i.paid_at?.startsWith(thisMonth))
    .reduce((s, i) => s + i.amount, 0);
  const outstanding = invoices
    .filter((i) => i.status === "청구" || i.status === "연체")
    .reduce((s, i) => s + i.amount, 0);
  const yearlyTotal = invoices
    .filter((i) => i.paid_at?.startsWith(thisYear))
    .reduce((s, i) => s + i.amount, 0);

  // 월별 차트 데이터
  const monthlyData = MONTHS.map((m, i) => {
    const month = `${thisYear}-${String(i + 1).padStart(2, "0")}`;
    const billed = invoices.filter((inv) => inv.issued_at?.startsWith(month)).reduce((s, inv) => s + inv.amount, 0);
    const paid = invoices.filter((inv) => inv.paid_at?.startsWith(month)).reduce((s, inv) => s + inv.amount, 0);
    return { name: m, 청구: Math.round(billed / 10000), 입금: Math.round(paid / 10000) };
  });

  // 클라이언트별 도넛
  const clientTotals = clients.map((c) => {
    const total = invoices
      .filter((i) => projectMap[i.project_id]?.client_id === c.id && i.status === "입금")
      .reduce((s, i) => s + i.amount, 0);
    return { name: c.name, value: total, color: c.color };
  }).filter((c) => c.value > 0);
  const noClientTotal = invoices
    .filter((i) => !projectMap[i.project_id]?.client_id && i.status === "입금")
    .reduce((s, i) => s + i.amount, 0);
  if (noClientTotal > 0) clientTotals.push({ name: "미분류", value: noClientTotal, color: "#8B7E6A" });

  const filteredInvoices = statusFilter === "전체"
    ? invoices
    : invoices.filter((i) => i.status === statusFilter);

  async function handleStatusChange(inv: Invoice, status: Invoice["status"]) {
    const paid_at = status === "입금" ? new Date().toISOString().slice(0, 10) : undefined;
    await updateInvoiceStatus(inv.id, status, paid_at);
  }

  async function handleCreate() {
    if (!newForm.project_id || !newForm.amount) { toast.error("프로젝트와 금액을 입력해주세요."); return; }
    setSaving(true);
    const result = await createInvoice({
      project_id: newForm.project_id,
      amount: parseInt(newForm.amount.replace(/,/g, "")),
      status: newForm.status,
      issued_at: newForm.issued_at || undefined,
      paid_at: newForm.paid_at || undefined,
      memo: newForm.memo || undefined,
    });
    if (result?.error) toast.error(result.error);
    else setShowModal(false);
    setSaving(false);
  }

  const inputStyle = {
    border: "0.5px solid var(--border)", backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)", borderRadius: 6, padding: "7px 10px",
    fontSize: 13, width: "100%", outline: "none", fontFamily: "inherit",
  };

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: 20, fontWeight: 500, color: "var(--text-primary)" }}>정산</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-md px-3.5 py-2 text-sm font-medium hover:opacity-80"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          + 새 견적
        </button>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: "이번달 청구", value: formatMoney(monthlyBilled) },
          { label: "이번달 입금", value: formatMoney(monthlyPaid), color: "var(--client-dankook)" },
          { label: "미수금", value: formatMoney(outstanding), color: outstanding > 0 ? "var(--warning-text)" : undefined },
          { label: "연 누적 매출", value: formatMoney(yearlyTotal) },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-4" style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}>
            <p style={{ fontSize: 11, color: "var(--text-meta)", marginBottom: 6 }}>{label}</p>
            <p style={{ fontSize: 20, fontWeight: 600, color: color ?? "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4">
        {/* 월별 막대 차트 */}
        <div className="rounded-xl p-5" style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 16 }}>월별 매출 (만원)</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} barSize={8}>
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-meta)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-meta)" }} axisLine={false} tickLine={false} />
              <RechartsTooltip
                contentStyle={{ fontSize: 11, border: "0.5px solid var(--border)", borderRadius: 6, backgroundColor: "var(--bg-surface)" }}
                labelStyle={{ color: "var(--text-primary)" }}
              />
              <Bar dataKey="청구" fill="var(--border)" radius={[2,2,0,0]} />
              <Bar dataKey="입금" fill="var(--client-dankook)" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 클라이언트별 도넛 */}
        <div className="rounded-xl p-5 flex flex-col" style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", marginBottom: 16 }}>클라이언트별 매출</p>
          {clientTotals.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={clientTotals}
                  cx="50%" cy="50%"
                  innerRadius={45} outerRadius={70}
                  dataKey="value"
                >
                  {clientTotals.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{value}</span>}
                />
                <RechartsTooltip
                  formatter={(v) => formatMoney(Number(v))}
                  contentStyle={{ fontSize: 11, border: "0.5px solid var(--border)", borderRadius: 6 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p style={{ fontSize: 12, color: "var(--text-meta)" }}>입금된 데이터가 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 인보이스 리스트 */}
      <div className="flex flex-col gap-3">
        {/* 상태 필터 탭 */}
        <div className="flex gap-1 overflow-x-auto">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className="px-3 py-1.5 rounded-md text-xs whitespace-nowrap"
              style={{
                backgroundColor: statusFilter === s ? "var(--text-primary)" : "var(--bg-surface)",
                color: statusFilter === s ? "var(--bg-base)" : "var(--text-secondary)",
                border: statusFilter === s ? "none" : "0.5px solid var(--border)",
              }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* 테이블 */}
        <div className="rounded-xl overflow-hidden" style={{ border: "0.5px solid var(--border)" }}>
          <table className="w-full" style={{ backgroundColor: "var(--bg-surface)", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
                {["프로젝트", "클라이언트", "금액", "상태", "발행일", "입금일", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3" style={{ fontSize: 11, color: "var(--text-meta)", fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ fontSize: 13, color: "var(--text-meta)" }}>인보이스가 없습니다</td>
                </tr>
              ) : filteredInvoices.map((inv, i) => {
                const proj = projectMap[inv.project_id];
                const cli = proj?.client_id ? clientMap[proj.client_id] : null;
                const statusStyle = STATUS_COLORS[inv.status] ?? STATUS_COLORS["예정"];
                return (
                  <tr key={inv.id} style={{ borderTop: i > 0 ? "0.5px solid var(--border-soft)" : "none" }}>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      {proj?.title ?? "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: "var(--text-meta)" }}>
                      {cli?.name ?? "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 13, color: "var(--text-primary)", fontWeight: 500 }}>
                      {inv.amount.toLocaleString("ko-KR")}원
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inv.status}
                        onChange={(e) => handleStatusChange(inv, e.target.value as Invoice["status"])}
                        className="rounded px-1.5 py-0.5 text-xs cursor-pointer outline-none"
                        style={{ backgroundColor: statusStyle.bg, color: statusStyle.text, border: "none" }}
                      >
                        {["예정","청구","입금","연체"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: "var(--text-meta)" }}>
                      {inv.issued_at ?? "-"}
                    </td>
                    <td className="px-4 py-3" style={{ fontSize: 12, color: "var(--text-meta)" }}>
                      {inv.paid_at ?? "-"}
                    </td>
                    <td className="px-4 py-3" />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 새 견적 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "rgba(61,47,32,0.25)" }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl"
            style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)", boxShadow: "0 8px 32px rgba(61,47,32,0.12)" }}
          >
            <div className="px-5 py-4" style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: "var(--text-primary)" }}>새 견적</h3>
            </div>
            <div className="px-5 py-4 flex flex-col gap-3">
              <select value={newForm.project_id} onChange={(e) => setNewForm((f) => ({ ...f, project_id: e.target.value }))} style={inputStyle}>
                <option value="">프로젝트 선택</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
              <input type="text" placeholder="금액" value={newForm.amount}
                onChange={(e) => setNewForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",") }))}
                style={inputStyle} />
              <select value={newForm.status} onChange={(e) => setNewForm((f) => ({ ...f, status: e.target.value as Invoice["status"] }))} style={inputStyle}>
                {["예정","청구","입금","연체"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input type="date" placeholder="발행일" value={newForm.issued_at} onChange={(e) => setNewForm((f) => ({ ...f, issued_at: e.target.value }))} style={inputStyle} />
                <input type="date" placeholder="입금일" value={newForm.paid_at} onChange={(e) => setNewForm((f) => ({ ...f, paid_at: e.target.value }))} style={inputStyle} />
              </div>
              <textarea placeholder="메모" value={newForm.memo} onChange={(e) => setNewForm((f) => ({ ...f, memo: e.target.value }))} rows={2} style={{ ...inputStyle, resize: "none" }} />
            </div>
            <div className="flex gap-2 px-5 py-3" style={{ borderTop: "0.5px solid var(--border-soft)" }}>
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-md py-2 text-sm hover:bg-[var(--neutral-bg)]" style={{ color: "var(--text-secondary)" }}>취소</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-md py-2 text-sm font-medium disabled:opacity-40" style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}>
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
