-- 신규 등록 화면에 발주일/입고일 입력 추가
-- 기존 Supabase 프로젝트의 SQL Editor에서 실행하세요. (신규 프로젝트는 schema.sql에 이미 반영되어 있음)

alter table products add column if not exists order_date date;
alter table products add column if not exists received_date date;
