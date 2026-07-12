import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  Truck, Users, MapPin, 
  DollarSign, ArrowUpRight, ArrowDownRight, Activity, ShieldAlert
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { vehicles, drivers, trips, maintenanceLogs, fuelLogs, expenses, notifications } = useApp();

  // Filter States
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Filter Options
  const typeOptions = useMemo(() => {
    return ['All', ...Array.from(new Set(vehicles.map(v => v.type)))];
  }, [vehicles]);

  const regionOptions = useMemo(() => {
    return ['All', 'Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Ahmedabad'];
  }, []);

  const statusOptions = useMemo(() => {
    return ['All', 'Available', 'On Trip', 'In Shop', 'Retired'];
  }, []);

  // Filtered Assets
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchType = selectedType === 'All' || v.type === selectedType;
      const matchRegion = selectedRegion === 'All' || v.region === selectedRegion;
      const matchStatus = selectedStatus === 'All' || v.status === selectedStatus;
      return matchType && matchRegion && matchStatus;
    });
  }, [vehicles, selectedType, selectedRegion, selectedStatus]);

  // ==========================================
  // METRICS COMPUTATIONS
  // ==========================================

  const stats = useMemo(() => {
    const totalV = filteredVehicles.length;
    const activeV = filteredVehicles.filter(v => v.status === 'On Trip').length;
    const availableV = filteredVehicles.filter(v => v.status === 'Available').length;
    const maintenanceV = filteredVehicles.filter(v => v.status === 'In Shop').length;
    const retiredV = filteredVehicles.filter(v => v.status === 'Retired').length;
    
    // Utilization calculation (excluding retired vehicles)
    const activeFleet = totalV - retiredV;
    const utilization = activeFleet > 0 ? (activeV / activeFleet) * 100 : 0;

    // Drivers on duty
    const activeDrivers = drivers.filter(d => d.status === 'On Trip').length;
    const availableDrivers = drivers.filter(d => d.status === 'Available').length;

    // Trip states
    const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
    const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;

    // Financial calculations
    // Filter trips, fuel, expenses related to the filtered vehicles to make the dashboard cohesive
    const vehicleIds = new Set(filteredVehicles.map(v => v.id));
    
    const revenue = trips
      .filter(t => t.status === 'Completed' && vehicleIds.has(t.vehicleId))
      .reduce((sum, t) => sum + t.revenue, 0);

    const fuelCost = fuelLogs
      .filter(f => vehicleIds.has(f.vehicleId))
      .reduce((sum, f) => sum + f.cost, 0);

    const maintCost = maintenanceLogs
      .filter(m => m.status === 'Resolved' && vehicleIds.has(m.vehicleId))
      .reduce((sum, m) => sum + (m.actualCost || 0), 0);

    const miscCost = expenses
      .filter(e => e.type !== 'Maintenance' && vehicleIds.has(e.vehicleId)) // exclude maintenance to avoid double counting
      .reduce((sum, e) => sum + e.cost, 0);

    const totalExpenses = fuelCost + maintCost + miscCost;
    const netProfit = revenue - totalExpenses;

    return {
      totalV,
      activeV,
      availableV,
      maintenanceV,
      utilization,
      activeDrivers,
      availableDrivers,
      activeTripsCount,
      pendingTripsCount,
      revenue,
      totalExpenses,
      netProfit,
      fuelCost,
      maintCost,
      miscCost
    };
  }, [filteredVehicles, drivers, trips, fuelLogs, maintenanceLogs, expenses]);

  // ==========================================
  // CHART DATA COMPILATION
  // ==========================================

  // 1. Fleet Status Distribution
  const fleetPieData = useMemo(() => {
    return [
      { name: 'Available', value: stats.availableV, color: '#10b981' },
      { name: 'On Trip', value: stats.activeV, color: '#2563eb' },
      { name: 'In Shop', value: stats.maintenanceV, color: '#f59e0b' },
      { name: 'Retired', value: vehicles.filter(v => v.status === 'Retired' && (selectedType === 'All' || v.type === selectedType) && (selectedRegion === 'All' || v.region === selectedRegion)).length, color: '#64748b' }
    ].filter(item => item.value > 0);
  }, [stats, vehicles, selectedType, selectedRegion]);

  // 2. Region-wise Revenue vs Expenses
  const regionBarData = useMemo(() => {
    const regions: ('Mumbai' | 'Pune' | 'Nashik' | 'Nagpur' | 'Ahmedabad')[] = ['Mumbai', 'Pune', 'Nashik', 'Nagpur', 'Ahmedabad'];
    return regions.map(reg => {
      // Find vehicles in this region that match selected type
      const regV = vehicles.filter(v => v.region === reg && (selectedType === 'All' || v.type === selectedType));
      const vIds = new Set(regV.map(v => v.id));

      const regRev = trips
        .filter(t => t.status === 'Completed' && vIds.has(t.vehicleId))
        .reduce((sum, t) => sum + t.revenue, 0);

      const regFuel = fuelLogs
        .filter(f => vIds.has(f.vehicleId))
        .reduce((sum, f) => sum + f.cost, 0);

      const regMaint = maintenanceLogs
        .filter(m => m.status === 'Resolved' && vIds.has(m.vehicleId))
        .reduce((sum, m) => sum + (m.actualCost || 0), 0);

      const regMisc = expenses
        .filter(e => e.type !== 'Maintenance' && vIds.has(e.vehicleId))
        .reduce((sum, e) => sum + e.cost, 0);

      return {
        name: reg,
        Revenue: regRev,
        Expenses: regFuel + regMaint + regMisc
      };
    });
  }, [vehicles, trips, fuelLogs, maintenanceLogs, expenses, selectedType]);

  // 3. Vehicle ROI Leaderboard (Top 5)
  const vehicleRoiData = useMemo(() => {
    const data = filteredVehicles
      .filter(v => v.status !== 'Retired')
      .map(v => {
        const rev = trips
          .filter(t => t.status === 'Completed' && t.vehicleId === v.id)
          .reduce((sum, t) => sum + t.revenue, 0);

        const fuel = fuelLogs
          .filter(f => f.vehicleId === v.id)
          .reduce((sum, f) => sum + f.cost, 0);

        const maint = maintenanceLogs
          .filter(m => m.status === 'Resolved' && m.vehicleId === v.id)
          .reduce((sum, m) => sum + (m.actualCost || 0), 0);

        const misc = expenses
          .filter(e => e.vehicleId === v.id && e.type !== 'Maintenance')
          .reduce((sum, e) => sum + e.cost, 0);

        const cost = fuel + maint + misc;
        const profit = rev - cost;
        const roi = v.acquisitionCost > 0 ? (profit / v.acquisitionCost) * 100 : 0;

        return {
          id: v.id,
          name: v.name,
          ROI: parseFloat(roi.toFixed(1)),
          Profit: profit
        };
      });

    // Sort by ROI descending, take top 5
    return data.sort((a, b) => b.ROI - a.ROI).slice(0, 5);
  }, [filteredVehicles, trips, fuelLogs, maintenanceLogs, expenses]);

  // 4. Fuel Cost Trend over last 7 log dates
  const fuelTrendData = useMemo(() => {
    // Take all fuel logs matching filtered vehicles, sort by date
    const vehicleIds = new Set(filteredVehicles.map(v => v.id));
    const sortedLogs = [...fuelLogs]
      .filter(f => vehicleIds.has(f.vehicleId))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Group by date
    const grouped: Record<string, { liters: number; cost: number }> = {};
    sortedLogs.forEach(log => {
      if (!grouped[log.date]) {
        grouped[log.date] = { liters: 0, cost: 0 };
      }
      grouped[log.date].liters += log.liters;
      grouped[log.date].cost += log.cost;
    });

    return Object.keys(grouped).map(date => ({
      date: date.substring(5), // MM-DD format
      Liters: parseFloat(grouped[date].liters.toFixed(0)),
      Cost: grouped[date].cost
    })).slice(-7); // last 7 days
  }, [fuelLogs, filteredVehicles]);



  // Warning Alerts in system
  const warnings = notifications.filter(n => n.type === 'Error' || n.type === 'Warning').slice(0, 3);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Top Section / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Operations Command</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time status metrics, logistical zones, and expense ROI tracking.</p>
        </div>

        {/* Global Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Region Zone</label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              {regionOptions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vehicle Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              {typeOptions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vehicle Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
            >
              {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Warnings Banner */}
      {warnings.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 items-start">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide block mb-1">Active Compliance Alerts</span>
            <div className="flex flex-col gap-1.5">
              {warnings.map(w => (
                <p key={w.id} className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                  {w.message}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Fleet Utilization */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-blue-600 dark:text-blue-400">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet Utilization</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.utilization.toFixed(1)}%</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.activeV} of {stats.totalV} active</span>
          </div>
        </div>

        {/* Vehicles */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Active / Total Assets</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.activeV} / {stats.totalV}</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.availableV} Available • {stats.maintenanceV} In Shop</span>
          </div>
        </div>

        {/* Drivers */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Drivers On Duty</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.activeDrivers}</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.availableDrivers} Off Duty / Available</span>
          </div>
        </div>

        {/* Trips */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex items-center gap-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">
            <MapPin className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dispatched Trips</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.activeTripsCount}</h3>
            <span className="text-[10px] text-slate-500 block mt-0.5">{stats.pendingTripsCount} Drafted / Pending</span>
          </div>
        </div>
      </div>

      {/* Financials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gross Revenue</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{stats.revenue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Earned from completed deliveries.</p>
        </div>

        {/* Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Expenses</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{stats.totalExpenses.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-lg">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
            <span>Fuel: ₹{stats.fuelCost.toLocaleString()}</span>
            <span>•</span>
            <span>Maint: ₹{stats.maintCost.toLocaleString()}</span>
            <span>•</span>
            <span>Misc: ₹{stats.miscCost.toLocaleString()}</span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Net Operating Profit</span>
              <h3 className={`text-2xl font-bold mt-1 ${stats.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                ₹{stats.netProfit.toLocaleString()}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${stats.netProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Net operating margin: {stats.revenue > 0 ? ((stats.netProfit / stats.revenue) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Region Financials Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-4">Financials by Logistics Hub</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionBarData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} tickFormatter={(val) => `₹${val / 1000}k`} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Revenue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Vehicle ROI Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-4">Top 5 Performing Vehicles (ROI Leaderboard)</span>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={vehicleRoiData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.1} />
                <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val}%`} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={120} tickLine={false} />
                <Tooltip formatter={(value, _name, props) => [`${value}%`, `ROI (Profit: ₹${props.payload.Profit.toLocaleString()})`]} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend iconType="circle" />
                <Bar dataKey="ROI" fill="#10b981" radius={[0, 4, 4, 0]} label={{ position: 'right', formatter: (v: any) => `${v}%`, fill: '#64748b', fontSize: 10 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel Trend Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block mb-4">Fuel Consumption History & Cost Trend</span>
          <div className="h-80 w-full">
            {fuelTrendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No recent fuel logs recorded.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={fuelTrendData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis yAxisId="left" stroke="#3b82f6" fontSize={12} label={{ value: 'Liters', angle: -90, position: 'insideLeft', fill: '#3b82f6' }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" fontSize={12} label={{ value: 'Cost (₹)', angle: 90, position: 'insideRight', fill: '#ef4444' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                  <Legend iconType="circle" />
                  <Line yAxisId="left" type="monotone" dataKey="Liters" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  <Line yAxisId="right" type="monotone" dataKey="Cost" stroke="#ef4444" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Vehicle Status Distribution (Doughnut) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Fleet Status and Dispatches</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around h-80">
            {fleetPieData.length === 0 ? (
              <div className="text-slate-400 text-sm">No vehicles match filters.</div>
            ) : (
              <>
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={fleetPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {fleetPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} Assets`} contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels */}
                <div className="flex flex-col gap-2 shrink-0">
                  {fleetPieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        {item.name}: <strong className="text-slate-900 dark:text-white">{item.value}</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
