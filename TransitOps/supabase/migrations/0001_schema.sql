-- ============================================================================
-- TransitOps — 0001_schema.sql
-- Core schema: extensions, enums, lookup tables, entities, indexes, triggers
-- Target: PostgreSQL 15+ / Supabase
-- ============================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- case-insensitive email

-- ============================================================================
-- ENUM TYPES  (closed state machines / fixed vocabularies)
-- ============================================================================
create type user_role            as enum ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst');
create type account_status       as enum ('Pending', 'Approved', 'Rejected');
create type vehicle_status       as enum ('Available', 'On Trip', 'In Shop', 'Retired');
create type driver_category      as enum ('Light', 'Medium', 'Heavy');
create type driver_status        as enum ('Available', 'On Trip', 'Off Duty', 'Suspended');
create type trip_status          as enum ('Draft', 'Dispatched', 'Completed', 'Cancelled');
create type maintenance_priority as enum ('Low', 'Medium', 'High');
create type maintenance_status   as enum ('Open', 'In Progress', 'Resolved');
create type expense_type         as enum ('Toll', 'Repair', 'Insurance', 'Parking', 'Maintenance');
create type notification_type    as enum ('Error', 'Warning', 'Success', 'Info');

-- ============================================================================
-- LOOKUP TABLES (grow without a migration — logistics hubs / fleet classes)
-- ============================================================================
create table regions (
    id          smallint generated always as identity primary key,
    name        text not null unique,
    created_at  timestamptz not null default now()
);

create table vehicle_types (
    id          smallint generated always as identity primary key,
    name        text not null unique,
    created_at  timestamptz not null default now()
);

insert into regions (name) values ('Mumbai'), ('Pune'), ('Nashik'), ('Nagpur'), ('Ahmedabad');
insert into vehicle_types (name) values ('Delivery Van'), ('Heavy Truck'), ('Semi-Trailer'), ('Electric Van');

-- ============================================================================
-- USER ACCOUNTS  (1:1 profile over Supabase auth.users — no password stored)
-- ============================================================================
create table user_accounts (
    id            uuid primary key references auth.users(id) on delete cascade,
    name          text not null,
    email         citext not null unique,
    role          user_role not null,
    status        account_status not null default 'Pending',
    driver_id     uuid,                                   -- FK added after drivers table exists
    requested_at  timestamptz not null default now(),
    decided_at    timestamptz,
    decided_by    uuid references user_accounts(id),
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),
    constraint chk_decision_consistency
        check ( (status = 'Pending' and decided_at is null) or (status <> 'Pending' and decided_at is not null) )
);

comment on table user_accounts is 'Approval-gated login profile. Credentials live in auth.users; this table only tracks role + Fleet Manager approval workflow.';

-- ============================================================================
-- VEHICLES
-- ============================================================================
create table vehicles (
    id                 uuid primary key default gen_random_uuid(),
    registration_no    text not null unique,
    name               text not null,
    vehicle_type_id    smallint not null references vehicle_types(id),
    region_id          smallint not null references regions(id),
    capacity_kg        integer not null check (capacity_kg > 0),
    odometer_km        integer not null default 0 check (odometer_km >= 0),
    acquisition_cost   numeric(14,2) not null check (acquisition_cost >= 0),
    status             vehicle_status not null default 'Available',
    created_at         timestamptz not null default now(),
    updated_at         timestamptz not null default now()
);

