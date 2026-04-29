import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY")!;
  const fromEmail = Deno.env.get("FROM_EMAIL") ?? "onboarding@resend.dev";
  const appUrl = Deno.env.get("APP_URL") ?? "https://your-app.vercel.app";

  const supabase = createClient(supabaseUrl, serviceKey);

  const now = new Date();
  const d3 = new Date(now); d3.setDate(d3.getDate() + 3);
  const d1 = new Date(now); d1.setDate(d1.getDate() + 1);

  const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
  const d3Str = toDateStr(d3);
  const d1Str = toDateStr(d1);

  // D-3 이벤트
  const { data: d3Events } = await supabase
    .from("events")
    .select("*, user_id")
    .eq("reminder_d3", true)
    .gte("event_date", d3Str + "T00:00:00")
    .lte("event_date", d3Str + "T23:59:59");

  // D-1 이벤트
  const { data: d1Events } = await supabase
    .from("events")
    .select("*, user_id")
    .eq("reminder_d1", true)
    .gte("event_date", d1Str + "T00:00:00")
    .lte("event_date", d1Str + "T23:59:59");

  const allEvents = [
    ...((d3Events ?? []).map((e) => ({ ...e, daysUntil: 3 }))),
    ...((d1Events ?? []).map((e) => ({ ...e, daysUntil: 1 }))),
  ];

  let sentCount = 0;

  for (const event of allEvents) {
    // 유저 이메일 조회
    const { data: userData } = await supabase.auth.admin.getUserById(event.user_id);
    const email = userData?.user?.email;
    if (!email) continue;

    const dLabel = event.daysUntil === 0 ? "D-day" : `D-${event.daysUntil}`;
    const eventDate = new Date(event.event_date).toLocaleDateString("ko-KR", {
      month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const html = `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="background:#F5F1EA;margin:0;padding:32px;font-family:'Apple SD Gothic Neo',sans-serif;">
  <div style="max-width:480px;margin:0 auto;background:#FFFFFF;border-radius:12px;overflow:hidden;border:0.5px solid #E5DDD0;">
    <div style="background:#3D2F20;padding:20px 28px;">
      <p style="margin:0;font-size:12px;color:#F5F1EA;opacity:0.7;">디자이너 워크</p>
      <h1 style="margin:6px 0 0;font-size:18px;color:#F5F1EA;font-weight:500;">
        📌 ${dLabel} 알림
      </h1>
    </div>
    <div style="padding:24px 28px;">
      <h2 style="margin:0 0 8px;font-size:16px;font-weight:500;color:#3D2F20;">${event.title}</h2>
      <p style="margin:0 0 4px;font-size:13px;color:#8B7E6A;">📅 ${eventDate}</p>
      ${event.memo ? `<p style="margin:12px 0 0;font-size:13px;color:#5C4B33;line-height:1.6;">${event.memo}</p>` : ""}
      <div style="margin-top:20px;">
        <a href="${appUrl}/calendar"
          style="display:inline-block;background:#3D2F20;color:#F5F1EA;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:13px;font-weight:500;">
          캘린더에서 보기
        </a>
      </div>
    </div>
    <div style="padding:16px 28px;border-top:0.5px solid #E5DDD0;">
      <p style="margin:0;font-size:11px;color:#8B7E6A;">디자이너 워크 · 프로젝트 관리 대시보드</p>
    </div>
  </div>
</body>
</html>`;

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: email,
        subject: `📌 [${event.title}] ${dLabel} 알림`,
        html,
      }),
    });

    sentCount++;
  }

  // 완료된 스티커 메모 자동 보관
  await supabase
    .from("sticky_notes")
    .update({ archived_at: new Date().toISOString() })
    .eq("is_completed", true)
    .is("archived_at", null);

  return new Response(
    JSON.stringify({ success: true, sent: sentCount }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
