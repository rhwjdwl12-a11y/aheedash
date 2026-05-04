import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";
import TopBar from "@/components/TopBar";
import { format, addDays } from "date-fns";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const userName = user.user_metadata?.full_name || user.user_metadata?.name;
  const userEmail = user.email;
  const displayName = userName || userEmail?.split("@")[0] || "사용자";
  const initials = displayName.slice(0, 2).toUpperCase();

  // 관리자 여부 조회
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();
  const isAdmin = (profile as { is_admin?: boolean } | null)?.is_admin ?? false;

  // 알림 카운트: 오늘부터 D-3 이내 마감 프로젝트
  const today = format(new Date(), "yyyy-MM-dd");
  const in3Days = format(addDays(new Date(), 3), "yyyy-MM-dd");
  const { count: deadlineCount } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .gte("deadline", today)
    .lte("deadline", in3Days)
    .neq("status", "완료");

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={userName} userEmail={userEmail} isAdmin={isAdmin} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader userEmail={userEmail} />
        <TopBar
          userName={displayName}
          userInitials={initials}
          isAdmin={isAdmin}
          notificationCount={deadlineCount ?? 0}
        />
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6"
          style={{ backgroundColor: "var(--bg-base)" }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
