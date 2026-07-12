import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Bell, X, ShieldAlert, CheckCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const { notifications, clearNotifications } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  const getIcon = (type: string) => {
    switch (type) {
      case 'Error':
        return <ShieldAlert className="h-5 w-5 text-red-500 shrink-0" />;
      case 'Warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
      case 'Success':
        return <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />;
      default:
        return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  const warningCount = notifications.filter(n => n.type === 'Error' || n.type === 'Warning').length;

  return (
    <div className="relative">
      {/* Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
        title="Event Operations Log"
      >
        <Bell className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className={`absolute top-0 right-0 h-5 w-5 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-slate-50 dark:border-slate-900 ${
            warningCount > 0 ? 'bg-red-500' : 'bg-blue-500'
          }`}>
            {notifications.length}
          </span>
        )}
      </button>

      {/* Overlay Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 max-h-[500px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl z-50 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
            <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="h-4 w-4 text-blue-500" />
              Live Operations Log
            </h3>
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="p-1 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors text-xs flex items-center gap-1"
                  title="Clear Log"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 rounded transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                No system notifications.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 flex gap-3 transition-colors ${
                    notif.type === 'Error' ? 'bg-red-50/20 dark:bg-red-950/10' :
                    notif.type === 'Warning' ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''
                  }`}
                >
                  {getIcon(notif.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-normal font-medium break-words">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                      {formatTime(notif.timestamp)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 text-center bg-slate-50 dark:bg-slate-900/50">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-semibold">
              Event Logger Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
