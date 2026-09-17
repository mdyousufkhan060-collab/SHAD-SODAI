import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Activity, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Terminal,
  Database,
  Globe,
  Monitor
} from 'lucide-react';

interface AuditLog {
  id: number;
  admin_id: number;
  admin_name: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

interface AdminAuditLogsProps {
  language: 'en' | 'bn';
}

export const AdminAuditLogs: React.FC<AdminAuditLogsProps> = ({ language }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch('/api/admin/audit-logs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      const data = await response.json();
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'text-emerald-700 bg-emerald-50 border-emerald-100';
      case 'UPDATE': return 'text-indigo-700 bg-indigo-50 border-indigo-100';
      case 'DELETE': return 'text-rose-700 bg-rose-50 border-rose-100';
      case 'LOGIN': return 'text-amber-700 bg-amber-50 border-amber-100';
      default: return 'text-gray-700 bg-gray-50 border-gray-100';
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder={language === 'bn' ? 'অডিট লগ সার্চ করুন...' : 'Search logs by admin, resource, or action...'}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Filter className="w-4 h-4" />
            {language === 'bn' ? 'ফিল্টার' : 'Filter'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all">
            <Calendar className="w-4 h-4" />
            {language === 'bn' ? 'তারিখ' : 'Date Range'}
          </button>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Administrator</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Resource</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-[11px] font-mono text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                      {new Date(log.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 border border-gray-200">
                        {log.admin_name.charAt(0)}
                      </div>
                      <span className="text-sm font-bold text-gray-900">{log.admin_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-700">{log.resource}</span>
                      {log.resource_id && (
                        <span className="text-[10px] font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">#{log.resource_id}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" /> {log.ip_address || '0.0.0.0'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Monitor className="w-3 h-3" /> {log.user_agent?.split(' ')[0] || 'Unknown'}
                        </div>
                      </div>
                      {log.details && (
                        <div className="flex items-start gap-1 text-[11px] text-gray-600 line-clamp-1">
                          <Terminal className="w-3 h-3 mt-0.5 text-emerald-600 shrink-0" />
                          <code className="bg-gray-50 px-1 rounded truncate">{log.details}</code>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
          Audit history is retained for 90 days.
        </span>
        <div className="flex items-center gap-2">
          <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-2 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all disabled:opacity-50" disabled>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
