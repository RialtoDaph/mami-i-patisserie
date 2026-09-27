-- RLS, storage buckets and RPCs for the preorder module.
--
-- Access matrix:
--   owner, admin : read + write everything
--   produksi     : read everything; create/edit customers, orders, order items; add payments.
--                  No deletes (cancel an order via status 'batal'). Products, campaigns,
--                  settings are read-only.
--   manager      : read-only
--   no role      : nothing

alter table public.settings enable row level security;
alter table public.products enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

revoke all on public.settings, public.products, public.campaigns, public.campaign_products,
  public.customers, public.orders, public.order_items, public.payments from anon;
revoke usage on sequence public.order_no_seq from anon;

-- Read access for every user with a role.
create policy settings_select on public.settings for select to authenticated using ((select public.my_role()) is not null);
create policy products_select on public.products for select to authenticated using ((select public.my_role()) is not null);
create policy campaigns_select on public.campaigns for select to authenticated using ((select public.my_role()) is not null);
create policy campaign_products_select on public.campaign_products for select to authenticated using ((select public.my_role()) is not null);
create policy customers_select on public.customers for select to authenticated using ((select public.my_role()) is not null);
create policy orders_select on public.orders for select to authenticated using ((select public.my_role()) is not null);
create policy order_items_select on public.order_items for select to authenticated using ((select public.my_role()) is not null);
create policy payments_select on public.payments for select to authenticated using ((select public.my_role()) is not null);

-- Catalog & settings: owner/admin only.
create policy settings_update on public.settings for update to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));
create policy products_write on public.products for all to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));
create policy campaigns_write on public.campaigns for all to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));
create policy campaign_products_write on public.campaign_products for all to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));

-- Customers & orders: owner/admin/produksi create and edit; owner/admin delete.
create policy customers_insert on public.customers for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy customers_update on public.customers for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi'))) with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy customers_delete on public.customers for delete to authenticated
  using ((select public.has_role('owner', 'admin')));

create policy orders_insert on public.orders for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy orders_update on public.orders for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi'))) with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy orders_delete on public.orders for delete to authenticated
  using ((select public.has_role('owner', 'admin')));

create policy order_items_insert on public.order_items for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy order_items_update on public.order_items for update to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi'))) with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy order_items_delete on public.order_items for delete to authenticated
  using ((select public.has_role('owner', 'admin', 'produksi')));

-- Payments: produksi may record; corrections (edit/delete) are owner/admin.
create policy payments_insert on public.payments for insert to authenticated
  with check ((select public.has_role('owner', 'admin', 'produksi')));
create policy payments_update on public.payments for update to authenticated
  using ((select public.has_role('owner', 'admin'))) with check ((select public.has_role('owner', 'admin')));
create policy payments_delete on public.payments for delete to authenticated
  using ((select public.has_role('owner', 'admin')));

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true),
       ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

-- Product photos: public bucket (readable by URL); only owner/admin write.
create policy product_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'product-photos' and (select public.has_role('owner', 'admin')));
create policy product_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'product-photos' and (select public.has_role('owner', 'admin')));
create policy product_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'product-photos' and (select public.has_role('owner', 'admin')));

-- Payment proofs: private; any role reads, staff uploads, owner/admin delete.
create policy payment_proofs_select on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (select public.my_role()) is not null);
create policy payment_proofs_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (select public.has_role('owner', 'admin', 'produksi')));
create policy payment_proofs_delete on storage.objects for delete to authenticated
  using (bucket_id = 'payment-proofs' and (select public.has_role('owner', 'admin')));

-- ---------------------------------------------------------------------------
-- RPCs (SECURITY INVOKER: RLS and triggers apply to the caller)
-- ---------------------------------------------------------------------------

