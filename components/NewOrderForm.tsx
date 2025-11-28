import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { OrderService } from '../services/orderService';
import { WEBHOOK_CONFIG } from '../services/config';
import { Plus, Minus, X, ShoppingCart, User, Phone, MapPin } from 'lucide-react';

interface NewOrderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

interface OrderItem {
  item_id: string;
  quantity: number;
  item: MenuItem;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isOpen, onClose, onOrderCreated }) => {
  const [customer_name, setCustomerName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [discount_percentage, setDiscountPercentage] = useState<number>(0);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchMenuItems();
    }
  }, [isOpen]);

  const fetchMenuItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(WEBHOOK_CONFIG.GET_MENU_URL);
      if (res.ok) {
        const data = await res.json();
        const mappedItems: MenuItem[] = data
          .filter((d: any) => d.is_available !== false)
          .map((d: any) => ({
            item_id: d.item_id,
            item_name_ar: d.item_name_ar || d.name || 'Unknown Item',
            category_ar: d.category_ar || 'Honey Products',
            description_ar: d.description_ar || d.description || '',
            price: parseFloat(d.price || 0),
            is_available: true
          }));
        setAvailableItems(mappedItems);
      }
    } catch (e) {
      console.error("Failed to fetch menu items", e);
    } finally {
      setIsLoading(false);
    }
  };

  const addItemToOrder = (item: MenuItem) => {
    const existingItem = orderItems.find(oi => oi.item_id === item.item_id);
    if (existingItem) {
      setOrderItems(prev => prev.map(oi => 
        oi.item_id === item.item_id 
          ? { ...oi, quantity: oi.quantity + 1 }
          : oi
      ));
    } else {
      setOrderItems(prev => [...prev, { item_id: item.item_id.toString(), quantity: 1, item }]);
    }
  };

  const updateItemQuantity = (item_id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(prev => prev.filter(oi => oi.item_id !== item_id));
    } else {
      setOrderItems(prev => prev.map(oi => 
        oi.item_id === item_id 
          ? { ...oi, quantity: newQuantity }
          : oi
      ));
    }
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((total, item) => total + (item.item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount_percentage / 100);
    return {
      subtotal,
      discount: discountAmount,
      total: subtotal - discountAmount
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (orderItems.length === 0) {
      alert('Please add at least one item to the order');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const orderData = {
        customer_name: customer_name.trim() || undefined,
        phone_number: phone_number.trim() || undefined,
        address: address.trim() || undefined,
        discount_percentage: discount_percentage,
        items: orderItems.map(item => ({
          item_id: item.item_id,
          quantity: item.quantity
        }))
      };

      const result = await OrderService.createOrder(orderData);
      
      if (result.success) {
        // Reset form
        setCustomerName('');
        setPhoneNumber('');
        setAddress('');
        setDiscountPercentage(0);
        setOrderItems([]);
        onOrderCreated();
        onClose();
        alert('Order created successfully!');
      } else {
        alert(`Failed to create order: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      let errorMessage = 'Failed to create order. ';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          errorMessage += 'Please make sure the server is running (node server.cjs).';
        } else {
          errorMessage += error.message;
        }
      } else {
        errorMessage += 'Please try again.';
      }
      
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
      <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col mx-4 sm:mx-0">
        <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 z-10">
          <h3 className="font-bold text-gray-800 flex items-center gap-2 text-base sm:text-lg">
            <ShoppingCart size={20} strokeWidth={2} />
            Create New Order
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 max-h-[calc(90vh-180px)] sm:max-h-[calc(85vh-180px)]">
            {/* Customer Information */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User size={16} strokeWidth={2} />
                Customer Information (Optional)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={customer_name}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-medium text-sm"
                    placeholder="e.g., Ahmed Hassan"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Phone size={12} strokeWidth={2} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone_number}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-medium text-sm"
                    placeholder="e.g., 01001234567"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <MapPin size={12} strokeWidth={2} />
                  Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none h-20 resize-none text-sm"
                  placeholder="e.g., 123 Main St, Cairo, Egypt"
                />
              </div>
            </div>

            {/* Available Items */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 text-sm">Available Products</h4>
              {isLoading ? (
                <div className="text-center py-4 text-sm">Loading products...</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto">
                  {availableItems.map(item => (
                    <div key={item.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200 hover:border-brand-teal/30 transition-colors gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-800 text-sm truncate" dir="rtl">{item.item_name_ar}</h5>
                        <p className="text-xs text-gray-500">{item.price} EGP</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addItemToOrder(item)}
                        className="px-2 py-1 sm:px-3 sm:py-1 bg-brand-teal text-green-600 rounded-lg text-xs sm:text-sm font-medium hover:bg-brand-tealDark transition-colors flex items-center gap-1 whitespace-nowrap"
                      >
                        <Plus size={16} strokeWidth={2} />
                        <span className="hidden sm:inline">Add</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items */}
            {orderItems.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-3 text-sm">Order Items ({orderItems.length})</h4>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {orderItems.map(orderItem => (
                    <div key={orderItem.item_id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200 gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-0 sm:min-w-fit">
                        <h5 className="font-medium text-gray-800 text-sm truncate" dir="rtl">{orderItem.item.item_name_ar}</h5>
                        <p className="text-xs text-gray-500">{orderItem.item.price} EGP each</p>
                      </div>
                      <div className="flex items-center gap-1 ml-auto">
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(orderItem.item_id, orderItem.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        >
                          <Minus size={16} strokeWidth={2} />
                        </button>
                        <span className="font-medium text-gray-700 min-w-[2rem] text-center text-sm">{orderItem.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateItemQuantity(orderItem.item_id, orderItem.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-brand-teal hover:bg-brand-teal/10 rounded transition-colors"
                        >
                          <Plus size={16} strokeWidth={2} />
                        </button>
                        <span className="font-bold text-gray-800 ml-2 min-w-[3.5rem] text-right text-sm">
                          {(orderItem.item.price * orderItem.quantity).toFixed(2)} EGP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 p-4 bg-gray-100 rounded-xl space-y-3">
                  {/* Discount Input */}
                  <div className="flex items-center justify-between gap-4">
                    <label className="text-sm font-semibold text-gray-700 whitespace-nowrap">Discount:</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={discount_percentage}
                        onChange={(e) => setDiscountPercentage(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-teal/20 outline-none text-sm font-medium text-center"
                      />
                      <span className="text-sm font-medium text-gray-700">%</span>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-2 pt-2 border-t border-gray-300">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-semibold text-gray-700">{calculateTotal().subtotal.toFixed(2)} EGP</span>
                    </div>
                    {discount_percentage > 0 && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Discount ({discount_percentage}%):</span>
                        <span className="font-semibold text-red-600">-{calculateTotal().discount.toFixed(2)} EGP</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-700">Total:</span>
                      <span className="font-bold text-lg sm:text-xl text-gray-900">{calculateTotal().total.toFixed(2)} EGP</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row gap-3 sticky bottom-0 bg-white shadow-lg">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 py-2 sm:py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors text-sm"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="flex-1 py-2 sm:py-3 rounded-xl font-semibold text-black bg-brand-orange shadow-lg shadow-brand-orange/30 hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              disabled={isSubmitting || orderItems.length === 0}
            >
              {isSubmitting ? (
                <>Loading...</>
              ) : (
                <>
                  <ShoppingCart size={18} strokeWidth={2} />
                  <span className="hidden sm:inline">Create Order</span>
                  <span className="sm:hidden">Create</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewOrderForm;