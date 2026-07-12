import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Vehicle } from '../context/AppContext';
import { Plus, Edit2, Trash2, Wrench, Search, MapPin } from 'lucide-react';

export const Vehicles: React.FC = () => {
  const { vehicles, addVehicle, updateVehicle, deleteVehicle, addMaintenanceLog } = useApp();

  // Tab state: 'registry' | 'predictive'
  const [activeTab, setActiveTab] = useState<'registry' | 'predictive'>('registry');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRegion, setFilterRegion] = useState('All');
  const [filterType, setFilterType] = useState('All');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<Vehicle | null>(null);

  // Form Fields
  const [regNo, setRegNo] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<Vehicle['type']>('Delivery Van');
  const [region, setRegion] = useState<Vehicle['region']>('Mumbai');
  const [capacity, setCapacity] = useState(1000);
  const [odometer, setOdometer] = useState(0);
  const [cost, setCost] = useState(500000);
  const [status, setStatus] = useState<Vehicle['status']>('Available');
  const [formError, setFormError] = useState('');

  // Handle adding
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim() || !name.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }
    const newVehicle: Vehicle = {
      id: regNo.trim().toUpperCase(),
      name: name.trim(),
      type,
      region,
      capacity: Number(capacity),
      odometer: Number(odometer),
      acquisitionCost: Number(cost),
      status: 'Available'
    };

    const res = addVehicle(newVehicle);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  // Open Edit Modal
  const handleEditClick = (vehicle: Vehicle) => {
    setCurrentVehicle(vehicle);
    setRegNo(vehicle.id);
    setName(vehicle.name);
    setType(vehicle.type);
    setRegion(vehicle.region);
    setCapacity(vehicle.capacity);
    setOdometer(vehicle.odometer);
    setCost(vehicle.acquisitionCost);
    setStatus(vehicle.status);
    setIsEditModalOpen(true);
  };

  // Handle editing
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentVehicle || !name.trim()) return;

    const updated: Vehicle = {
      ...currentVehicle,
      name: name.trim(),
      type,
      region,
      capacity: Number(capacity),
      odometer: Number(odometer),
      acquisitionCost: Number(cost),
      status
    };

    const res = updateVehicle(updated);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setIsEditModalOpen(false);
      resetForm();
    }
  };

  // Handle direct predictive maintenance dispatch
  const handleSendToMaintenance = (vehicle: Vehicle) => {
    addMaintenanceLog({
      vehicleId: vehicle.id,
      issue: 'Routine Check (Odometer Predictive Maintenance Flag)',
      priority: 'Medium',
      estimatedCost: 3500
    });
  };

  const resetForm = () => {
    setRegNo('');
    setName('');
    setType('Delivery Van');
    setRegion('Mumbai');
    setCapacity(1000);
    setOdometer(0);
    setCost(500000);
    setStatus('Available');
    setFormError('');
    setCurrentVehicle(null);
  };

  // Filters computed
  const filteredRegistry = vehicles.filter(v => {
    const matchSearch = v.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        v.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRegion = filterRegion === 'All' || v.region === filterRegion;
    const matchType = filterType === 'All' || v.type === filterType;
    return matchSearch && matchRegion && matchType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Vehicle Registry</h2>
          <p className="text-xs text-slate-500 mt-1">Manage and audit fleet assets, parameters, and service cycles.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('registry')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === 'registry' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            All Vehicles
          </button>
          <button
            onClick={() => setActiveTab('predictive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'predictive' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Predictive Service due
          </button>
        </div>
      </div>

      {activeTab === 'registry' ? (
        <>
          {/* Filters & Actions bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Registration / Model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Region */}
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="All">All Regions</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Pune">Pune</option>
                <option value="Nashik">Nashik</option>
                <option value="Nagpur">Nagpur</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>

              {/* Type */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-2 text-xs font-medium focus:outline-none"
              >
                <option value="All">All Types</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Semi-Trailer">Semi-Trailer</option>
                <option value="Electric Van">Electric Van</option>
              </select>
            </div>

            <button
              onClick={() => { resetForm(); setIsAddModalOpen(true); }}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add New Vehicle
            </button>
          </div>

          {/* Registry Table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full dense-table text-left border-collapse">
                <thead>
                  <tr>
                    <th>Registration No</th>
                    <th>Model Name</th>
                    <th>Type</th>
                    <th>Logistics Hub</th>
                    <th>Capacity</th>
                    <th>Odometer</th>
                    <th>Acquisition Cost</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {filteredRegistry.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                        No vehicles found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistry.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="font-semibold text-slate-900 dark:text-white font-mono">{v.id}</td>
                        <td className="font-medium">{v.name}</td>
                        <td>{v.type}</td>
                        <td>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            {v.region}
                          </span>
                        </td>
                        <td>{v.capacity.toLocaleString()} kg</td>
                        <td className="font-mono">{v.odometer.toLocaleString()} km</td>
                        <td>₹{v.acquisitionCost.toLocaleString()}</td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            v.status === 'Available' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            v.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                            v.status === 'In Shop' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                            'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {v.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(v)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Edit Registry"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteVehicle(v.id)}
                              className="p-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Delete Asset"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Predictive Maintenance Tab */
        <div className="flex flex-col gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-xl p-4 flex gap-3 items-start">
            <Wrench className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-wide block mb-1">How Predictive Maintenance Works</span>
              <p className="text-xs text-blue-700 dark:text-blue-300 leading-normal">
                TransitOps models recommend routine servicing every <strong>10,000 km</strong>. 
                Vehicles with remaining service distances below <strong>1,000 km</strong> are highlighted in orange (🟠) and should be routed to maintenance. 
                If the remaining distance is exceeded, they trigger a critical warning (🔴).
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full dense-table text-left border-collapse">
                <thead>
                  <tr>
                    <th>Vehicle Model</th>
                    <th>Registration No</th>
                    <th>Current Odometer</th>
                    <th>Service Due (Odo)</th>
                    <th>Remaining Odo</th>
                    <th>Priority State</th>
                    <th className="text-right">Logistics action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {vehicles
                    .filter(v => v.status !== 'Retired')
                    .map(v => {
                      const nextService = Math.ceil(v.odometer / 10000) * 10000 || 10000;
                      const remaining = nextService - v.odometer;
                      let priorityClass = 'text-emerald-600 dark:text-emerald-400 font-semibold';
                      let statusBadge = '🟢 Optimal';
                      
                      if (remaining <= 0) {
                        priorityClass = 'text-red-500 font-bold';
                        statusBadge = '🔴 Overdue';
                      } else if (remaining <= 1000) {
                        priorityClass = 'text-amber-500 font-semibold';
                        statusBadge = '🟠 Near Limit';
                      }

                      return (
                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="font-semibold text-slate-900 dark:text-white">{v.name}</td>
                          <td className="font-mono">{v.id}</td>
                          <td className="font-mono">{v.odometer.toLocaleString()} km</td>
                          <td className="font-mono">{nextService.toLocaleString()} km</td>
                          <td className={`font-mono ${priorityClass}`}>{remaining.toLocaleString()} km</td>
                          <td className="font-semibold text-xs">{statusBadge}</td>
                          <td className="text-right">
                            {v.status === 'In Shop' ? (
                              <span className="text-[10px] font-bold text-amber-500 uppercase">In Service Shop</span>
                            ) : v.status === 'On Trip' ? (
                              <span className="text-[10px] font-bold text-blue-500 uppercase">Active Route</span>
                            ) : (
                              <button
                                onClick={() => handleSendToMaintenance(v)}
                                className="bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-950/40 text-slate-700 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400 text-xs font-semibold px-2.5 py-1 rounded transition-colors"
                              >
                                Route to Shop
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS SECTION
         ========================================== */}

      {/* ADD VEHICLE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Register New Fleet Asset</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Registration No *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH12AB1234"
                    value={regNo}
                    onChange={(e) => { setRegNo(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tata Prima"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Semi-Trailer">Semi-Trailer</option>
                    <option value="Electric Van">Electric Van</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Logistics Hub</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Payload Capacity (kg)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Acquisition Cost (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Register Asset
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VEHICLE MODAL */}
      {isEditModalOpen && currentVehicle && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Modify Registry: {currentVehicle.id}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Registration No</label>
                  <input
                    type="text"
                    disabled
                    value={currentVehicle.id}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Vehicle Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Delivery Van">Delivery Van</option>
                    <option value="Heavy Truck">Heavy Truck</option>
                    <option value="Semi-Trailer">Semi-Trailer</option>
                    <option value="Electric Van">Electric Van</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Logistics Hub</label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Payload Capacity (kg)</label>
                  <input
                    type="number"
                    value={capacity}
                    onChange={(e) => setCapacity(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Odometer (km)</label>
                  <input
                    type="number"
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Acquisition Cost (₹)</label>
                  <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Asset Operational Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Save Registry Updates
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
