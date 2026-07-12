-- ============================================================================
-- TransitOps — seed.sql
-- Ports INITIAL_VEHICLES / INITIAL_DRIVERS / INITIAL_TRIPS / ... from
-- AppContext.tsx into relational rows. Run after migrations 0001–0004.
-- Note: the admin Fleet Manager account is NOT seeded here — create it via
-- `supabase.auth.admin.createUser()` (service role) so Auth owns the password,
-- then insert its user_accounts row with status='Approved', role='Fleet Manager'.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Vehicles
-- ----------------------------------------------------------------------------
insert into vehicles (registration_no, name, vehicle_type_id, region_id, capacity_kg, odometer_km, acquisition_cost, status)
select x.reg, x.name, vt.id, r.id, x.cap, x.odo, x.cost, x.status::vehicle_status
from (values
    ('MH-12-AB-1234','Tata Ultra 1518',      'Heavy Truck',   'Pune',      10000, 49200, 1800000, 'Available'),
    ('MH-12-CD-5678','Mahindra Supro',       'Delivery Van',  'Pune',      1000,  12400,  650000, 'Available'),
    ('MH-14-EF-9012','Tata Prima 2830',      'Heavy Truck',   'Mumbai',    15000, 88900, 3200000, 'Available'),
    ('MH-15-GH-3456','BharatBenz 1917R',     'Heavy Truck',   'Nagpur',    12000,102100, 2800000, 'Available'),
    ('GJ-01-JK-7890','Ashok Leyland 5525',   'Semi-Trailer',  'Ahmedabad', 35000,145000, 4500000, 'Available'),
    ('MH-12-LM-1122','Mahindra Zor Grand',   'Electric Van',  'Mumbai',    600,    8100,  420000, 'Available'),
    ('MH-14-NP-3344','Tata Winger Cargo',    'Delivery Van',  'Mumbai',    1500,  52300, 1100000, 'Available'),
    ('MH-12-QR-5566','Force Kargo King',     'Delivery Van',  'Nashik',    2000,  38500,  850000, 'Available'),
    ('MH-15-ST-7788','Eicher Pro 2049',      'Delivery Van',  'Nagpur',    3500,  49500, 1200000, 'Available'),
    ('GJ-01-UV-9900','Volvo FM 420',         'Semi-Trailer',  'Ahmedabad', 40000,210000, 6500000, 'Retired')
) as x(reg, name, vtype, region, cap, odo, cost, status)
join vehicle_types vt on vt.name = x.vtype
join regions r on r.name = x.region;

-- ----------------------------------------------------------------------------
-- Drivers
-- ----------------------------------------------------------------------------
insert into drivers (license_no, name, category, license_expiry, contact, safety_score, status) values
('LIC-MH12-001','Alex Fernandes',    'Heavy',  '2026-12-31','+91 98765 43210', 92, 'Available'),
('LIC-MH12-002','Rohan Sharma',      'Medium', '2026-08-15','+91 98765 43211', 88, 'Available'),
('LIC-MH14-003','Priyesh Kadam',     'Heavy',  '2027-02-28','+91 98765 43212', 96, 'Available'),
('LIC-MH15-004','Amit Patwardhan',   'Light',  '2026-09-12','+91 98765 43213', 76, 'Available'),
('LIC-GJ01-005','Sameer Patel',      'Heavy',  '2026-11-05','+91 98765 43214', 85, 'Available'),
('LIC-MH12-006','Vijay Patil',       'Medium', '2026-09-30','+91 98765 43215', 90, 'Available'),
('LIC-MH14-007','Sandeep Thorat',    'Light',  '2025-06-30','+91 98765 43216', 82, 'Available'),  -- expired
('LIC-MH15-008','Rajesh Gokhale',    'Heavy',  '2026-10-01','+91 98765 43217', 64, 'Suspended');

-- ----------------------------------------------------------------------------
-- Trips  (all seeded as Completed except the last two, kept as Draft)
-- ----------------------------------------------------------------------------
insert into trips (source_region_id, destination_region_id, vehicle_id, driver_id, cargo_weight_kg, planned_distance_km, revenue, status)
select rs.id, rd.id, v.id, d.id, x.cargo, x.dist, x.rev, x.status::trip_status
from (values
    ('Mumbai',   'Pune',      'MH-12-AB-1234','LIC-MH12-001', 4500, 150, 35000,  'Completed'),
    ('Pune',     'Nashik',    'MH-12-CD-5678','LIC-MH12-002', 800,  210, 18000,  'Completed'),
    ('Mumbai',   'Ahmedabad', 'MH-14-EF-9012','LIC-MH14-003', 12000,530, 95000,  'Completed'),
    ('Nagpur',   'Pune',      'MH-15-GH-3456','LIC-MH12-006', 8000, 710, 110000, 'Completed'),
    ('Ahmedabad','Mumbai',    'GJ-01-JK-7890','LIC-GJ01-005', 30000,530, 180000, 'Completed'),
    ('Mumbai',   'Pune',      'MH-12-LM-1122','LIC-MH12-001', 500,  150, 15000,  'Completed'),
    ('Pune',     'Nashik',    'MH-12-QR-5566','LIC-MH12-002', 1500, 210, 20000,  'Completed'),
    ('Nagpur',   'Mumbai',    'MH-15-ST-7788','LIC-MH12-006', 3000, 820, 90000,  'Completed'),
    ('Mumbai',   'Nashik',    'MH-14-NP-3344','LIC-MH14-003', 1200, 170, 25000,  'Completed'),
    ('Pune',     'Nagpur',    'MH-12-AB-1234','LIC-MH12-001', 6000, 710, 105000, 'Completed'),
    ('Mumbai',   'Pune',      'MH-14-NP-3344','LIC-MH14-003', 1000, 150, 20000,  'Draft'),
    ('Ahmedabad','Pune',      'GJ-01-JK-7890','LIC-GJ01-005', 22000,660, 160000, 'Draft')
) as x(src, dst, reg, lic, cargo, dist, rev, status)
join regions  rs on rs.name = x.src
join regions  rd on rd.name = x.dst
join vehicles v  on v.registration_no = x.reg
join drivers  d  on d.license_no = x.lic;

-- ----------------------------------------------------------------------------
-- Fuel logs
-- ----------------------------------------------------------------------------
insert into fuel_logs (vehicle_id, liters, cost, odometer_km, log_date)
select v.id, x.liters, x.cost, x.odo, x.d::date from (values
  ('MH-12-AB-1234', 45,  4500, 48600, '2026-06-10'),
  ('MH-12-AB-1234', 50,  5000, 49100, '2026-06-18'),
  ('MH-12-CD-5678', 25,  2500, 12200, '2026-06-12'),
  ('MH-14-EF-9012', 120, 12000,88400, '2026-06-15'),
  ('MH-15-GH-3456', 180, 18000,101400,'2026-06-16'),
  ('GJ-01-JK-7890', 220, 22000,144500,'2026-06-20'),
  ('MH-12-LM-1122', 0,   400,  8000,  '2026-06-21'),
  ('MH-14-NP-3344', 35,  3500, 52100, '2026-06-22'),
  ('MH-12-QR-5566', 40,  4000, 38300, '2026-06-24'),
  ('MH-15-ST-7788', 70,  7000, 49100, '2026-06-25'),
  ('MH-12-AB-1234', 48,  4800, 49200, '2026-07-02'),
  ('MH-12-CD-5678', 28,  2800, 12400, '2026-07-03'),
  ('MH-14-EF-9012', 110, 11000,88900, '2026-07-04'),
  ('MH-15-GH-3456', 170, 17000,102100,'2026-07-05'),
  ('GJ-01-JK-7890', 215, 21500,145000,'2026-07-06'),
  ('MH-12-LM-1122', 0,   450,  8100,  '2026-07-07'),
  ('MH-14-NP-3344', 38,  3800, 52300, '2026-07-08'),
  ('MH-12-QR-5566', 42,  4200, 38500, '2026-07-09'),
  ('MH-15-ST-7788', 75,  7500, 49500, '2026-07-10'),
  ('GJ-01-UV-9900', 300, 30000,210000,'2026-06-01')
) as x(reg, liters, cost, odo, d)
join vehicles v on v.registration_no = x.reg;

