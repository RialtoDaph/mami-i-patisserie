-- Stage 5c: Persetujuan (approvals + rules) and Target & Rencana (monthly/yearly targets, goals, milestones).
--
-- Rules (APP.md + prototype "App Internal v2"):
-- * Purchases/repairs above the alat limit, paid campaigns above the campaign limit, selling-price changes and
--   hiring/firing need Alto's approval. Anything else is recorded right away ("dicatat").
-- * When Alto has not answered within fallback_hours, the backup decider (Mami: profiles.approval_backup) may decide.
-- * Only Alto (owner) sets the rules, targets, goals and milestones. Owners update any milestone status;
--   the manager only milestones where they are the PIC. "Telat" is computed (open milestone past its date).

-- ---------------------------------------------------------------------------
-- Backup decider flag + team names for the office
-- ---------------------------------------------------------------------------

alter table public.profiles add column approval_backup boolean not null default false;

comment on column public.profiles.approval_backup is
  'May decide approvals Alto has not answered within approval_rules.fallback_hours (Mami). Set by the owner.';

-- Names for "diajukan oleh" and PIC lists. The manager cannot read profiles directly.
create function public.team_names()
returns table (id uuid, full_name text, title text, role public.app_role, approval_backup boolean)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, p.title, p.role, p.approval_backup
  from public.profiles p
  where public.is_office()
  order by p.sort_order, p.full_name;
$$;

revoke execute on function public.team_names() from public, anon;
grant execute on function public.team_names() to authenticated;

-- ---------------------------------------------------------------------------
-- Approval rules (single row)
-- ---------------------------------------------------------------------------

create table public.approval_rules (
  id boolean primary key default true check (id),
  alat_limit bigint not null default 2000000 check (alat_limit >= 0),
  campaign_limit bigint not null default 1000000 check (campaign_limit >= 0),
  fallback_hours integer not null default 48 check (fallback_hours between 1 and 720),
  updated_at timestamptz not null default now()
);

comment on table public.approval_rules is 'Approval limits (Rp) and how long Alto has before the backup decider may decide.';

insert into public.approval_rules (id) values (true);

create trigger approval_rules_set_updated_at
  before update on public.approval_rules
  for each row execute function public.set_updated_at();

alter table public.approval_rules enable row level security;
revoke all on public.approval_rules from anon;
create policy approval_rules_select on public.approval_rules for select to authenticated
  using ((select public.has_role('owner', 'admin', 'manager')));
create policy approval_rules_update on public.approval_rules for update to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));

-- ---------------------------------------------------------------------------
-- Goals and milestones
-- ---------------------------------------------------------------------------

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  area text not null check (area in ('Keuangan', 'Produksi', 'Marketing', 'Interior', 'Konsep', 'Operasional')),
  pic uuid references public.profiles (id) on delete set null,
  due_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger goals_set_updated_at before update on public.goals for each row execute function public.set_updated_at();

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null references public.goals (id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 200),
  due_date date not null,
  pic uuid references public.profiles (id) on delete set null,
  cost bigint not null default 0 check (cost >= 0),
  status text not null default 'belum' check (status in ('belum', 'jalan', 'selesai')),
  status_by uuid references public.profiles (id) on delete set null,
  status_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.milestones.status is '"telat" is not stored: an open milestone past due_date shows as late.';

create index milestones_goal_idx on public.milestones (goal_id);
create trigger milestones_set_updated_at before update on public.milestones for each row execute function public.set_updated_at();

alter table public.goals enable row level security;
alter table public.milestones enable row level security;
revoke all on public.goals, public.milestones from anon;

create policy goals_select on public.goals for select to authenticated using ((select public.has_role('owner', 'admin', 'manager')));
create policy goals_write on public.goals for all to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));
create policy milestones_select on public.milestones for select to authenticated using ((select public.has_role('owner', 'admin', 'manager')));
create policy milestones_write on public.milestones for all to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));

-- Status changes by others go through this RPC: owners any milestone, the manager only their own.
create function public.set_milestone_status(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pic uuid;
begin
  if p_status not in ('belum', 'jalan', 'selesai') then raise exception 'Status tidak dikenal'; end if;
  select m.pic into v_pic from public.milestones m where m.id = p_id;
  if not found then raise exception 'Milestone tidak ditemukan'; end if;
  if not (public.has_role('owner', 'admin') or (public.has_role('manager') and v_pic = auth.uid())) then
    raise exception 'Hanya PIC milestone ini atau Owner yang bisa mengubah status';
  end if;
  update public.milestones set status = p_status, status_by = auth.uid(), status_at = now() where id = p_id;
end;
$$;

revoke execute on function public.set_milestone_status(uuid, text) from public, anon;
grant execute on function public.set_milestone_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Approvals
-- ---------------------------------------------------------------------------

create table public.approvals (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('alat', 'harga', 'karyawan', 'campaign', 'lain')),
  title text not null check (length(btrim(title)) between 1 and 200),
  amount bigint not null default 0 check (amount >= 0),
  note text check (length(note) <= 1000),
  milestone_id uuid references public.milestones (id) on delete set null,
  requested_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  status text not null check (status in ('menunggu', 'disetujui', 'ditolak', 'dicatat')),
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  decision_note text check (length(decision_note) <= 300)
);