-- Create or update an order and replace its items atomically. Lead time and
-- campaign rules are checked for new orders and when the date/campaign changes;
-- capacity is enforced by the deferred constraint triggers.
create function public.save_order(p_id uuid, p_order jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_old_date date;
  v_old_campaign uuid;
  v_date date := (p_order ->> 'fulfill_date')::date;
  v_campaign uuid := nullif(p_order ->> 'campaign_id', '')::uuid;
begin
  if p_id is null then
    insert into public.orders (
      customer_id, campaign_id, fulfill_date, fulfill_method, delivery_address,
      status, shipping_fee, discount, dp_amount, notes
    ) values (
      (p_order ->> 'customer_id')::uuid,
      v_campaign,
      v_date,
      (p_order ->> 'fulfill_method')::public.fulfill_method,
      nullif(btrim(p_order ->> 'delivery_address'), ''),
      coalesce((p_order ->> 'status')::public.order_status, 'baru'),
      coalesce((p_order ->> 'shipping_fee')::bigint, 0),
      coalesce((p_order ->> 'discount')::bigint, 0),
      coalesce((p_order ->> 'dp_amount')::bigint, 0),
      nullif(btrim(p_order ->> 'notes'), '')
    )
    returning id into v_id;
  else
    select fulfill_date, campaign_id into v_old_date, v_old_campaign from public.orders where id = p_id;

    update public.orders o set
      customer_id = (p_order ->> 'customer_id')::uuid,
      campaign_id = v_campaign,
      fulfill_date = v_date,
      fulfill_method = (p_order ->> 'fulfill_method')::public.fulfill_method,
      delivery_address = nullif(btrim(p_order ->> 'delivery_address'), ''),
      shipping_fee = coalesce((p_order ->> 'shipping_fee')::bigint, 0),
      discount = coalesce((p_order ->> 'discount')::bigint, 0),
      dp_amount = coalesce((p_order ->> 'dp_amount')::bigint, 0),
      notes = nullif(btrim(p_order ->> 'notes'), '')
    where o.id = p_id
    returning o.id into v_id;

    if v_id is null then
      raise exception 'Order tidak ditemukan atau Anda tidak punya akses' using errcode = 'insufficient_privilege';
    end if;

    delete from public.order_items where order_id = v_id;
  end if;

  insert into public.order_items (order_id, product_id, qty, unit_price, sort_order)
  select v_id, (e ->> 'product_id')::uuid, (e ->> 'qty')::integer, (e ->> 'unit_price')::bigint, (t.ord - 1)::integer
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) with ordinality as t(e, ord);

  if p_id is null
     or v_old_date is distinct from v_date
     or v_old_campaign is distinct from v_campaign then
    perform public.validate_order_rules(v_id);
  end if;

  if (select o.discount > o.subtotal + o.shipping_fee from public.orders o where o.id = v_id) then
    raise exception 'Diskon lebih besar dari subtotal + ongkir' using errcode = 'check_violation';
  end if;

  return v_id;
end;
$$;

-- Find or create a customer by (normalized) WhatsApp number.
create function public.upsert_customer(p_whatsapp text, p_name text, p_address text, p_notes text)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.customers (whatsapp, name, address, notes)
  values (p_whatsapp, btrim(p_name), nullif(btrim(p_address), ''), nullif(btrim(p_notes), ''))
  on conflict (whatsapp) do update set
    name = excluded.name,
    address = coalesce(excluded.address, public.customers.address),
    notes = coalesce(excluded.notes, public.customers.notes)
  returning id into v_id;
  return v_id;
end;
$$;

-- Replace the product list of a campaign.
create function public.save_campaign(p_id uuid, p_campaign jsonb, p_products jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_id is null then
    insert into public.campaigns (name, preorder_open, preorder_close, fulfill_start, fulfill_end, dp_percent, is_active, notes)
    values (
      btrim(p_campaign ->> 'name'),
      (p_campaign ->> 'preorder_open')::date,
      (p_campaign ->> 'preorder_close')::date,
      nullif(p_campaign ->> 'fulfill_start', '')::date,
      nullif(p_campaign ->> 'fulfill_end', '')::date,
      nullif(p_campaign ->> 'dp_percent', '')::numeric,
      coalesce((p_campaign ->> 'is_active')::boolean, true),
      nullif(btrim(p_campaign ->> 'notes'), '')
    )
    returning id into v_id;
  else
    update public.campaigns c set
      name = btrim(p_campaign ->> 'name'),
      preorder_open = (p_campaign ->> 'preorder_open')::date,
      preorder_close = (p_campaign ->> 'preorder_close')::date,
      fulfill_start = nullif(p_campaign ->> 'fulfill_start', '')::date,
      fulfill_end = nullif(p_campaign ->> 'fulfill_end', '')::date,
      dp_percent = nullif(p_campaign ->> 'dp_percent', '')::numeric,
      is_active = coalesce((p_campaign ->> 'is_active')::boolean, true),
      notes = nullif(btrim(p_campaign ->> 'notes'), '')
    where c.id = p_id
    returning c.id into v_id;

    if v_id is null then
      raise exception 'Campaign tidak ditemukan atau Anda tidak punya akses' using errcode = 'insufficient_privilege';
    end if;
    delete from public.campaign_products where campaign_id = v_id;
  end if;

  insert into public.campaign_products (campaign_id, product_id, price_override)
  select v_id, (e ->> 'product_id')::uuid, nullif(e ->> 'price_override', '')::bigint
  from jsonb_array_elements(coalesce(p_products, '[]'::jsonb)) as e;

  return v_id;
end;
$$;

revoke execute on function public.save_order(uuid, jsonb, jsonb) from public, anon;
revoke execute on function public.upsert_customer(text, text, text, text) from public, anon;
revoke execute on function public.save_campaign(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_order(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.upsert_customer(text, text, text, text) to authenticated;
grant execute on function public.save_campaign(uuid, jsonb, jsonb) to authenticated;
grant execute on function public.validate_order_rules(uuid) to authenticated;
