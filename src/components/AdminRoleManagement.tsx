import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ChevronRight, 
  CheckSquare, 
  Square,
  Save,
  Trash2,
  Plus,
  Lock,
  Globe,
  Settings as SettingsIcon,
  ShoppingBag,
  Package,
  Users as UsersIcon,
  Headset,
  BarChart3,
  CreditCard,
  Truck,
  Layers,
  Layout,
  FileText,
  Eye,
  Edit,
  Trash,
  CheckCircle,
  Download,
  Terminal
} from 'lucide-react';

interface Role {
  id: number;
  name: string;
  description: string;
  is_custom: boolean;
}

interface Permission {
  id: number;
  resource: string;
  action: string;
}

interface AdminRoleManagementProps {
  language: 'en' | 'bn';
}

const RESOURCE_ICONS: Record<string, any> = {
  Dashboard: Layout,
  Products: Package,
  Categories: Layers,
  Brands: Globe,
  Orders: ShoppingBag,
  Customers: UsersIcon,
  Support: Headset,
  Reviews: CheckCircle,
  Coupons: Download,
  Payments: CreditCard,
  Shipping: Truck,
  Reports: BarChart3,
  CMS: FileText,
  Settings: SettingsIcon,
  Tracking: Globe,
  Security: Lock,
  AdminUsers: Shield
};

export const AdminRoleManagement: React.FC<AdminRoleManagementProps> = ({ language }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedRoleId) {
      fetchRolePermissions(selectedRoleId);
    }
  }, [selectedRoleId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('admin_session_token');
      const [rolesRes, permsRes] = await Promise.all([
        fetch('/api/admin/roles', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/admin/permissions', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      const rolesData = await rolesRes.json();
      const permsData = await permsRes.json();
      
      setRoles(rolesData);
      setAllPermissions(permsData);
      if (rolesData.length > 0) setSelectedRoleId(rolesData[0].id);
    } catch (err) {
      console.error('Failed to fetch roles data', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRolePermissions = async (roleId: number) => {
    try {
      const token = localStorage.getItem('admin_session_token');
      const res = await fetch(`/api/admin/roles/${roleId}/permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json() as any[];
      setRolePermissions(data.map((p: any) => p.id));
    } catch (err) {
      console.error('Failed to fetch role permissions', err);
    }
  };

  const togglePermission = (permId: number) => {
    setRolePermissions(prev => 
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    );
  };

  const savePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setSaving(true);
      const token = localStorage.getItem('admin_session_token');
      const response = await fetch(`/api/admin/roles/${selectedRoleId}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ permission_ids: rolePermissions })
      });
      
      if (response.ok) {
        // Success alert or notification could go here
        alert('Permissions updated successfully!');
      }
    } catch (err) {
      console.error('Failed to save permissions', err);
    } finally {
      setSaving(false);
    }
  };

  const groupedPermissions = allPermissions.reduce((acc: Record<string, Permission[]>, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Roles Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Roles</h3>
            <button className="text-emerald-600 hover:bg-emerald-50 p-1.5 rounded-lg transition-all">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="p-2 space-y-1">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(role.id)}
                className={`w-full text-left p-3 rounded-xl transition-all group ${
                  selectedRoleId === role.id 
                    ? 'bg-emerald-50 border border-emerald-100' 
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      selectedRoleId === role.id ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-sm font-bold ${selectedRoleId === role.id ? 'text-emerald-900' : 'text-gray-900'}`}>
                        {role.name}
                      </div>
                      <div className="text-[10px] text-gray-500 line-clamp-1">{role.description}</div>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${selectedRoleId === role.id ? 'text-emerald-600 translate-x-1' : 'text-gray-300'}`} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedRoleId === 1 && (
          <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl flex gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-[11px] text-amber-800 font-bold leading-relaxed uppercase tracking-wide">
              The Super Admin role is protected. Permissions cannot be modified for this system role.
            </p>
          </div>
        )}
      </div>

      {/* Permissions Grid */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">
                Permissions for {roles.find(r => r.id === selectedRoleId)?.name}
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">
                Grant or revoke granular access to system resources
              </p>
            </div>
            {selectedRoleId !== 1 && (
              <button 
                onClick={savePermissions}
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                {language === 'bn' ? 'সংরক্ষণ করুন' : 'Save Changes'}
              </button>
            )}
          </div>

          <div className="p-6 overflow-y-auto max-h-[600px] custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(Object.entries(groupedPermissions) as [string, Permission[]][]).map(([resource, perms]) => {
                const Icon = RESOURCE_ICONS[resource] || SettingsIcon;
                return (
                  <div key={resource} className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-wider">{resource}</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                      {perms.map((perm) => {
                        const isChecked = rolePermissions.includes(perm.id);
                        const isSuperAdmin = selectedRoleId === 1;
                        return (
                          <button
                            key={perm.id}
                            disabled={isSuperAdmin}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-center gap-2 group text-left transition-colors ${isSuperAdmin ? 'cursor-default' : 'hover:bg-gray-50 rounded-lg p-1'}`}
                          >
                            {isChecked ? (
                              <CheckSquare className={`w-4 h-4 ${isSuperAdmin ? 'text-gray-400' : 'text-emerald-600'}`} />
                            ) : (
                              <Square className="w-4 h-4 text-gray-300 group-hover:text-emerald-300" />
                            )}
                            <span className={`text-[11px] font-bold uppercase tracking-tight ${isChecked ? 'text-gray-900' : 'text-gray-400'}`}>
                              {perm.action}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
