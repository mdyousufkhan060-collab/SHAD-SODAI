import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { BarChart3, FileSpreadsheet } from 'lucide-react';

export const AdminReportsDashboard = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/admin/reports/overview`, { 
            headers: adminService.getHeaders() 
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setStats(data);
    } catch (err) {
        console.error('Failed to fetch reports overview:', err);
        setError('Unable to load report.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;
  if (error) return <div className="p-4 text-red-600 text-xs">Error: {error} <button onClick={fetchOverview} className="underline">Retry</button></div>;

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders || 0 },
    { label: 'Total Customers', value: stats.totalCustomers || 0 },
    { label: 'Total Products', value: stats.totalProducts || 0 },
    { label: 'Total Payments', value: `৳${Number(stats.totalPayments || 0).toLocaleString()}` },
    { label: 'Total Profit', value: `৳${Number(stats.totalProfit || 0).toLocaleString()}` },
    { label: 'Pending Orders', value: stats.pendingOrders || 0 },
    { label: 'Completed Orders', value: stats.completedOrders || 0 },
    { label: 'Low Stock Products', value: stats.lowStockProducts || 0 },
    { label: 'Out of Stock Products', value: stats.outOfStockProducts || 0 },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-black text-gray-900">{language === 'bn' ? 'রিপোর্ট ও অ্যানালিটিক্স' : 'Reports & Analytics'}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {statCards.map((stat, i) => (
            <div key={i} className="p-3 bg-white rounded-lg border shadow-sm text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase">{stat.label}</p>
                <p className="text-sm font-black">{stat.value}</p>
            </div>
        ))}
      </div>
    </div>
  );
};
