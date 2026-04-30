"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import {
  createBudgetItem,
  updateBudgetItem,
  deleteBudgetItem,
  updateBusinessAmount,
} from "@/app/actions/budgets";
import type { ProjectBudget } from "@/types/database";

interface BudgetTabProps {
  projectId: string;
  initialItems: ProjectBudget[];
  initialBusinessAmount: number | null;
}

function calcLineTotal(item: ProjectBudget) {
  const base = (item.unit_price || 0) * (item.quantity || 0) * (item.count || 0);
  return item.vat_included ? Math.round(base * 1.1) : Math.round(base);
}

function formatMoney(n: number) {
  return n.toLocaleString("ko-KR");
}

export default function BudgetTab({ projectId, initialItems, initialBusinessAmount }: BudgetTabProps) {
  const [items, setItems] = useState<ProjectBudget[]>(initialItems);
  const [businessAmount, setBusinessAmount] = useState<number | null>(initialBusinessAmount);
  const [businessInput, setBusinessInput] = useState(
    initialBusinessAmount != null ? initialBusinessAmount.toLocaleString("ko-KR") : ""
  );

  // 그룹별로 묶기 (구분 입력 순서 유지)
  const grouped = useMemo(() => {
    const map = new Map<string, ProjectBudget[]>();
    for (const it of items) {
      const key = it.group_name || "(미분류)";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    return Array.from(map.entries()); // [["잡트렌드 물품비", [...]], ...]
  }, [items]);

  const totalBeforeVat = items.reduce((s, it) => {
    const base = (it.unit_price || 0) * (it.quantity || 0) * (it.count || 0);
    // 부가세 포함 항목은 base가 곧 1배로 들어감 (vat 분리 어려우니, 합계는 견적가 그대로)
    return s + (it.vat_included ? base : base);
  }, 0);
  // 견적가 기준 합계 (실제 청구 합계)
  const totalQuote = items.reduce((s, it) => s + calcLineTotal(it), 0);
  // 부가세는 견적가 - 부가세 미포함 항목 base의 차이로 추정
  const taxableSum = items.filter((it) => it.vat_included).reduce(
    (s, it) => s + (it.unit_price || 0) * (it.quantity || 0) * (it.count || 0),
    0
  );
  const vat = Math.round(taxableSum * 0.1);

  // 순수익 = 사업비 - 합계
  const profit = (businessAmount ?? 0) - totalQuote;

  async function handleAddItem(groupName: string) {
    const res = await createBudgetItem({
      project_id: projectId,
      group_name: groupName,
      item_name: "",
      unit_price: 0,
      quantity: 1,
      qty_unit: "",
      count: 1,
      count_unit: "회",
      vat_included: false,
      note: "",
    });
    if (res?.error) toast.error(res.error);
    else if (res?.item) setItems((p) => [...p, res.item as ProjectBudget]);
  }

  async function handleAddGroup() {
    const name = prompt("새 구분 이름을 입력하세요 (예: 잡트렌드 물품비)");
    if (!name?.trim()) return;
    await handleAddItem(name.trim());
  }

  function updateLocalItem(id: string, patch: Partial<ProjectBudget>) {
    setItems((p) => p.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  }

  async function persistField(
    id: string,
    field: keyof ProjectBudget,
    value: string | number | boolean
  ) {
    const res = await updateBudgetItem(id, projectId, { [field]: value } as never);
    if (res?.error) toast.error(res.error);
  }

  async function handleDelete(id: string) {
    if (!confirm("이 항목을 삭제할까요?")) return;
    const prev = items;
    setItems((p) => p.filter((x) => x.id !== id));
    const res = await deleteBudgetItem(id, projectId);
    if (res?.error) {
      toast.error(res.error);
      setItems(prev);
    }
  }

  async function handleBusinessBlur() {
    const num = parseInt(businessInput.replace(/[^0-9]/g, ""), 10);
    const finalVal = isNaN(num) ? null : num;
    setBusinessAmount(finalVal);
    setBusinessInput(finalVal != null ? finalVal.toLocaleString("ko-KR") : "");
    const res = await updateBusinessAmount(projectId, finalVal);
    if (res?.error) toast.error(res.error);
  }

  const cellInputStyle = {
    width: "100%",
    border: "0.5px solid var(--border-soft)",
    backgroundColor: "var(--bg-base)",
    color: "var(--text-primary)",
    borderRadius: 4,
    padding: "4px 6px",
    fontSize: 11,
    outline: "none",
    fontFamily: "inherit",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
          비용 체크 (예산)
        </h2>
        <button
          onClick={handleAddGroup}
          className="flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium hover:opacity-80"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          <Plus size={12} /> 새 구분 추가
        </button>
      </div>

      {/* 그룹별 표 */}
      {grouped.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: "var(--bg-surface)", border: "0.5px dashed var(--border)" }}
        >
          <p style={{ fontSize: 13, color: "var(--text-meta)", marginBottom: 8 }}>
            예산 항목이 없습니다
          </p>
          <button
            onClick={handleAddGroup}
            className="rounded-md px-3 py-1.5 text-xs"
            style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-secondary)" }}
          >
            + 첫 구분 만들기
          </button>
        </div>
      ) : (
        grouped.map(([groupName, rows]) => {
          const subtotal = rows.reduce((s, it) => s + calcLineTotal(it), 0);
          return (
            <div
              key={groupName}
              className="rounded-xl overflow-hidden"
              style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
            >
              {/* 구분 헤더 */}
              <div
                className="flex items-center justify-between px-3 py-2"
                style={{ backgroundColor: "var(--neutral-bg)" }}
              >
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>
                  {groupName}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                  소계: <strong>{formatMoney(subtotal)}원</strong>
                </p>
              </div>

              {/* 표 */}
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
                      {["항목", "단가", "수량", "단위", "횟수", "단위", "부가세", "견적가", "비고", ""].map((h) => (
                        <th
                          key={h}
                          className="px-2 py-1.5 text-left"
                          style={{ fontSize: 10, color: "var(--text-meta)", fontWeight: 500 }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((it) => (
                      <tr key={it.id} style={{ borderBottom: "0.5px solid var(--border-soft)" }}>
                        <td className="px-2 py-1" style={{ minWidth: 130 }}>
                          <input
                            type="text"
                            defaultValue={it.item_name}
                            placeholder="항목명"
                            onBlur={(e) => {
                              if (e.target.value !== it.item_name) {
                                updateLocalItem(it.id, { item_name: e.target.value });
                                persistField(it.id, "item_name", e.target.value);
                              }
                            }}
                            style={cellInputStyle}
                          />
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 80 }}>
                          <input
                            type="number"
                            defaultValue={it.unit_price}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updateLocalItem(it.id, { unit_price: v });
                              persistField(it.id, "unit_price", v);
                            }}
                            style={{ ...cellInputStyle, textAlign: "right" }}
                          />
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 50 }}>
                          <input
                            type="number"
                            defaultValue={it.quantity}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updateLocalItem(it.id, { quantity: v });
                              persistField(it.id, "quantity", v);
                            }}
                            style={{ ...cellInputStyle, textAlign: "right" }}
                          />
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 45 }}>
                          <input
                            type="text"
                            defaultValue={it.qty_unit}
                            placeholder="명"
                            onBlur={(e) => {
                              if (e.target.value !== it.qty_unit) {
                                updateLocalItem(it.id, { qty_unit: e.target.value });
                                persistField(it.id, "qty_unit", e.target.value);
                              }
                            }}
                            style={cellInputStyle}
                          />
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 45 }}>
                          <input
                            type="number"
                            defaultValue={it.count}
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value) || 0;
                              updateLocalItem(it.id, { count: v });
                              persistField(it.id, "count", v);
                            }}
                            style={{ ...cellInputStyle, textAlign: "right" }}
                          />
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 45 }}>
                          <input
                            type="text"
                            defaultValue={it.count_unit}
                            placeholder="회"
                            onBlur={(e) => {
                              if (e.target.value !== it.count_unit) {
                                updateLocalItem(it.id, { count_unit: e.target.value });
                                persistField(it.id, "count_unit", e.target.value);
                              }
                            }}
                            style={cellInputStyle}
                          />
                        </td>
                        <td className="px-2 py-1 text-center" style={{ minWidth: 50 }}>
                          <input
                            type="checkbox"
                            checked={it.vat_included}
                            onChange={(e) => {
                              updateLocalItem(it.id, { vat_included: e.target.checked });
                              persistField(it.id, "vat_included", e.target.checked);
                            }}
                            title="부가세 포함 (×1.1)"
                            style={{ accentColor: "var(--text-primary)" }}
                          />
                        </td>
                        <td
                          className="px-2 py-1 text-right"
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            minWidth: 90,
                          }}
                        >
                          {formatMoney(calcLineTotal(it))}원
                        </td>
                        <td className="px-2 py-1" style={{ minWidth: 110 }}>
                          <input
                            type="text"
                            defaultValue={it.note}
                            placeholder="비고"
                            onBlur={(e) => {
                              if (e.target.value !== it.note) {
                                updateLocalItem(it.id, { note: e.target.value });
                                persistField(it.id, "note", e.target.value);
                              }
                            }}
                            style={cellInputStyle}
                          />
                        </td>
                        <td className="px-2 py-1 text-right">
                          <button
                            onClick={() => handleDelete(it.id)}
                            className="p-1 rounded hover:bg-[var(--neutral-bg)]"
                            title="삭제"
                          >
                            <Trash2 size={11} style={{ color: "var(--text-meta)" }} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 행 추가 */}
              <button
                onClick={() => handleAddItem(groupName)}
                className="w-full px-3 py-1.5 text-xs hover:bg-[var(--neutral-bg)] flex items-center justify-center gap-1"
                style={{
                  color: "var(--text-meta)",
                  borderTop: "0.5px solid var(--border-soft)",
                }}
              >
                <Plus size={11} /> 행 추가
              </button>
            </div>
          );
        })
      )}

      {/* 합계 + 사업비 + 순수익 */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 px-4 py-3" style={{ fontSize: 12 }}>
          <span style={{ color: "var(--text-meta)" }}>합계 (견적가)</span>
          <span className="text-right" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
            {formatMoney(totalQuote)}원
          </span>
          <span style={{ color: "var(--text-meta)" }}>└ 부가세 포함분</span>
          <span className="text-right" style={{ color: "var(--text-meta)" }}>
            {formatMoney(vat)}원
          </span>
        </div>

        <div
          className="grid grid-cols-2 gap-x-6 px-4 py-3 items-center"
          style={{
            fontSize: 13,
            borderTop: "0.5px solid var(--border-soft)",
            backgroundColor: "var(--neutral-bg)",
          }}
        >
          <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>사업비 (입력)</span>
          <input
            type="text"
            value={businessInput}
            onChange={(e) => {
              const num = e.target.value.replace(/[^0-9]/g, "");
              setBusinessInput(num ? parseInt(num).toLocaleString("ko-KR") : "");
            }}
            onBlur={handleBusinessBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
            }}
            placeholder="0"
            className="text-right outline-none"
            style={{
              border: "0.5px solid var(--border)",
              backgroundColor: "var(--bg-base)",
              color: "var(--text-primary)",
              borderRadius: 4,
              padding: "4px 8px",
              fontSize: 13,
              fontWeight: 500,
            }}
          />
        </div>

        <div
          className="grid grid-cols-2 gap-x-6 px-4 py-3"
          style={{
            fontSize: 14,
            fontWeight: 600,
            borderTop: "0.5px solid var(--border-soft)",
          }}
        >
          <span style={{ color: "var(--text-primary)" }}>순수익 (사업비 − 합계)</span>
          <span
            className="text-right"
            style={{ color: profit >= 0 ? "var(--success-text)" : "var(--warning-text)" }}
          >
            {formatMoney(profit)}원
          </span>
        </div>
      </div>

      <p style={{ fontSize: 11, color: "var(--text-meta)", textAlign: "center" }}>
        💡 견적가 = 단가 × 수량 × 횟수 (부가세 포함 시 × 1.1) · 자동 계산됩니다
      </p>
    </div>
  );
}
