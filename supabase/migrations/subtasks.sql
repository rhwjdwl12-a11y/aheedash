-- 태스크의 세부 체크리스트
create table if not exists subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  is_done boolean default false not null,
  order_index int default 0 not null,
  created_at timestamptz default now() not null
);

create index if not exists subtasks_task_idx on subtasks(task_id);

alter table subtasks enable row level security;

drop policy if exists "subtasks access" on subtasks;
create policy "subtasks access" on subtasks
  for all
  using (
    exists (
      select 1 from tasks t
      where t.id = task_id and public.has_project_access(t.project_id)
    )
  )
  with check (
    exists (
      select 1 from tasks t
      where t.id = task_id and public.has_project_access(t.project_id)
    )
  );
