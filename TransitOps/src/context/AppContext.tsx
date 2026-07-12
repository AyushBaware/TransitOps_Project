import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

// ==========================================
// TYPES DEFINITIONS
// ==========================================

export interface User {
  email: string;
  role: 'Fleet Manager' | 'Driver' | 'Safety Officer' | 'Financial Analyst';
  name: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string; // NOTE: plaintext for demo purposes only — a real backend would hash this
  role: User['role'];
  status: 'Pending' | 'Approved' | 'Rejected';
  requestedAt: string;
  decidedAt?: string;
}

export interface Vehicle {
  id: string; // Registration Plate (Unique)
  name: string;
  type: 'Delivery Van' | 'Heavy Truck' | 'Semi-Trailer' | 'Electric Van';
  region: 'Mumbai' | 'Pune' | 'Nashik' | 'Nagpur' | 'Ahmedabad';
  capacity: number; // in kg
  odometer: number; // in km
  acquisitionCost: number; // in INR
  status: 'Available' | 'On Trip' | 'In Shop' | 'Retired';
}

export interface Driver {
  id: string; // License Number (Unique)
  name: string;
  category: 'Light' | 'Medium' | 'Heavy';
  expiryDate: string; // YYYY-MM-DD
  contact: string;
  safetyScore: number; // 0-100
  status: 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';
}

export interface Trip {
  id: string; // TRP-XXX
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeight: number; // in kg
  plannedDistance: number; // in km
  revenue: number; // in INR
  status: 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  issue: string;
  priority: 'Low' | 'Medium' | 'High';
  estimatedCost: number;
  actualCost?: number;
  status: 'Open' | 'In Progress' | 'Resolved';
  logDate: string;
  resolveDate?: string;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number; // total cost in INR
  date: string;
  odometer: number; // odometer reading at log
}

export interface Expense {
  id: string;
  vehicleId: string;
  type: 'Toll' | 'Repair' | 'Insurance' | 'Parking' | 'Maintenance';
  cost: number;
  date: string;
}

export interface AppNotification {
  id: string;
  type: 'Error' | 'Warning' | 'Success' | 'Info';
  message: string;
  timestamp: string;
}

interface AppContextType {
  currentUser: User | null;
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: Trip[];
  maintenanceLogs: MaintenanceLog[];
  fuelLogs: FuelLog[];
  expenses: Expense[];
  notifications: AppNotification[];
  userAccounts: UserAccount[];
  registerAccount: (name: string, email: string, password: string, role: Exclude<User['role'], 'Fleet Manager'>) => { success: boolean; message: string };
  loginWithCredentials: (email: string, password: string) => { success: boolean; message: string; role?: User['role'] };
  approveAccount: (id: string) => void;
  rejectAccount: (id: string) => void;
  revokeAccount: (id: string) => void;
  logout: () => void;
  // Vehicles
  addVehicle: (vehicle: Vehicle) => { success: boolean; message: string };
  updateVehicle: (vehicle: Vehicle) => { success: boolean; message: string };
  deleteVehicle: (id: string) => void;
  // Drivers
  addDriver: (driver: Driver) => { success: boolean; message: string };
  updateDriver: (driver: Driver) => { success: boolean; message: string };
  deleteDriver: (id: string) => void;
  // Trips
  addTrip: (trip: Trip) => void;
  updateTrip: (trip: Trip) => void;
  dispatchTrip: (id: string) => { success: boolean; message: string };
  completeTrip: (id: string, finalOdometer: number, fuelLiters?: number, fuelCost?: number) => { success: boolean; message: string };
  cancelTrip: (id: string) => { success: boolean; message: string };
  // Maintenance
  addMaintenanceLog: (log: Omit<MaintenanceLog, 'id' | 'status' | 'logDate'>) => void;
  resolveMaintenanceLog: (id: string, actualCost: number) => void;
  // Fuel & Expenses
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  clearNotifications: () => void;
  // Smart Dispatch Recommendations
  getSmartVehicleRecommendations: (cargoWeight: number, region: Vehicle['region']) => { vehicle: Vehicle; score: number; reason: string }[];
  getSmartDriverRecommendations: () => { driver: Driver; score: number; reason: string }[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ==========================================
// PRE-POPULATED MOCK DATA
// ==========================================

const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'MH-12-AB-1234', name: 'Tata Ultra 1518', type: 'Heavy Truck', region: 'Pune', capacity: 10000, odometer: 49200, acquisitionCost: 1800000, status: 'Available' },
  { id: 'MH-12-CD-5678', name: 'Mahindra Supro', type: 'Delivery Van', region: 'Pune', capacity: 1000, odometer: 12400, acquisitionCost: 650000, status: 'Available' },
  { id: 'MH-14-EF-9012', name: 'Tata Prima 2830', type: 'Heavy Truck', region: 'Mumbai', capacity: 15000, odometer: 88900, acquisitionCost: 3200000, status: 'Available' },
  { id: 'MH-15-GH-3456', name: 'BharatBenz 1917R', type: 'Heavy Truck', region: 'Nagpur', capacity: 12000, odometer: 102100, acquisitionCost: 2800000, status: 'Available' },
  { id: 'GJ-01-JK-7890', name: 'Ashok Leyland 5525', type: 'Semi-Trailer', region: 'Ahmedabad', capacity: 35000, odometer: 145000, acquisitionCost: 4500000, status: 'Available' },
  { id: 'MH-12-LM-1122', name: 'Mahindra Zor Grand', type: 'Electric Van', region: 'Mumbai', capacity: 600, odometer: 8100, acquisitionCost: 420000, status: 'Available' },
  { id: 'MH-14-NP-3344', name: 'Tata Winger Cargo', type: 'Delivery Van', region: 'Mumbai', capacity: 1500, odometer: 52300, acquisitionCost: 1100000, status: 'Available' },
  { id: 'MH-12-QR-5566', name: 'Force Kargo King', type: 'Delivery Van', region: 'Nashik', capacity: 2000, odometer: 38500, acquisitionCost: 850000, status: 'Available' },
  { id: 'MH-15-ST-7788', name: 'Eicher Pro 2049', type: 'Delivery Van', region: 'Nagpur', capacity: 3500, odometer: 49500, acquisitionCost: 1200000, status: 'Available' },
  { id: 'GJ-01-UV-9900', name: 'Volvo FM 420', type: 'Semi-Trailer', region: 'Ahmedabad', capacity: 40000, odometer: 210000, acquisitionCost: 6500000, status: 'Retired' }
];

