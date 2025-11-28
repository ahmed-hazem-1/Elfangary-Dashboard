
import React from 'react';
import { Order, OrderStatus } from '../types';
import { X, Phone, MapPin, CreditCard, Clock, FileText } from 'lucide-react';

interface OrderModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, onClose, onStatusChange }) => {
  if (!order) return null;
  
  const deliveryAddress = order.address || order.customer?.full_address;
  
  // Calculate total from items as fallback if order.total_amount is 0
  const calculatedTotal = order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price_at_order), 0);
  const displaySubtotal = order.subtotal && order.subtotal > 0 ? order.subtotal : calculatedTotal;
  const displayTotal = order.total_amount > 0 ? order.total_amount : calculatedTotal;
  const hasDiscount = order.discount_percentage && order.discount_percentage > 0;
  const discountAmount = hasDiscount ? displaySubtotal * (order.discount_percentage! / 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-brand-teal/10 p-6 border-b border-brand-teal/20 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-1">
                <span className="bg-brand-teal text-white text-xs font-bold px-2 py-1 rounded">
                  {order.customer.source}
                </span>
                <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
            </div>
            <p className="text-sm text-gray-600 font-mono">ID: {order.order_id}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          {/* Customer Info */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-orange/20 text-brand-orange flex items-center justify-center font-bold text-lg">
                {(order.customer?.full_name || 'U').charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-800">{order.customer?.full_name || 'Unknown Customer'}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock size={14} strokeWidth={2} />
                  <span>Ordered {order.time_elapsed} ago</span>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-gray-200"></div>

            <div className="flex items-start gap-3 text-sm text-gray-600">
                <Phone size={16} strokeWidth={2} className="mt-0.5 text-brand-teal" />
                <span>{order.customer?.phone_number || 'No phone number'}</span>
            </div>
            <div className="flex items-start gap-3 text-sm text-gray-600">
                <MapPin size={16} strokeWidth={2} className="mt-0.5 text-brand-teal" />
                <span>{deliveryAddress || 'No Address Provided'}</span>
            </div>
            {order.notes && (
               <div className="flex items-start gap-3 text-sm text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                  <FileText size={16} strokeWidth={2} className="mt-0.5 text-yellow-600" />
                  <span className="italic text-gray-700">"{order.notes}"</span>
               </div>
            )}
          </div>

          {/* Items */}
          <div>
            <h3 className="text-sm font-bold text-gray-500 uppercase mb-3 tracking-wide">Order Items</h3>
            <ul className="space-y-3">
              {order.items.map((item, idx) => (
                <li key={idx} className="flex justify-between items-start p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                  <div className="flex gap-3">
                    <div className="bg-gray-100 text-gray-600 font-bold w-6 h-6 flex items-center justify-center rounded text-xs">
                        {item.quantity}x
                    </div>
                    <div>
                      <p className="text-gray-800 font-medium text-right" dir="rtl">{item.item_name_ar}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-gray-700">{(item.unit_price_at_order * item.quantity).toLocaleString()} EGP</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
            <div className="space-y-3 mb-6">
                {/* Subtotal */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Subtotal</span>
                    <span className="text-lg font-semibold text-gray-700">{displaySubtotal.toLocaleString()} EGP</span>
                </div>

                {/* Discount (if any) */}
                {hasDiscount && (
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500 font-medium">Discount ({order.discount_percentage}%)</span>
                        <span className="text-lg font-semibold text-red-600">-{discountAmount.toLocaleString()} EGP</span>
                    </div>
                )}

                {/* Divider */}
                <div className="h-px bg-gray-300 my-2"></div>

                {/* Total */}
                <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-bold">Total Amount</span>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-brand-teal">{displayTotal.toLocaleString()} EGP</span>
                        {order.total_amount === 0 && calculatedTotal > 0 && (
                            <p className="text-xs text-yellow-600 mt-1">Calculated from items</p>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                {order.status === OrderStatus.PENDING_CONFIRMATION && (
                    <>
                        <button 
                            onClick={() => { onStatusChange(order.order_id, OrderStatus.CANCELED); onClose(); }}
                            className="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-red-500 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={() => { onStatusChange(order.order_id, OrderStatus.CONFIRMED); onClose(); }}
                            className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-500 shadow-lg shadow-green-500/30 hover:bg-green-600 hover:scale-[1.02] transition-all"
                        >
                            Confirm Order
                        </button>
                    </>
                )}
                 {order.status === OrderStatus.CONFIRMED && (
                    <button 
                        onClick={() => { onStatusChange(order.order_id, OrderStatus.PREPARING); onClose(); }}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-yellow-500 shadow-lg shadow-yellow-500/30 hover:bg-yellow-600 transition-all"
                    >
                        Start Preparing
                    </button>
                )}
                {order.status === OrderStatus.PREPARING && (
                    <button 
                        onClick={() => { onStatusChange(order.order_id, OrderStatus.OUT_FOR_DELIVERY); onClose(); }}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-brand-orange shadow-lg shadow-brand-orange/30 hover:bg-orange-600 transition-all"
                    >
                        Send to Delivery
                    </button>
                )}
                 {order.status === OrderStatus.OUT_FOR_DELIVERY && (
                    <button 
                        onClick={() => { onStatusChange(order.order_id, OrderStatus.DELIVERED); onClose(); }}
                        className="w-full py-3 rounded-xl font-semibold text-white bg-blue-500 shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-all"
                    >
                        Mark as Delivered
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
