import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { UserCheck, UserX, RotateCcw, Clock, ShieldCheck, Mail } from 'lucide-react';

export const AccessControl: React.FC = () => {
  const { userAccounts, approveAccount, rejectAccount, revokeAccount } = useApp();

  const pending = useMemo(() => userAccounts.filter(a => a.status === 'Pending' && a.role !== 'Fleet Manager'), [userAccounts]);
  const approved = useMemo(() => userAccounts.filter(a => a.status === 'Approved' && a.role !== 'Fleet Manager'), [userAccounts]);
  const rejected = useMemo(() => userAccounts.filter(a => a.status === 'Rejected'), [userAccounts]);

  const formatDate = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Access Control</h2>
          <p className="text-xs text-slate-500 mt-1">Review and manage login access requests for Driver, Safety Officer, and Financial Analyst roles.</p>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-amber-50/40 dark:bg-amber-950/10 flex items-center gap-2">
          <Clock className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
            Pending Requests ({pending.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full dense-table text-left border-collapse">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Requested Role</th>
                <th>Requested On</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    No pending access requests.
                  </td>
                </tr>
              ) : (
                pending.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="text-xs">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" />{acc.email}</span>
                    </td>
                    <td>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                        {acc.role}
                      </span>
                    </td>
                    <td className="text-xs">{formatDate(acc.requestedAt)}</td>
                    <td className="text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          onClick={() => approveAccount(acc.id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors flex items-center gap-1"
                        >
                          <UserCheck className="h-3 w-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectAccount(acc.id)}
                          className="bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 transition-colors flex items-center gap-1"
                        >
                          <UserX className="h-3 w-3" />
                          Deny
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

      {/* Approved Users */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-emerald-50/40 dark:bg-emerald-950/10 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
            Approved Users ({approved.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full dense-table text-left border-collapse">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Approved On</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {approved.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    No approved users yet.
                  </td>
                </tr>
              ) : (
                approved.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="text-xs">{acc.email}</td>
                    <td>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                        {acc.role}
                      </span>
                    </td>
                    <td className="text-xs">{formatDate(acc.decidedAt)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => revokeAccount(acc.id)}
                        className="bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-950/40 text-slate-700 dark:text-slate-300 hover:text-red-700 dark:hover:text-red-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors"
                      >
                        Revoke Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Denied / Revoked Users */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center gap-2">
          <UserX className="h-4 w-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Denied / Revoked ({rejected.length})
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full dense-table text-left border-collapse">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Decided On</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {rejected.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                    No denied or revoked accounts.
                  </td>
                </tr>
              ) : (
                rejected.map(acc => (
                  <tr key={acc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors opacity-70">
                    <td className="font-semibold text-slate-900 dark:text-white">{acc.name}</td>
                    <td className="text-xs">{acc.email}</td>
                    <td>
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400">
                        {acc.role}
                      </span>
                    </td>
                    <td className="text-xs">{formatDate(acc.decidedAt)}</td>
                    <td className="text-right">
                      <button
                        onClick={() => approveAccount(acc.id)}
                        className="bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Restore Access
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};