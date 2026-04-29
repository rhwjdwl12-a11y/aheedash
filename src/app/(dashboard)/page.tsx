import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/dashboard/KpiCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import MiniCalendar from "@/components/dashboard/MiniCalendar";
import StickyNotesSection from "@/components/notes/StickyNotesSection";
import type { Project, Client, Event, Invoice, StickyNote } from "@/types/database";
import { startOfMonth, endOfMonth, addDays, addMonths } from "date-fns";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const in7Days = format(addDays(now, 7), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  // 미니 캘린더용: 이번 달 ~ +2개월 후 말일
  const calRangeEnd = format(endOfMonth(addMonths(now, 2)), "yyyy-MM-dd");

  const [
    { data: projects },
    { data: clients },
    { data: events },
    { data: invoices },
    { data: notes },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*"),
    supabase.from("events").select("*").gte("event_date", monthStart).lte("event_date", calRangeEnd + "T23:59:59"),
    supabase.from("invoices").select("*").gte("issued_at", monthStart).lte("issued_at", monthEnd),
    supabase.from("sticky_notes").select("*").is("archived_at", null).order("created_at", { ascending: false }),
  ]);

  const allProjects = (projects as Project[]) ?? [];
  const allClients = (clients as Client[]) ?? [];
  const allEvents = (events as Event[]) ?? [];
  const allInvoices = (invoices as Invoice[]) ?? [];
  const allNotes = (notes as StickyNote[]) ?? [];

  const clientMap = Object.fromEntries(allClients.map((c) => [c.id, c]));

  // KPI 계산
  const inProgressCount = allProjects.filter((p) => p.status === "진행중").length;
  const upcomingDeadlines = allProjects.filter(
    (p) => p.deadline && p.deadline >= today && p.deadline <= in7Days
  ).length;
  const monthlyInvoiceTotal = allInvoices.reduce((sum, i) => sum + i.amount, 0);
  const thisMonthProjects = allProjects.filter(
    (p) => p.created_at >= monthStart
  );
  const completedThisMonth = thisMonthProjects.filter((p) => p.status === "완료").length;
  const completionRate =
    thisMonthProjects.length > 0
      ? Math.round((completedThisMonth / thisMonthProjects.length) * 100)
      : 0;

  const activeProjects = allProjects.filter((p) => p.status === "진행중");

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "사용자";

  const dateLabel = format(now, "yyyy년 M월 d일 EEEE", { locale: ko });

  return (
    <div className="flex flex-col gap-5 max-w-6xl">
      {/* 인사말 */}
      <div className="flex items-start justify-between">
        <div>
          <p style={{ fontSize: 11, color: "var(--text-meta)" }}>{dateLabel}</p>
          <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--text-primary)", marginTop: 4 }}>
            안녕하세요, {userName}님 👋
          </h1>
        </div>
        <Link
          href="/projects"
          className="flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium transition-opacity hover:opacity-80 shrink-0"
          style={{ backgroundColor: "var(--text-primary)", color: "var(--bg-base)" }}
        >
          + 새 프로젝트
        </Link>
      </div>

      {/* KPI 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <KpiCard label="진행중" value={inProgressCount} />
        <KpiCard
          label="이번주 마감"
          value={upcomingDeadlines}
          accentColor="var(--client-aheeplan)"
        />
        <KpiCard
          label="이번달 견적"
          value={monthlyInvoiceTotal > 0 ? `${(monthlyInvoiceTotal / 10000).toFixed(0)}만원` : "-"}
        />
        <KpiCard
          label="완료율 (이번달)"
          value={`${completionRate}%`}
          accentColor="var(--client-dankook)"
        />
      </div>

      {/* 스티커 메모 섹션 */}
      <StickyNotesSection notes={allNotes} />

      {/* 본문 2단 */}
      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
        {/* 진행 중인 프로젝트 */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
              진행 중인 프로젝트
            </h2>
            <Link href="/projects" style={{ fontSize: 12, color: "var(--text-meta)" }}>
              전체 보기
            </Link>
          </div>

          {activeProjects.length === 0 ? (
            <div
              className="rounded-lg p-8 flex flex-col items-center justify-center gap-2"
              style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
            >
              <p style={{ fontSize: 13, color: "var(--text-meta)" }}>
                첫 프로젝트를 추가해보세요
              </p>
              <Link
                href="/projects"
                className="rounded-md px-3 py-1.5 text-xs font-medium"
                style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-secondary)" }}
              >
                + 새 프로젝트
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {activeProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  client={p.client_id ? clientMap[p.client_id] : null}
                />
              ))}
            </div>
          )}
        </div>

        {/* 미니 캘린더 */}
        <MiniCalendar events={allEvents} />
      </div>
    </div>
  );
}
