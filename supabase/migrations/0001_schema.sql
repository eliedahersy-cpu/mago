-- 0001_schema.sql — MAGO core schema (spec §5). Money is numeric(10,2) USD.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Store settings (singleton row)
-- ---------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  store_name text not null default 'MAGO',
  contact_email text,
  contact_phone text,
  currency text not null default 'USD',
  shipping_flat_fee numeric(10,2) not null default 3.00 check (shipping_flat_fee >= 0),
  free_shipping_threshold numeric(10,2) not null default 30.00 check (free_shipping_threshold >= 0),
  delivery_areas jsonb not null default '[]'::jsonb,
  social_links jsonb not null default '{}'::jsonb,
  announcement_bar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'customer' check (role in ('owner', 'staff', 'customer')),
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('owner', 'staff')
  );
$$;

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text,
  image text,
  sort_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  flavour text,
  sauce text,
  type text not null check (type in ('cup', 'bundle', 'extra', 'retail', 'merch')),
  tagline text,
  short_description text,
  description text,
  story text,
  price numeric(10,2) not null default 0 check (price >= 0),
  compare_at_price numeric(10,2) check (compare_at_price >= 0),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  sku text unique,
  stock int not null default 0,
  track_inventory boolean not null default true,
  allow_backorder boolean not null default false,
  low_stock_threshold int not null default 10,
  protein_g int,
  prep_minutes int,
  is_best_seller boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  badges text[] not null default '{}',
  ingredients jsonb not null default '[]'::jsonb,
  nutrition jsonb not null default '[]'::jsonb,
  preparation jsonb not null default '[]'::jsonb,
  flavour_profiles text[] not null default '{}',
  spice_level int not null default 0 check (spice_level between 0 and 4),
  textures text[] not null default '{}',
  occasions text[] not null default '{}',
  style text check (style in ('lebanese', 'italian', 'fusion')),
  bundle_size int check (bundle_size > 0),
  seo_title text,
  seo_description text,
  rating_avg numeric(3,2),
  rating_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_listing_idx on public.products (status, type, sort_order);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  position int not null default 0,
  kind text not null default 'packshot' check (kind in ('packshot', 'lifestyle', 'video')),
  created_at timestamptz not null default now()
);
create index product_images_product_idx on public.product_images (product_id, position);

create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  position int not null default 0,
  primary key (collection_id, product_id)
);
create index collection_products_product_idx on public.collection_products (product_id);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  delta int not null,
  reason text not null check (reason in ('order', 'cancel', 'adjustment', 'restock', 'subscription')),
  order_id uuid,
  note text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements (product_id, created_at desc);
create index inventory_movements_order_idx on public.inventory_movements (order_id);
create index inventory_movements_created_by_idx on public.inventory_movements (created_by);

-- ---------------------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles (id) on delete set null,
  email text not null,
  phone text,
  full_name text,
  accepts_marketing boolean not null default false,
  notes text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index customers_email_key on public.customers (lower(email));

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text,
  full_name text,
  phone text,
  governorate text not null,
  area text not null,
  street text,
  building text,
  floor text,
  notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index addresses_customer_idx on public.addresses (customer_id);

create table public.wishlist_items (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, product_id)
);
create index wishlist_items_product_idx on public.wishlist_items (product_id);

-- ---------------------------------------------------------------------------
-- Promotions & subscriptions
-- ---------------------------------------------------------------------------
create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text,
  title text not null,
  kind text not null check (kind in ('percentage', 'fixed_amount', 'free_shipping')),
  value numeric(10,2) not null default 0 check (value >= 0),
  applies_to text not null default 'order' check (applies_to in ('order', 'cups')),
  min_subtotal numeric(10,2),
  min_cup_quantity int,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit int,
  usage_count int not null default 0,
  once_per_customer boolean not null default false,
  is_automatic boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (is_automatic or code is not null)
);
create unique index discounts_code_key on public.discounts (upper(code)) where code is not null;

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  interval_weeks int not null check (interval_weeks > 0),
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  is_popular boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  status text not null default 'active' check (status in ('active', 'paused', 'cancelled')),
  items jsonb not null default '[]'::jsonb,
  address jsonb not null,
  next_delivery_date date not null,
  is_gift boolean not null default false,
  gift_note text,
  last_order_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_customer_idx on public.subscriptions (customer_id);
