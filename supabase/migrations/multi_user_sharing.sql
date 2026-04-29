-- ============================================================
-- 멀티 사용자 공유: profiles, project_members, task_assignees
-- ============================================================

-- 1) profiles: 가입된 모든 사용자 목록 (담당자 선택용)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz default now() not null
);

alter table profiles enable row level security;

-- 인증된 모든 사용자는 프로필 목록 조회 가능 (담당자 선택을 위해)
drop policy if exists "profiles read all" on profiles;
create policy "profiles read all" on profiles
  for select to authenticated using (true);

-- 본인 프로필만 수정 가능
drop policy if exists "profiles upsert own" on profiles;
create policy "profiles upsert own" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- auth.users → profiles 자동 동기화
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

-- 기존 사용자 백필
insert into public.profiles (id, email, display_name)
select
  id,
  email,
  coalesce(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(coalesce(email,''), '@', 1)
  )
from auth.users
on conflict (id) do nothing;


-- 2) project_members: 프로젝트별 공유 멤버
create table if not exists project_members (
  project_id uuid references projects(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' not null,
  added_at timestamptz default now() not null,
  primary key (project_id, user_id)
);

create index if not exists project_members_user_idx on project_members(user_id);


-- 3) task_assignees: 태스크별 담당자 (다중)
create table if not exists task_assignees (
  task_id uuid references tasks(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  primary key (task_id, user_id)
);

create index if not exists task_assignees_user_idx on task_assignees(user_id);


-- 4) RLS 재귀 방지를 위한 SECURITY DEFINER 헬퍼
create or replace function public.has_project_access(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects where id = p_id and user_id = auth.uid())
      or exists (select 1 from project_members where project_id = p_id and user_id = auth.uid());
$$;

create or replace function public.is_project_owner(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from projects where id = p_id and user_id = auth.uid());
$$;


-- 5) projects RLS 갱신: 소유자 또는 멤버 접근
drop policy if exists "own projects" on projects;
drop policy if exists "projects select" on projects;
drop policy if exists "projects insert" on projects;
drop policy if exists "projects update" on projects;
drop policy if exists "projects delete" on projects;

create policy "projects select" on projects
  for select using (
    user_id = auth.uid()
    or exists (select 1 from project_members m where m.project_id = id and m.user_id = auth.uid())
  );
create policy "projects insert" on projects
  for insert with check (user_id = auth.uid());
create policy "projects update" on projects
  for update using (
    user_id = auth.uid()
    or exists (select 1 from project_members m where m.project_id = id and m.user_id = auth.uid())
  );
create policy "projects delete" on projects
  for delete using (user_id = auth.uid());


-- 6) project_members RLS
alter table project_members enable row level security;

drop policy if exists "project_members select" on project_members;
create policy "project_members select" on project_members
  for select using (
    user_id = auth.uid()
    or public.is_project_owner(project_id)
  );

drop policy if exists "project_members insert" on project_members;
create policy "project_members insert" on project_members
  for insert with check (public.is_project_owner(project_id));

drop policy if exists "project_members delete" on project_members;
create policy "project_members delete" on project_members
  for delete using (public.is_project_owner(project_id));


-- 7) tasks RLS 갱신: 프로젝트 멤버이면 모두 가능
drop policy if exists "own tasks" on tasks;
drop policy if exists "tasks access" on tasks;
create policy "tasks access" on tasks
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));


-- 8) task_assignees RLS
alter table task_assignees enable row level security;

drop policy if exists "task_assignees access" on task_assignees;
create policy "task_assignees access" on task_assignees
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


-- 9) files / invoices RLS도 멤버 허용으로 갱신
drop policy if exists "own files" on files;
drop policy if exists "files access" on files;
create policy "files access" on files
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));

drop policy if exists "own invoices" on invoices;
drop policy if exists "invoices access" on invoices;
create policy "invoices access" on invoices
  for all
  using (public.has_project_access(project_id))
  with check (public.has_project_access(project_id));
