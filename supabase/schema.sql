-- 원물원가 관리 웹사이트 스키마
-- Supabase SQL Editor에서 실행하세요.

create extension if not exists pgcrypto;

-- 3-1. categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

insert into categories (name, sort_order) values
  ('수산물', 1),
  ('축산물', 2),
  ('자체생산 소스류', 3),
  ('매입 소스류', 4),
  ('기타가공제품', 5)
on conflict (name) do nothing;

-- 3-2. suppliers
create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

-- 3-3. products
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete restrict,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  product_name text not null,
  origin text,
  spec text,
  size text,
  grade text,
  purchase_price numeric(14,2) not null check (purchase_price >= 0),
  purchase_weight numeric(14,2) not null check (purchase_weight > 0),
  yield_rate numeric(5,2) check (yield_rate is null or (yield_rate > 0 and yield_rate <= 100)),
  -- 쭈꾸미 해외직구매 전용: 국내구매는 기본값 그대로 두고 매입가/매입중량을 직접 입력한다.
  purchase_type text not null default '국내구매' check (purchase_type in ('국내구매', '해외직구매')),
  contract_unit_price numeric(14,2) check (contract_unit_price is null or contract_unit_price >= 0),
  box_weight numeric(14,2) check (box_weight is null or box_weight > 0),
  box_count integer check (box_count is null or box_count > 0),
  usd_exchange_rate numeric(14,4) check (usd_exchange_rate is null or usd_exchange_rate > 0),
  preserved_weight numeric(14,2) generated always as (
    case when yield_rate is null then purchase_weight
         else round(purchase_weight * yield_rate / 100, 2)
    end
  ) stored,
  unit_cost_per_100g numeric(14,2) generated always as (
    case
      when coalesce(case when yield_rate is null then purchase_weight else purchase_weight * yield_rate / 100 end, 0) = 0 then null
      else round(purchase_price / (case when yield_rate is null then purchase_weight else purchase_weight * yield_rate / 100 end) * 100, 2)
    end
  ) stored,
  status text not null default '거래중' check (status in ('거래중', '거래중단')),
  last_editor text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_supplier on products(supplier_id);
create index if not exists idx_products_status on products(status);
create index if not exists idx_products_updated_at on products(updated_at desc);

-- 3-4. price_history
create table if not exists price_history (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  changed_price numeric(14,2) not null,
  previous_price numeric(14,2),
  price_diff numeric(14,2) generated always as (changed_price - previous_price) stored,
  unit_cost_per_100g numeric(14,2),
  changed_date date not null default current_date,
  changed_by text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_price_history_product on price_history(product_id, changed_date desc);

-- updated_at 자동 갱신
create or replace function touch_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_touch_updated_at on products;
create trigger trg_products_touch_updated_at
  before update on products
  for each row
  execute function touch_updated_at();

-- 매입가 변경 시 이전 값을 price_history 에 자동 적재
-- 앱에서 UPDATE 직전에 아래처럼 이번 변경의 비고를 세션에 설정할 수 있음(선택):
--   select set_config('app.price_change_note', '메모 내용', true);
create or replace function log_price_change()
returns trigger as $$
begin
  if new.purchase_price is distinct from old.purchase_price then
    insert into price_history (
      product_id, changed_price, previous_price, unit_cost_per_100g,
      changed_date, changed_by, note
    ) values (
      new.id, new.purchase_price, old.purchase_price, new.unit_cost_per_100g,
      current_date, new.last_editor,
      nullif(current_setting('app.price_change_note', true), '')
    );
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_products_log_price_change on products;
create trigger trg_products_log_price_change
  after update on products
  for each row
  execute function log_price_change();

-- RLS: 사내 소수 인원, 로그인한 사용자는 모두 읽기/쓰기 가능
alter table categories enable row level security;
alter table suppliers enable row level security;
alter table products enable row level security;
alter table price_history enable row level security;

drop policy if exists "authenticated read categories" on categories;
create policy "authenticated read categories" on categories for select using (auth.role() = 'authenticated');
drop policy if exists "authenticated write categories" on categories;
create policy "authenticated write categories" on categories for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read suppliers" on suppliers;
create policy "authenticated read suppliers" on suppliers for select using (auth.role() = 'authenticated');
drop policy if exists "authenticated write suppliers" on suppliers;
create policy "authenticated write suppliers" on suppliers for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read products" on products;
create policy "authenticated read products" on products for select using (auth.role() = 'authenticated');
drop policy if exists "authenticated write products" on products;
create policy "authenticated write products" on products for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "authenticated read price_history" on price_history;
create policy "authenticated read price_history" on price_history for select using (auth.role() = 'authenticated');
drop policy if exists "authenticated write price_history" on price_history;
create policy "authenticated write price_history" on price_history for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
