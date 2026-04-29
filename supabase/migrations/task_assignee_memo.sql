-- 프로젝트 Task에 담당자/메모 필드 추가
alter table tasks add column if not exists assignee text;
alter table tasks add column if not exists memo text;
