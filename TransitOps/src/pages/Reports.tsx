import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { jsPDF } from 'jspdf';
import { Download, FileText, ArrowUpDown, Search } from 'lucide-react';

interface CompiledReportRow {
  id: string;
  name: string;
  type: string;
  region: string;
  acquisitionCost: number;
  distanceDriven: number;
  fuelLiters: number;
  fuelEfficiency: number; // km/L
  fuelCost: number;
  maintenanceCost: number;
  miscCost: number;
  totalExpenses: number;
  revenue: number;
  profit: number;
  roi: number; // %
}

type SortKey = 'id' | 'distanceDriven' | 'fuelEfficiency' | 'totalExpenses' | 'revenue' | 'profit' | 'roi';

export const Reports: React.FC = () => {
  const { vehicles, trips, fuelLogs, maintenanceLogs, expenses } = useApp();

  // Search & Sorting States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('roi');
  const [sortAsc, setSortAsc] = useState(false);

  // ==========================================
  // COMPILE REPORT ROW DATA
  // ==========================================
  const reportData = useMemo((): CompiledReportRow[] => {
    return vehicles
      .filter(v => v.status !== 'Retired') // focus on active fleet reports
      .map(v => {
        // 1. Calculate distance driven from completed trips
        const completedTrips = trips.filter(t => t.vehicleId === v.id && t.status === 'Completed');
        const distanceDriven = completedTrips.reduce((sum, t) => sum + t.plannedDistance, 0);

        // 2. Calculate fuel logs parameters
        const vFuelLogs = fuelLogs.filter(f => f.vehicleId === v.id);
        const fuelCost = vFuelLogs.reduce((sum, f) => sum + f.cost, 0);
        const fuelLiters = vFuelLogs.reduce((sum, f) => sum + f.liters, 0);

        // Fuel Efficiency = Distance / Fuel Consumed
        const fuelEfficiency = fuelLiters > 0 ? parseFloat((distanceDriven / fuelLiters).toFixed(2)) : 0;

        // 3. Maintenance Cost (Resolved Logs)
        const vMaintLogs = maintenanceLogs.filter(m => m.vehicleId === v.id && m.status === 'Resolved');
        const maintenanceCost = vMaintLogs.reduce((sum, m) => sum + (m.actualCost || 0), 0);

        // 4. Other Expenses
        const vMiscExpenses = expenses.filter(e => e.vehicleId === v.id && e.type !== 'Maintenance');
        const miscCost = vMiscExpenses.reduce((sum, e) => sum + e.cost, 0);

        // Total operational expenses
        const totalExpenses = fuelCost + maintenanceCost + miscCost;

        // 5. Total Revenue
        const revenue = completedTrips.reduce((sum, t) => sum + t.revenue, 0);

        // 6. Net Profit
        const profit = revenue - totalExpenses;

        // 7. Return on Investment (ROI)
        const roi = v.acquisitionCost > 0 ? parseFloat(((profit / v.acquisitionCost) * 100).toFixed(1)) : 0;

        return {
          id: v.id,
          name: v.name,
          type: v.type,
          region: v.region,
          acquisitionCost: v.acquisitionCost,
          distanceDriven,
          fuelLiters,
          fuelEfficiency,
          fuelCost,
          maintenanceCost,
          miscCost,
          totalExpenses,
          revenue,
          profit,
          roi
        };
      });
  }, [vehicles, trips, fuelLogs, maintenanceLogs, expenses]);

  // ==========================================
  // SEARCH & SORT FILTERING
  // ==========================================
  const processedData = useMemo(() => {
    const searched = reportData.filter(row => {
      return row.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
             row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             row.type.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return searched.sort((a, b) => {
      let valA = a[sortKey];
      let valB = b[sortKey];

      // Handle string type comparison (Registration Number)
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }

      // Handle numbers comparison
      valA = Number(valA);
      valB = Number(valB);
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [reportData, searchQuery, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false); // default descending for numbers
    }
  };

  // ==========================================
  // EXPORT ENGINE: CSV
  // ==========================================
  const handleExportCSV = () => {
    const headers = [
      'Registration No', 'Model', 'Type', 'Region', 'Acquisition Cost (INR)',
      'Distance Driven (km)', 'Fuel Consumed (L)', 'Fuel Efficiency (km/L)',
      'Fuel Cost (INR)', 'Maintenance Cost (INR)', 'Other Expenses (INR)',
      'Total Expenses (INR)', 'Revenue (INR)', 'Net Profit (INR)', 'ROI (%)'
    ];

    const rows = processedData.map(row => [
      row.id, row.name, row.type, row.region, row.acquisitionCost,
      row.distanceDriven, row.fuelLiters, row.fuelEfficiency,
      row.fuelCost, row.maintenanceCost, row.miscCost,
      row.totalExpenses, row.revenue, row.profit, row.roi
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `transitops_fleet_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ==========================================
  // EXPORT ENGINE: PDF (jsPDF)
  // ==========================================
  const handleExportPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const todayStr = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    // Styling helpers
    doc.setFillColor(15, 23, 42); // dark slate header background
    doc.rect(0, 0, 297, 40, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('TransitOps Operations Command', 15, 18);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184); // light gray text
    doc.text(`Fleet ROI & Profitability Audit Summary • Exported: ${todayStr}`, 15, 26);

    // Fleet Summary Totals
    const totalRev = processedData.reduce((sum, r) => sum + r.revenue, 0);
    const totalExp = processedData.reduce((sum, r) => sum + r.totalExpenses, 0);
    const totalProf = totalRev - totalExp;
    
    doc.setFillColor(248, 250, 252);
    doc.rect(15, 48, 267, 20, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(15, 48, 267, 20);

    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text('Total Fleet Revenue', 20, 54);
    doc.text('Total Operational Cost', 105, 54);
    doc.text('Net Operating Profit', 190, 54);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`INR ${totalRev.toLocaleString()}`, 20, 62);
    doc.text(`INR ${totalExp.toLocaleString()}`, 105, 62);
    doc.text(`INR ${totalProf.toLocaleString()}`, 190, 62);

    // Table Headers
    const startY = 80;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, startY, 267, 10, 'F');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    
    doc.text('Reg No', 18, startY + 7);
    doc.text('Model', 48, startY + 7);
    doc.text('Type', 90, startY + 7);
    doc.text('Hub', 130, startY + 7);
    doc.text('Odo km', 160, startY + 7);
    doc.text('Fuel eff', 185, startY + 7);
    doc.text('Expenses', 210, startY + 7);
    doc.text('Revenue', 235, startY + 7);
    doc.text('ROI %', 260, startY + 7);

    // Table Rows
    let currentY = startY + 10;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);

    processedData.forEach((row, index) => {
      if (currentY > 185) {
        doc.addPage();
        // Reprint header row in new page
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 15, 267, 10, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('Reg No', 18, 22);
        doc.text('Model', 48, 22);
        doc.text('Type', 90, 22);
        doc.text('Hub', 130, 22);
        doc.text('Odo km', 160, 22);
        doc.text('Fuel eff', 185, 22);
        doc.text('Expenses', 210, 22);
        doc.text('Revenue', 235, 22);
        doc.text('ROI %', 260, 22);
        
        currentY = 25;
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
      }

      // Alternating row background colors
      if (index % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 267, 8, 'F');
      }

      // Draw cell text
      doc.text(row.id, 18, currentY + 5.5);
      doc.text(row.name, 48, currentY + 5.5);
      doc.text(row.type, 90, currentY + 5.5);
      doc.text(row.region, 130, currentY + 5.5);
      doc.text(row.distanceDriven.toLocaleString(), 160, currentY + 5.5);
      doc.text(`${row.fuelEfficiency} km/L`, 185, currentY + 5.5);
      doc.text(`INR ${row.totalExpenses.toLocaleString()}`, 210, currentY + 5.5);
      doc.text(`INR ${row.revenue.toLocaleString()}`, 235, currentY + 5.5);
      doc.text(`${row.roi}%`, 260, currentY + 5.5);

      // Bottom border line
      doc.setDrawColor(241, 245, 249);
      doc.line(15, currentY + 8, 282, currentY + 8);
      
      currentY += 8;
    });

    // Save document
    doc.save(`transitops_operations_report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Reports & Analytics</h2>
          <p className="text-xs text-slate-500 mt-1">Audit fleet performance, fuel economy metrics, operational costs, and ROI percentages.</p>
        </div>

        {/* Export Actions */}
        <div className="flex gap-2.5 w-full sm:w-auto">
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
          >
            <FileText className="h-4 w-4" />
            Export PDF Report
          </button>
        </div>
      </div>

      {/* Stats Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="p-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Completed Deliveries</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {processedData.reduce((sum, r) => sum + trips.filter(t => t.vehicleId === r.id && t.status === 'Completed').length, 0)} routes
          </h4>
        </div>
        <div className="p-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Fuel Efficiency</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {(processedData.reduce((sum, r) => sum + r.fuelEfficiency, 0) / (processedData.filter(r => r.fuelEfficiency > 0).length || 1)).toFixed(2)} km/L
          </h4>
        </div>
        <div className="p-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fleet ROI Average</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {(processedData.reduce((sum, r) => sum + r.roi, 0) / processedData.length).toFixed(1)}%
          </h4>
        </div>
        <div className="p-3 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Acquisition Leverage</span>
          <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            ₹{processedData.reduce((sum, r) => sum + r.acquisitionCost, 0).toLocaleString()}
          </h4>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex flex-col gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Vehicle or Model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none"
          />
        </div>

        {/* Data Grid */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full dense-table text-left border-collapse">
              <thead>
                <tr>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('id')}>
                    <div className="flex items-center gap-1.5">
                      Reg No
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th>Model</th>
                  <th>Region</th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('distanceDriven')}>
                    <div className="flex items-center gap-1.5">
                      Distance
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('fuelEfficiency')}>
                    <div className="flex items-center gap-1.5">
                      Fuel Econ
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('totalExpenses')}>
                    <div className="flex items-center gap-1.5">
                      Op Costs
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('revenue')}>
                    <div className="flex items-center gap-1.5">
                      Revenue
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer select-none" onClick={() => toggleSort('profit')}>
                    <div className="flex items-center gap-1.5">
                      Net Profit
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                  <th className="cursor-pointer select-none text-right" onClick={() => toggleSort('roi')}>
                    <div className="flex items-center gap-1.5 justify-end">
                      Vehicle ROI
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                      No compiled report data found.
                    </td>
                  </tr>
                ) : (
                  processedData.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="font-semibold font-mono text-slate-900 dark:text-white">{row.id}</td>
                      <td className="font-medium text-xs">{row.name}</td>
                      <td>{row.region}</td>
                      <td className="font-mono text-xs">{row.distanceDriven.toLocaleString()} km</td>
                      <td className="font-mono text-xs">{row.fuelEfficiency > 0 ? `${row.fuelEfficiency} km/L` : 'N/A'}</td>
                      <td>₹{row.totalExpenses.toLocaleString()}</td>
                      <td>₹{row.revenue.toLocaleString()}</td>
                      <td className={`font-semibold text-xs ${row.profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                        ₹{row.profit.toLocaleString()}
                      </td>
                      <td className="text-right font-bold text-slate-950 dark:text-white font-mono text-xs">
                        {row.roi}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

