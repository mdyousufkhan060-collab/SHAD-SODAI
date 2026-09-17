import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

export const AdminSalesReport = () => {
  const { language } = useLanguage();
  const [reportData, setReportData] = useState<any>({ 
    stats: { totalOrders: 0, totalSales: 0, avgOrderValue: 0, paidOrders: 0, pendingOrders: 0, cancelledOrders: 0, refundedAmount: 0 }, 
    statuses: [] 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    fetchReport();
  }, [dateRange]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      let start = new Date();
      if (dateRange === '30') start.setDate(now.getDate() - 30);
      else if (dateRange === '7') start.setDate(now.getDate() - 7);
      else if (dateRange === '1') start.setDate(now.getDate() - 1);
      
      const res = await fetch(`/api/admin/reports/sales?start=${start.toISOString()}&end=${now.toISOString()}`, { 
        headers: adminService.getHeaders() 
      });
      const data = await res.json();
      
      // Normalize statuses
      const normalizedStatuses = (data.statuses || []).reduce((acc: any, cur: any) => {
          const status = cur.status.charAt(0).toUpperCase() + cur.status.slice(1).toLowerCase();
          const existing = acc.find((s: any) => s.status === status);
          if (existing) existing.count += cur.count;
          else acc.push({ status, count: cur.count });
          return acc;
      }, []);
      
      setReportData({ ...data, statuses: normalizedStatuses });
    } catch (err) {
      console.error('Failed to fetch sales report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-6 text-xs text-gray-500">Loading...</div>;

  const COLORS = ['#059669', '#d97706', '#dc2626', '#2563eb', '#6b7280', '#9f1239'];

  const SummaryCard = ({ label, value }: { label: string, value: string | number }) => (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-[10px] text-gray-500 font-bold uppercase">{label}</p>
          <p className="text-base font-black text-gray-900">{value}</p>
      </div>
  );

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-black text-gray-900">{language === 'bn' ? 'সেলস রিপোর্ট' : 'Sales Report'}</h2>
        <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="text-[10px] p-1.5 border rounded-md">
            <option value="1">Today/Yesterday</option>
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <SummaryCard label="Total Orders" value={reportData.stats.totalOrders} />
        <SummaryCard label="Total Sales" value={`৳${Number(reportData.stats.totalSales || 0).toLocaleString()}`} />
        <SummaryCard label="Avg Order Value" value={`৳${Number(reportData.stats.avgOrderValue || 0).toLocaleString()}`} />
        <SummaryCard label="Paid Orders" value={reportData.stats.paidOrders || 0} />
      </div>

      <div className="bg-white p-3 rounded-lg border border-gray-100">
        <h3 className="text-xs font-black mb-2">Orders by Status</h3>
        {reportData.statuses.length > 0 ? (
            <div className="h-56 flex flex-col items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={reportData.statuses} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={2} fill="#8884d8">
                            {reportData.statuses.map((_:any, index:number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                        <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-56 flex flex-col items-center justify-center text-gray-400 text-xs text-center p-4">
                No orders found for this period.<br/>Try selecting a different date range.
            </div>
        )}
      </div>
    </div>
  );
};
