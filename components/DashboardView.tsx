
import React, { useEffect, useState } from 'react';
import { BarChart3, Calendar, TrendingUp, Wallet, AlertCircle, Loader2, DollarSign, ShoppingCart, Coins, Wrench, Package, Star, Search, CalendarDays, X } from 'lucide-react';
import { OrderService } from '../services/orderService';
import { Order, OrderStatus } from '../types';

type FilterPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

interface AnalyticsData {
  totalOrders: number;
  totalSales: number;
  netProfit: number;
  avgOrderValue: number;
}

interface ProductSales {
  item_id: string;
  item_name: string;
  quantity_sold: number;
  total_revenue: number;
  order_count: number;
}

const DashboardView: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<FilterPeriod>('month');
  const [profitMargin, setProfitMargin] = useState<number>(30);
  const [isFixingTotals, setIsFixingTotals] = useState(false);
  const [fixTotalsMessage, setFixTotalsMessage] = useState<string>('');
  const [productSearchQuery, setProductSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalOrders: 0,
    totalSales: 0,
    netProfit: 0,
    avgOrderValue: 0
  });
  const [productSales, setProductSales] = useState<ProductSales[]>([]);

  const getDateRange = (period: FilterPeriod): { start: Date; end?: Date } => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'day':
        return { start: startDate };
      case 'week':
        startDate.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
        return { start: startDate };
      case 'month':
        startDate.setDate(1); // First day of month
        return { start: startDate };
      case 'quarter':
        const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
        startDate.setMonth(quarterStartMonth, 1);
        return { start: startDate };
      case 'year':
        startDate.setMonth(0, 1); // January 1st
        return { start: startDate };
      case 'custom':
        if (selectedDate) {
          const customDate = new Date(selectedDate);
          customDate.setHours(0, 0, 0, 0);
          const endDate = new Date(customDate);
          endDate.setHours(23, 59, 59, 999);
          return { start: customDate, end: endDate };
        }
        return { start: startDate };
      default:
        return { start: startDate };
    }
  };

  const getPeriodLabel = (period: FilterPeriod): string => {
    switch (period) {
      case 'day': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'custom': 
        if (selectedDate) {
          const date = new Date(selectedDate);
          return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        }
        return 'Custom Date';
    }
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedPeriod('custom');
    setShowCalendar(false);
  };

  const handleClearCustomDate = () => {
    setSelectedDate('');
    setSelectedPeriod('month');
  };

  useEffect(() => {
    const calculateAnalytics = async () => {
      try {
        setIsLoading(true);
        const orders = await OrderService.getOrders();
        
        const dateRange = getDateRange(selectedPeriod);
        const periodStartDate = dateRange.start;
        const periodEndDate = dateRange.end;
        
        let totalOrders = 0;
        let totalSales = 0;
        const profitMarginDecimal = profitMargin / 100; // Convert percentage to decimal
        
        // Product sales tracking
        const productSalesMap = new Map<string, ProductSales>();

        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          
          // Check if order is within the date range
          const isInRange = periodEndDate 
            ? (orderDate >= periodStartDate && orderDate <= periodEndDate)
            : (orderDate >= periodStartDate);
          
          if (isInRange) {
            // Count all orders in period
            totalOrders++;
            
            // Only count delivered orders in sales
            if (order.status === OrderStatus.DELIVERED) {
              totalSales += order.total_amount;
              
              // Track product sales
              order.items.forEach(item => {
                const itemKey = `${item.item_id}`;
                const itemRevenue = item.quantity * item.unit_price_at_order;
                
                if (productSalesMap.has(itemKey)) {
                  const existing = productSalesMap.get(itemKey)!;
                  existing.quantity_sold += item.quantity;
                  existing.total_revenue += itemRevenue;
                  existing.order_count += 1;
                } else {
                  productSalesMap.set(itemKey, {
                    item_id: item.item_id,
                    item_name: item.item_name_ar,
                    quantity_sold: item.quantity,
                    total_revenue: itemRevenue,
                    order_count: 1
                  });
                }
              });
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
        
        // Convert map to sorted arrays
        const productSalesArray = Array.from(productSalesMap.values());
        setProductSales(productSalesArray);

      } catch (error) {
        console.error("Failed to calculate analytics", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateAnalytics();
  }, [selectedPeriod, profitMargin, selectedDate]);

  const handleFixTotals = async () => {
    try {
      setIsFixingTotals(true);
      setFixTotalsMessage('');
      
      const result = await OrderService.fixOrderTotals();
      
      if (result.success) {
        setFixTotalsMessage(result.message || 'Order totals fixed successfully!');
        // Refresh analytics after fixing totals
        const orders = await OrderService.getOrders();
        const dateRange = getDateRange(selectedPeriod);
        const periodStartDate = dateRange.start;
        const periodEndDate = dateRange.end;
        
        let totalOrders = 0;
        let totalSales = 0;
        const profitMarginDecimal = profitMargin / 100;

        orders.forEach(order => {
          const orderDate = new Date(order.created_at);
          
          const isInRange = periodEndDate 
            ? (orderDate >= periodStartDate && orderDate <= periodEndDate)
            : (orderDate >= periodStartDate);
          
          if (isInRange) {
            totalOrders++;
            
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
      } else {
        setFixTotalsMessage(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to fix totals:', error);
      setFixTotalsMessage('Failed to fix totals. Please check the console for errors.');
    } finally {
      setIsFixingTotals(false);
      // Clear message after 5 seconds
      setTimeout(() => setFixTotalsMessage(''), 5000);
    }
  };

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
        <div className="mb-6 flex flex-col gap-4">
            <div>
                <h1 className="text-2xl font-bold text-black">Dashboard Analytics</h1>
                <p className="text-black text-sm">Financial performance and sales overview</p>
            </div>
            
            <div className="flex flex-col gap-3">
                {/* Fix Totals Button */}
                <button
                    onClick={handleFixTotals}
                    disabled={isFixingTotals}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium text-sm hover:bg-yellow-600 disabled:bg-yellow-300 disabled:cursor-not-allowed transition-colors"
                >
                    {isFixingTotals ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Wrench size={16} />
                    )}
                    {isFixingTotals ? 'Fixing...' : 'Fix Order Totals'}
                </button>
                
                {/* Profit Margin Input */}
                <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 flex-wrap justify-between">
                    <label htmlFor="profit-margin" className="text-sm font-medium text-black whitespace-nowrap">
                        Profit Margin:
                    </label>
                    <div className="flex items-center gap-2">
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
                </div>
                
                {/* Period Filter */}
                <div className="flex gap-2 flex-wrap justify-start items-center">
                    {(['day', 'week', 'month', 'quarter', 'year'] as FilterPeriod[]).map((period) => (
                        <button
                            key={period}
                            onClick={() => {
                                setSelectedPeriod(period);
                                setSelectedDate('');
                            }}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                                selectedPeriod === period && selectedPeriod !== 'custom'
                                    ? 'bg-brand-teal text-brand-orange shadow-md'
                                    : 'bg-white text-black hover:bg-amber-50 hover:text-brand-orange border border-gray-200'
                            }`}
                        >
                            {period.charAt(0).toUpperCase() + period.slice(1)}
                        </button>
                    ))}
                    
                    {/* Calendar Button */}
                    <div className="relative">
                        <button
                            onClick={() => setShowCalendar(!showCalendar)}
                            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all ${
                                selectedPeriod === 'custom'
                                    ? 'bg-brand-teal text-brand-orange shadow-md'
                                    : 'bg-white text-black hover:bg-amber-50 hover:text-brand-orange border border-gray-200'
                            }`}
                        >
                            <CalendarDays size={16} />
                            <span>Pick Date</span>
                        </button>
                        
                        {/* Calendar Dropdown */}
                        {showCalendar && (
                            <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4 min-w-[280px]">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-black">Select Date</h4>
                                    <button 
                                        onClick={() => setShowCalendar(false)}
                                        className="text-gray-400 hover:text-black"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                                <input 
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => handleDateSelect(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal"
                                />
                                <div className="mt-3 flex gap-2">
                                    <button
                                        onClick={() => handleDateSelect(new Date().toISOString().split('T')[0])}
                                        className="flex-1 px-3 py-2 bg-gray-100 text-black rounded-lg text-xs hover:bg-gray-200 transition-colors"
                                    >
                                        Today
                                    </button>
                                    <button
                                        onClick={() => {
                                            const yesterday = new Date();
                                            yesterday.setDate(yesterday.getDate() - 1);
                                            handleDateSelect(yesterday.toISOString().split('T')[0]);
                                        }}
                                        className="flex-1 px-3 py-2 bg-gray-100 text-black rounded-lg text-xs hover:bg-gray-200 transition-colors"
                                    >
                                        Yesterday
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Clear Custom Date Button */}
                    {selectedPeriod === 'custom' && selectedDate && (
                        <button
                            onClick={handleClearCustomDate}
                            className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg font-medium text-xs hover:bg-red-100 transition-colors"
                        >
                            <X size={14} />
                            <span>Clear</span>
                        </button>
                    )}
                </div>
            </div>
        </div>

        {/* Fix Totals Message */}
        {fixTotalsMessage && (
            <div className={`mb-4 p-4 rounded-xl text-sm font-medium ${
                fixTotalsMessage.includes('Error') 
                    ? 'bg-red-50 text-red-700 border border-red-200' 
                    : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
                {fixTotalsMessage}
            </div>
        )}

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
        <div className="bg-gradient-to-br from-brand-teal to-brand-teal/80 text-black p-6 sm:p-8 rounded-2xl shadow-lg mb-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                        <BarChart3 size={32} />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold">Performance Summary - {getPeriodLabel(selectedPeriod)}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <div>
                        <p className="text-black/70 text-sm">Orders Received</p>
                        <p className="text-xl sm:text-2xl font-bold">{analytics.totalOrders} orders</p>
                    </div>
                    <div>
                        <p className="text-black/70 text-sm">Revenue Generated</p>
                        <p className="text-xl sm:text-2xl font-bold">{analytics.totalSales.toLocaleString()} EGP</p>
                    </div>
                    <div>
                        <p className="text-black/70 text-sm">Estimated Profit</p>
                        <p className="text-xl sm:text-2xl font-bold">{analytics.netProfit.toLocaleString(undefined, {maximumFractionDigits: 0})} EGP</p>
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

        {/* Product Analytics Section */}
        <div className="mt-8 space-y-6">
            <div>
                <h2 className="text-xl font-bold text-black mb-2">Product Analytics</h2>
                <p className="text-black text-sm">Best performing products for {getPeriodLabel(selectedPeriod)}</p>
            </div>

            {/* Most Popular Products (By Quantity) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Star size={20} className="text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-black">Most Popular Products</h3>
                        <p className="text-sm text-gray-600">By quantity sold</p>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {productSales.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4">No product sales data available for this period</p>
                    ) : (
                        productSales
                            .sort((a, b) => b.quantity_sold - a.quantity_sold)
                            .slice(0, 5)
                            .map((product, index) => (
                                <div key={product.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 bg-purple-500 text-white rounded-full font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-black">{product.item_name}</p>
                                            <p className="text-xs text-gray-500">In {product.order_count} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-black">{product.quantity_sold}</p>
                                        <p className="text-xs text-gray-500">units</p>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Top Revenue Products */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <TrendingUp size={20} className="text-green-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-black">Top Revenue Products</h3>
                        <p className="text-sm text-gray-600">Highest sales value</p>
                    </div>
                </div>
                
                <div className="space-y-2">
                    {productSales.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4">No product sales data available for this period</p>
                    ) : (
                        productSales
                            .sort((a, b) => b.total_revenue - a.total_revenue)
                            .slice(0, 5)
                            .map((product, index) => (
                                <div key={product.item_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-black">{product.item_name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity_sold} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-lg text-black">{product.total_revenue.toLocaleString()} EGP</p>
                                        <p className="text-xs text-gray-500">revenue</p>
                                    </div>
                                </div>
                            ))
                    )}
                </div>
            </div>

            {/* Search Specific Product */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Package size={20} className="text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-black">Product Search</h3>
                        <p className="text-sm text-gray-600">Find sales data for specific products</p>
                    </div>
                </div>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by product name..." 
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                    />
                </div>
                
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                    {productSales.length === 0 ? (
                        <p className="text-gray-400 text-sm py-4">No product sales data available for this period</p>
                    ) : (
                        productSales
                            .filter(product => 
                                productSearchQuery === '' || 
                                product.item_name.toLowerCase().includes(productSearchQuery.toLowerCase())
                            )
                            .sort((a, b) => b.quantity_sold - a.quantity_sold)
                            .map((product) => (
                                <div key={product.item_id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-bold text-black">{product.item_name}</h4>
                                        <span className="px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded-full">
                                            ID: {product.item_id}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 mt-3">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Quantity Sold</p>
                                            <p className="text-lg font-bold text-black">{product.quantity_sold}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
                                            <p className="text-lg font-bold text-green-600">{product.total_revenue.toLocaleString()} EGP</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Order Count</p>
                                            <p className="text-lg font-bold text-blue-600">{product.order_count}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-xs text-gray-600">
                                            Avg Price: <span className="font-semibold text-black">{(product.total_revenue / product.quantity_sold).toLocaleString(undefined, {maximumFractionDigits: 2})} EGP</span>
                                            {' • '}
                                            Avg per Order: <span className="font-semibold text-black">{(product.quantity_sold / product.order_count).toFixed(1)} units</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                    )}
                    {productSearchQuery !== '' && productSales.filter(product => 
                        product.item_name.toLowerCase().includes(productSearchQuery.toLowerCase())
                    ).length === 0 && (
                        <p className="text-gray-400 text-sm py-4 text-center">No products found matching "{productSearchQuery}"</p>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;