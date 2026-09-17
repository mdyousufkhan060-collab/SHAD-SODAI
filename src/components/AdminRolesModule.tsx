import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  ShieldCheck, 
  History, 
  Plus, 
  Search, 
  Filter,
  UserPlus,
  Shield
} from 'lucide-react';
import { AdminUsersList } from './AdminUsersList';
import { AdminRoleManagement } from './AdminRoleManagement';
import { AdminAuditLogs } from './AdminAuditLogs';

interface AdminRolesModuleProps {
  language: 'en' | 'bn';
}

export const AdminRolesModule: React.FC<AdminRolesModuleProps> = ({ language }) => {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'roles' | 'audit'>('users');

  const tabs = [
    { id: 'users', labelEn: 'Admin Users', labelBn: 'অ্যাডমিন ব্যবহারকারী', icon: Users },
    { id: 'roles', labelEn: 'Role Management', labelBn: 'রোল ব্যবস্থাপনা', icon: ShieldCheck },
    { id: 'audit', labelEn: 'Audit Logs', labelBn: 'অডিট লগ', icon: History }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header with Breadcrumbs and Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
            <span>Settings</span>
            <span>/</span>
            <span className="text-emerald-600">Admin Roles & Permissions</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-600" />
            {language === 'bn' ? 'অ্যাডমিন ইউজার এবং রোলস' : 'Admin Users & Roles'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {language === 'bn' 
              ? 'অ্যাডমিন অ্যাক্সেস, কাস্টম রোল এবং পারমিশন ম্যানেজ করুন' 
              : 'Manage administrative access, custom roles, and granular permissions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'users' && (
            <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95">
              <UserPlus className="w-4 h-4" />
              {language === 'bn' ? 'নতুন অ্যাডমিন' : 'Add New Admin'}
            </button>
          )}
          {activeSubTab === 'roles' && (
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md active:scale-95">
              <Plus className="w-4 h-4" />
              {language === 'bn' ? 'নতুন রোল' : 'Create Custom Role'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit border border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${activeSubTab === tab.id 
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
            `}
          >
            <tab.icon className={`w-4 h-4 ${activeSubTab === tab.id ? 'text-emerald-600' : ''}`} />
            {language === 'bn' ? tab.labelBn : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Tab Content Rendering */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSubTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeSubTab === 'users' && <AdminUsersList language={language} />}
            {activeSubTab === 'roles' && <AdminRoleManagement language={language} />}
            {activeSubTab === 'audit' && <AdminAuditLogs language={language} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
