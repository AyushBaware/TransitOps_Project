import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { MaintenanceLog } from '../context/AppContext';
import { Plus, Search } from 'lucide-react';

export const Maintenance: React.FC = () => {
  const { maintenanceLogs, vehicles, addMaintenanceLog, resolveMaintenanceLog } = useApp();

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  // Modals
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [activeLogId, setActiveLogId] = useState<string | null>(null);

  // Form Fields (Log Maintenance)
  const [vehicleId, setVehicleId] = useState('');
  const [issue, setIssue] = useState('');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [estCost, setEstCost] = useState(3000);
  const [logError, setLogError] = useState('');

  // Form Fields (Resolve)
  const [actualCost, setActualCost] = useState(3000);

  // Submit new request
  const handleLogSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !issue.trim()) {
      setLogError('Please select a vehicle and specify the service issue.');
      return;
    }

    addMaintenanceLog({
      vehicleId,
      issue: issue.trim(),
      priority,
      estimatedCost: Number(estCost)
    });

    setIsLogModalOpen(false);
    resetLogForm();
  };

  const resetLogForm = () => {
    setVehicleId('');
    setIssue('');
    setPriority('Medium');
    setEstCost(3000);
    setLogError('');
  };

  // Open resolve modal
  const handleOpenResolve = (log: MaintenanceLog) => {
    setActiveLogId(log.id);
    setActualCost(log.estimatedCost);
    setIsResolveModalOpen(true);
  };

  // Submit resolution
  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLogId) return;

    resolveMaintenanceLog(activeLogId, actualCost);
    setIsResolveModalOpen(false);
    setActiveLogId(null);
  };

  // Filter logs
  const filteredLogs = maintenanceLogs.filter(log => {
    const matchSearch = log.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        log.issue.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPriority = filterPriority === 'All' || log.priority === filterPriority;
    const matchStatus = filterStatus === 'All' || log.status === filterStatus;
    return matchSearch && matchPriority && matchStatus;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Maintenance logs</h2>
          <p className="text-xs text-slate-500 mt-1">Monitor mechanical failures, routine checks, and garage schedules.</p>
        </div>

        <button
          onClick={() => { resetLogForm(); setIsLogModalOpen(true); }}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
        >
          <Plus className="h-4 w-4" />
          Log Service Event
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Vehicle ID / Issue details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
            />
          </div>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-2 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open (Pending)</option>
            <option value="Resolved">Resolved (Complete)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full dense-table text-left border-collapse">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Vehicle Reg No</th>
                <th>Mechanical Issue Details</th>
                <th>Priority</th>
                <th>Estimated Cost</th>
                <th>Actual Cost</th>
                <th>Log Date</th>
                <th>Resolve Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    No active maintenance logs.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="font-mono text-xs">{log.id}</td>
                    <td className="font-semibold font-mono text-slate-900 dark:text-white">{log.vehicleId}</td>
                    <td className="font-medium text-xs max-w-xs truncate">{log.issue}</td>
                    <td>
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400' :
                        log.priority === 'Medium' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                        'bg-slate-105 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {log.priority}
                      </span>
                    </td>
                    <td>₹{log.estimatedCost.toLocaleString()}</td>
                    <td>{log.actualCost ? `₹${log.actualCost.toLocaleString()}` : '-'}</td>
                    <td>{log.logDate}</td>
                    <td>{log.resolveDate || '-'}</td>
                    <td>
                      <span className={`inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider ${
                        log.status === 'Resolved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}>
                        {log.status === 'Resolved' ? 'Resolved' : 'Active Shop'}
                      </span>
                    </td>
                    <td className="text-right">
                      {log.status !== 'Resolved' && (
                        <button
                          onClick={() => handleOpenResolve(log)}
                          className="bg-emerald-650 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors"
                        >
                          Resolve Repair
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          MODALS SECTION
         ========================================== */}

      {/* LOG MAINTENANCE MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Log Vehicle Shop Service</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleLogSubmit} className="p-6 flex flex-col gap-4">
              {logError && <div className="text-xs text-red-500 font-semibold">{logError}</div>}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select Fleet Asset *</label>
                <select
                  value={vehicleId}
                  required
                  onChange={(e) => { setVehicleId(e.target.value); setLogError(''); }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold"
                >
                  <option value="">Select a Vehicle</option>
                  {vehicles
                    .filter(v => v.status === 'Available')
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) - Odo: {v.odometer.toLocaleString()} km
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Service / Repair Issue *</label>
                <textarea
                  required
                  placeholder="Describe mechanical faults or service logs (e.g. clutch overhaul, alternator belt replacement)..."
                  value={issue}
                  onChange={(e) => { setIssue(e.target.value); setLogError(''); }}
                  rows={3}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Service Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Low">Low Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="High">High Priority</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    required
                    value={estCost}
                    onChange={(e) => setEstCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Log Service: Route Vehicle to Shop
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE MAINTENANCE MODAL */}
      {isResolveModalOpen && activeLogId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Resolve Garage Service: {activeLogId}</h3>
              <button onClick={() => { setIsResolveModalOpen(false); setActiveLogId(null); }} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleResolveSubmit} className="p-6 flex flex-col gap-4">
              <div className="bg-slate-50 dark:bg-slate-855 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                <span>Subject Vehicle: <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  {maintenanceLogs.find(m => m.id === activeLogId)?.vehicleId}
                </strong></span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Actual Garage Repair Cost (₹) *</label>
                <input
                  type="number"
                  required
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Approve Service Resolution
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
