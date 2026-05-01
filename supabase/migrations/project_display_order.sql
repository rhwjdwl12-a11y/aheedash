-- 프로젝트 우선순위 정렬용 컬럼
alter table projects add column if not exists display_order int default 0 not null;
create index if not exists projects_display_order_idx on projects(display_order);
