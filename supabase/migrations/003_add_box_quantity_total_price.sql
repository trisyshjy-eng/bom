-- 매입가는 1box 기준 단가이므로, 박스수량을 곱한 총매입가를 자동 계산해서 보여준다.
-- box_count(쭈꾸미 해외직구매 전용, 이미 총액으로 계산된 purchase_price에 쓰임)와는 별개 컬럼이다.
-- 기존 Supabase 프로젝트의 SQL Editor에서 실행하세요. (신규 프로젝트는 schema.sql에 이미 반영되어 있음)

alter table products add column if not exists box_quantity integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'products_box_quantity_check'
  ) then
    alter table products add constraint products_box_quantity_check
      check (box_quantity is null or box_quantity > 0);
  end if;
end $$;

alter table products add column if not exists total_purchase_price numeric(16,2)
  generated always as (purchase_price * coalesce(box_quantity, 1)) stored;
