-- profiles에 관리자 플래그 추가
alter table profiles add column if not exists is_admin boolean default false not null;

-- 관리자 지정 (naver/gmail 둘 다 처리해서 어느 쪽이든 들어감)
update profiles set is_admin = true
where email in ('rhwjdwl12@naver.com', 'rhwjdwl12@gmail.com');
