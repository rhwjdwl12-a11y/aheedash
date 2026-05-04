import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Briefcase, CheckSquare, Calendar as CalendarIcon, FolderOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import KpiCard from "@/components/dashboard/KpiCard";
import ProjectCard from "@/components/dashboard/ProjectCard";
import HomeCalendar from "@/components/dashboard/HomeCalendar";
import StickyNotesSection from "@/components/notes/StickyNotesSection";
import type { Project, Client, Event, Invoice, StickyNote } from "@/types/database";
import { startOfMonth, endOfMonth, addDays } from "date-fns";

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const in7Days = format(addDays(now, 7), "yyyy-MM-dd");
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const [
    { data: projects },
    { data: clients },
    { data: events },
    { data: invoices },
    { data: notes },
  ] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*"),
    supabase.from("events").select("*").gte("event_date", monthStart).lte("event_date", monthEnd + "T23:59:59"),
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
  const todayCreatedCount = allProjects.filter(
    (p) => p.created_at.slice(0, 10) === today
  ).length;
  const upcomingDeadlines = allProjects.filter(
    (p) => p.deadline && p.deadline >= today && p.deadline <= in7Days
  ).length;
  const monthlyDeadlines = allProjects.filter(
    (p) => p.deadline && p.deadline >= monthStart && p.deadline <= monthEnd
  );
  // 가장 가까운 마감일 (이번 달)
  const nextDeadlineDays = (() => {
    const future = monthlyDeadlines
      .map((p) => p.deadline!)
      .filter((d) => d >= today)
      .sort();
    if (future.length === 0) return null;
    const diff = Math.ceil((new Date(future[0]).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  })();
  const totalProjectsCount = allProjects.length;
  // 견적 합계는 노출은 하지 않지만 추후 사용 가능
  void allInvoices;

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="진행 중인 업무"
          value={inProgressCount}
          icon={Briefcase}
          iconColor="#B85C2D"
          iconBg="rgba(184,92,45,0.13)"
          change={todayCreatedCount > 0 ? `+${todayCreatedCount} 오늘 추가` : "변동 없음"}
        />
        <KpiCard
          label="완료 예정 (이번 주)"
          value={upcomingDeadlines}
          icon={CheckSquare}
          iconColor="#3B6FA0"
          iconBg="rgba(59,111,160,0.13)"
          change="이번 주 마감"
        />
        <KpiCard
          label="이번 달 마감"
          value={monthlyDeadlines.length}
          icon={CalendarIcon}
          iconColor="#5A7D4F"
          iconBg="rgba(90,125,79,0.13)"
          change={nextDeadlineDays !== null ? `D-${nextDeadlineDays}까지` : "예정 없음"}
        />
        <KpiCard
          label="전체 프로젝트"
          value={totalProjectsCount}
          icon={FolderOpen}
          iconColor="#8B7E6A"
          iconBg="rgba(139,126,106,0.13)"
          change="활동 중"
        />
      </div>

      {/* 스티커 메모 섹션 */}
      <StickyNotesSection notes={allNotes} />

      {/* 진행중 프로젝트 - 아희 / GPI 좌우 분할 */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>
            진행 중인 프로젝트
          </h2>
          <Link href="/projects" style={{ fontSize: 12, color: "var(--text-meta)" }}>
            전체 보기
          </Link>
        </div>

        {(() => {
          const aheeClient = allClients.find((c) => c.name === "아희");
          const gpiClient = allClients.find((c) => c.name === "GPI");
          const aheeProjects = activeProjects.filter((p) => p.client_id === aheeClient?.id);
          const gpiProjects = activeProjects.filter((p) => p.client_id === gpiClient?.id);
          const otherProjects = activeProjects.filter(
            (p) => p.client_id !== aheeClient?.id && p.client_id !== gpiClient?.id
          );

          if (activeProjects.length === 0) {
            return (
              <div
                className="rounded-lg p-8 flex flex-col items-center justify-center gap-2"
                style={{ backgroundColor: "var(--bg-surface)", border: "0.5px solid var(--border)" }}
              >
                <p style={{ fontSize: 13, color: "var(--text-meta)" }}>첫 프로젝트를 추가해보세요</p>
                <Link
                  href="/projects"
                  className="rounded-md px-3 py-1.5 text-xs font-medium"
                  style={{ backgroundColor: "var(--neutral-bg)", color: "var(--text-secondary)" }}
                >
                  + 새 프로젝트
                </Link>
              </div>
            );
          }

          return (
            <>
              {/* 아희 / GPI 2단 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <ClientColumn
                  title="아희 업무"
                  color={aheeClient?.color ?? "#B85C2D"}
                  projects={aheeProjects}
                  clientMap={clientMap}
                />
                <ClientColumn
                  title="GPI 업무"
                  color={gpiClient?.color ?? "#3B6FA0"}
                  projects={gpiProjects}
                  clientMap={clientMap}
                />
              </div>

              {/* 기타 (있을 때만) */}
              {otherProjects.length > 0 && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block rounded-full"
                      style={{ width: 6, height: 6, backgroundColor: "var(--text-meta)" }}
                    />
                    <p style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>
                      기타
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    {otherProjects.map((p) => (
                      <ProjectCard key={p.id} project={p} client={p.client_id ? clientMap[p.client_id] : null} />
                    ))}
                  </div>
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* 월간 캘린더 */}
      <HomeCalendar events={allEvents} />
    </div>
  );
}

function ClientColumn({
  title,
  color,
  projects,
  clientMap,
}: {
  title: string;
  color: string;
  projects: import("@/types/database").Project[];
  clientMap: Record<string, import("@/types/database").Client>;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-md"
        style={{ backgroundColor: color + "15" }}
      >
        <span className="inline-block rounded-full" style={{ width: 8, height: 8, backgroundColor: color }} />
        <p style={{ fontSize: 13, fontWeight: 600, color }}>{title}</p>
        <span
          className="rounded-full px-1.5 py-0.5 ml-auto"
          style={{ fontSize: 10, backgroundColor: "var(--bg-surface)", color: "var(--text-secondary)" }}
        >
          {projects.length}
        </span>
      </div>
      {projects.length === 0 ? (
        <p
          className="text-center py-6 rounded-md"
          style={{
            fontSize: 11,
            color: "var(--text-meta)",
            backgroundColor: "var(--bg-surface)",
            border: "0.5px dashed var(--border)",
          }}
        >
          진행 중인 프로젝트 없음
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} client={p.client_id ? clientMap[p.client_id] : null} />
          ))}
        </div>
      )}
    </div>
  );
}
