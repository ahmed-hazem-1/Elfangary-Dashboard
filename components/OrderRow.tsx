
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
  const deliveryAddress = order.address || order.customer.full_address;
  
  // Action Buttons based on status flow:
  // Pending -> Confirmed -> Preparing -> Out For Delivery -> Delivered
  const renderActions = () => {
    switch (order.status) {
      case OrderStatus.PENDING_CONFIRMATION:
        return (
          <div className="flex items-center gap-2">
             <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.CANCELED); }}
              className="p-2 rounded-lg text-black hover:bg-red-50 hover:text-black transition-colors"
              title="Cancel Order"
            >
              <X size={20} strokeWidth={2} />
            </button>
            <button 
              onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.CONFIRMED); }}
              className="bg-brand-teal text-black px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-brand-teal/20 hover:bg-brand-tealDark hover:text-black transition-all flex items-center gap-2"
            >
              <Check size={16} strokeWidth={2} /> Confirm
            </button>
          </div>
        );
      case OrderStatus.CONFIRMED:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.PREPARING); }}
            className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-yellow-500/20 hover:bg-yellow-600 hover:text-black transition-all flex items-center gap-2"
          >
             <ChefHat size={16} strokeWidth={2} /> Start Preparing
          </button>
        );
      case OrderStatus.PREPARING:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.OUT_FOR_DELIVERY); }}
            className="bg-brand-orange text-black px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-brand-orange/20 hover:bg-orange-600 hover:text-black transition-all flex items-center gap-2"
          >
             <Bike size={16} strokeWidth={2} /> Send to Delivery
          </button>
        );
       case OrderStatus.OUT_FOR_DELIVERY:
        return (
          <button 
            onClick={(e) => { e.stopPropagation(); onStatusChange(order.order_id, OrderStatus.DELIVERED); }}
            className="bg-blue-500 text-black px-4 py-2 rounded-lg text-sm font-medium shadow-md shadow-blue-500/20 hover:bg-blue-600 hover:text-black transition-all flex items-center gap-2"
          >
             <PackageCheck size={16} strokeWidth={2} /> Mark Delivered
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
        className="group bg-white hover:bg-gray-50 border-b border-gray-100 last:border-none py-4 px-6 flex items-center justify-between transition-all cursor-pointer"
    >
      {/* Left: ID & Source */}
      <div className="flex items-center gap-6 w-1/4">
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

      {/* Middle: Customer */}
      <div className="w-1/4">
        <p className="font-semibold text-gray-800">{order.customer.full_name}</p>
        <p className="text-xs text-gray-500 truncate">{deliveryAddress || 'No address'}</p>
      </div>

      {/* Timer & Amount */}
      <div className="w-1/5 flex flex-col items-start">
         <div className="flex items-center gap-2 text-gray-600 mb-1">
            <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded">{order.time_elapsed}</span>
            {order.status === OrderStatus.PREPARING && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>}
         </div>
         <div className="flex items-center gap-2">
             <span className="font-bold text-gray-800">{order.total_amount.toLocaleString()} EGP</span>
         </div>
      </div>

      {/* Actions */}
      <div className="w-1/4 flex justify-end items-center gap-3">
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