const INITIAL_DRIVERS: Driver[] = [
  { id: 'LIC-MH12-001', name: 'Alex Fernandes', category: 'Heavy', expiryDate: '2026-12-31', contact: '+91 98765 43210', safetyScore: 92, status: 'Available' },
  { id: 'LIC-MH12-002', name: 'Rohan Sharma', category: 'Medium', expiryDate: '2026-08-15', contact: '+91 98765 43211', safetyScore: 88, status: 'Available' },
  { id: 'LIC-MH14-003', name: 'Priyesh Kadam', category: 'Heavy', expiryDate: '2027-02-28', contact: '+91 98765 43212', safetyScore: 96, status: 'Available' },
  { id: 'LIC-MH15-004', name: 'Amit Patwardhan', category: 'Light', expiryDate: '2026-09-12', contact: '+91 98765 43213', safetyScore: 76, status: 'Available' },
  { id: 'LIC-GJ01-005', name: 'Sameer Patel', category: 'Heavy', expiryDate: '2026-11-05', contact: '+91 98765 43214', safetyScore: 85, status: 'Available' },
  { id: 'LIC-MH12-006', name: 'Vijay Patil', category: 'Medium', expiryDate: '2026-09-30', contact: '+91 98765 43215', safetyScore: 90, status: 'Available' },
  { id: 'LIC-MH14-007', name: 'Sandeep Thorat', category: 'Light', expiryDate: '2025-06-30', contact: '+91 98765 43216', safetyScore: 82, status: 'Available' }, // Expired!
  { id: 'LIC-MH15-008', name: 'Rajesh Gokhale', category: 'Heavy', expiryDate: '2026-10-01', contact: '+91 98765 43217', safetyScore: 64, status: 'Suspended' }
];

const INITIAL_TRIPS: Trip[] = [
  { id: 'TRP-101', source: 'Mumbai', destination: 'Pune', vehicleId: 'MH-12-AB-1234', driverId: 'LIC-MH12-001', cargoWeight: 4500, plannedDistance: 150, revenue: 35000, status: 'Completed' },
  { id: 'TRP-102', source: 'Pune', destination: 'Nashik', vehicleId: 'MH-12-CD-5678', driverId: 'LIC-MH12-002', cargoWeight: 800, plannedDistance: 210, revenue: 18000, status: 'Completed' },
  { id: 'TRP-103', source: 'Mumbai', destination: 'Ahmedabad', vehicleId: 'MH-14-EF-9012', driverId: 'LIC-MH14-003', cargoWeight: 12000, plannedDistance: 530, revenue: 95000, status: 'Completed' },
  { id: 'TRP-104', source: 'Nagpur', destination: 'Pune', vehicleId: 'MH-15-GH-3456', driverId: 'LIC-MH12-006', cargoWeight: 8000, plannedDistance: 710, revenue: 110000, status: 'Completed' },
  { id: 'TRP-105', source: 'Ahmedabad', destination: 'Mumbai', vehicleId: 'GJ-01-JK-7890', driverId: 'LIC-GJ01-005', cargoWeight: 30000, plannedDistance: 530, revenue: 180000, status: 'Completed' },
  { id: 'TRP-106', source: 'Mumbai', destination: 'Pune', vehicleId: 'MH-12-LM-1122', driverId: 'LIC-MH12-001', cargoWeight: 500, plannedDistance: 150, revenue: 15000, status: 'Completed' },
  { id: 'TRP-107', source: 'Pune', destination: 'Nashik', vehicleId: 'MH-12-QR-5566', driverId: 'LIC-MH12-002', cargoWeight: 1500, plannedDistance: 210, revenue: 20000, status: 'Completed' },
  { id: 'TRP-108', source: 'Nagpur', destination: 'Mumbai', vehicleId: 'MH-15-ST-7788', driverId: 'LIC-MH12-006', cargoWeight: 3000, plannedDistance: 820, revenue: 90000, status: 'Completed' },
  { id: 'TRP-109', source: 'Mumbai', destination: 'Nashik', vehicleId: 'MH-14-NP-3344', driverId: 'LIC-MH14-003', cargoWeight: 1200, plannedDistance: 170, revenue: 25000, status: 'Completed' },
  { id: 'TRP-110', source: 'Pune', destination: 'Nagpur', vehicleId: 'MH-12-AB-1234', driverId: 'LIC-MH12-001', cargoWeight: 6000, plannedDistance: 710, revenue: 105000, status: 'Completed' },
  { id: 'TRP-111', source: 'Mumbai', destination: 'Pune', vehicleId: 'MH-14-NP-3344', driverId: 'LIC-MH14-003', cargoWeight: 1000, plannedDistance: 150, revenue: 20000, status: 'Draft' },
  { id: 'TRP-112', source: 'Ahmedabad', destination: 'Pune', vehicleId: 'GJ-01-JK-7890', driverId: 'LIC-GJ01-005', cargoWeight: 22000, plannedDistance: 660, revenue: 160000, status: 'Draft' }
];

