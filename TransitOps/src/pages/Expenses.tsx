import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Expense } from '../context/AppContext';
import { Plus, Receipt, Fuel, Search, Calendar } from 'lucide-react';

export const Expenses: React.FC = () => {
  const { fuelLogs, expenses, vehicles, addFuelLog, addExpense, currentUser } = useApp();

  // Tab control: 'fuel' | 'expenses'
  const [activeTab, setActiveTab] = useState<'fuel' | 'expenses'>('fuel');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Form Fields (Fuel)
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState(40);
  const [fuelCost, setFuelCost] = useState(4000);
  const [fuelDate, setFuelDate] = useState(new Date().toISOString().split('T')[0]);
  const [fuelOdometer, setFuelOdometer] = useState(10000);
  const [fuelError, setFuelError] = useState('');

  // Form Fields (Expense)
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expType, setExpType] = useState<Expense['type']>('Toll');
  const [expCost, setExpCost] = useState(1000);
  const [expDate, setExpDate] = useState(new Date().toISOString().split('T')[0]);
  const [expError, setExpError] = useState('');

  const isFinancialAnalyst = currentUser?.role === 'Financial Analyst';

  // Handle Fuel Submit
  const handleFuelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehicleId || liters <= 0 || fuelCost <= 0 || fuelOdometer <= 0) {
      setFuelError('Please enter valid fuel parameters.');
      return;
    }

    // Verify odometer is not less than vehicle's current odometer
    const vehicle = vehicles.find(v => v.id === fuelVehicleId);
    if (vehicle && fuelOdometer < vehicle.odometer) {
      setFuelError(`Odometer Error: Fuel log odometer (${fuelOdometer.toLocaleString()} km) cannot be less than vehicle's current odometer (${vehicle.odometer.toLocaleString()} km).`);
      return;
    }

    addFuelLog({
      vehicleId: fuelVehicleId,
      liters,
      cost: fuelCost,
      date: fuelDate,
      odometer: fuelOdometer
    });

    setIsFuelModalOpen(false);
    resetFuelForm();
  };

  const resetFuelForm = () => {
    setFuelVehicleId('');
    setLiters(40);
    setFuelCost(4000);
    setFuelDate(new Date().toISOString().split('T')[0]);
    setFuelOdometer(10000);
    setFuelError('');
  };

  // Handle Expense Submit
  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expVehicleId || expCost <= 0) {
      setExpError('Please fill in valid expense parameters.');
      return;
    }

    addExpense({
      vehicleId: expVehicleId,
      type: expType,
      cost: expCost,
      date: expDate
    });

    setIsExpenseModalOpen(false);
    resetExpenseForm();
  };

  const resetExpenseForm = () => {
    setExpVehicleId('');
    setExpType('Toll');
    setExpCost(1000);
    setExpDate(new Date().toISOString().split('T')[0]);
    setExpError('');
  };

  // Filter fuel logs
  const filteredFuelLogs = fuelLogs
    .filter(log => log.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter expenses
  const filteredExpenses = expenses
    .filter(exp => exp.vehicleId.toLowerCase().includes(searchQuery.toLowerCase()) || exp.type.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Fuel & Expenses</h2>
          <p className="text-xs text-slate-500 mt-1">Audit and record diesel logs, highway tolls, parking costs, and parts maintenance.</p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'fuel' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Fuel className="h-3.5 w-3.5" />
            Fuel Logs
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'expenses' 
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Receipt className="h-3.5 w-3.5" />
            General Expenses
          </button>
        </div>
      </div>

      {/* Filter and Log button action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-xl">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Vehicle Reg No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>

        {/* Hide action forms for view-only Safety Officer (or restrict to Drivers & Managers) */}
        {!isFinancialAnalyst && (
          <div className="flex gap-2.5 w-full sm:w-auto">
            {activeTab === 'fuel' ? (
              <button
                onClick={() => { resetFuelForm(); setIsFuelModalOpen(true); }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log Fuel Entry
              </button>
            ) : (
              <button
                onClick={() => { resetExpenseForm(); setIsExpenseModalOpen(true); }}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <Plus className="h-4 w-4" />
                Log Other Expense
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'fuel' ? (
        /* FUEL LOGS LIST */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full dense-table text-left border-collapse">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Vehicle Registration</th>
                  <th>Diesel Liters</th>
                  <th>Total Cost</th>
                  <th>Odometer Reading</th>
                  <th>Billing Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredFuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      No fuel logs recorded.
                    </td>
                  </tr>
                ) : (
                  filteredFuelLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="font-mono text-xs">{log.id}</td>
                      <td className="font-semibold font-mono text-slate-900 dark:text-white">{log.vehicleId}</td>
                      <td>{log.liters === 0 ? 'Charging (EV)' : `${log.liters} L`}</td>
                      <td className="font-semibold text-slate-900 dark:text-white">₹{log.cost.toLocaleString()}</td>
                      <td className="font-mono">{log.odometer.toLocaleString()} km</td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {log.date}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* OTHER EXPENSES LIST */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full dense-table text-left border-collapse">
              <thead>
                <tr>
                  <th>Expense ID</th>
                  <th>Vehicle Registration</th>
                  <th>Expense Classification</th>
                  <th>Cost</th>
                  <th>Billing Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      No expense records registered.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="font-mono text-xs">{exp.id}</td>
                      <td className="font-semibold font-mono text-slate-900 dark:text-white">{exp.vehicleId}</td>
                      <td>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          exp.type === 'Toll' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400' :
                          exp.type === 'Maintenance' ? 'bg-amber-105 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400' :
                          exp.type === 'Insurance' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {exp.type}
                        </span>
                      </td>
                      <td className="font-semibold text-slate-900 dark:text-white">₹{exp.cost.toLocaleString()}</td>
                      <td>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {exp.date}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          MODALS SECTION
         ========================================== */}

      {/* LOG FUEL MODAL */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Log Diesel / Fuel Entry</h3>
              <button onClick={() => setIsFuelModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleFuelSubmit} className="p-6 flex flex-col gap-4">
              {fuelError && <div className="text-xs text-red-500 font-semibold">{fuelError}</div>}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select vehicle *</label>
                <select
                  value={fuelVehicleId}
                  required
                  onChange={(e) => { setFuelVehicleId(e.target.value); setFuelError(''); }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold"
                >
                  <option value="">Select a Vehicle</option>
                  {vehicles
                    .filter(v => v.status !== 'Retired')
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id}) - Odo: {v.odometer.toLocaleString()} km
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Fuel Liters (0 for EV) *</label>
                  <input
                    type="number"
                    required
                    value={liters}
                    onChange={(e) => setLiters(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Bill Cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={fuelCost}
                    onChange={(e) => setFuelCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Odometer (km) *</label>
                  <input
                    type="number"
                    required
                    value={fuelOdometer}
                    onChange={(e) => setFuelOdometer(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Date Logged *</label>
                  <input
                    type="date"
                    required
                    value={fuelDate}
                    onChange={(e) => setFuelDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Log Fuel Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* LOG GENERAL EXPENSE MODAL */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-900 dark:text-white">Log Operational Expense</h3>
              <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">Close</button>
            </div>

            <form onSubmit={handleExpenseSubmit} className="p-6 flex flex-col gap-4">
              {expError && <div className="text-xs text-red-500 font-semibold">{expError}</div>}

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Select vehicle *</label>
                <select
                  value={expVehicleId}
                  required
                  onChange={(e) => { setExpVehicleId(e.target.value); setExpError(''); }}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono font-semibold"
                >
                  <option value="">Select a Vehicle</option>
                  {vehicles
                    .filter(v => v.status !== 'Retired')
                    .map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.id})
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Expense Type</label>
                  <select
                    value={expType}
                    onChange={(e) => setExpType(e.target.value as any)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Toll">Highway Tolls</option>
                    <option value="Parking">Parking Charges</option>
                    <option value="Insurance">Asset Insurance</option>
                    <option value="Repair">Emergency Repairs</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Bill cost (₹) *</label>
                  <input
                    type="number"
                    required
                    value={expCost}
                    onChange={(e) => setExpCost(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Billing Date *</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                />
              </div>

              <button
                type="submit"
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 font-semibold text-xs transition-colors"
              >
                Log Fleet Expense
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
