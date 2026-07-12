import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Trip } from '../context/AppContext';
import { 
  Plus, Play, CheckCircle, XCircle, ArrowRight, 
  MapPin, Sparkles, User, Truck, Info, Fuel
} from 'lucide-react';

export const Trips: React.FC = () => {
  const { 
    trips, vehicles, drivers, 
    addTrip, dispatchTrip, completeTrip, cancelTrip,
    getSmartVehicleRecommendations, getSmartDriverRecommendations,
    currentUser
  } = useApp();

  // Modal controls
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);

  // Form Fields (Create Trip)
  const [source, setSource] = useState<'Mumbai' | 'Pune' | 'Nashik' | 'Nagpur' | 'Ahmedabad'>('Mumbai');
  const [destination, setDestination] = useState<'Mumbai' | 'Pune' | 'Nashik' | 'Nagpur' | 'Ahmedabad'>('Pune');
  const [cargoWeight, setCargoWeight] = useState(1500);
  const [plannedDistance, setPlannedDistance] = useState(150);
  const [revenue, setRevenue] = useState(25000);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [createError, setCreateError] = useState('');

  // Form Fields (Complete Trip)
  const [finalOdometer, setFinalOdometer] = useState(0);
  const [fuelLiters, setFuelLiters] = useState<number | undefined>(undefined);
  const [fuelCost, setFuelCost] = useState<number | undefined>(undefined);
  const [completeError, setCompleteError] = useState('');

  // Smart suggestions derived state
  const recommendedVehicles = useMemo(() => {
    if (!cargoWeight) return [];
    // We pass cargo weight and source zone to find local vehicles first
    return getSmartVehicleRecommendations(cargoWeight, source);
  }, [cargoWeight, source, vehicles]);

  const recommendedDrivers = useMemo(() => {
    return getSmartDriverRecommendations();
  }, [drivers]);

  // Open creation modal
  const handleOpenCreateModal = () => {
    setSource('Mumbai');
    setDestination('Pune');
    setCargoWeight(1500);
    setPlannedDistance(150);
    setRevenue(25000);
    setCreateError('');

    // Pre-select first recommended vehicle and driver
    const recV = getSmartVehicleRecommendations(1500, 'Mumbai');
    const recD = getSmartDriverRecommendations();
    
    setVehicleId(recV[0]?.vehicle.id || '');
    setDriverId(recD[0]?.driver.id || '');
    
    setIsCreateModalOpen(true);
  };

  // Trigger trip creation
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverId) {
      setCreateError('Please assign a vehicle and driver.');
      return;
    }
    if (source === destination) {
      setCreateError('Source and Destination cannot be the same zone.');
      return;
    }

    const newTrip: Trip = {
      id: `TRP-${100 + trips.length + 1}`,
      source,
      destination,
      vehicleId,
      driverId,
      cargoWeight: Number(cargoWeight),
      plannedDistance: Number(plannedDistance),
      revenue: Number(revenue),
      status: 'Draft'
    };

    addTrip(newTrip);
    setIsCreateModalOpen(false);
  };

  // Trigger dispatch event
  const handleDispatch = (id: string) => {
    const res = dispatchTrip(id);
    if (!res.success) {
      alert(res.message); // Nice simple prompt alert for validation block
    }
  };

  // Open completion form
  const handleOpenCompleteModal = (trip: Trip) => {
    const v = vehicles.find(item => item.id === trip.vehicleId);
    setActiveTripId(trip.id);
    setFinalOdometer(v ? v.odometer + trip.plannedDistance : 0);
    setFuelLiters(undefined);
    setFuelCost(undefined);
    setCompleteError('');
    setIsCompleteModalOpen(true);
  };

  // Trigger completion event
  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTripId) return;

    const res = completeTrip(activeTripId, finalOdometer, fuelLiters, fuelCost);
    if (!res.success) {
      setCompleteError(res.message);
    } else {
      setIsCompleteModalOpen(false);
      setActiveTripId(null);
    }
  };

  // Filter trips for roles (Driver role only sees their own assigned trips)
  const isDriverRole = currentUser?.role === 'Driver';
  const driverIdMap = isDriverRole ? drivers.find(d => d.name.includes('Alex'))?.id : null;

  const visibleTrips = useMemo(() => {
    if (isDriverRole && driverIdMap) {
      return trips.filter(t => t.driverId === driverIdMap);
    }
    return trips;
  }, [trips, isDriverRole, driverIdMap]);

  // Group trips by Kanban columns
  const kanban = useMemo(() => {
    return {
      Draft: visibleTrips.filter(t => t.status === 'Draft'),
      Dispatched: visibleTrips.filter(t => t.status === 'Dispatched'),
      Completed: visibleTrips.filter(t => t.status === 'Completed'),
      Cancelled: visibleTrips.filter(t => t.status === 'Cancelled')
    };
  }, [visibleTrips]);

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Trips & Dispatches</h2>
          <p className="text-xs text-slate-500 mt-1">
            {isDriverRole ? 'View and update your active deliveries.' : 'Route and dispatch vehicle cargo shipments.'}
          </p>
        </div>

        {!isDriverRole && (
          <button
            onClick={handleOpenCreateModal}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Schedule Delivery Route
          </button>
        )}
      </div>

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 items-start">
        
        {/* DRAFT COLUMN */}
        <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Draft Schedules</span>
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-full">{kanban.Draft.length}</span>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px]">
            {kanban.Draft.length === 0 ? (
              <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No draft routes scheduled.
              </div>
            ) : (
              kanban.Draft.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{t.id}</span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded">Draft</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{t.source}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0 mx-1" />
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{t.destination}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>Vehicle: <strong className="text-slate-700 dark:text-slate-350">{t.vehicleId}</strong></span>
                    <span>Driver: <strong className="text-slate-700 dark:text-slate-350">{drivers.find(d => d.id === t.driverId)?.name}</strong></span>
                    <span>Cargo Weight: <strong className="text-slate-700 dark:text-slate-350">{t.cargoWeight} kg</strong></span>
                    <span>Revenue: <strong className="text-slate-700 dark:text-slate-350">₹{t.revenue.toLocaleString()}</strong></span>
                  </div>

                  {!isDriverRole && (
                    <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                      <button
                        onClick={() => handleDispatch(t.id)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                      >
                        <Play className="h-3 w-3 fill-white" />
                        Dispatch
                      </button>
                      <button
                        onClick={() => cancelTrip(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-800"
                        title="Cancel Route"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* DISPATCHED COLUMN */}
        <div className="bg-blue-50/20 dark:bg-blue-950/5 border border-blue-100 dark:border-blue-900/20 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Dispatched (Active)</span>
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/40 text-[10px] font-bold text-blue-600 dark:text-blue-400 rounded-full">{kanban.Dispatched.length}</span>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px]">
            {kanban.Dispatched.length === 0 ? (
              <div className="text-center py-12 text-blue-400 dark:text-blue-500 text-xs border-2 border-dashed border-blue-200 dark:border-blue-900/10 rounded-lg">
                No active routes on-trip.
              </div>
            ) : (
              kanban.Dispatched.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{t.id}</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded uppercase tracking-wide">On Trip</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{t.source}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 shrink-0 mx-1" />
                    <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-400" />{t.destination}</span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-col gap-1 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>Vehicle: <strong className="text-slate-700 dark:text-slate-350 font-mono">{t.vehicleId}</strong></span>
                    <span>Driver: <strong className="text-slate-700 dark:text-slate-350">{drivers.find(d => d.id === t.driverId)?.name}</strong></span>
                    <span>Load: <strong className="text-slate-700 dark:text-slate-350">{t.cargoWeight} kg</strong></span>
                    <span>Distance: <strong className="text-slate-700 dark:text-slate-350">{t.plannedDistance} km</strong></span>
                  </div>

                  <div className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <button
                      onClick={() => handleOpenCompleteModal(t)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded py-1.5 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Complete Route
                    </button>
                    {!isDriverRole && (
                      <button
                        onClick={() => cancelTrip(t.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded border border-slate-200 dark:border-slate-800"
                        title="Cancel Route"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COMPLETED COLUMN */}
        <div className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Completed</span>
            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/40 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 rounded-full">{kanban.Completed.length}</span>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px]">
            {kanban.Completed.length === 0 ? (
              <div className="text-center py-12 text-emerald-450 dark:text-emerald-550 text-xs border-2 border-dashed border-emerald-200 dark:border-emerald-900/10 rounded-lg">
                No completed shipments.
              </div>
            ) : (
              kanban.Completed.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{t.id}</span>
                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded tracking-wide uppercase">Delivered</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{t.source}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 mx-1" />
                    <span>{t.destination}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 flex flex-col gap-0.5 border-t border-slate-100 dark:border-slate-800 pt-2">
                    <span>Vehicle: <span className="font-mono">{t.vehicleId}</span></span>
                    <span>Revenue: <strong className="text-slate-800 dark:text-slate-300">₹{t.revenue.toLocaleString()}</strong></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CANCELLED COLUMN */}
        <div className="bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cancelled</span>
            <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-850 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-full">{kanban.Cancelled.length}</span>
          </div>

          <div className="flex flex-col gap-3 min-h-[300px]">
            {kanban.Cancelled.length === 0 ? (
              <div className="text-center py-12 text-slate-450 dark:text-slate-500 text-xs border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No cancelled routes.
              </div>
            ) : (
              kanban.Cancelled.map(t => (
                <div key={t.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm opacity-60 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-400 font-mono">{t.id}</span>
                    <span className="text-[9px] font-bold text-red-650 bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded tracking-wide uppercase">Cancelled</span>
                  </div>

                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-white">
                    <span>{t.source}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400 mx-1" />
                    <span>{t.destination}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ==========================================
          MODALS SECTION
         ========================================== */}

      {/* CREATE TRIP MODAL (WITH SMART RECOMMENDATIONS) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-xl overflow-hidden flex flex-col md:flex-row h-[90vh] max-h-[700px]">
            
            {/* Left Side: Scheduling Form */}
            <div className="flex-1 p-6 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">Schedule Shipment Route</h3>
                <p className="text-xs text-slate-500 mt-1">Specify load weight and select assets to compute routing availability.</p>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs text-red-600 dark:text-red-400 font-semibold">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Source Zone</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Nagpur">Nagpur</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Destination Zone</label>
                    <select
                      value={destination}
                      onChange={(e) => setDestination(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    >
                      <option value="Mumbai">Mumbai</option>
                      <option value="Pune">Pune</option>
                      <option value="Nashik">Nashik</option>
                      <option value="Nagpur">Nagpur</option>
                      <option value="Ahmedabad">Ahmedabad</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Cargo Weight (kg)</label>
                    <input
                      type="number"
                      required
                      value={cargoWeight}
                      onChange={(e) => setCargoWeight(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Distance (km)</label>
                    <input
                      type="number"
                      required
                      value={plannedDistance}
                      onChange={(e) => setPlannedDistance(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Revenue fare (₹)</label>
                    <input
                      type="number"
                      required
                      value={revenue}
                      onChange={(e) => setRevenue(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assign Fleet Vehicle *</label>
                  <select
                    value={vehicleId}
                    required
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold"
                  >
                    <option value="">Select a Vehicle</option>
                    {vehicles
                      .filter(v => v.status === 'Available')
                      .map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.id}) - Cap: {v.capacity}kg | Zone: {v.region}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assign Driver *</label>
                  <select
                    value={driverId}
                    required
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-2 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="">Select a Driver</option>
                    {drivers
                      .filter(d => d.status === 'Available')
                      .map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id}) - Safety: {d.safetyScore}% | Exp: {d.expiryDate}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex gap-2.5 mt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-bold text-xs transition-colors"
                  >
                    Schedule Draft Route
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-350 rounded-lg px-4 py-2.5 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>

            {/* Right Side: Smart Recommendation Advisor Sidebar */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-900/60 p-6 overflow-y-auto flex flex-col gap-5">
              <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Sparkles className="h-5 w-5 text-blue-500" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Smart Dispatch Advisor</h4>
              </div>

              {/* Recommended Vehicles */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Recommended Vehicles</span>
                <div className="flex flex-col gap-2">
                  {recommendedVehicles.length === 0 ? (
                    <div className="text-[11px] text-slate-450 dark:text-slate-500 italic p-3 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                      No vehicles matching criteria (e.g. payload exceeded).
                    </div>
                  ) : (
                    recommendedVehicles.map(rec => (
                      <button
                        type="button"
                        key={rec.vehicle.id}
                        onClick={() => setVehicleId(rec.vehicle.id)}
                        className={`p-3 border text-left rounded-lg flex flex-col gap-1.5 transition-all w-full bg-white dark:bg-slate-900 ${
                          vehicleId === rec.vehicle.id 
                            ? 'border-blue-500 ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-850 hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5 text-blue-500" />
                            {rec.vehicle.name}
                          </span>
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            {rec.score} pts
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-mono font-semibold">{rec.vehicle.id} • Max: {rec.vehicle.capacity}kg</span>
                        <div className="text-[9px] text-slate-500 leading-normal flex items-start gap-1">
                          <Info className="h-2.5 w-2.5 shrink-0 mt-0.5 text-slate-400" />
                          <span>{rec.reason}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Recommended Drivers */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">Recommended Drivers</span>
                <div className="flex flex-col gap-2">
                  {recommendedDrivers.length === 0 ? (
                    <div className="text-[11px] text-slate-450 dark:text-slate-500 italic p-3 border border-slate-200 dark:border-slate-800 rounded bg-white dark:bg-slate-900">
                      No available compliant drivers.
                    </div>
                  ) : (
                    recommendedDrivers.slice(0, 3).map(rec => (
                      <button
                        type="button"
                        key={rec.driver.id}
                        onClick={() => setDriverId(rec.driver.id)}
                        className={`p-3 border text-left rounded-lg flex flex-col gap-1.5 transition-all w-full bg-white dark:bg-slate-900 ${
                          driverId === rec.driver.id 
                            ? 'border-blue-500 ring-1 ring-blue-500' 
                            : 'border-slate-200 dark:border-slate-850 hover:border-slate-400 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                            <User className="h-3.5 w-3.5 text-blue-500" />
                            {rec.driver.name}
                          </span>
                          <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                            {rec.score} pts
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 leading-normal flex items-start gap-1">
                          <Info className="h-2.5 w-2.5 shrink-0 mt-0.5 text-slate-400" />
                          <span>{rec.reason}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* COMPLETE TRIP MODAL */}
      {isCompleteModalOpen && activeTripId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Complete Trip Shipment</h3>
              <button onClick={() => { setIsCompleteModalOpen(false); setActiveTripId(null); }} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 flex flex-col gap-4">
              {completeError && (
                <div className="text-xs text-red-500 font-semibold">{completeError}</div>
              )}

              <div className="bg-slate-55 dark:bg-slate-850 p-3.5 border border-slate-200 dark:border-slate-800 rounded-lg flex flex-col gap-1 text-xs text-slate-500">
                <span>Trip ID: <strong className="text-slate-700 dark:text-slate-350">{activeTripId}</strong></span>
                <span>Assigned Vehicle: <strong className="text-slate-700 dark:text-slate-350 font-mono">
                  {trips.find(t => t.id === activeTripId)?.vehicleId}
                </strong></span>
                <span>Current Odometer: <strong className="text-slate-700 dark:text-slate-350 font-mono">
                  {vehicles.find(v => v.id === trips.find(t => t.id === activeTripId)?.vehicleId)?.odometer.toLocaleString()} km
                </strong></span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Final Odometer Reading (km) *</label>
                <input
                  type="number"
                  required
                  value={finalOdometer}
                  onChange={(e) => { setFinalOdometer(Number(e.target.value)); setCompleteError(''); }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              {/* Linked Fuel Logging Subform */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2 flex items-center gap-1">
                  <Fuel className="h-3.5 w-3.5 text-blue-500" />
                  Log Fuel Consumed (Optional)
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-semibold text-slate-400 block mb-0.5">Liters Consumed</label>
                    <input
                      type="number"
                      placeholder="e.g. 45"
                      value={fuelLiters || ''}
                      onChange={(e) => setFuelLiters(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-semibold text-slate-400 block mb-0.5">Total Fuel Cost (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4500"
                      value={fuelCost || ''}
                      onChange={(e) => setFuelCost(e.target.value ? Number(e.target.value) : undefined)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Log Completion & Update Stats
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