const INITIAL_FUEL_LOGS: FuelLog[] = [
  { id: 'FL-001', vehicleId: 'MH-12-AB-1234', liters: 45, cost: 4500, date: '2026-06-10', odometer: 48600 },
  { id: 'FL-002', vehicleId: 'MH-12-AB-1234', liters: 50, cost: 5000, date: '2026-06-18', odometer: 49100 },
  { id: 'FL-003', vehicleId: 'MH-12-CD-5678', liters: 25, cost: 2500, date: '2026-06-12', odometer: 12200 },
  { id: 'FL-004', vehicleId: 'MH-14-EF-9012', liters: 120, cost: 12000, date: '2026-06-15', odometer: 88400 },
  { id: 'FL-005', vehicleId: 'MH-15-GH-3456', liters: 180, cost: 18000, date: '2026-06-16', odometer: 101400 },
  { id: 'FL-006', vehicleId: 'GJ-01-JK-7890', liters: 220, cost: 22000, date: '2026-06-20', odometer: 144500 },
  { id: 'FL-007', vehicleId: 'MH-12-LM-1122', liters: 0, cost: 400, date: '2026-06-21', odometer: 8000 }, // EV Charging cost
  { id: 'FL-008', vehicleId: 'MH-14-NP-3344', liters: 35, cost: 3500, date: '2026-06-22', odometer: 52100 },
  { id: 'FL-009', vehicleId: 'MH-12-QR-5566', liters: 40, cost: 4000, date: '2026-06-24', odometer: 38300 },
  { id: 'FL-010', vehicleId: 'MH-15-ST-7788', liters: 70, cost: 7000, date: '2026-06-25', odometer: 49100 },
  { id: 'FL-011', vehicleId: 'MH-12-AB-1234', liters: 48, cost: 4800, date: '2026-07-02', odometer: 49200 },
  { id: 'FL-012', vehicleId: 'MH-12-CD-5678', liters: 28, cost: 2800, date: '2026-07-03', odometer: 12400 },
  { id: 'FL-013', vehicleId: 'MH-14-EF-9012', liters: 110, cost: 11000, date: '2026-07-04', odometer: 88900 },
  { id: 'FL-014', vehicleId: 'MH-15-GH-3456', liters: 170, cost: 17000, date: '2026-07-05', odometer: 102100 },
  { id: 'FL-015', vehicleId: 'GJ-01-JK-7890', liters: 215, cost: 21500, date: '2026-07-06', odometer: 145000 },
  { id: 'FL-016', vehicleId: 'MH-12-LM-1122', liters: 0, cost: 450, date: '2026-07-07', odometer: 8100 },
  { id: 'FL-017', vehicleId: 'MH-14-NP-3344', liters: 38, cost: 3800, date: '2026-07-08', odometer: 52300 },
  { id: 'FL-018', vehicleId: 'MH-12-QR-5566', liters: 42, cost: 4200, date: '2026-07-09', odometer: 38500 },
  { id: 'FL-019', vehicleId: 'MH-15-ST-7788', liters: 75, cost: 7500, date: '2026-07-10', odometer: 49500 },
  { id: 'FL-020', vehicleId: 'GJ-01-UV-9900', liters: 300, cost: 30000, date: '2026-06-01', odometer: 210000 }
];

const INITIAL_MAINTENANCE: MaintenanceLog[] = [
  { id: 'MNT-001', vehicleId: 'MH-12-AB-1234', issue: 'Engine Oil Change & Filter Renewal', priority: 'Medium', estimatedCost: 5000, actualCost: 5200, status: 'Resolved', logDate: '2026-05-10', resolveDate: '2026-05-12' },
  { id: 'MNT-002', vehicleId: 'MH-12-CD-5678', issue: 'Brake Pad Replacement & Bleeding', priority: 'High', estimatedCost: 3500, actualCost: 3300, status: 'Resolved', logDate: '2026-05-18', resolveDate: '2026-05-19' },
  { id: 'MNT-003', vehicleId: 'MH-14-EF-9012', issue: 'Clutch Plate Overhaul', priority: 'High', estimatedCost: 15000, actualCost: 16500, status: 'Resolved', logDate: '2026-05-25', resolveDate: '2026-05-28' },
  { id: 'MNT-004', vehicleId: 'MH-15-GH-3456', issue: 'Air Conditioner Refilling & Service', priority: 'Low', estimatedCost: 2500, actualCost: 2500, status: 'Resolved', logDate: '2026-06-02', resolveDate: '2026-06-03' },
  { id: 'MNT-005', vehicleId: 'GJ-01-JK-7890', issue: 'Tire Rotation & Wheel Alignment', priority: 'Medium', estimatedCost: 8000, actualCost: 7800, status: 'Resolved', logDate: '2026-06-12', resolveDate: '2026-06-13' },
  { id: 'MNT-006', vehicleId: 'MH-12-LM-1122', issue: 'Battery Coolant Leakage Rectification', priority: 'High', estimatedCost: 6000, actualCost: 5900, status: 'Resolved', logDate: '2026-06-28', resolveDate: '2026-06-29' },
  { id: 'MNT-007', vehicleId: 'MH-14-NP-3344', issue: 'Suspension Bushing Replacement', priority: 'Medium', estimatedCost: 4500, actualCost: 4500, status: 'Resolved', logDate: '2026-07-02', resolveDate: '2026-07-03' },
  { id: 'MNT-008', vehicleId: 'MH-12-QR-5566', issue: 'Alternator Belt Crack - Preventive', priority: 'Low', estimatedCost: 1800, actualCost: 1800, status: 'Resolved', logDate: '2026-07-08', resolveDate: '2026-07-09' }
];

