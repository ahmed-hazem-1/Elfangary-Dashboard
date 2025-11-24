
import React from 'react';
import { Order, Source, OrderStatus } from '../types';
import { SOURCE_ICONS, SOURCE_COLORS } from '../constants';

interface StatsBarProps {
  orders: Order[];
}

const StatsBar: React.FC<StatsBarProps> = ({ orders }) => {
  // Calculate stats
  const activeOrders = orders.filter(o => 
    o.status !== OrderStatus.DELIVERED && 
    o.status !== OrderStatus.CANCELED
  );
  
  const stats = [Source.TELEGRAM, Source.WEB, Source.WHATSAPP, Source.DINE_IN].map(source => {
    const count = activeOrders.filter(o => o.customer.source === source).length;
    const Icon = SOURCE_ICONS[source] || SOURCE_ICONS[Source.WEB];
    const colorClass = SOURCE_COLORS[source] || SOURCE_COLORS[Source.WEB];

    return {
      source,
      count,
      Icon,
      colorClass
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {/* Total Summary Card */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Active Orders</p>
          <h3 className="text-2xl font-bold text-gray-800">{activeOrders.length}</h3>
        </div>
        <div className="bg-brand-teal/10 p-3 rounded-lg text-brand-teal">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>
        </div>
      </div>

      {/* Source Cards */}
      {stats.map((stat) => (
        <div key={stat.source} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{stat.source}</p>
            <h3 className="text-xl font-bold text-gray-800">{stat.count} <span className="text-xs font-normal text-gray-400">orders</span></h3>
          </div>
          <div className={`p-2 rounded-full ${stat.colorClass}`}>
            <stat.Icon size={20} strokeWidth={2} />
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsBar;