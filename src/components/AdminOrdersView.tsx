import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Search,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Phone,
  MapPin,
  RefreshCw,
  Download,
  Calendar,
  DollarSign,
  PackageCheck,
  MessageSquare,
  ChevronDown,
  User,
  X,
  FileText
} from 'lucide-react';
import { CapturedOrder } from '../types';

interface AdminOrdersViewProps {
  authToken: string;
  showToast: (msg: string) => void;
}

export const AdminOrdersView: React.FC<AdminOrdersViewProps> = ({ authToken, showToast }) => {
  const [orders, setOrders] = useState<CapturedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [bookingOrderId, setBookingOrderId] = useState<string | null>(null);

  // Manual / Edit Order Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<CapturedOrder | null>(null);

  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formQty, setFormQty] = useState(1);
  const [formCod, setFormCod] = useState(790);
  const [formLocation, setFormLocation] = useState<'inside_dhaka' | 'outside_dhaka'>('inside_dhaka');
  const [formDeliveryCharge, setFormDeliveryCharge] = useState(70);
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000); // Poll every 10s for new chat orders
    return () => clearInterval(interval);
  }, [authToken]);

  const openCreateModal = () => {
    setEditingOrder(null);
    setFormName('');
    setFormPhone('');
    setFormAddress('');
    setFormProduct('Gift Ghor Product');
    setFormQty(1);
    setFormCod(790);
    setFormLocation('inside_dhaka');
    setFormDeliveryCharge(70);
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (order: CapturedOrder) => {
    setEditingOrder(order);
    setFormName(order.customerName || '');
    setFormPhone(order.customerPhone);
    setFormAddress(order.customerAddress);
    setFormProduct(order.productName);
    setFormQty(order.quantity);
    setFormCod(order.codAmount);
    setFormLocation(order.deliveryLocation);
    setFormDeliveryCharge(order.deliveryCharge);
    setFormNotes(order.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPhone.trim() || !formProduct.trim()) {
      showToast('Customer phone and product name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingOrder) {
        // Update
        const payload = {
          customerName: formName,
          customerPhone: formPhone,
          customerAddress: formAddress,
          productName: formProduct,
          quantity: Number(formQty),
          codAmount: Number(formCod),
          deliveryLocation: formLocation,
          deliveryCharge: Number(formDeliveryCharge),
          totalAmount: Number(formCod) + Number(formDeliveryCharge),
          notes: formNotes,
        };

        const res = await fetch(`/api/admin/orders/${editingOrder.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast('Order updated successfully!');
          setIsModalOpen(false);
          loadOrders();
        } else {
          showToast('Failed to update order');
        }
      } else {
        // Create manual
        const payload = {
          customerName: formName,
          customerPhone: formPhone,
          customerAddress: formAddress,
          productName: formProduct,
          quantity: Number(formQty),
          codAmount: Number(formCod),
          deliveryLocation: formLocation,
          deliveryCharge: Number(formDeliveryCharge),
          notes: formNotes,
        };

        const res = await fetch('/api/admin/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          showToast('New manual order created and synced to Firebase!');
          setIsModalOpen(false);
          loadOrders();
        } else {
          showToast('Failed to create order');
        }
      }
    } catch (err) {
      showToast('Error saving order');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(`Order status set to ${newStatus}`);
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as any } : o))
        );
      }
    } catch (e) {
      showToast('Failed to change status');
    }
  };

  const handleBookSteadfast = async (order: CapturedOrder) => {
    if (!order.customerPhone || !order.customerAddress) {
      showToast('Customer phone and address are required for Steadfast booking!');
      return;
    }

    setBookingOrderId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/book-steadfast`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Steadfast Consignment booked! #${data.consignment_id || ''}`);
        loadOrders();
      } else {
        showToast(data.error || 'Failed to book with Steadfast');
      }
    } catch (e) {
      showToast('Network error while booking Steadfast');
    } finally {
      setBookingOrderId(null);
    }
  };

  const handleDeleteOrder = async (id: string, orderNum: string) => {
    if (!confirm(`Are you sure you want to delete order #${orderNum}?`)) return;

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (res.ok) {
        showToast('Order removed from database and Cloud Firestore');
        setOrders((prev) => prev.filter((o) => o.id !== id));
      }
    } catch (e) {
      showToast('Failed to delete order');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (orders.length === 0) {
      showToast('No orders to export');
      return;
    }

    const headers = ['Order Number', 'Date', 'Customer Name', 'Phone', 'Address', 'Product', 'Qty', 'COD Amount', 'Delivery Zone', 'Delivery Charge', 'Total Amount', 'Status', 'Steadfast Consignment', 'Steadfast Tracking', 'Source'];
    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString(),
      `"${(o.customerName || '').replace(/"/g, '""')}"`,
      `"${o.customerPhone}"`,
      `"${(o.customerAddress || '').replace(/"/g, '""')}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      o.quantity,
      o.codAmount,
      o.deliveryLocation,
      o.deliveryCharge,
      o.totalAmount,
      o.status,
      o.steadfastConsignmentId || '',
      o.steadfastTrackingCode || '',
      o.source,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `giftghor_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders exported to CSV!');
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerName && o.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      o.customerPhone.includes(searchQuery) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (o.customerAddress && o.customerAddress.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && o.status === statusFilter;
  });

  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Controls Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#ECECEC] shadow-xs">
        <div>
          <h2 className="font-bold text-lg text-[#262626] flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#ECA548]" />
            Order Management & Auto-Captured Leads
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-captured from customer AI chats and permanently synced to Cloud Firestore.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-95 shrink-0"
            style={{ backgroundColor: '#ECA548' }}
          >
            <Plus className="w-4 h-4" />
            <span>Manual Order</span>
          </button>

          <button
            onClick={exportToCSV}
            className="px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-gray-50 hover:bg-gray-100 border border-[#ECECEC] text-gray-700 flex items-center gap-1.5 transition-all shrink-0"
            title="Export to CSV"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={loadOrders}
            disabled={loading}
            className="p-2.5 rounded-xl text-gray-500 hover:text-gray-900 bg-gray-50 border border-[#ECECEC] transition-all shrink-0"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#ECA548]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-[#ECECEC] shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Orders
          </span>
          <span className="text-2xl font-bold text-[#262626] mt-1 block">
            {orders.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECECEC] shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Total Value (COD)
          </span>
          <span className="text-2xl font-bold text-emerald-600 mt-1 block">
            ৳{totalRevenue.toLocaleString()}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECECEC] shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Steadfast Booked
          </span>
          <span className="text-2xl font-bold text-sky-600 mt-1 block">
            {orders.filter((o) => o.status === 'steadfast_booked').length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#ECECEC] shadow-xs">
          <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
            Pending Confirmation
          </span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {orders.filter((o) => o.status === 'pending').length}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#ECECEC]">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, phone, customer, product..."
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-gray-50 border border-[#ECECEC] rounded-xl focus:outline-none focus:border-[#ECA548] focus:bg-white text-[#262626]"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-hide py-1">
          {['all', 'confirmed', 'steadfast_booked', 'pending', 'delivered', 'cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all capitalize ${
                statusFilter === tab
                  ? 'bg-[#262626] text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 bg-gray-50 border border-[#ECECEC]'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table & Cards */}
      <div className="bg-white rounded-2xl border border-[#ECECEC] overflow-hidden shadow-xs">
        {loading && orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs flex flex-col items-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#ECA548]" />
            <span>Loading orders from Cloud Firestore...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="font-semibold text-gray-600 text-sm">No orders found</p>
            <p className="text-gray-400 mt-1">
              When customers place an order in the AI chat or when you add manual orders, they will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-700">
              <thead className="bg-[#F8F9FA] text-[11px] font-bold text-gray-500 uppercase border-b border-[#ECECEC]">
                <tr>
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Address & Zone</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Steadfast</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC]">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#262626]">{order.orderNumber}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-semibold mt-1 ${
                        order.source === 'chat' ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {order.source === 'chat' ? 'AI Chat' : 'Manual'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-[#262626] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>{order.customerName || 'Guest'}</span>
                      </div>
                      <a
                        href={`tel:${order.customerPhone}`}
                        className="text-[11px] font-semibold text-[#0284C7] hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Phone className="w-3 h-3 text-sky-500" />
                        <span>{order.customerPhone}</span>
                      </a>
                    </td>

                    <td className="py-3 px-4 max-w-xs">
                      <div className="text-[11px] text-[#262626] line-clamp-2" title={order.customerAddress}>
                        {order.customerAddress || <span className="italic text-gray-400">Address pending in chat</span>}
                      </div>
                      <span className="text-[10px] font-semibold text-gray-500 mt-1 inline-block">
                        {order.deliveryLocation === 'inside_dhaka' ? 'Inside Dhaka (৳70)' : 'Outside Dhaka (৳130)'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-[#262626] line-clamp-1">{order.productName}</div>
                      <div className="text-[10px] text-gray-500">Qty: {order.quantity} (৳{order.codAmount})</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-bold text-sm text-emerald-700">৳{order.totalAmount}</div>
                      <div className="text-[10px] text-gray-400">COD (Charge: ৳{order.deliveryCharge})</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                          order.status === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : order.status === 'steadfast_booked'
                            ? 'bg-sky-50 text-sky-700 border-sky-200'
                            : order.status === 'delivered'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : order.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="steadfast_booked">Steadfast Booked</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {order.status === 'steadfast_booked' ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3 text-sky-600" />
                            Booked
                          </span>
                          {order.steadfastConsignmentId && (
                            <span className="text-[10px] text-gray-500 font-mono block mt-0.5">
                              ID: {order.steadfastConsignmentId}
                            </span>
                          )}
                          {order.steadfastTrackingCode && (
                            <span className="text-[10px] text-gray-500 font-mono block">
                              Trk: {order.steadfastTrackingCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleBookSteadfast(order)}
                          disabled={bookingOrderId === order.id}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#262626] hover:bg-black transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                        >
                          <Truck className="w-3.5 h-3.5 text-[#ECA548]" />
                          <span>{bookingOrderId === order.id ? 'Booking...' : 'Send Steadfast'}</span>
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(order)}
                          title="Edit Order"
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                          title="Delete Order"
                          className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-[#ECECEC] p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#ECECEC] mb-4">
              <h3 className="font-bold text-base text-[#262626] flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#ECA548]" />
                <span>{editingOrder ? `Edit Order #${editingOrder.orderNumber}` : 'Create Manual Order'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Farhana Ahmed"
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    required
                    placeholder="017xxxxxxxx"
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Delivery Address *</label>
                <textarea
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  rows={2}
                  required
                  placeholder="House, Road, Area, Thana, District"
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-semibold text-gray-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formProduct}
                    onChange={(e) => setFormProduct(e.target.value)}
                    required
                    placeholder="e.g. Classic Leather Ladies Wallet"
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={formQty}
                    onChange={(e) => setFormQty(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Product Price (৳)</label>
                  <input
                    type="number"
                    value={formCod}
                    onChange={(e) => setFormCod(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Delivery Zone</label>
                  <select
                    value={formLocation}
                    onChange={(e) => {
                      const loc = e.target.value as any;
                      setFormLocation(loc);
                      setFormDeliveryCharge(loc === 'inside_dhaka' ? 70 : 130);
                    }}
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  >
                    <option value="inside_dhaka">Inside Dhaka</option>
                    <option value="outside_dhaka">Outside Dhaka</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Delivery Fee (৳)</label>
                  <input
                    type="number"
                    value={formDeliveryCharge}
                    onChange={(e) => setFormDeliveryCharge(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#FDF7EE] border border-[#ECA548]/30 flex items-center justify-between font-bold text-sm text-[#262626]">
                <span>Total Cash On Delivery (COD):</span>
                <span className="text-emerald-700 font-extrabold text-base">
                  ৳{Number(formCod) + Number(formDeliveryCharge)} BDT
                </span>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Special Notes (Optional)</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Call before delivery, gift wrap"
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3 py-2 text-[#262626]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#ECECEC] text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-white font-bold shadow-sm disabled:opacity-50"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  {isSubmitting ? 'Saving...' : editingOrder ? 'Update Order' : 'Save Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