const INITIAL_EXPENSES: Expense[] = [
  { id: 'EXP-001', vehicleId: 'MH-12-AB-1234', type: 'Toll', cost: 1200, date: '2026-06-10' },
  { id: 'EXP-002', vehicleId: 'MH-12-CD-5678', type: 'Toll', cost: 600, date: '2026-06-12' },
  { id: 'EXP-003', vehicleId: 'MH-14-EF-9012', type: 'Toll', cost: 4200, date: '2026-06-15' },
  { id: 'EXP-004', vehicleId: 'MH-15-GH-3456', type: 'Insurance', cost: 24000, date: '2026-06-01' },
  { id: 'EXP-005', vehicleId: 'GJ-01-JK-7890', type: 'Toll', cost: 6800, date: '2026-06-20' },
  { id: 'EXP-006', vehicleId: 'MH-12-LM-1122', type: 'Parking', cost: 500, date: '2026-06-21' },
  { id: 'EXP-007', vehicleId: 'MH-14-NP-3344', type: 'Toll', cost: 1100, date: '2026-06-22' },
  { id: 'EXP-008', vehicleId: 'MH-12-QR-5566', type: 'Toll', cost: 950, date: '2026-06-24' },
  { id: 'EXP-009', vehicleId: 'MH-15-ST-7788', type: 'Toll', cost: 2800, date: '2026-06-25' },
  { id: 'EXP-010', vehicleId: 'GJ-01-UV-9900', type: 'Insurance', cost: 35000, date: '2026-05-15' },
  { id: 'EXP-011', vehicleId: 'MH-12-AB-1234', type: 'Toll', cost: 1200, date: '2026-07-02' },
  { id: 'EXP-012', vehicleId: 'MH-12-CD-5678', type: 'Toll', cost: 600, date: '2026-07-03' },
  { id: 'EXP-013', vehicleId: 'MH-14-EF-9012', type: 'Toll', cost: 4200, date: '2026-07-04' },
  { id: 'EXP-014', vehicleId: 'MH-15-GH-3456', type: 'Toll', cost: 5400, date: '2026-07-05' },
  { id: 'EXP-015', vehicleId: 'GJ-01-JK-7890', type: 'Toll', cost: 6800, date: '2026-07-06' }
];

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  { id: 'NTF-1', type: 'Warning', message: '🔴 Driver Sandeep Thorat (LIC-MH14-007) license expired on 2025-06-30.', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
  { id: 'NTF-2', type: 'Warning', message: '🟠 Vehicle Eicher Pro 2049 (MH-15-ST-7788) is 500 km away from recommended service.', timestamp: new Date(Date.now() - 3600000 * 4).toISOString() },
  { id: 'NTF-3', type: 'Info', message: '🔵 System booted successfully with 10 vehicles, 8 drivers, and active routes.', timestamp: new Date(Date.now() - 3600000 * 8).toISOString() }
];

// Reserved Fleet Manager (admin) account — deliberately NOT reachable via public signup.
// Only the person who owns these credentials can access the Fleet Manager role.
const INITIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'ACC-ADMIN-001',
    name: 'Yash Patil',
    email: 'superadmin@transitops.internal',
    password: 'TransitOps#2026',
    role: 'Fleet Manager',
    status: 'Approved',
    requestedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
    decidedAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString()
  }
];

