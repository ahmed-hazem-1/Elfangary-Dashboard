
import React, { useState, useRef } from 'react';
import Sidebar from './components/Sidebar';
import OrdersView from './components/OrdersView';
import MenuView from './components/MenuView';
import DashboardView from './components/DashboardView';
import NewOrderForm from './components/NewOrderForm';
import { Hexagon } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState('orders');
  const [isNewOrderFormOpen, setIsNewOrderFormOpen] = useState(false);
  const ordersViewRef = useRef<{ refreshData: () => void } | null>(null);

  const handleOrderCreated = () => {
    // Refresh the orders view silently and switch to it if not already there
    setCurrentView('orders');
    setIsNewOrderFormOpen(false);
    // Use setTimeout to ensure the view is mounted before calling refresh
    setTimeout(() => {
      if (ordersViewRef.current) {
        ordersViewRef.current.refreshData();
      }
    }, 100);
  };

  const renderView = () => {
    switch (currentView) {
        case 'orders':
            return <OrdersView ref={ordersViewRef} />;
        case 'menu':
            return <MenuView />;
        case 'dashboard':
            return <DashboardView />;
        default:
            return <OrdersView ref={ordersViewRef} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-brand-bg font-sans">
      <Sidebar 
        currentView={currentView} 
        onViewChange={setCurrentView} 
        onOpenNewOrderForm={() => setIsNewOrderFormOpen(true)}
      />
      
      <main className="flex-1 max-h-screen flex flex-col w-full lg:w-auto overflow-y-auto">
        {/* Mobile Header (visible only on small screens) */}
        <div className="lg:hidden bg-white p-4 shadow-sm flex items-center gap-3 border-b border-amber-100">
            <div className="w-8 h-8 bg-brand-teal rounded-md flex items-center justify-center text-white font-bold">E</div>
            <span className="font-bold text-gray-800">Elfangary Honey</span>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 lg:pb-4">
            <div className="max-w-[1600px] mx-auto w-full">
                {renderView()}
            </div>
        </div>
      </main>

      {/* New Order Form Modal - Rendered at app root level for proper z-stacking */}
      <NewOrderForm
        isOpen={isNewOrderFormOpen}
        onClose={() => setIsNewOrderFormOpen(false)}
        onOrderCreated={handleOrderCreated}
      />
    </div>
  );
};

export default App;