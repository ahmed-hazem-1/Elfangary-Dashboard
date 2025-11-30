
import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Order, OrderStatus } from '../types';
import { OrderService } from '../services/orderService';
import { WEBHOOK_CONFIG } from '../services/config';
import StatsBar from './StatsBar';
import OrderModal from './OrderModal';
import OrderSection from './OrderSection';
import { Search, Bell, RefreshCw, Loader2, Zap, History, CheckCircle2, XCircle, Bike, ChefHat, Clock, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

const OrdersView = forwardRef<{ refreshData: () => void }>((props, ref) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const intervalRef = useRef<any>(null);

  // Expose refreshData method to parent component
  useImperativeHandle(ref, () => ({
    refreshData: () => fetchData(true) // Silent refresh
  }));

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => {
        if (isOnline) fetchData(true);
    }, WEBHOOK_CONFIG.AUTO_REFRESH_INTERVAL_MS);

    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isOnline]);

  const fetchData = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const data = await OrderService.getOrders();
      data.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
      setOrders(data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error("Failed to fetch orders", error);
    } finally {
      setIsLoading(false);
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: OrderStatus) => {
    const orderToUpdate = orders.find(o => o.order_id === id);
    if (!orderToUpdate) return;
    setOrders(prev => prev.map(order => order.order_id === id ? { ...order, status: newStatus } : order));
    const success = await OrderService.updateStatus(orderToUpdate, newStatus);
    if (!success) {
        alert("Failed to update order status on server.");
        fetchData(true);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const result = await OrderService.deleteOrder(orderId);
      if (result.success) {
        // Remove the order from the local state immediately
        setOrders(prev => prev.filter(order => order.order_id !== orderId));
        // Also close the modal if this order was being viewed
        if (selectedOrder && selectedOrder.order_id === orderId) {
          setSelectedOrder(null);
        }
      } else {
        alert(`Failed to delete order: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const exportToExcel = () => {
    // Filter orders with valid customer names and phone numbers
    const customersWithInfo = orders
      .filter(order => {
        const hasName = order.customer?.full_name && 
                       order.customer.full_name.trim() !== '' && 
                       order.customer.full_name !== 'Unknown Customer' &&
                       order.customer.full_name !== 'Walk-in Customer';
        const hasPhone = order.customer?.phone_number && 
                        order.customer.phone_number.trim() !== '';
        return hasName && hasPhone;
      })
      .map(order => ({
        'الاسم': order.customer?.full_name || '',
        'رقم الهاتف': order.customer?.phone_number || '',
        'العنوان': order.shipping_address || '',
        'المصدر': order.customer?.source || '',
        'عدد الطلبات': orders.filter(o => o.customer?.phone_number === order.customer?.phone_number).length
      }));

    // Remove duplicates based on phone number
    const uniqueCustomers = customersWithInfo.reduce((acc, current) => {
      const exists = acc.find(item => item['رقم الهاتف'] === current['رقم الهاتف']);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, [] as typeof customersWithInfo);

    if (uniqueCustomers.length === 0) {
      alert('لا يوجد عملاء بأسماء وأرقام هواتف مسجلة');
      return;
    }

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(uniqueCustomers);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // الاسم
      { wch: 15 }, // رقم الهاتف
      { wch: 30 }, // العنوان
      { wch: 15 }, // المصدر
      { wch: 12 }  // عدد الطلبات
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'العملاء');

    // Generate file name with current date
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const fileName = `customers_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, fileName);
  };

  const filteredOrders = orders.filter(o => {
    const customerName = o.customer?.full_name || 'Unknown Customer';
    const orderId = o.order_id?.toString() || '';
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          orderId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const newOrders = filteredOrders.filter(o => o.status === OrderStatus.PENDING_CONFIRMATION);
  const preparingOrders = filteredOrders.filter(o => o.status === OrderStatus.CONFIRMED || o.status === OrderStatus.PREPARING);
  const deliveryOrders = filteredOrders.filter(o => o.status === OrderStatus.OUT_FOR_DELIVERY);
  const completedOrders = filteredOrders.filter(o => o.status === OrderStatus.DELIVERED);
  const canceledOrders = filteredOrders.filter(o => o.status === OrderStatus.CANCELED);

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-4">
         <Loader2 size={48} className="animate-spin text-brand-teal" />
         <div className="flex items-center gap-2 text-sm font-medium">
            <Zap size={16} />
            <span>Loading Orders...</span>
         </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Live Orders</h1>
                <p className="text-gray-500 text-sm">Real-time kitchen display and status management</p>
            </div>

            {/* Search & Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="relative flex-1 sm:flex-none sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="text-xs text-gray-400 hidden xl:block">
                    Updated: {lastUpdate.toLocaleTimeString()}
                </div>

                <button 
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium"
                  title="Export customers to Excel"
                >
                  <FileSpreadsheet size={18} />
                  <span className="hidden sm:inline">Export Excel</span>
                </button>

                <button 
                  onClick={() => fetchData()} 
                  className={`bg-white p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-brand-teal transition-all ${isRefreshing ? 'animate-spin text-brand-teal' : ''}`} 
                  title="Refresh"
                >
                    <RefreshCw size={20} />
                </button>
            </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-20 custom-scrollbar pr-2">
        <StatsBar orders={orders} />

        <OrderSection 
            title="Pending Confirmation" 
            colorClass="bg-brand-orange"
            countColorClass="bg-brand-orange text-white"
            icon={<Clock size={18} />}
            orders={newOrders}
            onStatusChange={handleStatusChange}
            onViewDetails={setSelectedOrder}
            onDelete={handleDeleteOrder}
            emptyMessage="No new orders"
        />

        <OrderSection 
            title="Kitchen / Preparing" 
            colorClass="bg-yellow-500"
            countColorClass="bg-yellow-500 text-white"
            icon={<ChefHat size={18} />}
            orders={preparingOrders}
            onStatusChange={handleStatusChange}
            onViewDetails={setSelectedOrder}
            onDelete={handleDeleteOrder}
            emptyMessage="Kitchen is clear"
        />

        <OrderSection 
            title="Out for Delivery" 
            colorClass="bg-brand-teal"
            countColorClass="bg-brand-teal text-white"
            icon={<Bike size={18} />}
            orders={deliveryOrders}
            onStatusChange={handleStatusChange}
            onViewDetails={setSelectedOrder}
            onDelete={handleDeleteOrder}
            emptyMessage="No active deliveries"
        />

        <div className="mt-10 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2 mb-4 px-2 text-gray-500">
                <History size={20} />
                <h2 className="font-bold text-sm uppercase tracking-wide">History</h2>
            </div>

            <OrderSection 
                title="Completed" 
                colorClass="bg-green-600"
                countColorClass="bg-green-600 text-white"
                icon={<CheckCircle2 size={18} />}
                orders={completedOrders}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedOrder}
                onDelete={handleDeleteOrder}
                emptyMessage="No history yet"
                defaultOpen={false}
            />

            <OrderSection 
                title="Canceled" 
                colorClass="bg-red-600"
                countColorClass="bg-red-600 text-white"
                icon={<XCircle size={18} />}
                orders={canceledOrders}
                onStatusChange={handleStatusChange}
                onViewDetails={setSelectedOrder}
                onDelete={handleDeleteOrder}
                emptyMessage="No canceled orders"
                defaultOpen={false}
            />
        </div>
      </div>

      {selectedOrder && (
        <OrderModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
            onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
});

export default OrdersView;