-- ----------------------------------------------------------------------------
-- Maintenance logs (all resolved)
-- ----------------------------------------------------------------------------
insert into maintenance_logs (vehicle_id, issue, priority, estimated_cost, actual_cost, status, log_date, resolve_date)
select v.id, x.issue, x.priority::maintenance_priority, x.est, x.act, 'Resolved', x.logd::date, x.resd::date
from (values
  ('MH-12-AB-1234','Engine Oil Change & Filter Renewal','Medium',5000,5200,'2026-05-10','2026-05-12'),
  ('MH-12-CD-5678','Brake Pad Replacement & Bleeding','High',3500,3300,'2026-05-18','2026-05-19'),
  ('MH-14-EF-9012','Clutch Plate Overhaul','High',15000,16500,'2026-05-25','2026-05-28'),
  ('MH-15-GH-3456','Air Conditioner Refilling & Service','Low',2500,2500,'2026-06-02','2026-06-03'),
  ('GJ-01-JK-7890','Tire Rotation & Wheel Alignment','Medium',8000,7800,'2026-06-12','2026-06-13'),
  ('MH-12-LM-1122','Battery Coolant Leakage Rectification','High',6000,5900,'2026-06-28','2026-06-29'),
  ('MH-14-NP-3344','Suspension Bushing Replacement','Medium',4500,4500,'2026-07-02','2026-07-03'),
  ('MH-12-QR-5566','Alternator Belt Crack - Preventive','Low',1800,1800,'2026-07-08','2026-07-09')
) as x(reg, issue, priority, est, act, logd, resd)
join vehicles v on v.registration_no = x.reg;

-- mirror resolved maintenance cost into expenses (as resolve_maintenance() would)
insert into expenses (vehicle_id, expense_type, cost, expense_date, maintenance_log_id)
select vehicle_id, 'Maintenance', actual_cost, resolve_date, id from maintenance_logs;

-- ----------------------------------------------------------------------------
-- Non-maintenance expenses
-- ----------------------------------------------------------------------------
insert into expenses (vehicle_id, expense_type, cost, expense_date)
select v.id, x.etype::expense_type, x.cost, x.d::date from (values
  ('MH-12-AB-1234','Toll',1200,'2026-06-10'),
  ('MH-12-CD-5678','Toll',600, '2026-06-12'),
  ('MH-14-EF-9012','Toll',4200,'2026-06-15'),
  ('MH-15-GH-3456','Insurance',24000,'2026-06-01'),
  ('GJ-01-JK-7890','Toll',6800,'2026-06-20'),
  ('MH-12-LM-1122','Parking',500,'2026-06-21'),
  ('MH-14-NP-3344','Toll',1100,'2026-06-22'),
  ('MH-12-QR-5566','Toll',950, '2026-06-24'),
  ('MH-15-ST-7788','Toll',2800,'2026-06-25'),
  ('GJ-01-UV-9900','Insurance',35000,'2026-05-15'),
  ('MH-12-AB-1234','Toll',1200,'2026-07-02'),
  ('MH-12-CD-5678','Toll',600, '2026-07-03'),
  ('MH-14-EF-9012','Toll',4200,'2026-07-04'),
  ('MH-15-GH-3456','Toll',5400,'2026-07-05'),
  ('GJ-01-JK-7890','Toll',6800,'2026-07-06')
) as x(reg, etype, cost, d)
join vehicles v on v.registration_no = x.reg;

-- ----------------------------------------------------------------------------
-- Broadcast notifications
-- ----------------------------------------------------------------------------
insert into notifications (type, message, created_at) values
('Warning','Driver Sandeep Thorat (LIC-MH14-007) license expired on 2025-06-30.', now() - interval '2 hours'),
('Warning','Vehicle Eicher Pro 2049 (MH-15-ST-7788) is 500 km away from recommended service.', now() - interval '4 hours'),
('Info','System booted successfully with 10 vehicles, 8 drivers, and active routes.', now() - interval '8 hours');

-- ----------------------------------------------------------------------------
-- Admin Fleet Manager profile — run AFTER creating the auth user, e.g.:
--   const { data } = await supabaseAdmin.auth.admin.createUser({
--     email: 'superadmin@transitops.internal', password: '<set-a-real-secret>',
--     email_confirm: true
--   });
-- then:
--   update user_accounts set role='Fleet Manager', status='Approved', decided_at=now()
--     where id = '<returned user id>';
-- (Row is auto-created as Pending/Driver by the on_auth_user_created trigger.)
-- ----------------------------------------------------------------------------