
import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, MenuSquare, Settings, LogOut, ChevronLeft, ChevronRight, Hexagon, Plus, X } from 'lucide-react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onOpenNewOrderForm?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onOpenNewOrderForm }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'orders', label: 'Live Orders', Icon: ClipboardList },
    { id: 'menu', label: 'Inventory', Icon: MenuSquare },
    { id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  ];

  const handleOrderCreated = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="fixed bottom-6 right-6 z-50 lg:hidden text-white p-4 rounded-full shadow-lg transition-all"
        style={{ backgroundColor: '#D97706' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#B45309')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#D97706')}
      >
        <MenuSquare size={24} strokeWidth={2} />
      </button>

      <div className={`${isExpanded ? 'lg:w-64' : 'lg:w-20'} w-full lg:w-auto bg-white border-r border-amber-200 flex flex-col h-screen lg:h-auto lg:sticky lg:top-0 z-40 lg:z-20 transition-all duration-300 fixed lg:relative bottom-0 left-0 right-0 max-h-[50vh] lg:max-h-none ${isMobileMenuOpen ? 'translate-y-0' : 'translate-y-full lg:translate-y-0'}`}>
      {/* Logo Area */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-amber-100 lg:sticky lg:top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-teal rounded-lg flex items-center justify-center shadow-lg shadow-brand-teal/20">
            <Hexagon size={24} strokeWidth={2} className="text-brand-orange" />
          </div>
          {isExpanded && <span className="font-bold text-gray-800 text-lg truncate">Elfangary Honey</span>}
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 hover:bg-amber-50 rounded-lg transition-colors text-gray-500 hover:text-brand-teal hidden lg:block"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? <ChevronLeft size={20} strokeWidth={2} /> : <ChevronRight size={20} strokeWidth={2} />}
        </button>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="p-1 hover:bg-amber-50 rounded-lg transition-colors text-gray-500 hover:text-brand-teal lg:hidden"
        >
          <X size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-2 space-y-1">
        <button
          onClick={() => {
            onOpenNewOrderForm?.();
            setIsMobileMenuOpen(false);
          }}
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
              onClick={() => {
                onViewChange(item.id);
                setIsMobileMenuOpen(false);
              }}
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
    </div>
    </>
  );
};

export default Sidebar;