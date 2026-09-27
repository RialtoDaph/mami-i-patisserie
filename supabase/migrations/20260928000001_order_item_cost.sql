-- HPP snapshot per order item, for gross profit per order/campaign.
--
-- unit_cost = cost of one product unit (HPP per product, incl. units_per_product) at
-- the time the order was saved. It is computed by the app with the same costing
-- functions as the costing pages and passed to save_order. Null = unknown (older
-- orders, or the cost could not be computed); the app then falls back to the
-- current HPP and marks it as an estimate.

alter table public.order_items
  add column unit_cost bigint check (unit_cost >= 0);

-- Same as before, plus unit_cost per item (same signature, so grants are kept).
create or replace function public.save_order(p_id uuid, p_order jsonb, p_items jsonb)
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

  insert into public.order_items (order_id, product_id, qty, unit_price, unit_cost, sort_order)
  select v_id, (e ->> 'product_id')::uuid, (e ->> 'qty')::integer, (e ->> 'unit_price')::bigint,
         nullif(e ->> 'unit_cost', '')::bigint, (t.ord - 1)::integer
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
