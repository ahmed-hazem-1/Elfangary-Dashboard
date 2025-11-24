
import React, { useEffect, useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Wallet, AlertCircle, Loader2, DollarSign, ShoppingCart, Coins } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';

type FilterPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

interface AnalyticsData {
  totalOrders: number;
  totalSales: number;
  netProfit: number;
  avgOrderValue: number;
}

const DashboardView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('month');
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    totalSales: 0,
    netProfit: 0,
    avgOrderValue: 0
  });

  const getDateRange = (period: FilterPeriod): Date => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'day':
        return startDate;
      case 'week':
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        return startDate;
      case 'month':
        startDate.setDate(1); // First day of month
        return startDate;
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate.setMonth(quarterStartMonth, 1);
        return startDate;
      case 'year':
        startDate.setMonth(0, 1); // January 1st
        return startDate;
      default:
        return startDate;
    }
  };

  const getPeriodLabel = (period: FilterPeriod): string => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
    }
  };

  useEffect(() => {
    const calculateAnalytics = async () => {
      try {
        setIsLoading(true);
        const orders = await OrderService.getOrders();
        
        const periodStartDate = getDateRange(selectedPeriod);
        
        let totalOrders = 0;
        let totalSales = 0;
        const profitMarginDecimal = profitMargin / 100; // Convert percentage to decimal

        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          
          if (orderDate >= periodStartDate) {
            // Count all orders in period
            totalOrders++;
            
            // Only count delivered orders in sales
            if (order.status === OrderStatus.DELIVERED) {
              totalSales += order.total_amount;
            }
          }
        });

        const netProfit = totalSales * profitMarginDecimal;
        const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

        setAnalytics({
          totalOrders,
          totalSales,
          netProfit,
          avgOrderValue
        });

      } catch (error) {
        console.error("Failed to calculate analytics", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAnalytics();
  }, [selectedPeriod, profitMargin]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Loader2 size={40} className="animate-spin text-brand-teal mb-4" />
            <p>Calculating Analytics...</p>
        </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto custom-scrollbar pb-10">
        {/* Header with Filter */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-black">Dashboard Analytics</h1>
                <p className="text-black text-sm">Financial performance and sales overview</p>
            </div>
            
            <div className="flex flex-col md:flex-row gap-3">
                {/* Profit Margin Input */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200">
                    <label htmlFor="profit-margin" className="text-sm font-medium text-black whitespace-nowrap">
                        Profit Margin:
                    </label>
                    <input
                        id="profit-margin"
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={profitMargin}
                        onChange={(e) => setProfitMargin(Math.min(100, Math.max(0, Number(e.target.value))))}
                        className="w-16 px-2 py-1 text-sm font-medium text-black bg-gray-50 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-teal"
                    />
                    <span className="text-sm font-medium text-black">%</span>
                </div>
                
                {/* Period Filter */}
                <div className="flex gap-2 flex-wrap">
                    {(['day', 'week', 'month', 'quarter', 'year'] as FilterPeriod[]).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                selectedPeriod === period
                                    ? 'bg-brand-teal text-brand-orange shadow-md'
                                    : 'bg-white text-black hover:bg-amber-50 hover:text-brand-orange border border-gray-200'
                            }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>

        {/* Analytics KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Orders */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-600">
                        <ShoppingCart size={24} />
                    </div>
                </div>
                
                <div className="relative z-10">
                    <p className="text-black font-medium text-sm uppercase tracking-wide">Total Orders</p>
                    <h2 className="text-4xl font-bold text-black mt-1">{analytics.totalOrders}</h2>
                    <p className="text-black text-sm mt-2">{getPeriodLabel(selectedPeriod)}</p>
                </div>
            </div>

            {/* Total Sales */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-brand-teal/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-brand-teal/10 rounded-xl text-brand-teal">
                        <DollarSign size={24} />
                    </div>
                </div>
                
                <div className="relative z-10">
                    <p className="text-black font-medium text-sm uppercase tracking-wide">Total Sales</p>
                    <h2 className="text-4xl font-bold text-black mt-1">{analytics.totalSales.toLocaleString()}</h2>
                    <p className="text-black text-sm mt-2">EGP • Delivered orders</p>
                </div>
            </div>

            {/* Net Profit */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-green-500/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-green-500/10 rounded-xl text-green-600">
                        <Coins size={24} />
                    </div>
                </div>
                
                <div className="relative z-10">
                    <p className="text-black font-medium text-sm uppercase tracking-wide">Net Profit</p>
                    <h2 className="text-4xl font-bold text-black mt-1">{analytics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                    <p className="text-black text-sm mt-2">EGP • {profitMargin}% margin</p>
                </div>
            </div>

            {/* Average Order Value */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className="absolute right-0 top-0 w-24 h-24 bg-brand-orange/5 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-110"></div>

                <div className="flex justify-between items-start mb-4 relative z-10">
                    <div className="p-3 bg-brand-orange/10 rounded-xl text-brand-orange">
                        <TrendingUp size={24} />
                    </div>
                </div>
                
                <div className="relative z-10">
                    <p className="text-black font-medium text-sm uppercase tracking-wide">Avg Order Value</p>
                    <h2 className="text-4xl font-bold text-black mt-1">{analytics.avgOrderValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</h2>
                    <p className="text-black text-sm mt-2">EGP per order</p>
                </div>
            </div>
        </div>

        {/* Summary Card */}
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 text-black p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                    <BarChart3 size={32} />
                </div>
                <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-2">Performance Summary - {getPeriodLabel(selectedPeriod)}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div>
                            <p className="text-black/70 text-sm">Orders Received</p>
                            <p className="text-2xl font-bold">{analytics.totalOrders} orders</p>
                        </div>
                        <div>
                            <p className="text-black/70 text-sm">Revenue Generated</p>
                            <p className="text-2xl font-bold">{analytics.totalSales.toLocaleString()} EGP</p>
                        </div>
                        <div>
                            <p className="text-black/70 text-sm">Estimated Profit</p>
                            <p className="text-2xl font-bold">{analytics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex items-start gap-3 bg-blue-50 p-4 rounded-xl text-blue-700 text-sm">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p>
                <strong>Note:</strong> Total Sales and Net Profit are calculated based on orders marked as <u>Delivered</u>. 
                Total Orders includes all orders in the selected period. Net Profit uses a {profitMargin}% profit margin estimate.
            </p>
        </div>
    </div>
  );
};

export default DashboardView;