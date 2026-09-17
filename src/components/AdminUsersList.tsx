import React, { useState, useEffect } from 'react';
import { 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Key, 
  LogOut, 
  UserMinus, 
  UserCheck, 
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'motion/react';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  role_id: number;
  status: 'active' | 'inactive';
  last_login_at: string | null;
  created_at: string;
}

interface AdminUsersListProps {
  language: 'en' | 'bn';
}

export const AdminUsersList: React.FC<AdminUsersListProps> = ({ language }) => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch admin users');
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      const token = localStorage.getItem('admin_session_token');
      const user = users.find(u => u.id === id);
      if (!user) return;

      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...user, status: newStatus })
      });

      if (response.ok) {
        setUsers(users.map(u => u.id === id ? { ...u, status: newStatus as any } : u));
      }
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Admins...</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Admin Details</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-[11px] font-black text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold border border-emerald-200 shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-900 leading-none mb-1">{user.name}</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Mail className="w-3 h-3" /> {user.email}
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                              <Phone className="w-3 h-3" /> {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${
                        user.role === 'Super Admin' 
                          ? 'bg-rose-50 text-rose-700 border-rose-100' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {user.role}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => toggleStatus(user.id, user.status)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-all ${
                        user.status === 'active' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100' 
                          : 'bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100'
                      }`}
                    >
                      {user.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          {language === 'bn' ? 'সক্রিয়' : 'Active'}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          {language === 'bn' ? 'নিষ্ক্রিয়' : 'Inactive'}
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[11px] text-gray-500 font-medium">
                      {user.last_login_at 
                        ? new Date(user.last_login_at).toLocaleString()
                        : (language === 'bn' ? 'কখনো না' : 'Never')
                      }
                    </div>
                    <div className="text-[9px] text-gray-400 mt-0.5">
                      {language === 'bn' ? 'তৈরি:' : 'Joined:'} {new Date(user.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Edit Admin">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="Delete Account">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Summary Footer */}
      <div className="flex items-center justify-between px-2 text-[11px] text-gray-400 font-bold uppercase tracking-widest">
        <div>Showing {users.length} Administrative accounts</div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span>Super Admin accounts cannot be disabled or deleted from the UI.</span>
        </div>
      </div>
    </div>
  );
};
