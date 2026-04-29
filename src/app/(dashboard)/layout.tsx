import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/Sidebar";
import MobileHeader from "@/components/MobileHeader";

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

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userName={userName} userEmail={userEmail} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader userEmail={userEmail} />
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