create index subscriptions_plan_idx on public.subscriptions (plan_id);
create index subscriptions_due_idx on public.subscriptions (status, next_delivery_date);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  number bigint not null unique default nextval('public.order_number_seq'),
  access_token uuid not null unique default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  email text not null,
  phone text not null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
  payment_method text not null default 'cod' check (payment_method in ('cod')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'refunded')),
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount_total numeric(10,2) not null default 0 check (discount_total >= 0),
  shipping_total numeric(10,2) not null default 0 check (shipping_total >= 0),
  total numeric(10,2) not null check (total >= 0),
  discount_code text,
  shipping_address jsonb not null,
  special_instructions text,
  gift_note text,
  is_gift boolean not null default false,
  source text not null default 'web' check (source in ('web', 'subscription', 'admin')),
  subscription_id uuid references public.subscriptions (id) on delete set null,
  idempotency_key uuid unique,
  cancelled_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter sequence public.order_number_seq owned by public.orders.number;
create index orders_customer_idx on public.orders (customer_id);
create index orders_subscription_idx on public.orders (subscription_id);
create index orders_status_idx on public.orders (status, created_at desc);
create index orders_created_idx on public.orders (created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  parent_item_id uuid references public.order_items (id) on delete cascade,
  name text not null,
  flavour text,
  image text,
  unit_price numeric(10,2) not null check (unit_price >= 0),
  quantity int not null check (quantity > 0),
  line_total numeric(10,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index order_items_parent_idx on public.order_items (parent_item_id);

create table public.order_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  type text not null check (type in ('created', 'status_changed', 'payment', 'note', 'cancelled', 'edited')),
  message text not null,
  data jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_events_order_idx on public.order_events (order_id, created_at);
create index order_events_created_by_idx on public.order_events (created_by);

alter table public.inventory_movements
  add constraint inventory_movements_order_fk foreign key (order_id) references public.orders (id) on delete set null;
alter table public.subscriptions
  add constraint subscriptions_last_order_fk foreign key (last_order_id) references public.orders (id) on delete set null;
create index subscriptions_last_order_idx on public.subscriptions (last_order_id);

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------
create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  subtitle text,
  hero_image text,
  minutes int not null default 10 check (minutes > 0),
  difficulty text not null default 'Easy',
  servings text not null default '1–2',
  cups_used int not null default 1,
  is_vegetarian boolean not null default false,
  tags text[] not null default '{}',
  product_id uuid references public.products (id) on delete set null,
  intro text,
  ingredients jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  tip text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index recipes_product_idx on public.recipes (product_id);
create index recipes_listing_idx on public.recipes (status, sort_order);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null,
  chain text,
  type text not null default 'supermarket' check (type in ('supermarket', 'minimarket', 'online', 'cafe_restaurant')),
  address text,
  area text,
  city text,
  lat double precision,
  lng double precision,
  hours jsonb not null default '{}'::jsonb,
  phone text,
  image text,
  website text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.store_products (
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  primary key (store_id, product_id)
);
create index store_products_product_idx on public.store_products (product_id);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,
  author_name text not null,
  rating int not null check (rating between 1 and 5),
  title text,
  body text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  is_verified_buyer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reviews_product_idx on public.reviews (product_id, status);
create index reviews_customer_idx on public.reviews (customer_id);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  source text,
  created_at timestamptz not null default now()
);
create unique index newsletter_subscribers_email_key on public.newsletter_subscribers (lower(email));

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'profiles', 'collections', 'products', 'customers', 'addresses', 'discounts',
    'subscription_plans', 'subscriptions', 'orders', 'recipes', 'stores', 'reviews'
  ] loop
    execute format(
      'create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t
    );
  end loop;
end $$;

-- New auth user -> profile row (role customer).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only staff (or a direct SQL session with no auth user) may change roles.
create or replace function public.prevent_role_self_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role
     and (select auth.uid()) is not null
     and not public.is_staff() then
    raise exception 'Only staff can change roles' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger prevent_role_self_change
  before update on public.profiles
  for each row execute function public.prevent_role_self_change();

-- Keep products.rating_avg / rating_count in sync with approved reviews.
create or replace function public.refresh_product_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pid uuid;
begin
  foreach pid in array array[
    case when tg_op in ('UPDATE', 'DELETE') then old.product_id end,
    case when tg_op in ('INSERT', 'UPDATE') then new.product_id end
  ] loop
    if pid is not null then
      update public.products p
      set rating_avg = s.avg_rating,
          rating_count = s.n
      from (
        select round(avg(r.rating)::numeric, 2) as avg_rating, count(*)::int as n
        from public.reviews r
        where r.product_id = pid and r.status = 'approved'
      ) s
      where p.id = pid;
    end if;
  end loop;
  return null;
end $$;

create trigger refresh_product_rating
  after insert or update or delete on public.reviews
  for each row execute function public.refresh_product_rating();
