-- Public website: product categories for shoppers and read-only catalog RPCs for anon.
-- Base tables stay closed to anon; these SECURITY DEFINER functions expose only safe columns.

create type public.web_category as enum ('kue_kering', 'frozen', 'kue_basah', 'pastry', 'minuman', 'hampers');

alter table public.products add column web_category public.web_category not null default 'kue_basah';

-- Sensible defaults for existing products.
update public.products p set web_category = case
  when p.bundle_id is not null then 'hampers'::public.web_category
  when r.category = 'pastry_supplier' then 'pastry'::public.web_category
  when r.category = 'minuman' then 'minuman'::public.web_category
  else 'kue_basah'::public.web_category
end
from public.products p2
left join public.recipes r on r.id = p2.recipe_id
where p.id = p2.id;

-- Products shown on the website. full_this_week: quota of the current Mon–Sun week (Jakarta) is used up.
create function public.public_catalog(p_include_dummy boolean default false)
returns table (
  id uuid,
  name text,
  description text,
  web_category public.web_category,
  price bigint,
  photo_path text,
  min_lead_days integer,
  full_this_week boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with wk as (select public.week_start(public.today_jakarta()) as start)
  select
    p.id, p.name, p.description, p.web_category, p.price, p.photo_path, p.min_lead_days,
    coalesce(p.weekly_capacity <= (
      select coalesce(sum(i.qty), 0)
      from public.order_items i
      join public.orders o on o.id = i.order_id
      where i.product_id = p.id
        and o.status <> 'batal'
        and o.fulfill_date >= wk.start
        and o.fulfill_date < wk.start + 7
    ), false) as full_this_week
  from public.products p, wk
  where p.is_active
    and p.show_on_website
    and (p_include_dummy or not p.is_dummy)
  order by p.web_category, p.name;
$$;

-- Campaigns that are open now or open in the future, with their website-visible products and prices.
create function public.public_campaigns(p_include_dummy boolean default false)
returns table (
  id uuid,
  name text,
  preorder_open date,
  preorder_close date,
  fulfill_start date,
  fulfill_end date,
  is_open boolean,
  products jsonb
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id, c.name, c.preorder_open, c.preorder_close, c.fulfill_start, c.fulfill_end,
    public.today_jakarta() between c.preorder_open and c.preorder_close as is_open,
    coalesce((
      select jsonb_agg(jsonb_build_object('product_id', p.id, 'price', coalesce(cp.price_override, p.price)) order by p.name)
      from public.campaign_products cp
      join public.products p on p.id = cp.product_id
      where cp.campaign_id = c.id and p.is_active and p.show_on_website
        and (p_include_dummy or not p.is_dummy)
    ), '[]'::jsonb) as products
  from public.campaigns c
  where c.is_active
    and c.preorder_close >= public.today_jakarta()
    and (p_include_dummy or not c.is_dummy)
  order by c.preorder_open;
$$;

revoke execute on function public.public_catalog(boolean) from public;
revoke execute on function public.public_campaigns(boolean) from public;
grant execute on function public.public_catalog(boolean) to anon, authenticated;
grant execute on function public.public_campaigns(boolean) to anon, authenticated;
-- The functions call these helpers as definer; anon never calls them directly.