// ==========================================
// CONTEXT PROVIDER
// ==========================================

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load State from LocalStorage or initialize with defaults
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('transitops_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('transitops_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers, setDrivers] = useState<Driver[]>(() => {
    const saved = localStorage.getItem('transitops_drivers');
    return saved ? JSON.parse(saved) : INITIAL_DRIVERS;
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('transitops_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>(() => {
    const saved = localStorage.getItem('transitops_maintenance');
    return saved ? JSON.parse(saved) : INITIAL_MAINTENANCE;
  });

  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>(() => {
    const saved = localStorage.getItem('transitops_fuel');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_LOGS;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('transitops_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem('transitops_notifications');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [userAccounts, setUserAccounts] = useState<UserAccount[]>(() => {
    const saved = localStorage.getItem('transitops_accounts');
    return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
  });

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('transitops_user', currentUser ? JSON.stringify(currentUser) : '');
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('transitops_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('transitops_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('transitops_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('transitops_maintenance', JSON.stringify(maintenanceLogs));
  }, [maintenanceLogs]);

  useEffect(() => {
    localStorage.setItem('transitops_fuel', JSON.stringify(fuelLogs));
  }, [fuelLogs]);

  useEffect(() => {
    localStorage.setItem('transitops_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('transitops_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('transitops_accounts', JSON.stringify(userAccounts));
  }, [userAccounts]);

  // ==========================================
  // CROSS-TAB SYNC
  // Keeps state in sync across multiple open browser tabs/windows.
  // The 'storage' event only fires in OTHER tabs than the one that wrote
  // the change — exactly what we need so Fleet Manager's tab picks up a
  // Driver's signup happening in a different window, without a refresh.
  // ==========================================
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key || e.newValue === null) return;
      try {
        switch (e.key) {
          case 'transitops_accounts':
            setUserAccounts(JSON.parse(e.newValue));
            break;
          case 'transitops_notifications':
            setNotifications(JSON.parse(e.newValue));
            break;
          case 'transitops_vehicles':
            setVehicles(JSON.parse(e.newValue));
            break;
          case 'transitops_drivers':
            setDrivers(JSON.parse(e.newValue));
            break;
          case 'transitops_trips':
            setTrips(JSON.parse(e.newValue));
            break;
          case 'transitops_maintenance':
            setMaintenanceLogs(JSON.parse(e.newValue));
            break;
          case 'transitops_fuel':
            setFuelLogs(JSON.parse(e.newValue));
            break;
          case 'transitops_expenses':
            setExpenses(JSON.parse(e.newValue));
            break;
        }
      } catch {
        // Ignore malformed payloads from other tabs
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Trigger alert check on load
  useEffect(() => {
    checkPredictiveMaintenanceAlerts();
    checkLicenseExpiryAlerts();
    checkFleetUtilizationAlerts();
  }, []);

  // Helper to add system notifications
  const pushNotification = (type: AppNotification['type'], message: string) => {
    const newNotif: AppNotification = {
      id: `NTF-${Date.now()}`,
      type,
      message,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev.slice(0, 49)]); // Cap at 50 logs
  };

  // Check and create notifications for license expiries
  const checkLicenseExpiryAlerts = () => {
    const today = new Date();
    drivers.forEach(driver => {
      const expiry = new Date(driver.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        // Expired
        const msg = `🔴 Driver ${driver.name} (${driver.id}) license expired on ${driver.expiryDate}. Please suspend or update.`;
        if (!notifications.some(n => n.message.includes(driver.id) && n.message.includes('expired'))) {
          pushNotification('Error', msg);
        }
      } else if (diffDays <= 30) {
        // Expiring in 30 days
        const msg = `🟠 Driver ${driver.name} (${driver.id}) license expires in ${diffDays} days on ${driver.expiryDate}.`;
        if (!notifications.some(n => n.message.includes(driver.id) && n.message.includes('expires'))) {
          pushNotification('Warning', msg);
        }
      }
    });
  };

  // Check and create notifications for predictive maintenance
  const checkPredictiveMaintenanceAlerts = () => {
    vehicles.forEach(vehicle => {
      if (vehicle.status === 'Retired') return;
      const nextService = Math.ceil(vehicle.odometer / 10000) * 10000 || 10000;
      const remaining = nextService - vehicle.odometer;

      if (remaining <= 1000 && remaining >= 0) {
        const msg = `🟠 Vehicle ${vehicle.name} (${vehicle.id}) requires maintenance soon. Odo: ${vehicle.odometer.toLocaleString()} km. Service due: ${nextService.toLocaleString()} km (Remaining: ${remaining} km).`;
        if (!notifications.some(n => n.message.includes(vehicle.id) && n.message.includes('requires maintenance'))) {
          pushNotification('Warning', msg);
        }
      }
    });
  };

  // Fleet Utilization Alert
  const checkFleetUtilizationAlerts = () => {
    const activeVehiclesCount = vehicles.filter(v => v.status === 'On Trip').length;
    const totalV = vehicles.filter(v => v.status !== 'Retired').length;
    const utilization = totalV > 0 ? (activeVehiclesCount / totalV) * 100 : 0;
    
    if (utilization >= 90) {
      const msg = `🟠 Critical Alert: Fleet utilization is extremely high at ${utilization.toFixed(1)}%. Available reserves are depleted.`;
      if (!notifications.some(n => n.message.includes('Fleet utilization is extremely high'))) {
        pushNotification('Warning', msg);
      }
    }
  };

  // ==========================================
  // BUSINESS OPERATIONS & EVENT LIFECYCLES
  // ==========================================

  // =================================================================
  // EVENT: ACCESS REQUEST SUBMITTED (Sign Up)
  // =================================================================
  const registerAccount = (name: string, email: string, password: string, role: Exclude<User['role'], 'Fleet Manager'>) => {
    const normalizedEmail = email.trim().toLowerCase();
    const exists = userAccounts.some(a => a.email.toLowerCase() === normalizedEmail);
    if (exists) {
      return { success: false, message: 'An account with this email already exists.' };
    }

    const newAccount: UserAccount = {
      id: `ACC-${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role,
      status: 'Pending',
      requestedAt: new Date().toISOString()
    };

    setUserAccounts(prev => [...prev, newAccount]);
    pushNotification('Warning', `🟡 [ACCESS REQUEST] ${newAccount.name} (${role}) requested login access and is awaiting your approval.`);
    return { success: true, message: 'Account request submitted. Please wait for Fleet Manager approval before signing in.' };
  };

  const loginWithCredentials = (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const account = userAccounts.find(a => a.email.toLowerCase() === normalizedEmail);

    if (!account || account.password !== password) {
      return { success: false, message: 'Invalid email or password.' };
    }

    if (account.status === 'Pending') {
      return { success: false, message: 'Your access request is still pending Fleet Manager approval.' };
    }

    if (account.status === 'Rejected') {
      return { success: false, message: 'Your access request was denied by the Fleet Manager. Contact your administrator.' };
    }

    const userObj: User = { email: account.email, role: account.role, name: account.name };
    setCurrentUser(userObj);
    pushNotification('Info', `🔵 User ${userObj.name} logged in as ${account.role}.`);
    return { success: true, message: 'Login successful', role: account.role };
  };

  const logout = () => {
    if (currentUser) {
      pushNotification('Info', `🔵 User ${currentUser.name} logged out.`);
    }
    setCurrentUser(null);
  };

  // =================================================================
  // EVENTS: FLEET MANAGER APPROVAL DECISIONS
  // =================================================================
  const approveAccount = (id: string) => {
    const acc = userAccounts.find(a => a.id === id);
    if (!acc) return;
    setUserAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'Approved', decidedAt: new Date().toISOString() } : a));
    pushNotification('Success', `🟢 [ACCESS GRANTED] ${acc.name} (${acc.role}) can now log in to TransitOps.`);
  };

  const rejectAccount = (id: string) => {
    const acc = userAccounts.find(a => a.id === id);
    if (!acc) return;
    setUserAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected', decidedAt: new Date().toISOString() } : a));
    pushNotification('Warning', `🔴 [ACCESS DENIED] ${acc.name}'s (${acc.role}) request was declined.`);
  };

  const revokeAccount = (id: string) => {
    const acc = userAccounts.find(a => a.id === id);
    if (!acc) return;
    setUserAccounts(prev => prev.map(a => a.id === id ? { ...a, status: 'Rejected', decidedAt: new Date().toISOString() } : a));
    pushNotification('Warning', `🔴 [ACCESS REVOKED] ${acc.name}'s (${acc.role}) login access has been revoked.`);
  };

  const addVehicle = (vehicle: Vehicle) => {
    const exists = vehicles.some(v => v.id.toUpperCase() === vehicle.id.toUpperCase());
    if (exists) {
      return { success: false, message: `Registration number ${vehicle.id} already exists!` };
    }
    setVehicles(prev => [...prev, vehicle]);
    pushNotification('Success', `🟢 Registered new vehicle: ${vehicle.name} (${vehicle.id}) in ${vehicle.region} region.`);
    return { success: true, message: 'Vehicle added successfully' };
  };

  const updateVehicle = (updated: Vehicle) => {
    // Check duplication of plate (if they changed the ID, which shouldn't happen but let's check index)
    setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
    pushNotification('Info', `🔵 Updated vehicle registry for ${updated.name} (${updated.id}).`);
    return { success: true, message: 'Vehicle updated successfully' };
  };

  const deleteVehicle = (id: string) => {
    const v = vehicles.find(item => item.id === id);
    setVehicles(prev => prev.filter(item => item.id !== id));
    pushNotification('Warning', `🟠 Removed vehicle ${v?.name || id} from registry.`);
  };

  const addDriver = (driver: Driver) => {
    const exists = drivers.some(d => d.id.toUpperCase() === driver.id.toUpperCase());
    if (exists) {
      return { success: false, message: `License number ${driver.id} already registered!` };
    }
    setDrivers(prev => [...prev, driver]);
    pushNotification('Success', `🟢 Onboarded driver: ${driver.name} (${driver.id}) - safety score: ${driver.safetyScore}.`);
    return { success: true, message: 'Driver onboarded successfully' };
  };

  const updateDriver = (updated: Driver) => {
    setDrivers(prev => prev.map(d => d.id === updated.id ? updated : d));
    pushNotification('Info', `🔵 Updated profile for driver ${updated.name} (${updated.id}).`);
    
    // Recheck alerts
    setTimeout(() => {
      checkLicenseExpiryAlerts();
    }, 500);
    return { success: true, message: 'Driver details updated' };
  };

  const deleteDriver = (id: string) => {
    const d = drivers.find(item => item.id === id);
    setDrivers(prev => prev.filter(item => item.id !== id));
    pushNotification('Warning', `🟠 Removed driver ${d?.name || id} from roster.`);
  };

  const addTrip = (trip: Trip) => {
    setTrips(prev => [...prev, trip]);
    pushNotification('Info', `🔵 Trip ${trip.id} created as Draft from ${trip.source} to ${trip.destination}.`);
  };

  const updateTrip = (updated: Trip) => {
    setTrips(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  // =================================================================
  // EVENT: TRIP DISPATCHED
  // =================================================================
  const dispatchTrip = (id: string): { success: boolean; message: string } => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return { success: false, message: 'Trip not found' };

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    if (!vehicle || !driver) {
      return { success: false, message: 'Assigned Vehicle or Driver not found in database.' };
    }

    // Strict Business Rules
    if (vehicle.status !== 'Available') {
      return { success: false, message: `Vehicle ${vehicle.id} is currently ${vehicle.status} and cannot be dispatched.` };
    }
    if (driver.status !== 'Available') {
      return { success: false, message: `Driver ${driver.name} is currently ${driver.status} and cannot be dispatched.` };
    }

    // License expiry verification
    const today = new Date();
    const expiry = new Date(driver.expiryDate);
    if (expiry < today) {
      return { success: false, message: `Dispatch Blocked: Driver ${driver.name} has an expired license.` };
    }

    // Capacity verification
    if (trip.cargoWeight > vehicle.capacity) {
      return { success: false, message: `Dispatch Blocked: Cargo weight (${trip.cargoWeight} kg) exceeds vehicle maximum capacity (${vehicle.capacity} kg).` };
    }

    // Cascading updates
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'Dispatched' } : t));
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: 'On Trip' } : v));
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'On Trip' } : d));

    // Emit Dispatched Event Notification
    pushNotification('Success', `🟢 [EVENT: Trip Dispatched] Route ${trip.id} is live! Vehicle: ${vehicle.id}, Driver: ${driver.name}. Load: ${trip.cargoWeight}kg.`);
    
    // Spark Confetti for wow effect!
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 }
    });

    // Check high utilization limit
    setTimeout(() => {
      checkFleetUtilizationAlerts();
    }, 500);

    return { success: true, message: 'Trip dispatched successfully!' };
  };

  // =================================================================
  // EVENT: TRIP COMPLETED
  // =================================================================
  const completeTrip = (id: string, finalOdometer: number, fuelLiters?: number, fuelCost?: number): { success: boolean; message: string } => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return { success: false, message: 'Trip not found' };

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    if (!vehicle || !driver) {
      return { success: false, message: 'Assigned Vehicle or Driver not found.' };
    }

    if (finalOdometer < vehicle.odometer) {
      return { success: false, message: `Odometer Error: Final odometer reading (${finalOdometer} km) cannot be less than the current odometer reading (${vehicle.odometer} km).` };
    }

    // Update statuses
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'Completed' } : t));
    setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: 'Available', odometer: finalOdometer } : v));
    setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'Available' } : d));

    // Log Fuel if provided
    if (fuelLiters && fuelLiters > 0 && fuelCost && fuelCost > 0) {
      const newFuelLog: FuelLog = {
        id: `FL-${Date.now()}`,
        vehicleId: vehicle.id,
        liters: fuelLiters,
        cost: fuelCost,
        date: new Date().toISOString().split('T')[0],
        odometer: finalOdometer
      };
      setFuelLogs(prev => [...prev, newFuelLog]);
    }

    // Emit Completed Event Notification
    pushNotification('Success', `🟢 [EVENT: Trip Completed] Route ${trip.id} finished. Earnings: ₹${trip.revenue.toLocaleString()}. Vehicle Odometer updated to ${finalOdometer.toLocaleString()} km.`);

    // Check service alerts after odometer changes
    setTimeout(() => {
      checkPredictiveMaintenanceAlerts();
    }, 500);

    return { success: true, message: 'Trip completed successfully!' };
  };

  // =================================================================
  // EVENT: TRIP CANCELLED
  // =================================================================
  const cancelTrip = (id: string): { success: boolean; message: string } => {
    const trip = trips.find(t => t.id === id);
    if (!trip) return { success: false, message: 'Trip not found' };

    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    const driver = drivers.find(d => d.id === trip.driverId);

    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: 'Cancelled' } : t));

    // Reset statuses to Available if they were on trip
    if (vehicle && vehicle.status === 'On Trip' && trip.status === 'Dispatched') {
      setVehicles(prev => prev.map(v => v.id === vehicle.id ? { ...v, status: 'Available' } : v));
    }
    if (driver && driver.status === 'On Trip' && trip.status === 'Dispatched') {
      setDrivers(prev => prev.map(d => d.id === driver.id ? { ...d, status: 'Available' } : d));
    }

    // Emit Cancelled Event Notification
    pushNotification('Warning', `🔴 [EVENT: Trip Cancelled] Trip ${trip.id} from ${trip.source} to ${trip.destination} has been cancelled.`);
    return { success: true, message: 'Trip cancelled' };
  };

  // =================================================================
  // EVENT: MAINTENANCE LOGGED
  // =================================================================
  const addMaintenanceLog = (log: Omit<MaintenanceLog, 'id' | 'status' | 'logDate'>) => {
    const newLog: MaintenanceLog = {
      ...log,
      id: `MNT-${Date.now()}`,
      status: 'Open',
      logDate: new Date().toISOString().split('T')[0]
    };
    
    setMaintenanceLogs(prev => [newLog, ...prev]);
    
    // Automatically switch vehicle status to "In Shop"
    setVehicles(prev => prev.map(v => v.id === log.vehicleId ? { ...v, status: 'In Shop' } : v));

    // Emit event
    pushNotification('Error', `🔴 [EVENT: Maintenance Logged] Vehicle ${log.vehicleId} entered shop for '${log.issue}'. Estimated Cost: ₹${log.estimatedCost.toLocaleString()}.`);
  };

  // =================================================================
  // EVENT: MAINTENANCE RESOLVED
  // =================================================================
  const resolveMaintenanceLog = (id: string, actualCost: number) => {
    const log = maintenanceLogs.find(m => m.id === id);
    if (!log) return;

    setMaintenanceLogs(prev => prev.map(m => m.id === id ? {
      ...m,
      status: 'Resolved',
      actualCost,
      resolveDate: new Date().toISOString().split('T')[0]
    } : m));

    // Automatically switch vehicle back to "Available"
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
      setVehicles(prev => prev.map(v => v.id === log.vehicleId ? { ...v, status: 'Available' } : v));
    }

    // Log the maintenance cost as a generic operational expense
    const newExpense: Expense = {
      id: `EXP-${Date.now()}`,
      vehicleId: log.vehicleId,
      type: 'Maintenance',
      cost: actualCost,
      date: new Date().toISOString().split('T')[0]
    };
    setExpenses(prev => [...prev, newExpense]);

    // Emit Event
    pushNotification('Success', `🟢 [EVENT: Maintenance Resolved] Vehicle ${log.vehicleId} returned to service. Maintenance cost: ₹${actualCost.toLocaleString()}.`);
  };

  const addFuelLog = (log: Omit<FuelLog, 'id'>) => {
    const newLog: FuelLog = {
      ...log,
      id: `FL-${Date.now()}`
    };
    setFuelLogs(prev => [...prev, newLog]);
    
    // If odometer reading in fuel log is higher than vehicle's current odometer, update it
    const vehicle = vehicles.find(v => v.id === log.vehicleId);
    if (vehicle && log.odometer > vehicle.odometer) {
      setVehicles(prev => prev.map(v => v.id === log.vehicleId ? { ...v, odometer: log.odometer } : v));
    }

    pushNotification('Success', `🟢 [EVENT: Fuel Logged] Recorded ${log.liters} liters for ${log.vehicleId}. Cost: ₹${log.cost.toLocaleString()}.`);
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expense,
      id: `EXP-${Date.now()}`
    };
    setExpenses(prev => [...prev, newExpense]);
    pushNotification('Success', `🟢 [EVENT: Expense Logged] Added ${expense.type} expense of ₹${expense.cost.toLocaleString()} for vehicle ${expense.vehicleId}.`);
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // =================================================================
  // SMART DISPATCH ALGORITHMS
  // =================================================================

  const getSmartVehicleRecommendations = (cargoWeight: number, region: Vehicle['region']) => {
    // 1. Get available vehicles
    const available = vehicles.filter(v => v.status === 'Available');
    
    const rated = available.map(vehicle => {
      let score = 50; // Base score
      let reasons: string[] = [];

      // Capacity verification
      if (cargoWeight > vehicle.capacity) {
        return null; // Excluded entirely
      }

      // Check capacity sizing (we want appropriate vehicle size, not too huge but big enough)
      const ratio = cargoWeight / vehicle.capacity;
      if (ratio >= 0.7 && ratio <= 1.0) {
        score += 25;
        reasons.push(`Optimal capacity fit (${(ratio * 100).toFixed(0)}% payload)`);
      } else if (ratio < 0.3) {
        score -= 15;
        reasons.push('Vehicle is oversized for cargo weight (high cost)');
      } else {
        score += 10;
        reasons.push('Capacity is sufficient');
      }

      // Region check
      if (vehicle.region === region) {
        score += 30;
        reasons.push(`Located directly in target zone: ${region}`);
      } else {
        score -= 10;
        reasons.push(`Stationed in ${vehicle.region} (Requires positioning transit)`);
      }

      // Fuel efficiency proxy (based on average of fuel logs)
      const vehicleFuel = fuelLogs.filter(f => f.vehicleId === vehicle.id);
      const vehicleCompletedTrips = trips.filter(t => t.vehicleId === vehicle.id && t.status === 'Completed');
      
      let fuelEfficiencyVal = 10; // Default
      if (vehicle.type === 'Electric Van') {
        fuelEfficiencyVal = 25; // EV is highly cost efficient
        score += 20;
        reasons.push('Electric vehicle (lowest fuel operating cost)');
      } else if (vehicleFuel.length > 0 && vehicleCompletedTrips.length > 0) {
        const totalLiters = vehicleFuel.reduce((sum, item) => sum + item.liters, 0);
        // Estimate distance driven
        const totalDistance = vehicleCompletedTrips.reduce((sum, item) => sum + item.plannedDistance, 0);
        if (totalLiters > 0) {
          fuelEfficiencyVal = totalDistance / totalLiters;
          if (fuelEfficiencyVal > 15) {
            score += 15;
            reasons.push(`Excellent fuel efficiency history (${fuelEfficiencyVal.toFixed(1)} km/L)`);
          } else if (fuelEfficiencyVal < 8) {
            score -= 10;
            reasons.push(`High fuel consumption history (${fuelEfficiencyVal.toFixed(1)} km/L)`);
          } else {
            reasons.push(`Average fuel efficiency (${fuelEfficiencyVal.toFixed(1)} km/L)`);
          }
        }
      } else {
        // Fallback by vehicle type
        if (vehicle.type === 'Delivery Van') {
          score += 10;
          reasons.push('Good standard fuel efficiency (Van)');
        }
      }

      // Predictive maintenance deduction
      const nextService = Math.ceil(vehicle.odometer / 10000) * 10000 || 10000;
      const remaining = nextService - vehicle.odometer;
      if (remaining <= 1500) {
        score -= 20;
        reasons.push(`⚠️ Approaching service limit (Due in ${remaining} km)`);
      }

      return {
        vehicle,
        score: Math.max(0, Math.min(100, score)),
        reason: reasons.join(' • ')
      };
    });

    // Filter out nulls and sort by score descending
    return rated
      .filter((r): r is { vehicle: Vehicle; score: number; reason: string } => r !== null)
      .sort((a, b) => b.score - a.score);
  };

  const getSmartDriverRecommendations = () => {
    // 1. Get available drivers
    const available = drivers.filter(d => d.status === 'Available');

    // 2. Score them
    const rated = available.map(driver => {
      let score = 50; // Base score
      let reasons: string[] = [];

      // Check license expiry
      const today = new Date();
      const expiry = new Date(driver.expiryDate);
      const diffTime = expiry.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) {
        return null; // Expired, exclude
      }

      if (diffDays <= 15) {
        score -= 25;
        reasons.push('⚠️ License expires in less than 15 days');
      }

      // Safety Score bonus
      score += (driver.safetyScore - 80) * 1.5; // High score adds, low score subtracts
      reasons.push(`Safety Score: ${driver.safetyScore}%`);

      if (driver.safetyScore >= 90) {
        reasons.push('Elite rating (Top safety bracket)');
      }

      // Completed trips count as experience
      const driverTrips = trips.filter(t => t.driverId === driver.id && t.status === 'Completed').length;
      if (driverTrips > 5) {
        score += 15;
        reasons.push(`Highly experienced (${driverTrips} successful trips logged)`);
      } else if (driverTrips > 0) {
        score += 5;
        reasons.push(`Familiar with platform (${driverTrips} routes logged)`);
      } else {
        reasons.push('No recent trip history');
      }

      return {
        driver,
        score: Math.max(0, Math.min(100, score)),
        reason: reasons.join(' • ')
      };
    });

    return rated
      .filter((r): r is { driver: Driver; score: number; reason: string } => r !== null)
      .sort((a, b) => b.score - a.score);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      vehicles,
      drivers,
      trips,
      maintenanceLogs,
      fuelLogs,
      expenses,
      notifications,
      userAccounts,
      registerAccount,
      loginWithCredentials,
      approveAccount,
      rejectAccount,
      revokeAccount,
      logout,
      addVehicle,
      updateVehicle,
      deleteVehicle,
      addDriver,
      updateDriver,
      deleteDriver,
      addTrip,
      updateTrip,
      dispatchTrip,
      completeTrip,
      cancelTrip,
      addMaintenanceLog,
      resolveMaintenanceLog,
      addFuelLog,
      addExpense,
      clearNotifications,
      getSmartVehicleRecommendations,
      getSmartDriverRecommendations
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