-- ============================================================================
-- DRIVERS
-- ============================================================================
create table drivers (
    id             uuid primary key default gen_random_uuid(),
    license_no     text not null unique,
    name           text not null,
    category       driver_category not null default 'Medium',
    license_expiry date not null,
    contact        text,
    safety_score   smallint not null default 70 check (safety_score between 0 and 100),
    status         driver_status not null default 'Available',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

alter table user_accounts
    add constraint fk_user_accounts_driver foreign key (driver_id) references drivers(id) on delete set null;

-- one driver can be claimed by at most one login
create unique index uq_user_accounts_driver_id on user_accounts(driver_id) where driver_id is not null;

-- ============================================================================
-- TRIPS
-- ============================================================================
create sequence trip_code_seq start 101;

create table trips (
    id                    uuid primary key default gen_random_uuid(),
    trip_code             text not null unique default ('TRP-' || nextval('trip_code_seq')),
    source_region_id      smallint not null references regions(id),
    destination_region_id smallint not null references regions(id),
    vehicle_id            uuid not null references vehicles(id),
    driver_id             uuid not null references drivers(id),
    cargo_weight_kg       integer not null check (cargo_weight_kg > 0),
    planned_distance_km   integer not null check (planned_distance_km > 0),
    revenue               numeric(14,2) not null check (revenue >= 0),
    status                trip_status not null default 'Draft',
    dispatched_at         timestamptz,
    completed_at          timestamptz,
    final_odometer_km     integer,
    created_at            timestamptz not null default now(),
    updated_at            timestamptz not null default now(),
    constraint chk_trip_route_distinct check (source_region_id <> destination_region_id)
);

-- ============================================================================
-- MAINTENANCE LOGS
-- ============================================================================
create sequence maintenance_code_seq start 1;

create table maintenance_logs (
    id             uuid primary key default gen_random_uuid(),
    log_code       text not null unique default ('MNT-' || lpad(nextval('maintenance_code_seq')::text, 5, '0')),
    vehicle_id     uuid not null references vehicles(id),
    issue          text not null,
    priority       maintenance_priority not null default 'Medium',
    estimated_cost numeric(12,2) not null check (estimated_cost >= 0),
    actual_cost    numeric(12,2) check (actual_cost >= 0),
    status         maintenance_status not null default 'Open',
    log_date       date not null default current_date,
    resolve_date   date,
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now()
);

-- ============================================================================
-- FUEL LOGS
-- ============================================================================
create sequence fuel_code_seq start 1;

create table fuel_logs (
    id          uuid primary key default gen_random_uuid(),
    log_code    text not null unique default ('FL-' || lpad(nextval('fuel_code_seq')::text, 5, '0')),
    vehicle_id  uuid not null references vehicles(id),
    liters      numeric(8,2) not null default 0 check (liters >= 0),   -- 0 = EV charging
    cost        numeric(12,2) not null check (cost >= 0),
    odometer_km integer not null check (odometer_km >= 0),
    log_date    date not null default current_date,
    created_at  timestamptz not null default now()
);

-- ============================================================================
-- EXPENSES
-- ============================================================================
create sequence expense_code_seq start 1;

create table expenses (
    id                  uuid primary key default gen_random_uuid(),
    expense_code        text not null unique default ('EXP-' || lpad(nextval('expense_code_seq')::text, 5, '0')),
    vehicle_id          uuid not null references vehicles(id),
    expense_type        expense_type not null,
    cost                numeric(12,2) not null check (cost >= 0),
    expense_date        date not null default current_date,
    maintenance_log_id  uuid references maintenance_logs(id),   -- set when auto-generated from a resolved repair
    created_at          timestamptz not null default now()
);

-- ============================================================================
-- NOTIFICATIONS  (null user_id = broadcast to all approved users)
-- ============================================================================
create table notifications (
    id          uuid primary key default gen_random_uuid(),
    type        notification_type not null,
    message     text not null,
    user_id     uuid references user_accounts(id) on delete cascade,
    is_read     boolean not null default false,
    created_at  timestamptz not null default now()
);

-- ============================================================================
-- INDEXES  (matching the read patterns in Dashboard.tsx / Reports.tsx / Trips.tsx)
-- ============================================================================
create index idx_vehicles_status        on vehicles(status) where status <> 'Retired';
create index idx_vehicles_region        on vehicles(region_id);
create index idx_vehicles_type          on vehicles(vehicle_type_id);
create index idx_vehicles_reg_no_trgm   on vehicles using btree (upper(registration_no));

create index idx_drivers_status         on drivers(status);
create index idx_drivers_expiry         on drivers(license_expiry);

create index idx_trips_vehicle          on trips(vehicle_id);
create index idx_trips_driver           on trips(driver_id);
create index idx_trips_status           on trips(status);
create index idx_trips_vehicle_status   on trips(vehicle_id, status);   -- Reports.tsx completed-trip rollups

create index idx_maint_vehicle_status   on maintenance_logs(vehicle_id, status);
create index idx_maint_open             on maintenance_logs(vehicle_id) where status <> 'Resolved';

create index idx_fuel_vehicle_date      on fuel_logs(vehicle_id, log_date desc);
create index idx_expenses_vehicle_date  on expenses(vehicle_id, expense_date desc);
create index idx_expenses_type          on expenses(expense_type) where expense_type <> 'Maintenance';

create index idx_notifications_user     on notifications(user_id, created_at desc);
create index idx_notifications_unread   on notifications(user_id) where is_read = false;

create index idx_user_accounts_pending  on user_accounts(status) where status = 'Pending';

-- ============================================================================
-- updated_at MAINTENANCE TRIGGER
-- ============================================================================
create or replace function trg_set_updated_at() returns trigger
language plpgsql as $$
begin
    new.updated_at := now();
    return new;
end;
$$;

create trigger set_updated_at before update on user_accounts     for each row execute function trg_set_updated_at();
create trigger set_updated_at before update on vehicles          for each row execute function trg_set_updated_at();
create trigger set_updated_at before update on drivers           for each row execute function trg_set_updated_at();
create trigger set_updated_at before update on trips             for each row execute function trg_set_updated_at();
create trigger set_updated_at before update on maintenance_logs  for each row execute function trg_set_updated_at();