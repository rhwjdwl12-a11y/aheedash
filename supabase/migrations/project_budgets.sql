-- 프로젝트 예산/비용 관리
-- 1) projects에 사업비 칼럼 추가
alter table projects add column if not exists business_amount bigint;

-- 2) 예산 항목 테이블 (엑셀 양식: 구분/항목/단가/수량/단위/횟수/단위/부가세/비고)
create table if not exists project_budgets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  group_name text default '' not null,        -- 구분 (예: "잡트렌드 물품비")
  item_name text default '' not null,          -- 항목 (예: "퍼스널컬러진단")
  unit_price numeric default 0 not null,       -- 단가
  quantity numeric default 1 not null,         -- 인원/수량
  qty_unit text default '' not null,           -- 인원/수량 단위 (명/개/식)
  count numeric default 1 not null,            -- 시간/횟수
  count_unit text default '회' not null,       -- 횟수 단위
  vat_included boolean default false not null, -- 부가세 포함 (X1.1)
  note text default '' not null,               -- 비고
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
