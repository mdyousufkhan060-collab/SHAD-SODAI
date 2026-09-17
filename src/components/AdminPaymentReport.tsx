import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminPaymentReport = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
        const res = await fetch(`/api/admin/reports/payments`, { 
            headers: adminService.getHeaders() 
        });
        const data = await res.json();
        setStats(data.stats || { totalPayments: 0, successfulPayments: 0, pendingPayments: 0, failedPayments: 0, refundedPayments: 0, totalPaidAmount: 0 });
        setTransactions(data.transactions || []);
    } catch (err) {
        console.error('Failed to fetch payment report:', err);
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-black text-gray-900">{language === 'bn' ? 'পেমেন্ট রিপোর্ট' : 'Payment Report'}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 bg-gray-50 rounded-lg border text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
            <p className="text-base font-black">{stats.totalPayments}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-700 font-bold uppercase">Successful</p>
            <p className="text-base font-black text-emerald-900">{stats.successfulPayments}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
            <p className="text-[10px] text-amber-700 font-bold uppercase">Pending</p>
            <p className="text-base font-black text-amber-900">{stats.pendingPayments}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
            <p className="text-[10px] text-red-700 font-bold uppercase">Failed</p>
            <p className="text-base font-black text-red-900">{stats.failedPayments}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
            <thead className="bg-gray-50">
                <tr>
                    <th className="p-2">Order ID</th>
                    <th className="p-2">Method</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Amount</th>
                </tr>
            </thead>
            <tbody>
                {transactions.map((t, index) => (
                    <tr key={t.id || index} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-bold cursor-pointer hover:text-emerald-600" onClick={() => window.location.hash = `#/admin/orders/details/${t.id}`}>{t.id}</td>
                        <td className="p-2">{t.payment_method}</td>
                        <td className="p-2 capitalize">{t.payment_status}</td>
                        <td className="p-2">৳{Number(t.total_amount || 0).toLocaleString()}</td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};
