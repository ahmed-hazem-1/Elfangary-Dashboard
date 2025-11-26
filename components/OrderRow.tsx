
import React from 'react';
import { Order, OrderStatus } from '../types';
import { SOURCE_ICONS, SOURCE_COLORS } from '../constants';
import { Eye, Check, X, ChefHat, Bike, PackageCheck, Trash2 } from 'lucide-react';

interface OrderRowProps {
  order: Order;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
  onDelete: (orderId: string) => void;
}

const OrderRow: React.FC<OrderRowProps> = ({ order, onStatusChange, onViewDetails, onDelete }) => {
  const SourceIcon = SOURCE_ICONS[order.customer.source];
  const deliveryAddress = order.address || order.customer?.full_address;
  
  // Action Buttons based on status flow:
  // Pending -> Confirmed -> Preparing -> Out For Delivery -> Delivered
  const renderActions = () => {
    switch (order.status) {
      case OrderStatus.PENDING_CONFIRMATION:
        return (
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.CANCELED); }}
              className="p-2 rounded-lg text-black hover:bg-red-50 hover:text-black transition-colors"
              title="Cancel Order"
            >
              <X size={20} strokeWidth={2} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.CONFIRMED); }}
              className="bg-brand-teal text-black px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md shadow-brand-teal/20 hover:bg-brand-tealDark hover:text-black transition-all flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none"
            >
              <Check size={16} strokeWidth={2} /> <span className="hidden sm:inline">Confirm</span><span className="sm:hidden">OK</span>
            </button>
          </div>
        );
      case OrderStatus.CONFIRMED:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.PREPARING); }}
            className="bg-yellow-500 text-black px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md shadow-yellow-500/20 hover:bg-yellow-600 hover:text-black transition-all flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto"
          >
             <ChefHat size={16} strokeWidth={2} /> <span className="hidden sm:inline">Start Preparing</span><span className="sm:hidden">Prepare</span>
          </button>
        );
      case OrderStatus.PREPARING:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.OUT_FOR_DELIVERY); }}
            className="bg-brand-orange text-black px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md shadow-brand-orange/20 hover:bg-orange-600 hover:text-black transition-all flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto"
          >
             <Bike size={16} strokeWidth={2} /> <span className="hidden sm:inline">Send to Delivery</span><span className="sm:hidden">Deliver</span>
          </button>
        );
       case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.DELIVERED); }}
            className="bg-blue-500 text-black px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:text-black transition-all flex items-center justify-center gap-1 sm:gap-2 w-full sm:w-auto"
          >
             <PackageCheck size={16} strokeWidth={2} /> <span className="hidden sm:inline">Mark Delivered</span><span className="sm:hidden">Done</span>
          </button>
        );
      case OrderStatus.DELIVERED:
        return <span className="text-green-600 bg-green-50 px-3 py-1 rounded-full text-xs font-bold border border-green-100">Delivered</span>;
      case OrderStatus.CANCELED:
        return <span className="text-red-600 bg-red-50 px-3 py-1 rounded-full text-xs font-bold border border-red-100">Canceled</span>;
      default:
        return <span className="text-gray-400 text-sm">{order.status}</span>;
    }
  };

  return (
    <div 
        onClick={() => onViewDetails(order)}
        className="group bg-white hover:bg-gray-50 border-b border-gray-100 last:border-none py-4 px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center gap-4 transition-all cursor-pointer"
    >
      {/* Mobile: Header Row */}
      <div className="flex items-center justify-between sm:hidden">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${SOURCE_COLORS[order.customer.source] || 'bg-gray-100'}`}>
              {SourceIcon ? <SourceIcon size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
          </div>
          <div>
            <p className="font-bold text-gray-800">#{order.order_id}</p>
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">
                {order.customer.source}
            </span>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-gray-800 text-lg">{order.total_amount.toLocaleString()} EGP</p>
          <span className="font-mono text-xs text-gray-500">{order.time_elapsed}</span>
        </div>
      </div>

      {/* Mobile: Customer Info */}
      <div className="sm:hidden">
        <p className="font-semibold text-gray-800">{order.customer?.full_name || 'Unknown Customer'}</p>
        <p className="text-xs text-gray-500 line-clamp-1">{deliveryAddress || 'No address'}</p>
        <p className="text-xs text-gray-400 mt-1">
            {order.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Mobile: Actions */}
      <div className="flex items-center gap-2 sm:hidden">
        <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(order); }}
            className="p-2 text-black hover:text-black hover:bg-teal-50 rounded-full transition-colors"
            title="View Details"
        >
            <Eye size={20} strokeWidth={2} />
        </button>
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (window.confirm(`Are you sure you want to delete order #${order.order_id}?\n\nThis action cannot be undone.`)) {
                    onDelete(order.order_id);
                }
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Order"
        >
            <Trash2 size={18} strokeWidth={2} />
        </button>
        <div className="flex-1">
          {renderActions()}
        </div>
      </div>

      {/* Desktop: ID & Source */}
      <div className="hidden sm:flex items-center gap-6 w-1/4">
        <div>
            <p className="text-gray-400 text-xs font-medium mb-1">Order ID</p>
            <p className="font-bold text-gray-800">#{order.order_id}</p>
        </div>
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${SOURCE_COLORS[order.customer.source] || 'bg-gray-100'}`}>
            {SourceIcon ? <SourceIcon size={20} strokeWidth={2.5} /> : <Eye size={20} strokeWidth={2.5} />}
        </div>
        <div>
            <div className="flex items-center gap-2">
                <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-0.5 rounded">
                    {order.customer.source}
                </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[120px]">
                {order.created_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
        </div>
      </div>

      {/* Desktop: Customer */}
      <div className="hidden sm:block w-1/4">
        <p className="font-semibold text-gray-800">{order.customer?.full_name || 'Unknown Customer'}</p>
        <p className="text-xs text-gray-500 truncate">{deliveryAddress || 'No address'}</p>
      </div>

      {/* Desktop: Timer & Amount */}
      <div className="hidden sm:flex w-1/5 flex-col items-start">
         <div className="flex items-center gap-2 text-gray-600 mb-1">
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{order.time_elapsed}</span>
            {order.status === OrderStatus.PREPARING && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>}
         </div>
         <div className="flex items-center gap-2">
             <span className="font-bold text-gray-800">{order.total_amount.toLocaleString()} EGP</span>
         </div>
      </div>

      {/* Desktop: Actions */}
      <div className="hidden sm:flex w-1/4 justify-end items-center gap-3">
        <button 
            onClick={(e) => { e.stopPropagation(); onViewDetails(order); }}
            className="p-2 text-black hover:text-black hover:bg-teal-50 rounded-full transition-colors"
            title="View Details"
        >
            <Eye size={20} strokeWidth={2} />
        </button>
        <button 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (window.confirm(`Are you sure you want to delete order #${order.order_id}?\n\nThis action cannot be undone.`)) {
                    onDelete(order.order_id);
                }
            }}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
            title="Delete Order"
        >
            <Trash2 size={18} strokeWidth={2} />
        </button>
        {renderActions()}
      </div>
    </div>
  );
};

export default OrderRow;
