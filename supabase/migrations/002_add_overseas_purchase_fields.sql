-- 쭈꾸미 해외직구매/국내구매 구분 및 해외직구매 전용 입력값 추가
-- 기존 Supabase 프로젝트의 SQL Editor에서 실행하세요. (신규 프로젝트는 schema.sql에 이미 반영되어 있음)

alter table products add column if not exists purchase_type text not null default '국내구매';
alter table products add column if not exists contract_unit_price numeric(14,2);
alter table products add column if not exists box_weight numeric(14,2);
alter table products add column if not exists box_count integer;
alter table products add column if not exists usd_exchange_rate numeric(14,4);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_purchase_type_check'
  ) then
    alter table products add constraint products_purchase_type_check
      check (purchase_type in ('국내구매', '해외직구매'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_contract_unit_price_check'
  ) then
    alter table products add constraint products_contract_unit_price_check
      check (contract_unit_price is null or contract_unit_price >= 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_box_weight_check'
  ) then
    alter table products add constraint products_box_weight_check
      check (box_weight is null or box_weight > 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_box_count_check'
  ) then
    alter table products add constraint products_box_count_check
      check (box_count is null or box_count > 0);
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'products_usd_exchange_rate_check'
  ) then
    alter table products add constraint products_usd_exchange_rate_check
      check (usd_exchange_rate is null or usd_exchange_rate > 0);
  end if;
end $$;
