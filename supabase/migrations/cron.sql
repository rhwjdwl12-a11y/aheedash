-- pg_cron으로 매일 자정 D-day 알림 + 메모 보관 실행
-- Supabase 대시보드 > SQL Editor에서 실행하세요
-- (YOUR_PROJECT 와 YOUR_SERVICE_KEY 를 실제 값으로 교체)

SELECT cron.schedule(
  'daily-reminders',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/check-deadlines',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_KEY", "Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
  $$
);
