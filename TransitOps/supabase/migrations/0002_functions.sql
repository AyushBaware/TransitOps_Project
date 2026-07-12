-- ============================================================================
-- TransitOps — 0002_functions.sql
-- Server-side business logic. Moves the validation that currently lives in
-- AppContext.tsx (dispatchTrip, completeTrip, resolveMaintenanceLog, ...)
-- into atomic, race-condition-safe SQL functions.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Notification helper
-- ----------------------------------------------------------------------------
create or replace function push_notification(p_type notification_type, p_message text, p_user_id uuid default null)
returns void language plpgsql security definer as $$
begin
    insert into notifications (type, message, user_id) values (p_type, p_message, p_user_id);
end;
$$;

-- ----------------------------------------------------------------------------
-- new auth.users row -> create Pending user_accounts profile
-- role/name come from auth signup metadata (raw_user_meta_data)
-- ----------------------------------------------------------------------------
create or replace function handle_new_auth_user() returns trigger
language plpgsql security definer as $$
begin
    insert into user_accounts (id, name, email, role, status)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        coalesce((new.raw_user_meta_data->>'role')::user_role, 'Driver'),
        'Pending'
    );

    perform push_notification(
        'Warning',
        format('[ACCESS REQUEST] %s (%s) requested login access and is awaiting approval.',
               coalesce(new.raw_user_meta_data->>'name', new.email),
               coalesce(new.raw_user_meta_data->>'role', 'Driver'))
    );
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- Fleet Manager approval decisions
-- ----------------------------------------------------------------------------
create or replace function approve_account(p_account_id uuid) returns void
language plpgsql security definer as $$
declare v_acc user_accounts;
begin
    update user_accounts
        set status = 'Approved', decided_at = now(), decided_by = auth.uid()
        where id = p_account_id
        returning * into v_acc;

    if not found then raise exception 'Account % not found', p_account_id; end if;

    perform push_notification('Success', format('[ACCESS GRANTED] %s (%s) can now log in.', v_acc.name, v_acc.role));
end;
$$;

create or replace function reject_account(p_account_id uuid) returns void
language plpgsql security definer as $$
declare v_acc user_accounts;
begin
    update user_accounts
        set status = 'Rejected', decided_at = now(), decided_by = auth.uid()
        where id = p_account_id
        returning * into v_acc;

    if not found then raise exception 'Account % not found', p_account_id; end if;

    perform push_notification('Warning', format('[ACCESS DENIED/REVOKED] %s (%s) access declined or revoked.', v_acc.name, v_acc.role));
end;
$$;

-- ----------------------------------------------------------------------------
-- dispatch_trip: atomic version of AppContext.dispatchTrip()
-- Locks vehicle + driver rows to prevent double-dispatch race conditions.
-- ----------------------------------------------------------------------------
create or replace function dispatch_trip(p_trip_id uuid) returns trips
language plpgsql security definer as $$
declare
    v_trip     trips;
    v_vehicle  vehicles;
    v_driver   drivers;
begin
    select * into v_trip from trips where id = p_trip_id for update;
    if not found then raise exception 'Trip not found'; end if;
    if v_trip.status <> 'Draft' then raise exception 'Trip % is not in Draft state', v_trip.trip_code; end if;

    select * into v_vehicle from vehicles where id = v_trip.vehicle_id for update;
    select * into v_driver  from drivers  where id = v_trip.driver_id  for update;

    if v_vehicle.status <> 'Available' then
        raise exception 'Vehicle % is currently % and cannot be dispatched', v_vehicle.registration_no, v_vehicle.status;
    end if;
    if v_driver.status <> 'Available' then
        raise exception 'Driver % is currently % and cannot be dispatched', v_driver.name, v_driver.status;
    end if;
    if v_driver.license_expiry < current_date then
        raise exception 'Dispatch blocked: driver % has an expired license', v_driver.name;
    end if;
    if v_trip.cargo_weight_kg > v_vehicle.capacity_kg then
        raise exception 'Dispatch blocked: cargo weight (% kg) exceeds vehicle capacity (% kg)',
            v_trip.cargo_weight_kg, v_vehicle.capacity_kg;
    end if;

    update trips    set status = 'Dispatched', dispatched_at = now() where id = p_trip_id;
    update vehicles set status = 'On Trip' where id = v_vehicle.id;
    update drivers  set status = 'On Trip' where id = v_driver.id;

    perform push_notification('Success', format('[Trip Dispatched] Route %s is live. Vehicle: %s, Driver: %s, Load: %s kg.',
        v_trip.trip_code, v_vehicle.registration_no, v_driver.name, v_trip.cargo_weight_kg));

    select * into v_trip from trips where id = p_trip_id;
    return v_trip;