create index approvals_status_idx on public.approvals (status, created_at desc);
create index approvals_milestone_idx on public.approvals (milestone_id) where milestone_id is not null;

alter table public.approvals enable row level security;
revoke all on public.approvals from anon;
-- Read only: rows are written by submit_approval / decide_approval so the status follows the rules.
create policy approvals_select on public.approvals for select to authenticated
  using ((select public.has_role('owner', 'admin', 'manager')));

-- Mirrors needsApproval() in src/lib/plans/approvals.ts.
create function public.approval_needed(p_kind text, p_amount bigint)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when p_kind in ('harga', 'karyawan') then true
    when p_kind = 'campaign' then p_amount > r.campaign_limit
    else p_amount > r.alat_limit
  end
  from public.approval_rules r;
$$;

create function public.submit_approval(p_kind text, p_title text, p_amount bigint, p_note text, p_milestone uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status text;
begin
  if not public.has_role('owner', 'admin', 'manager') then raise exception 'Tidak punya akses'; end if;
  if p_kind not in ('alat', 'harga', 'karyawan', 'campaign', 'lain') then raise exception 'Jenis tidak dikenal'; end if;
  if coalesce(p_amount, 0) < 0 then raise exception 'Nominal tidak boleh minus'; end if;
  if p_milestone is not null and exists (
    select 1 from public.approvals a where a.milestone_id = p_milestone and a.status in ('menunggu', 'disetujui', 'dicatat')
  ) then
    raise exception 'Biaya milestone ini sudah diajukan';
  end if;
  v_status := case when public.approval_needed(p_kind, coalesce(p_amount, 0)) then 'menunggu' else 'dicatat' end;
  insert into public.approvals (kind, title, amount, note, milestone_id, requested_by, status)
  values (p_kind, btrim(p_title), coalesce(p_amount, 0), nullif(btrim(coalesce(p_note, '')), ''), p_milestone, auth.uid(), v_status);
  return v_status;
end;
$$;

create function public.decide_approval(p_id uuid, p_approve boolean, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.approvals;
  v_hours integer;
begin
  select * into v_row from public.approvals where id = p_id for update;
  if not found then raise exception 'Pengajuan tidak ditemukan'; end if;
  if v_row.status <> 'menunggu' then raise exception 'Pengajuan ini sudah diputuskan'; end if;
  select fallback_hours into v_hours from public.approval_rules;
  if not (
    public.has_role('owner')
    or (
      public.has_role('admin')
      and exists (select 1 from public.profiles p where p.id = auth.uid() and p.approval_backup)
      and now() - v_row.created_at >= make_interval(hours => v_hours)
    )
  ) then
    raise exception 'Hanya Alto yang bisa memutuskan (cadangan boleh setelah % jam)', v_hours;
  end if;
  update public.approvals
  set status = case when p_approve then 'disetujui' else 'ditolak' end,
      decided_by = auth.uid(), decided_at = now(), decision_note = nullif(btrim(coalesce(p_note, '')), '')
  where id = p_id;
end;
$$;

revoke execute on function public.approval_needed(text, bigint) from public, anon;
revoke execute on function public.submit_approval(text, text, bigint, text, uuid) from public, anon;
revoke execute on function public.decide_approval(uuid, boolean, text) from public, anon;
grant execute on function public.approval_needed(text, bigint) to authenticated;
grant execute on function public.submit_approval(text, text, bigint, text, uuid) to authenticated;
grant execute on function public.decide_approval(uuid, boolean, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Targets
-- ---------------------------------------------------------------------------

create table public.monthly_targets (
  month date primary key check (extract(day from month) = 1),
  cafe_revenue bigint check (cafe_revenue >= 0),
  preorder_revenue bigint check (preorder_revenue >= 0),
  hampers_revenue bigint check (hampers_revenue >= 0),
  web_revenue bigint check (web_revenue >= 0),
  orders integer check (orders >= 0),
  avg_order bigint check (avg_order >= 0),
  food_cost_pct numeric(5, 2) check (food_cost_pct between 0 and 100),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);

comment on table public.monthly_targets is
  'A month without a row uses the latest earlier row ("ikut target bulan sebelumnya"). Null = no target.';

create table public.year_targets (
  year integer primary key check (year between 2026 and 2100),
  revenue bigint check (revenue >= 0),
  orders integer check (orders >= 0),
  updated_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now()
);

comment on table public.year_targets is 'Optional. Without a row the yearly target is the sum of the 12 monthly targets.';

create trigger monthly_targets_set_updated_at before update on public.monthly_targets for each row execute function public.set_updated_at();
create trigger year_targets_set_updated_at before update on public.year_targets for each row execute function public.set_updated_at();

alter table public.monthly_targets enable row level security;
alter table public.year_targets enable row level security;
revoke all on public.monthly_targets, public.year_targets from anon;

create policy monthly_targets_select on public.monthly_targets for select to authenticated
  using ((select public.has_role('owner', 'admin', 'manager')));
create policy monthly_targets_write on public.monthly_targets for all to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));
create policy year_targets_select on public.year_targets for select to authenticated
  using ((select public.has_role('owner', 'admin', 'manager')));
create policy year_targets_write on public.year_targets for all to authenticated
  using ((select public.has_role('owner'))) with check ((select public.has_role('owner')));
