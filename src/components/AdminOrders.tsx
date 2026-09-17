import React, { useState, useEffect } from 'react';
import { adminService } from '../utils/adminService';
import { 
  Search, 
  Filter, 
  Eye, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  MapPin, 
  Phone, 
  Mail, 
  User, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  CreditCard,
  Package,
  ArrowLeft
} from 'lucide-react';

interface AdminOrdersProps {
  language: 'en' | 'bn';
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ language }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, searchTerm]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders?page=${page}&status=${statusFilter}&search=${searchTerm}`, {
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetails = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        headers: adminService.getHeaders()
      });
      const data = await res.json();
      setSelectedOrder(data);
    } catch (err) {
      console.error('Failed to fetch order details');
    }
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: adminService.getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        fetchOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          fetchOrderDetails(orderId);
        }
      }
    } catch (err) {
      console.error('Failed to update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return <span className="bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-emerald-100 uppercase">Delivered</span>;
      case 'shipped':
        return <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-blue-100 uppercase">Shipped</span>;
      case 'processing':
        return <span className="bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-purple-100 uppercase">Processing</span>;
      case 'cancelled':
        return <span className="bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-red-100 uppercase">Cancelled</span>;
      default:
        return <span className="bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full text-[10px] font-black border border-amber-100 uppercase">Pending</span>;
    }
  };

  if (selectedOrder) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in text-left">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
          <button 
            onClick={() => setSelectedOrder(null)}
            className="flex items-center gap-2 text-xs font-black text-gray-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'bn' ? 'অর্ডার তালিকায় ফিরে যান' : 'Back to Orders'}
          </button>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 border border-gray-100">
              <Download className="w-4 h-4" />
            </button>
            <select 
              value={selectedOrder.status}
              onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
              className="text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Details & Items */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                  <Package className="w-4 h-4 text-emerald-600" />
                  Order #{selectedOrder.id}
                </h3>
                <span className="text-[10px] font-bold text-gray-400">{new Date(selectedOrder.created_at).toLocaleString()}</span>
              </div>
              <div className="p-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-400 font-black uppercase tracking-wider border-b border-gray-100">
                      <th className="py-2 text-left">Product</th>
                      <th className="py-2 text-center">Price</th>
                      <th className="py-2 text-center">Qty</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {selectedOrder.items?.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="py-3 font-bold text-gray-700">{item.product_name}</td>
                        <td className="py-3 text-center text-gray-500">৳{item.price}</td>
                        <td className="py-3 text-center text-gray-500">x{item.quantity}</td>
                        <td className="py-3 text-right font-black text-gray-800">৳{item.price * item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-gray-100">
                      <td colSpan={3} className="py-2 text-right text-gray-500 font-bold">Subtotal:</td>
                      <td className="py-2 text-right font-bold">৳{selectedOrder.subtotal || (selectedOrder.total_amount - (selectedOrder.delivery_charge || 0))}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="py-2 text-right text-gray-500 font-bold">Delivery Charge:</td>
                      <td className="py-2 text-right font-bold text-emerald-600">+৳{selectedOrder.delivery_charge || 0}</td>
                    </tr>
                    <tr className="text-base font-black text-gray-900">
                      <td colSpan={3} className="py-3 text-right">Grand Total:</td>
                      <td className="py-3 text-right text-emerald-700">৳{selectedOrder.total_amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Method</p>
                  <p className="text-xs font-black text-gray-700 uppercase mt-1">{selectedOrder.payment_method}</p>
                </div>
                {selectedOrder.payment_details && (
                  <>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Transaction ID</p>
                      <p className="text-xs font-black text-gray-700 mt-1">{selectedOrder.payment_details.transaction_id || 'N/A'}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sender Number</p>
                      <p className="text-xs font-black text-gray-700 mt-1">{selectedOrder.payment_details.sender_number || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Customer & Address Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Customer Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                    <User className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 leading-none">Name</p>
                    <p className="text-xs font-black text-gray-700 mt-1">{selectedOrder.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 leading-none">Phone</p>
                    <p className="text-xs font-black text-gray-700 mt-1">{selectedOrder.customer_phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center border border-amber-100">
                    <Mail className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 leading-none">Email</p>
                    <p className="text-xs font-black text-gray-700 mt-1 truncate">{selectedOrder.customer_email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-150 shadow-xs p-4 space-y-4">
              <h3 className="text-sm font-black text-gray-800 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Delivery Address
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">House</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.house_number || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Road/Area</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.road_area || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ward No</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.ward_number || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Thana</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.thana || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">District</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.district || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Post Code</p>
                    <p className="text-xs font-black text-gray-700 mt-0.5">{selectedOrder.post_code || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="bg-emerald-50/50 p-3 rounded-lg border border-emerald-100 border-dashed">
                  <p className="text-[9px] font-black text-emerald-800 uppercase tracking-widest">Full Address Label</p>
                  <p className="text-[11px] font-bold text-gray-600 mt-1 leading-relaxed">
                    House No: {selectedOrder.house_number}, Road/Area: {selectedOrder.road_area}, Ward No: {selectedOrder.ward_number}, Thana: {selectedOrder.thana}, District: {selectedOrder.district}, Post Code: {selectedOrder.post_code}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in text-left">
      <div className="bg-white p-5 rounded-xl border border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <span className="text-[9px] text-emerald-700 font-black tracking-widest uppercase block">Order Management</span>
          <h2 className="text-base font-black text-gray-800 leading-tight">Customer Orders</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by ID or Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all w-full md:w-64"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-150 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 transition-all"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-150 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-black uppercase tracking-wider">
                <th className="px-5 py-3 text-left">Order ID</th>
                <th className="px-5 py-3 text-left">Customer</th>
                <th className="px-5 py-3 text-left">Date</th>
                <th className="px-5 py-3 text-right">Total</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 font-bold">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400 font-bold">No orders found.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-black text-gray-800">{order.id}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-700">{order.customer_name}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{order.customer_phone}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 font-bold">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right font-black text-gray-800">
                      ৳{Number(order.total_amount).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-center">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button 
                          onClick={() => fetchOrderDetails(order.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/30">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-1.5 border border-gray-150 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 border border-gray-150 rounded-lg hover:bg-white disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
