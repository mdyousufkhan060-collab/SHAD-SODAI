import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  RefreshCcw, 
  Trash2, 
  Play, 
  Calendar, 
  Shield, 
  History, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Settings as SettingsIcon,
  Search,
  ArrowRight,
  ShieldAlert,
  Server,
  FileArchive,
  Save
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DatabaseStats {
  connection: 'Connected' | 'Error';
  type: string;
  health: 'Healthy' | 'Error';
  size: string;
  tables: number;
  lastBackup: string;
  lastBackupStatus: string;
}

interface BackupItem {
  name: string;
  date: string;
  size: string;
  status: string;
  type: string;
}

interface AdminDatabaseBackupProps {
  language: 'en' | 'bn';
}

export const AdminDatabaseBackup: React.FC<AdminDatabaseBackupProps> = ({ language }) => {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [backingUp, setBackingUp] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('Daily');
  const [retentionCount, setRetentionCount] = useState(10);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_session_token');
      const [statsRes, backupsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/database/status', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/database/backups', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/general-settings', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (statsRes.ok) setStats(await statsRes.ok ? await statsRes.json() : null);
      if (backupsRes.ok) setBackups(await backupsRes.json());
      
      const settings = await settingsRes.json();
      setAutoBackupEnabled(settings.backup_auto_enabled === 'true');
      setBackupFrequency(settings.backup_frequency || 'Daily');
      setRetentionCount(Number(settings.backup_retention_count) || 10);
    } catch (err) {
      console.error('Failed to fetch database data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      setBackingUp(true);
      const token = localStorage.getItem('admin_session_token');
      const res = await fetch('/api/admin/database/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Backup failed', err);
    } finally {
      setBackingUp(false);
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/database/backups/${filename}/download`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const handleRestore = async (filename: string) => {
    const confirmMessage = language === 'bn' 
      ? 'আপনি কি নিশ্চিত যে আপনি এই ব্যাকআপটি রিস্টোর করতে চান? এটি বর্তমান ডেটা মুছে ফেলবে।' 
      : 'Are you absolutely sure you want to restore this backup? It will replace all current database data.';
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setRestoring(filename);
      const token = localStorage.getItem('admin_session_token');
      const res = await fetch(`/api/admin/database/backups/${filename}/restore`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        alert(language === 'bn' ? 'সফলভাবে রিস্টোর হয়েছে!' : 'Database restored successfully!');
        window.location.reload(); // Refresh app to load restored data
      } else {
        alert(language === 'bn' ? 'রিস্টোর ব্যর্থ হয়েছে।' : 'Restore failed.');
      }
    } catch (err) {
      console.error('Restore failed', err);
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(language === 'bn' ? 'মুছে ফেলতে চান?' : 'Confirm delete?')) return;
    try {
      const token = localStorage.getItem('admin_session_token');
      const res = await fetch(`/api/admin/database/backups/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setBackups(backups.filter(b => b.name !== filename));
      }
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const saveBackupSettings = async () => {
    try {
      setSavingSettings(true);
      const token = localStorage.getItem('admin_session_token');
      await fetch('/api/admin/general-settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          backup_auto_enabled: String(autoBackupEnabled),
          backup_frequency: backupFrequency,
          backup_retention_count: String(retentionCount)
        })
      });
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setSavingSettings(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest animate-pulse">Checking Database Health...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-emerald-600">Database & Backups</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            {language === 'bn' ? 'ডাটাবেস এবং ব্যাকআপ' : 'Database & Backup'}
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            {language === 'bn' 
              ? 'সিস্টেম ডেটা সুরক্ষিত রাখুন এবং ব্যাকআপ পরিচালনা করুন।' 
              : 'Secure system data, monitor health, and manage automated backup strategies.'}
          </p>
        </div>

        <button 
          onClick={handleBackupNow}
          disabled={backingUp}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95"
        >
          {backingUp ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {language === 'bn' ? 'এখনই ব্যাকআপ নিন' : 'Create Backup Now'}
        </button>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Status & Settings */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Database Status Card */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-emerald-600" />
                {language === 'bn' ? 'ডাটাবেস স্ট্যাটাস' : 'Database Status'}
              </h3>
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-black uppercase ${
                stats?.connection === 'Connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'
              }`}>
                {stats?.connection}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'ধরন' : 'Engine'}</p>
                  <p className="text-sm font-black text-gray-800">{stats?.type}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'স্বাস্থ্য' : 'Health'}</p>
                  <p className={`text-sm font-black flex items-center gap-1.5 ${stats?.health === 'Healthy' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stats?.health === 'Healthy' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {stats?.health}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'সাইজ' : 'Storage Size'}</p>
                  <p className="text-sm font-black text-gray-800">{stats?.size}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{language === 'bn' ? 'টেবিল' : 'Total Tables'}</p>
                  <p className="text-sm font-black text-gray-800">{stats?.tables} Objects</p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">{language === 'bn' ? 'শেষ ব্যাকআপ:' : 'Last Backup:'}</span>
                  <span className="text-gray-900 font-bold">{stats?.lastBackup === 'Never' ? 'None' : new Date(stats?.lastBackup || '').toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-medium">{language === 'bn' ? 'ব্যাকআপ স্ট্যাটাস:' : 'Backup Status:'}</span>
                  <span className={`font-black uppercase tracking-tighter ${stats?.lastBackupStatus === 'Success' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {stats?.lastBackupStatus}
                  </span>
                </div>
              </div>

              <button 
                onClick={fetchData}
                className="w-full py-2.5 border border-gray-200 rounded-xl text-xs font-black text-gray-600 hover:bg-gray-50 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                {language === 'bn' ? 'রিফ্রেশ করুন' : 'Refresh Connection'}
              </button>
            </div>
          </div>

          {/* Automated Backup Settings */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                {language === 'bn' ? 'অটো ব্যাকআপ সেটিংস' : 'Auto Backup Schedule'}
              </h3>
              <div className={`w-8 h-4 rounded-full relative transition-colors cursor-pointer ${autoBackupEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} onClick={() => setAutoBackupEnabled(!autoBackupEnabled)}>
                <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoBackupEnabled ? 'left-4.5' : 'left-0.5'}`} />
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-3">
                <label className="block">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Frequency</span>
                  <select 
                    value={backupFrequency}
                    onChange={(e) => setBackupFrequency(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Daily">Daily at Midnight</option>
                    <option value="Weekly">Weekly (Every Sunday)</option>
                    <option value="Monthly">Monthly (1st of Month)</option>
                  </select>
                </label>
                
                <label className="block">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Retention Count</span>
                  <input 
                    type="number" 
                    value={retentionCount}
                    onChange={(e) => setRetentionCount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Keep last X backups"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">Number of older backup files to retain before deletion.</span>
                </label>
              </div>

              <button 
                onClick={saveBackupSettings}
                disabled={savingSettings}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
              >
                {savingSettings ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {language === 'bn' ? 'সেটিংস সংরক্ষণ করুন' : 'Save Scheduler Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Backup List */}
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[500px]">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                  {language === 'bn' ? 'ব্যাকআপ হিস্ট্রি' : 'Backup History & Repository'}
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                  Download, Restore or Manage your database snapshots
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search backups..." 
                    className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none w-48"
                  />
                </div>
              </div>
            </div>

            <div className="p-0 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">File Reference</th>
                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Size / Type</th>
                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  <AnimatePresence>
                    {backups.map((backup) => (
                      <motion.tr 
                        key={backup.name}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="hover:bg-gray-50/30 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                              <FileArchive className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-gray-900 leading-none mb-1">{backup.name}</div>
                              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-100">Verified</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold text-gray-700">{new Date(backup.date).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-[11px] font-black text-gray-600 uppercase tracking-tighter">{backup.size} • {backup.type}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                            <button 
                              onClick={() => handleDownload(backup.name)}
                              className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" 
                              title="Download Backup"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleRestore(backup.name)}
                              disabled={restoring === backup.name}
                              className={`p-2 rounded-lg transition-all ${
                                restoring === backup.name ? 'bg-amber-100 text-amber-600 animate-pulse' : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                              }`} 
                              title="Restore Database"
                            >
                              <RefreshCcw className={`w-4 h-4 ${restoring === backup.name ? 'animate-spin' : ''}`} />
                            </button>
                            <button 
                              onClick={() => handleDelete(backup.name)}
                              className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  
                  {backups.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-20 text-center">
                        <div className="max-w-xs mx-auto space-y-3">
                          <div className="w-12 h-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                            <Database className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-tight">No Backups Found</p>
                            <p className="text-[10px] text-gray-400 font-medium">Create your first database snapshot to ensure data safety.</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security Advisory */}
          <div className="bg-rose-50 border border-rose-100 p-5 rounded-2xl flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-200">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-rose-900 uppercase tracking-tight leading-none mb-1">
                {language === 'bn' ? 'সতর্কবার্তা' : 'Security & Integrity Advisory'}
              </h4>
              <p className="text-xs text-rose-800 font-medium leading-relaxed">
                {language === 'bn'
                  ? 'ব্যাকআপ ফাইলগুলিতে সংবেদনশীল গ্রাহক এবং সিস্টেম ডেটা রয়েছে। শুধুমাত্র অনুমোদিত প্রশাসকদের এই ফাইলগুলি ডাউনলোড বা রিস্টোর করার অনুমতি দিন।'
                  : 'Database backups contain sensitive customer, order, and system configuration data. Ensure backup files are stored securely and never shared with unauthorized personnel. RESTORE operations will overwrite live production data.'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
