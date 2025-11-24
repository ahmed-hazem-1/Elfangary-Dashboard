
import React, { useState } from 'react';
import { Order, OrderStatus } from '../types';
import OrderRow from './OrderRow';
import { ChevronDown, ChevronRight, ClipboardList } from 'lucide-react';

interface OrderSectionProps {
  title: string;
  colorClass: string; // e.g., "bg-brand-orange"
  countColorClass: string; // e.g., "bg-brand-orange text-white"
  icon?: React.ReactNode;
  orders: Order[];
  onStatusChange: (id: string, status: OrderStatus) => void;
  onViewDetails: (order: Order) => void;
  onDelete: (orderId: string) => void;
  emptyMessage?: string;
  defaultOpen?: boolean;
}

const OrderSection: React.FC<OrderSectionProps> = ({ 
  title, 
  colorClass,
  countColorClass, 
  icon, 
  orders, 
  onStatusChange, 
  onViewDetails,
  onDelete,
  emptyMessage = "No active orders in this stage",
  defaultOpen = true
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <section className="animate-fade-in mb-6">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors select-none"
      >
        <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${colorClass} bg-opacity-10 text-gray-600`}>
                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </div>
            {icon && <div className="text-gray-500">{icon}</div>}
            <h2 className="text-gray-600 font-bold text-sm uppercase tracking-wide">{title}</h2>
            <span className={`${countColorClass} text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center`}>
                {orders.length}
            </span>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="mt-2 transition-all">
            {orders.length > 0 ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {orders.map(order => (
                        <OrderRow 
                            key={order.order_id} 
                            order={order} 
                            onStatusChange={onStatusChange} 
                            onViewDetails={onViewDetails}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            ) : (
                <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400">
                    <ClipboardList size={32} className="mb-2 opacity-50" />
                    <p className="text-sm font-medium">{emptyMessage}</p>
                </div>
            )}
        </div>
      )}
    </section>
  );
};

export default OrderSection;
