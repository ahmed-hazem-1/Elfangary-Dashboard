
import React, { useState, useEffect } from 'react';
import { MenuItem } from '../types';
import { WEBHOOK_CONFIG } from '../services/config';
import { Search, Plus, Edit3, X, Save, ToggleRight, ToggleLeft, Loader2 } from 'lucide-react';

const MenuView: React.FC = () => {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // New Item State
  const [newItemData, setNewItemData] = useState({
      name: '',
      category: 'General',
      description: '',
      price: ''
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
      setIsLoading(true);
      try {
          const res = await fetch(WEBHOOK_CONFIG.GET_MENU_URL);
          if (res.ok) {
              const data = await res.json();
              // Map DB fields to UI fields
              const mappedItems: MenuItem[] = data.map((d: any) => ({
                  item_id: d.item_id,
                  item_name_ar: d.item_name_ar || d.name || 'Unknown Item',
                  category_ar: d.category_ar || 'Honey Products', // Default category as schema doesn't have it
                  description_ar: d.description_ar || d.description || '',
                  price: parseFloat(d.price || 0),
                  is_available: d.is_available !== undefined ? d.is_available : true
              }));
              setItems(mappedItems);
          }
      } catch (e) {
          console.error("Failed to fetch menu", e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleToggleAvailability = async (id: number | string) => {
    // Optimistic Update
    const targetItem = items.find(i => i.item_id === id);
    if (!targetItem) return;
    const newStatus = !targetItem.is_available;

    setItems(prev => prev.map(item => 
      item.item_id === id ? { ...item, is_available: newStatus } : item
    ));

    try {
        await fetch(WEBHOOK_CONFIG.TOGGLE_MENU_URL, {
            method: 'POST',
            headers: WEBHOOK_CONFIG.HEADERS,
            body: JSON.stringify({ item_id: id, is_available: newStatus })
        });
    } catch (e) {
        console.error("Failed to toggle availability", e);
        // Revert on error
        setItems(prev => prev.map(item => 
            item.item_id === id ? { ...item, is_available: !newStatus } : item
        ));
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
        const res = await fetch(WEBHOOK_CONFIG.UPDATE_MENU_URL, {
            method: 'POST',
            headers: WEBHOOK_CONFIG.HEADERS,
            body: JSON.stringify({
                item_id: editingItem.item_id,
                name: editingItem.item_name_ar,
                description: editingItem.description_ar,
                price: editingItem.price
            })
        });

        if (res.ok) {
            setItems(prev => prev.map(item => 
                item.item_id === editingItem.item_id ? editingItem : item
            ));
            setEditingItem(null);
        }
    } catch (e) {
        alert("Failed to save changes");
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        const res = await fetch(WEBHOOK_CONFIG.ADD_MENU_URL, {
            method: 'POST',
            headers: WEBHOOK_CONFIG.HEADERS,
            body: JSON.stringify(newItemData)
        });
        if (res.ok) {
            setIsAddingNew(false);
            setNewItemData({ name: '', category: 'General', description: '', price: '' });
            fetchMenu(); // Refresh list
        }
      } catch (e) {
          alert("Failed to add item");
      }
  };

  // Filters
  const filteredItems = items.filter(item => {
    return (item.item_name_ar || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-full">
              <Loader2 size={40} strokeWidth={2} className="animate-spin text-brand-teal" />
          </div>
      )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
          <p className="text-gray-500 text-sm">Manage honey products, prices, and stock</p>
        </div>
        <button 
            onClick={() => setIsAddingNew(true)}
            className="w-full sm:w-auto text-white px-4 py-2 rounded-lg shadow-lg flex items-center justify-center sm:justify-start gap-2 transition-all"
            style={{ backgroundColor: '#F59E0B' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D97706'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#F59E0B'}
        >
            <Plus size={20} strokeWidth={2} />
            <span>Add Product</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col gap-4 justify-between items-stretch">
        <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={2} />
            <input 
                type="text" 
                placeholder="Search products..." 
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-10 overflow-y-auto custom-scrollbar">
        {filteredItems.map(item => (
            <div key={item.item_id} className={`bg-white rounded-xl shadow-sm border transition-all hover:shadow-md ${item.is_available ? 'border-gray-100' : 'border-gray-200 bg-gray-50 opacity-75'}`}>
                <div className="p-5">
                    <div className="flex justify-between items-start mb-3">
                        <span className="bg-brand-teal/10 text-brand-teal text-xs font-bold px-2 py-1 rounded">
                            {item.category_ar}
                        </span>
                        <button 
                            onClick={() => handleToggleAvailability(item.item_id)}
                            className={`transition-colors ${item.is_available ? 'text-brand-teal' : 'text-gray-400'}`}
                            title={item.is_available ? "Mark Unavailable" : "Mark Available"}
                        >
                            {item.is_available ? <ToggleRight size={28} strokeWidth={1.5} /> : <ToggleLeft size={28} strokeWidth={1.5} />}
                        </button>
                    </div>
                    
                    <h3 className="font-bold text-gray-800 text-lg mb-1" dir="rtl">{item.item_name_ar}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2 h-10" dir="rtl">{item.description_ar}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="font-bold text-xl text-gray-900">{item.price} <span className="text-xs font-normal text-gray-500">EGP</span></span>
                        <button 
                            onClick={() => setEditingItem(item)}
                            className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                            <Edit3 size={20} strokeWidth={2} />
                        </button>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-slide-up overflow-hidden mx-4 sm:mx-0">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Edit Product</h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={handleSaveItem} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                        <input 
                            type="text" 
                            value={editingItem.item_name_ar}
                            onChange={(e) => setEditingItem({...editingItem, item_name_ar: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea 
                            value={editingItem.description_ar}
                            onChange={(e) => setEditingItem({...editingItem, description_ar: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none h-24 resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (EGP)</label>
                        <input 
                            type="number" 
                            step="0.5"
                            value={editingItem.price}
                            onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value)})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-bold"
                            required
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setEditingItem(null)} className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="flex-1 py-3 rounded-xl font-semibold text-white shadow-lg transition-colors flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#D97706', boxShadow: '0 10px 15px -3px rgba(217, 119, 6, 0.3), 0 4px 6px -4px rgba(217, 119, 6, 0.3)' }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B45309')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#D97706')}
                        >
                            <Save size={18} strokeWidth={2} /> Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Add Modal */}
      {isAddingNew && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-hidden">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl animate-slide-up overflow-hidden mx-4 sm:mx-0">
                <div className="bg-gray-50 p-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Add New Product</h3>
                    <button onClick={() => setIsAddingNew(false)} className="text-gray-400 hover:text-gray-600">
                        <X size={24} strokeWidth={2} />
                    </button>
                </div>
                <form onSubmit={handleAddItem} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Product Name</label>
                        <input 
                            type="text" 
                            value={newItemData.name}
                            onChange={(e) => setNewItemData({...newItemData, name: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                        <textarea 
                            value={newItemData.description}
                            onChange={(e) => setNewItemData({...newItemData, description: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none h-24 resize-none"
                            placeholder="e.g., Organic Sidr Honey..."
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Price (EGP)</label>
                        <input 
                            type="number" 
                            step="0.5"
                            value={newItemData.price}
                            onChange={(e) => setNewItemData({...newItemData, price: e.target.value})}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-teal/20 outline-none font-bold"
                            required
                        />
                    </div>
                    
                    <div className="pt-4 flex gap-3">
                        <button type="button" onClick={() => setIsAddingNew(false)} className="flex-1 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-600 shadow-lg shadow-green-600/30 hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                            <Plus size={18} strokeWidth={2} /> Add Product
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default MenuView;
