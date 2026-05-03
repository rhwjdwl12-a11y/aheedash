-- =============================================================
-- 아희 대시보드 전체 스키마 (Seoul 마이그레이션용 통합본)
-- 새 Supabase 프로젝트의 SQL Editor에서 한 번에 실행
-- =============================================================

-- 1) clients (담당업체)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  color text default '#5A7D4F' not null,
  contact_person text,
  phone text,
  email text,
  memo text,
  created_at timestamptz default now() not null
);

alter table clients enable row level security;
drop policy if exists "own clients" on clients;
create policy "own clients" on clients
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- 2) projects (프로젝트)
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  client_id uuid references clients(id) on delete set null,
  title text not null,
  type text check (type in ('제안서','기획안','결과보고서','기타')),
  status text default '진행중' not null check (status in ('진행중','검토','완료','보류')),
  duration_type text check (duration_type in ('단기','중기','장기')),
  start_date date,
  deadline date,
  budget bigint,
  fee bigint,
  progress int default 0 not null,
  description text,
  notes text,
  business_amount bigint,
  display_order int default 0 not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_deadline on projects(deadline);
create index if not exists projects_display_order_idx on projects(display_order);


-- 3) tasks (태스크)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  title text not null,
  status text default 'todo' not null check (status in ('todo','doing','review','done')),
  due_date date,
  assignee text,
  memo text,
  order_index int default 0 not null,
  created_at timestamptz default now() not null
);
create index if not exists idx_tasks_project on tasks(project_id);


-- 4) files
create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  filename text not null,
  storage_path text not null,
  file_type text,
  file_size bigint,
  thumbnail_url text,
  uploaded_at timestamptz default now() not null
);


-- 5) events (캘린더 일정)
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  event_date timestamptz not null,
  end_date timestamptz,
  all_day boolean default false not null,
  type text default '미팅' not null check (type in ('마감','미팅','제출','기타')),
  reminder_d3 boolean default true not null,
  reminder_d1 boolean default true not null,
  memo text,
  created_at timestamptz default now() not null
);

alter table events enable row level security;
drop policy if exists "own events" on events;
create policy "own events" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_events_date on events(event_date);


-- 6) invoices
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  amount bigint not null,
  status text default '예정' not null check (status in ('예정','청구','입금','연체')),
  issued_at date,
  paid_at date,
  memo text,
  created_at timestamptz default now() not null
);


-- 7) sticky_notes (홈 메모)
create table if not exists sticky_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  category text,
  due_label text,
  due_date date,
  is_completed boolean default false not null,
  completed_at timestamptz,
  rotation real default 0 not null,
  color_key text default 'yellow' not null check (color_key in ('yellow','pink','green','beige','gray')),
  archived_at timestamptz,
  created_at timestamptz default now() not null
);

alter table sticky_notes enable row level security;
drop policy if exists "own notes" on sticky_notes;
create policy "own notes" on sticky_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_notes_user on sticky_notes(user_id, archived_at);


-- =============================================================
-- 멀티 사용자 공유 (profiles, project_members, task_assignees)
-- =============================================================

-- profiles
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;
drop policy if exists "profiles read all" on profiles;
create policy "profiles read all" on profiles for select to authenticated using (true);
drop policy if exists "profiles upsert own" on profiles;
create policy "profiles upsert own" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- 회원가입/업데이트 자동 동기화
create or replace function public.handle_auth_user_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email,''), '@', 1)
    )
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, profiles.display_name);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_auth_user_change();

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute function public.handle_auth_user_change();


-- project_members
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' not null,
  added_at timestamptz default now() not null,
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on project_members(user_id);


-- task_assignees
create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (task_id, user_id)
);
create index if not exists task_assignees_user_idx on task_assignees(user_id);


-- 헬퍼 함수
create or replace function public.has_project_access(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects where id = p_id and user_id = auth.uid())
      or exists (select 1 from project_members where project_id = p_id and user_id = auth.uid());
$$;

create or replace function public.is_project_owner(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects where id = p_id and user_id = auth.uid());
$$;


-- projects RLS
alter table projects enable row level security;
drop policy if exists "projects select" on projects;
drop policy if exists "projects insert" on projects;
drop policy if exists "projects update" on projects;
drop policy if exists "projects delete" on projects;

create policy "projects select" on projects
  for select using (
    user_id = auth.uid()
    or exists (select 1 from project_members m where m.project_id = id and m.user_id = auth.uid())
  );
create policy "projects insert" on projects for insert with check (user_id = auth.uid());
create policy "projects update" on projects for update using (
  user_id = auth.uid()
  or exists (select 1 from project_members m where m.project_id = id and m.user_id = auth.uid())
);
create policy "projects delete" on projects for delete using (user_id = auth.uid());


-- project_members RLS
alter table project_members enable row level security;
drop policy if exists "project_members select" on project_members;
create policy "project_members select" on project_members for select using (
  user_id = auth.uid() or public.is_project_owner(project_id)
);
drop policy if exists "project_members insert" on project_members;
create policy "project_members insert" on project_members for insert with check (public.is_project_owner(project_id));
drop policy if exists "project_members delete" on project_members;
create policy "project_members delete" on project_members for delete using (public.is_project_owner(project_id));


-- tasks RLS
alter table tasks enable row level security;
drop policy if exists "tasks access" on tasks;
create policy "tasks access" on tasks
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));


-- task_assignees RLS
alter table task_assignees enable row level security;
drop policy if exists "task_assignees access" on task_assignees;
create policy "task_assignees access" on task_assignees
  for all
  using (exists (select 1 from tasks t where t.id = task_id and public.has_project_access(t.project_id)))
  with check (exists (select 1 from tasks t where t.id = task_id and public.has_project_access(t.project_id)));


-- files RLS
alter table files enable row level security;
drop policy if exists "files access" on files;
create policy "files access" on files
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));


-- invoices RLS
alter table invoices enable row level security;
drop policy if exists "invoices access" on invoices;
create policy "invoices access" on invoices
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));


-- =============================================================
-- 서브태스크 (세부 일정)
-- =============================================================
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
  using (exists (select 1 from tasks t where t.id = task_id and public.has_project_access(t.project_id)))
  with check (exists (select 1 from tasks t where t.id = task_id and public.has_project_access(t.project_id)));


-- =============================================================
-- 프로젝트 예산
-- =============================================================
create table if not exists project_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  group_name text default '' not null,
  item_name text default '' not null,
  unit_price numeric default 0 not null,
  quantity numeric default 1 not null,
  qty_unit text default '' not null,
  count numeric default 1 not null,
  count_unit text default '회' not null,
  vat_included boolean default false not null,
  note text default '' not null,
  order_index int default 0 not null,
  created_at timestamptz default now() not null
);
create index if not exists project_budgets_project_idx on project_budgets(project_id);

alter table project_budgets enable row level security;
drop policy if exists "project_budgets access" on project_budgets;
create policy "project_budgets access" on project_budgets
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));
