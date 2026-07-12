-- ============================================================================
-- TransitOps — 0003_views.sql
-- Replaces the useMemo() aggregations in Reports.tsx / Dashboard.tsx with
-- indexed SQL views so the DB does the rollup work, not the browser.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- vehicle_financials: one row per non-retired vehicle — Reports.tsx equivalent
-- ----------------------------------------------------------------------------
create or replace view vehicle_financials as
with completed as (
    select vehicle_id,
           sum(planned_distance_km) as distance_driven_km,
           sum(revenue)             as revenue,
           count(*)                 as completed_trip_count
    from trips
    where status = 'Completed'
    group by vehicle_id
),
fuel as (
    select vehicle_id, sum(liters) as fuel_liters, sum(cost) as fuel_cost
    from fuel_logs
    group by vehicle_id
),
maint as (
    select vehicle_id, sum(actual_cost) as maintenance_cost
    from maintenance_logs
    where status = 'Resolved'
    group by vehicle_id
),
misc as (
    select vehicle_id, sum(cost) as misc_cost
    from expenses
    where expense_type <> 'Maintenance'
    group by vehicle_id
)
select
    v.id,
    v.registration_no,
    v.name,
    vt.name as vehicle_type,
    r.name  as region,
    v.acquisition_cost,
    coalesce(c.distance_driven_km, 0)                                   as distance_driven_km,
    coalesce(f.fuel_liters, 0)                                          as fuel_liters,
    case when coalesce(f.fuel_liters, 0) > 0
         then round(coalesce(c.distance_driven_km, 0) / f.fuel_liters, 2)
         else 0 end                                                     as fuel_efficiency_km_per_l,
    coalesce(f.fuel_cost, 0)                                            as fuel_cost,
    coalesce(m.maintenance_cost, 0)                                     as maintenance_cost,
    coalesce(mi.misc_cost, 0)                                           as misc_cost,
    coalesce(f.fuel_cost,0) + coalesce(m.maintenance_cost,0) + coalesce(mi.misc_cost,0)      as total_expenses,
    coalesce(c.revenue, 0)                                              as revenue,
    coalesce(c.revenue, 0) - (coalesce(f.fuel_cost,0) + coalesce(m.maintenance_cost,0) + coalesce(mi.misc_cost,0)) as profit,
    case when v.acquisition_cost > 0
         then round(100 * (coalesce(c.revenue, 0) - (coalesce(f.fuel_cost,0) + coalesce(m.maintenance_cost,0) + coalesce(mi.misc_cost,0)))
                    / v.acquisition_cost, 1)
         else 0 end                                                     as roi_percent
from vehicles v
join vehicle_types vt on vt.id = v.vehicle_type_id
join regions r        on r.id  = v.region_id
left join completed c on c.vehicle_id = v.id
left join fuel f       on f.vehicle_id = v.id
left join maint m      on m.vehicle_id = v.id
left join misc mi      on mi.vehicle_id = v.id
where v.status <> 'Retired';

-- ----------------------------------------------------------------------------
-- predictive_maintenance: Vehicles.tsx "Predictive Service Due" tab
-- ----------------------------------------------------------------------------
create or replace view predictive_maintenance as
select
    v.id, v.registration_no, v.name, v.status, v.odometer_km,
    (case when ceil(v.odometer_km::numeric/10000)*10000 = 0 then 10000
          else (ceil(v.odometer_km::numeric/10000)*10000)::integer end)          as next_service_km,
    (case when ceil(v.odometer_km::numeric/10000)*10000 = 0 then 10000
          else (ceil(v.odometer_km::numeric/10000)*10000)::integer end) - v.odometer_km as remaining_km,
    case
        when (case when ceil(v.odometer_km::numeric/10000)*10000 = 0 then 10000
              else (ceil(v.odometer_km::numeric/10000)*10000)::integer end) - v.odometer_km <= 0   then 'Overdue'
        when (case when ceil(v.odometer_km::numeric/10000)*10000 = 0 then 10000
              else (ceil(v.odometer_km::numeric/10000)*10000)::integer end) - v.odometer_km <= 1000 then 'Near Limit'
        else 'Optimal'
    end as priority_state
from vehicles v
where v.status <> 'Retired';

-- ----------------------------------------------------------------------------
-- driver_compliance: Drivers.tsx compliance panel
-- ----------------------------------------------------------------------------
create or replace view driver_compliance as
select
    d.*,
    (d.license_expiry < current_date)                                  as is_expired,
    (d.license_expiry - current_date)                                  as days_to_expiry,
    (select count(*) from trips t where t.driver_id = d.id and t.status = 'Completed') as completed_trip_count
from drivers d;

-- ----------------------------------------------------------------------------
-- fleet_dashboard_stats: single-row KPI summary for Dashboard.tsx header cards
-- ----------------------------------------------------------------------------
create or replace view fleet_dashboard_stats as
select
    count(*) filter (where status <> 'Retired')      as total_active_vehicles,
    count(*) filter (where status = 'On Trip')        as vehicles_on_trip,
    count(*) filter (where status = 'Available')      as vehicles_available,
    count(*) filter (where status = 'In Shop')         as vehicles_in_shop,
    round(100.0 * count(*) filter (where status = 'On Trip')
        / nullif(count(*) filter (where status <> 'Retired'), 0), 1)  as utilization_percent
from vehicles;