import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Driver } from '../context/AppContext';
import { Plus, Edit2, Trash2, ShieldAlert, Award, Star, Search, CheckCircle } from 'lucide-react';

export const Drivers: React.FC = () => {
  const { drivers, trips, addDriver, updateDriver, deleteDriver } = useApp();

  // Search & filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modal control
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentDriver, setCurrentDriver] = useState<Driver | null>(null);

  // Form Fields
  const [licNo, setLicNo] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Driver['category']>('Medium');
  const [expiryDate, setExpiryDate] = useState('2026-12-31');
  const [contact, setContact] = useState('');
  const [safetyScore, setSafetyScore] = useState(85);
  const [status, setStatus] = useState<Driver['status']>('Available');
  const [formError, setFormError] = useState('');

  // Handle addition
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!licNo.trim() || !name.trim() || !contact.trim()) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const newDriver: Driver = {
      id: licNo.trim().toUpperCase(),
      name: name.trim(),
      category,
      expiryDate,
      contact: contact.trim(),
      safetyScore: Number(safetyScore),
      status: 'Available'
    };

    const res = addDriver(newDriver);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setIsAddModalOpen(false);
      resetForm();
    }
  };

  // Open Edit Modal
  const handleEditClick = (driver: Driver) => {
    setCurrentDriver(driver);
    setLicNo(driver.id);
    setName(driver.name);
    setCategory(driver.category);
    setExpiryDate(driver.expiryDate);
    setContact(driver.contact);
    setSafetyScore(driver.safetyScore);
    setStatus(driver.status);
    setIsEditModalOpen(true);
  };

  // Handle Editing
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDriver || !name.trim()) return;

    const updated: Driver = {
      ...currentDriver,
      name: name.trim(),
      category,
      expiryDate,
      contact: contact.trim(),
      safetyScore: Number(safetyScore),
      status
    };

    const res = updateDriver(updated);
    if (!res.success) {
      setFormError(res.message);
    } else {
      setIsEditModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setLicNo('');
    setName('');
    setCategory('Medium');
    setExpiryDate('2026-12-31');
    setContact('');
    setSafetyScore(85);
    setStatus('Available');
    setFormError('');
    setCurrentDriver(null);
  };

  // Filter roster
  const filteredDrivers = drivers.filter(d => {
    const matchSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        d.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Compiled Performance leaderboard sorted by safety score
  const leaderboard = useMemo(() => {
    return [...drivers]
      .map(driver => {
        const completedTrips = trips.filter(t => t.driverId === driver.id && t.status === 'Completed').length;
        return {
          ...driver,
          completedTrips
        };
      })
      .sort((a, b) => b.safetyScore - a.safetyScore);
  }, [drivers, trips]);

  const checkLicenseState = (expiryStr: string) => {
    const today = new Date();
    const expiry = new Date(expiryStr);
    const diff = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30' };
    } else if (diffDays <= 30) {
      return { label: `Expiring soon (${diffDays}d)`, color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30' };
    } else {
      return { label: 'Valid', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' };
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col md:flex-row gap-6">
      
      {/* Left Column: Drivers List */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Driver Roster</h2>
            <p className="text-xs text-slate-500 mt-1">Monitor driver compliance, safety ratings, and license expiries.</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Driver Name / License..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-2 text-xs font-medium focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="Off Duty">Off Duty</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>

          <button
            onClick={() => { resetForm(); setIsAddModalOpen(true); }}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Onboard Driver
          </button>
        </div>

        {/* Drivers Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full dense-table text-left border-collapse">
              <thead>
                <tr>
                  <th>Driver Name</th>
                  <th>License Plate</th>
                  <th>Category</th>
                  <th>Contact No</th>
                  <th>Safety Score</th>
                  <th>License Expiry</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      No drivers registered in registry.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => {
                    const lState = checkLicenseState(d.expiryDate);
                    return (
                      <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="font-semibold text-slate-900 dark:text-white">{d.name}</td>
                        <td className="font-mono text-xs">{d.id}</td>
                        <td className="font-medium text-xs">{d.category} Class</td>
                        <td>{d.contact}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs">{d.safetyScore}%</span>
                            <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  d.safetyScore >= 90 ? 'bg-emerald-500' :
                                  d.safetyScore >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                                }`} 
                                style={{ width: `${d.safetyScore}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${lState.color}`}>
                            {d.expiryDate} ({lState.label})
                          </span>
                        </td>
                        <td>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            d.status === 'Available' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' :
                            d.status === 'On Trip' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                            d.status === 'Off Duty' ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                            'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200 dark:border-red-900/30'
                          }`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              onClick={() => handleEditClick(d)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Edit Driver Profile"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => deleteDriver(d.id)}
                              className="p-1.5 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                              title="Delete Driver"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Driver Leaderboard & Compliance */}
      <div className="w-full md:w-80 shrink-0 flex flex-col gap-6">
        
        {/* Compliance panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500" />
            Compliance Status
          </h3>
          <div className="flex flex-col gap-3">
            {drivers.filter(d => {
              const today = new Date();
              const expiry = new Date(d.expiryDate);
              return expiry < today || d.status === 'Suspended';
            }).length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="h-4 w-4" />
                All driver licenses compliant.
              </div>
            ) : (
              drivers
                .filter(d => {
                  const today = new Date();
                  const expiry = new Date(d.expiryDate);
                  return expiry < today || d.status === 'Suspended';
                })
                .map(d => {
                  const isExpired = new Date(d.expiryDate) < new Date();
                  return (
                    <div key={d.id} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-lg flex flex-col gap-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white">{d.name}</span>
                      <span className="text-[10px] text-red-600 dark:text-red-400 font-medium font-mono">
                        {isExpired ? `Expired license: ${d.expiryDate}` : 'Driver status: Suspended'}
                      </span>
                    </div>
                  );
                })
            )}
          </div>
        </div>

        {/* Leaderboard panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide mb-4 flex items-center gap-1.5">
            <Award className="h-4.5 w-4.5 text-blue-500" />
            Driver Leaderboard
          </h3>
          <div className="flex flex-col gap-3.5">
            {leaderboard.slice(0, 5).map((d, index) => (
              <div key={d.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-slate-400 w-4">{index + 1}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate m-0">{d.name}</p>
                    <span className="text-[9px] text-slate-400 font-medium block">
                      {d.completedTrips} deliveries finished
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/20 px-2 py-0.5 rounded shrink-0">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{d.safetyScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ==========================================
          MODALS SECTION
         ========================================== */}

      {/* ADD DRIVER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Onboard New Driver</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 flex flex-col gap-4">
              {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priyesh Kadam"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Plate (No) *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. LIC-MH12-005"
                    value={licNo}
                    onChange={(e) => { setLicNo(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Light">Light Vehicle (Van/Zor)</option>
                    <option value="Medium">Medium Category (Mini-Truck)</option>
                    <option value="Heavy">Heavy Machinery (Semi-Trailer)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={contact}
                    onChange={(e) => { setContact(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Initial Safety Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Onboard Driver
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT DRIVER MODAL */}
      {isEditModalOpen && currentDriver && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Modify Driver: {currentDriver.name}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 flex flex-col gap-4">
              {formError && <div className="text-xs text-red-500 font-semibold">{formError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Plate (Disabled)</label>
                  <input
                    type="text"
                    disabled
                    value={currentDriver.id}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Driver Name *</label>
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
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="Light">Light Vehicle (Van/Zor)</option>
                    <option value="Medium">Medium Category (Mini-Truck)</option>
                    <option value="Heavy">Heavy Machinery (Semi-Trailer)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">License Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Number *</label>
                  <input
                    type="text"
                    required
                    value={contact}
                    onChange={(e) => { setContact(e.target.value); setFormError(''); }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Safety Score (0-100)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Duty Roster Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Save Driver Details
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
