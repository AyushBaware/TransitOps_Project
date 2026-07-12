-- ============================================================================
-- TransitOps — 0004_rls.sql
-- Row Level Security — server-enforced version of the roleMap/allowedRoles
-- logic in App.tsx and Sidebar.tsx. Without this, RBAC only lives in the
-- React router, which any direct API/DB call bypasses entirely.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper functions (SECURITY DEFINER to avoid RLS recursion on user_accounts)
-- ----------------------------------------------------------------------------
create or replace function current_user_role() returns user_role
language sql stable security definer set search_path = public as $$
    select role from user_accounts where id = auth.uid() and status = 'Approved';
$$;

create or replace function current_driver_id() returns uuid
language sql stable security definer set search_path = public as $$
    select driver_id from user_accounts where id = auth.uid() and status = 'Approved';
$$;

create or replace function is_fleet_manager() returns boolean
language sql stable security definer set search_path = public as $$
    select current_user_role() = 'Fleet Manager';
$$;

-- ----------------------------------------------------------------------------
-- Enable RLS everywhere
-- ----------------------------------------------------------------------------
alter table user_accounts     enable row level security;
alter table vehicles          enable row level security;
alter table drivers           enable row level security;
alter table trips             enable row level security;
alter table maintenance_logs  enable row level security;
alter table fuel_logs         enable row level security;
alter table expenses          enable row level security;
alter table notifications     enable row level security;
alter table regions           enable row level security;
alter table vehicle_types     enable row level security;

-- ----------------------------------------------------------------------------
-- Lookup tables: readable by anyone approved, writable only by Fleet Manager
-- ----------------------------------------------------------------------------
create policy lookup_read_regions  on regions       for select using (current_user_role() is not null);
create policy lookup_read_types    on vehicle_types  for select using (current_user_role() is not null);
create policy lookup_write_regions on regions        for all using (is_fleet_manager()) with check (is_fleet_manager());
create policy lookup_write_types   on vehicle_types  for all using (is_fleet_manager()) with check (is_fleet_manager());

-- ----------------------------------------------------------------------------
-- user_accounts: self-read, Fleet Manager reads/decides all
-- ----------------------------------------------------------------------------
create policy accounts_select_self on user_accounts for select
    using (id = auth.uid() or is_fleet_manager());

create policy accounts_update_fm on user_accounts for update
    using (is_fleet_manager()) with check (is_fleet_manager());

-- ----------------------------------------------------------------------------
-- vehicles: all approved roles read (dashboard needs it); only FM writes
-- ----------------------------------------------------------------------------
create policy vehicles_select on vehicles for select using (current_user_role() is not null);
create policy vehicles_write  on vehicles for all
    using (is_fleet_manager()) with check (is_fleet_manager());

-- ----------------------------------------------------------------------------
-- drivers: FM + Safety Officer full access; Driver can read own row
-- ----------------------------------------------------------------------------
create policy drivers_select on drivers for select
    using (current_user_role() in ('Fleet Manager', 'Safety Officer') or id = current_driver_id());

create policy drivers_write on drivers for all
    using (current_user_role() in ('Fleet Manager', 'Safety Officer'))
    with check (current_user_role() in ('Fleet Manager', 'Safety Officer'));

-- ----------------------------------------------------------------------------
-- trips: FM sees/writes all; Driver sees & completes only their own trips
-- ----------------------------------------------------------------------------
create policy trips_select on trips for select
    using (current_user_role() = 'Fleet Manager' or driver_id = current_driver_id());

create policy trips_insert on trips for insert
    with check (is_fleet_manager());

create policy trips_update on trips for update
    using (is_fleet_manager() or driver_id = current_driver_id())
    with check (is_fleet_manager() or driver_id = current_driver_id());

-- Note: dispatch_trip/complete_trip/cancel_trip are SECURITY DEFINER RPCs —
-- prefer calling those over raw UPDATEs so business rules stay enforced.

-- ----------------------------------------------------------------------------
-- maintenance_logs: Fleet Manager only (per Maintenance.tsx allowedRoles)
-- ----------------------------------------------------------------------------
create policy maintenance_all on maintenance_logs for all
    using (is_fleet_manager()) with check (is_fleet_manager());

-- ----------------------------------------------------------------------------
-- fuel_logs / expenses: FM + Driver can write; Financial Analyst read-only
-- ----------------------------------------------------------------------------
create policy fuel_select on fuel_logs for select
    using (current_user_role() in ('Fleet Manager', 'Driver', 'Financial Analyst'));
create policy fuel_write on fuel_logs for insert
    with check (current_user_role() in ('Fleet Manager', 'Driver'));

create policy expenses_select on expenses for select
    using (current_user_role() in ('Fleet Manager', 'Driver', 'Financial Analyst'));
create policy expenses_write on expenses for insert
    with check (current_user_role() in ('Fleet Manager', 'Driver'));

-- ----------------------------------------------------------------------------
-- notifications: any approved user reads broadcast + their own; FM clears
-- ----------------------------------------------------------------------------
create policy notifications_select on notifications for select
    using (user_id is null or user_id = auth.uid());

create policy notifications_delete on notifications for delete
    using (is_fleet_manager() or user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Views inherit RLS of underlying tables automatically (security_invoker)
-- ----------------------------------------------------------------------------
alter view vehicle_financials     set (security_invoker = true);
alter view predictive_maintenance set (security_invoker = true);
alter view driver_compliance      set (security_invoker = true);
alter view fleet_dashboard_stats  set (security_invoker = true);