end;
$$;

-- ----------------------------------------------------------------------------
-- complete_trip: atomic version of AppContext.completeTrip()
-- ----------------------------------------------------------------------------
create or replace function complete_trip(
    p_trip_id       uuid,
    p_final_odometer integer,
    p_fuel_liters    numeric default null,
    p_fuel_cost      numeric default null
) returns trips
language plpgsql security definer as $$
declare
    v_trip    trips;
    v_vehicle vehicles;
begin
    select * into v_trip from trips where id = p_trip_id for update;
    if not found then raise exception 'Trip not found'; end if;
    if v_trip.status <> 'Dispatched' then raise exception 'Trip % is not Dispatched', v_trip.trip_code; end if;

    select * into v_vehicle from vehicles where id = v_trip.vehicle_id for update;

    if p_final_odometer < v_vehicle.odometer_km then
        raise exception 'Odometer error: final reading (% km) is less than current reading (% km)',
            p_final_odometer, v_vehicle.odometer_km;
    end if;

    update trips    set status = 'Completed', completed_at = now(), final_odometer_km = p_final_odometer where id = p_trip_id;
    update vehicles set status = 'Available', odometer_km = p_final_odometer where id = v_vehicle.id;
    update drivers  set status = 'Available' where id = v_trip.driver_id;

    if p_fuel_liters is not null and p_fuel_liters > 0 and p_fuel_cost is not null and p_fuel_cost > 0 then
        insert into fuel_logs (vehicle_id, liters, cost, odometer_km, log_date)
        values (v_vehicle.id, p_fuel_liters, p_fuel_cost, p_final_odometer, current_date);
    end if;

    perform push_notification('Success', format('[Trip Completed] Route %s finished. Earnings: %s. Odometer now %s km.',
        v_trip.trip_code, v_trip.revenue, p_final_odometer));

    -- surface predictive-maintenance alert if newly within threshold
    perform check_predictive_maintenance(v_vehicle.id);

    select * into v_trip from trips where id = p_trip_id;
    return v_trip;
end;
$$;

-- ----------------------------------------------------------------------------
-- cancel_trip
-- ----------------------------------------------------------------------------
create or replace function cancel_trip(p_trip_id uuid) returns trips
language plpgsql security definer as $$
declare v_trip trips;
begin
    select * into v_trip from trips where id = p_trip_id for update;
    if not found then raise exception 'Trip not found'; end if;
    if v_trip.status in ('Completed', 'Cancelled') then
        raise exception 'Trip % is already %', v_trip.trip_code, v_trip.status;
    end if;

    if v_trip.status = 'Dispatched' then
        update vehicles set status = 'Available' where id = v_trip.vehicle_id and status = 'On Trip';
        update drivers  set status = 'Available' where id = v_trip.driver_id  and status = 'On Trip';
    end if;

    update trips set status = 'Cancelled' where id = p_trip_id;
    perform push_notification('Warning', format('[Trip Cancelled] %s cancelled.', v_trip.trip_code));

    select * into v_trip from trips where id = p_trip_id;
    return v_trip;
end;
$$;

