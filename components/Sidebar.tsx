
import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, MenuSquare, Settings, LogOut, ChevronLeft, ChevronRight, Hexagon, Plus } from 'lucide-react';
import NewOrderForm from './NewOrderForm';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onOrderCreated?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOrderCreated }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isNewOrderFormOpen, setIsNewOrderFormOpen] = useState(false);

  const menuItems = [
    { id: 'orders', label: 'Live Orders', Icon: ClipboardList },
    { id: 'menu', label: 'Inventory', Icon: MenuSquare },
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ];

  const handleOrderCreated = () => {
    setIsNewOrderFormOpen(false);
    if (onOrderCreated) {
      onOrderCreated();
    }
  };

  return (
    <div className={`${isExpanded ? 'w-64' : 'w-20'} bg-white border-r border-amber-200 flex flex-col h-screen sticky top-0 z-20 transition-all duration-300`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-amber-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-teal rounded-lg flex items-center justify-center shadow-lg shadow-brand-teal/20">
            <Hexagon size={24} strokeWidth={2} className="text-brand-orange" />
          </div>
          {isExpanded && <span className="font-bold text-gray-800 text-lg truncate">Elfangary Honey</span>}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-amber-50 rounded-lg transition-colors text-gray-500 hover:text-brand-teal"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronLeft size={20} strokeWidth={2} /> : <ChevronRight size={20} strokeWidth={2} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1">
        {/* New Order Button */}
        <button
          onClick={() => setIsNewOrderFormOpen(true)}
          className="w-full flex items-center justify-start gap-3 px-3 py-3 mb-4 rounded-xl transition-all duration-200 group bg-brand-orange/10 border-2 border-dashed border-brand-orange/30 hover:bg-brand-orange/20 hover:border-brand-orange/50"
          title={!isExpanded ? 'Create New Order' : undefined}
        >
          <Plus size={22} strokeWidth={2.5} className="text-brand-orange" />
          {isExpanded && <span className="font-medium text-brand-orange">Create New Order</span>}
        </button>

        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-brand-tealDark shadow-md shadow-brand-teal/30' 
                  : 'text-gray-500 hover:bg-amber-50 hover:text-brand-teal'
              }`}
              title={!isExpanded ? item.label : undefined}
            >
              <item.Icon size={22} strokeWidth={2.5} className={`${isActive ? 'text-black animate-pulse' : 'text-gray-500 group-hover:text-brand-teal'}`} />
              {isExpanded && <span className={`font-medium ${isActive ? 'font-bold text-black' : 'text-gray-700'}`}>
                {item.label}
              </span>}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-amber-100 space-y-2">
        <button className={`w-full flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-amber-50 hover:text-black transition-colors`} title={!isExpanded ? 'Settings' : undefined}>
            <Settings size={22} strokeWidth={1.5} />
            {isExpanded && <span className="font-medium">Settings</span>}
        </button>
        <button className={`w-full flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-50 hover:text-black transition-colors`} title={!isExpanded ? 'Logout' : undefined}>
            <LogOut size={22} strokeWidth={1.5} />
            {isExpanded && <span className="font-medium">Logout</span>}
        </button>
      </div>

      {/* New Order Form Modal */}
      <NewOrderForm 
        isOpen={isNewOrderFormOpen} 
        onClose={() => setIsNewOrderFormOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default Sidebar;