import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminDeliveryReport = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [deliveries, setDeliveries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/admin/reports/delivery`, { 
            headers: adminService.getHeaders() 
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setStats(data.stats || {});
        setDeliveries(data.deliveries || []);
    } catch (err) {
        console.error('Failed to fetch delivery report:', err);
        setError('Unable to load delivery report.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;
  if (error) return <div className="p-4 text-red-600 text-xs">Error: {error} <button onClick={fetchReport} className="underline">Retry</button></div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-black text-gray-900">{language === 'bn' ? 'ডেলিভারি রিপোর্ট' : 'Delivery Report'}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
        <div className="p-2 bg-gray-50 rounded-lg border text-center font-bold">Total: {stats.totalDeliveries || 0}</div>
        <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-center font-bold text-amber-900">Pending: {stats.pendingDeliveries || 0}</div>
        <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-center font-bold text-blue-900">Shipped: {stats.shippedDeliveries || 0}</div>
        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-center font-bold text-emerald-900">Delivered: {stats.deliveredDeliveries || 0}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
            <thead className="bg-gray-50">
                <tr>
                    <th className="p-2">Order ID</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Tracking</th>
                </tr>
            </thead>
            <tbody>
                {deliveries.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-gray-500">No delivery data available.</td></tr>
                ) : (
                    deliveries.map((d, index) => (
                        <tr key={d.id || index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-bold cursor-pointer hover:text-emerald-600" onClick={() => window.location.hash = `#/admin/orders/details/${d.id}`}>{d.id}</td>
                            <td className="p-2">{d.customerName}</td>
                            <td className="p-2 capitalize">{d.delivery_status}</td>
                            <td className="p-2">{d.tracking_number || 'N/A'}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
