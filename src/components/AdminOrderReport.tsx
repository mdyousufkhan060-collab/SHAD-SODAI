import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminOrderReport = () => {
  const { language } = useLanguage();
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
        const now = new Date();
        const start = new Date();
        start.setDate(now.getDate() - 30);
        
        const res = await fetch(`/api/admin/reports/orders?start=${start.toISOString()}&end=${now.toISOString()}&page=${page}`, { 
            headers: adminService.getHeaders() 
        });
        const data = await res.json();
        setOrders(data.orders || []);
        setTotal(data.total || 0);
    } catch (err) {
        console.error('Failed to fetch order report:', err);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-lg font-black text-gray-900 mb-4">{language === 'bn' ? 'অর্ডার রিপোর্ট' : 'Order Report'}</h2>
      
      {isLoading ? <div className="text-xs">Loading...</div> : (
        <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
                <thead>
                    <tr className="border-b">
                        <th className="p-2">Order ID</th>
                        <th className="p-2">Customer</th>
                        <th className="p-2">Total</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Date</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map(o => (
                        <tr key={o.id} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-bold">{o.id}</td>
                            <td className="p-2">{o.customer_name}</td>
                            <td className="p-2">৳{o.total_amount}</td>
                            <td className="p-2">{o.status}</td>
                            <td className="p-2">{new Date(o.created_at).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}
    </div>
  );
};
