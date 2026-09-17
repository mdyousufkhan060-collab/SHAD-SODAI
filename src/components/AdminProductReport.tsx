import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { useLanguage } from '../context/LanguageContext';

export const AdminProductReport = () => {
  const { language } = useLanguage();
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
        const res = await fetch(`/api/admin/reports/products`, { 
            headers: adminService.getHeaders() 
        });
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        setStats(data.stats || { totalProducts: 0, activeProducts: 0, inactiveProducts: 0, outOfStock: 0, lowStock: 0 });
        setProducts(data.products || []);
    } catch (err) {
        console.error('Failed to fetch product report:', err);
        setError('Failed to load product report.');
    } finally {
        setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-4 text-xs">Loading...</div>;
  if (error) return <div className="p-4 text-red-600 text-xs">Error: {error} <button onClick={fetchReport} className="underline">Retry</button></div>;

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-lg font-black text-gray-900">{language === 'bn' ? 'প্রোডাক্ট রিপোর্ট' : 'Product Report'}</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="p-3 bg-gray-50 rounded-lg border text-center">
            <p className="text-[10px] text-gray-500 font-bold uppercase">Total</p>
            <p className="text-base font-black">{stats.totalProducts}</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 text-center">
            <p className="text-[10px] text-emerald-700 font-bold uppercase">Active</p>
            <p className="text-base font-black text-emerald-900">{stats.activeProducts}</p>
        </div>
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 text-center">
            <p className="text-[10px] text-amber-700 font-bold uppercase">Low Stock</p>
            <p className="text-base font-black text-amber-900">{stats.lowStock}</p>
        </div>
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 text-center">
            <p className="text-[10px] text-red-700 font-bold uppercase">Out Stock</p>
            <p className="text-base font-black text-red-900">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
            <thead className="bg-gray-50">
                <tr>
                    <th className="p-2">Name</th>
                    <th className="p-2">SKU</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Units Sold</th>
                </tr>
            </thead>
            <tbody>
                {products.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-gray-500">No product sales data found for this period.</td></tr>
                ) : (
                    products.map((p, index) => (
                        <tr key={p.id || index} className="border-b hover:bg-gray-50">
                            <td className="p-2 font-bold cursor-pointer hover:text-emerald-600" onClick={() => window.location.hash = `#/admin/products/edit/${p.id}`}>{p.name}</td>
                            <td className="p-2">{p.sku}</td>
                            <td className="p-2">৳{p.selling_price}</td>
                            <td className="p-2">{p.stock}</td>
                            <td className="p-2">{p.unitsSold || 0}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
      </div>
    </div>
  );
};