-- ----------------------------------------------------------------------------
-- Maintenance lifecycle
-- ----------------------------------------------------------------------------
create or replace function log_maintenance(p_vehicle_id uuid, p_issue text, p_priority maintenance_priority, p_estimated_cost numeric)
returns maintenance_logs
language plpgsql security definer as $$
declare v_log maintenance_logs;
begin
    insert into maintenance_logs (vehicle_id, issue, priority, estimated_cost)
    values (p_vehicle_id, p_issue, p_priority, p_estimated_cost)
    returning * into v_log;

    update vehicles set status = 'In Shop' where id = p_vehicle_id;

    perform push_notification('Error', format('[Maintenance Logged] Vehicle entered shop for "%s". Estimated cost: %s.', p_issue, p_estimated_cost));
    return v_log;
end;
$$;

create or replace function resolve_maintenance(p_log_id uuid, p_actual_cost numeric) returns maintenance_logs
language plpgsql security definer as $$
declare v_log maintenance_logs;
begin
    update maintenance_logs
        set status = 'Resolved', actual_cost = p_actual_cost, resolve_date = current_date
        where id = p_log_id
        returning * into v_log;
    if not found then raise exception 'Maintenance log not found'; end if;

    update vehicles set status = 'Available' where id = v_log.vehicle_id and status <> 'Retired';

    insert into expenses (vehicle_id, expense_type, cost, expense_date, maintenance_log_id)
    values (v_log.vehicle_id, 'Maintenance', p_actual_cost, current_date, v_log.id);

    perform push_notification('Success', format('[Maintenance Resolved] Vehicle returned to service. Cost: %s.', p_actual_cost));
    return v_log;
end;
$$;

-- ----------------------------------------------------------------------------
-- Fuel logging: auto-advances vehicle odometer if reading is higher
-- ----------------------------------------------------------------------------
create or replace function log_fuel(p_vehicle_id uuid, p_liters numeric, p_cost numeric, p_odometer integer, p_date date default current_date)
returns fuel_logs
language plpgsql security definer as $$
declare v_log fuel_logs; v_current_odo integer;
begin
    select odometer_km into v_current_odo from vehicles where id = p_vehicle_id for update;
    if p_odometer < v_current_odo then
        raise exception 'Odometer error: fuel log reading (% km) is less than vehicle current odometer (% km)', p_odometer, v_current_odo;
    end if;

    insert into fuel_logs (vehicle_id, liters, cost, odometer_km, log_date)
    values (p_vehicle_id, p_liters, p_cost, p_odometer, p_date)
    returning * into v_log;

    if p_odometer > v_current_odo then
        update vehicles set odometer_km = p_odometer where id = p_vehicle_id;
    end if;

    perform push_notification('Success', format('[Fuel Logged] %s liters recorded. Cost: %s.', p_liters, p_cost));
    return v_log;
end;
$$;

-- ----------------------------------------------------------------------------
-- Predictive maintenance check (service every 10,000 km)
-- ----------------------------------------------------------------------------
create or replace function check_predictive_maintenance(p_vehicle_id uuid) returns void
language plpgsql security definer as $$
declare
    v_vehicle vehicles;
    v_next_service integer;
    v_remaining integer;
begin
    select * into v_vehicle from vehicles where id = p_vehicle_id;
    if v_vehicle.status = 'Retired' then return; end if;

    v_next_service := (ceil(v_vehicle.odometer_km::numeric / 10000) * 10000)::integer;
    if v_next_service = 0 then v_next_service := 10000; end if;
    v_remaining := v_next_service - v_vehicle.odometer_km;

    if v_remaining <= 1000 and v_remaining >= 0 then
        perform push_notification('Warning', format(
            'Vehicle %s requires maintenance soon. Odo: %s km, service due: %s km (remaining %s km).',
            v_vehicle.registration_no, v_vehicle.odometer_km, v_next_service, v_remaining));
    end if;
end;
$$;