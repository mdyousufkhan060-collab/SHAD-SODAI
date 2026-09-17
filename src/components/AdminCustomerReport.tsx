import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminCustomerReport = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>({});
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/admin/reports/customers`, { 
            headers: adminService.getHeaders() 
        });
        const data = await res.json();
        setStats(data.stats || { totalCustomers: 0, activeCustomers: 0, inactiveCustomers: 0 });
        setCustomers(data.customers || []);
    } catch (err) {
        console.error('Failed to fetch customer report:', err);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-black text-gray-900">{language === 'bn' ? 'কাস্টমার রিপোর্ট' : 'Customer Report'}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        <div className="p-3 bg-gray-50 rounded-lg border text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
            <p className="text-base font-black">{stats.totalCustomers}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-700 font-bold uppercase">Active</p>
            <p className="text-base font-black text-emerald-900">{stats.activeCustomers}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
            <p className="text-[10px] text-red-700 font-bold uppercase">Inactive</p>
            <p className="text-base font-black text-red-900">{stats.inactiveCustomers}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
            <thead className="bg-gray-50">
                <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Total Orders</th>
                    <th className="p-2">Total Spent</th>
                </tr>
            </thead>
            <tbody>
                {customers.map((c, index) => (
                    <tr key={c.id || index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-bold cursor-pointer hover:text-emerald-600" onClick={() => window.location.hash = `#/admin/customers/edit/${c.id}`}>{c.full_name}</td>
                        <td className="p-2">{c.phone}</td>
                        <td className="p-2">{c.totalOrders || 0}</td>
                        <td className="p-2">৳{Number(c.totalSpent || 0).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
