import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiDollarSign, FiShoppingCart, FiPackage, FiUsers,
  FiTrendingUp, FiArrowUp, FiArrowDown, FiPercent
} from 'react-icons/fi';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#d4a541', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
const GOLD = '#d4a541';
const BLUE = '#3b82f6';

const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val || 0);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.getDashboard();
      setData(res.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-12 h-12 border-4 border-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-400">No data available</div>;
  }

  // ---- Stat Cards ----
  const statCards = [
    {
      label: 'Total Sales',
      value: formatCurrency(data.totalSales),
      icon: FiDollarSign,
      color: 'text-gold',
      bg: 'bg-gold/10',
      sub: `${data.totalSalesCount} transactions`,
    },
    {
      label: 'Inventory Value',
      value: formatCurrency(data.inventoryValue),
      icon: FiPackage,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      sub: `${data.inStockInventory} in stock / ${data.soldInventory} sold`,
    },
    {
      label: 'Items Sold',
      value: data.soldInventory.toString(),
      icon: FiShoppingCart,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      sub: `Out of ${data.totalInventory} total items`,
    },
    {
      label: 'Active Employees',
      value: data.totalEmployees.toString(),
      icon: FiUsers,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      sub: `${formatCurrency(data.totalDiscount)} total discounts`,
    },
  ];

  // ---- Chart Data ----
  const salesByTypeData = data.salesByType.map(item => ({
    name: item.jewelry_type || 'Unknown',
    value: parseFloat(item.total),
    count: parseInt(item.count),
  }));

  const salesByEmployeeData = data.salesByEmployee.map(item => ({
    name: item.full_name.length > 12 ? item.full_name.substring(0, 12) + '…' : item.full_name,
    fullName: item.full_name,
    sales: parseFloat(item.total),
    count: parseInt(item.count),
  }));

  const salesByCategoryData = data.salesByCategory.map(item => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '…' : item.name,
    fullName: item.name,
    sales: parseFloat(item.total),
    count: parseInt(item.count),
  }));

  const dailySalesData = data.dailySales.map(item => ({
    date: new Date(item.sale_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    fullDate: item.sale_date,
    sales: parseFloat(item.total),
    count: parseInt(item.count),
  }));

  const monthlySalesData = data.monthlySales.map(item => ({
    month: item.month,
    sales: parseFloat(item.total),
    count: parseInt(item.count),
  }));

  const inventoryByTypeData = data.inventoryByType.map(item => ({
    name: item.jewelry_type,
    count: parseInt(item.count),
    weight: parseFloat(item.total_weight),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiTrendingUp className="text-gold" /> Dashboard
        </h2>
        <p className="text-gray-400 mt-1">Overview of your jewelry store performance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => (
          <div key={idx} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${card.bg} rounded-lg flex items-center justify-center`}>
                <card.icon className={card.color} size={20} />
              </div>
            </div>
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-white mt-1">{card.value}</p>
            <p className="text-gray-500 text-xs mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Row 1: Daily Sales Line + Sales by Type Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Sales Trend */}
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-white mb-4">Sales Trend (Last 30 Days)</h3>
          <div className="h-64 min-h-[256px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySalesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2025" />
                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Area type="monotone" dataKey="sales" stroke={GOLD} fill="url(#goldGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales by Jewelry Type */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Sales by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={salesByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {salesByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                />
                <Legend
                  wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Monthly Sales Bar + Top Employees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Sales */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2025" />
                <XAxis dataKey="month" stroke="#6b7280" tick={{ fontSize: 11 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                />
                <Bar dataKey="sales" fill={GOLD} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Employees */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Top Employees by Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByEmployeeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2025" />
                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <YAxis type="category" dataKey="name" stroke="#6b7280" tick={{ fontSize: 11 }} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  labelFormatter={(label) => {
                    const emp = salesByEmployeeData.find(e => e.name === label);
                    return emp ? emp.fullName : label;
                  }}
                />
                <Bar dataKey="sales" fill={BLUE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Sales by Category + Inventory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Category */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Sales by Category</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByCategoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a2025" />
                <XAxis dataKey="name" stroke="#6b7280" tick={{ fontSize: 10 }} />
                <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [formatCurrency(value), 'Sales']}
                  labelFormatter={(label) => {
                    const cat = salesByCategoryData.find(c => c.name === label);
                    return cat ? cat.fullName : label;
                  }}
                />
                <Bar dataKey="sales" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Inventory Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={inventoryByTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  label={({ name, count }) => `${name}: ${count}`}
                >
                  {inventoryByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2025', border: '1px solid #d4a541', borderRadius: '8px', color: '#fff' }}
                  formatter={(value, name, props) => {
                    const item = inventoryByTypeData.find(i => i.count === value);
                    return [`${value} items (${item ? item.weight.toFixed(1) : 0}g)`, props.payload.name];
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Quick Stats Table */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Inventory Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-primary rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-white mt-1">{data.totalInventory}</p>
          </div>
          <div className="bg-primary rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">In Stock</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{data.inStockInventory}</p>
          </div>
          <div className="bg-primary rounded-lg p-4 text-center">
            <p className="text-gray-400 text-sm">Sold</p>
            <p className="text-2xl font-bold text-gold mt-1">{data.soldInventory}</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Sold</span>
            <span>{data.totalInventory > 0 ? Math.round((data.soldInventory / data.totalInventory) * 100) : 0}%</span>
          </div>
          <div className="w-full bg-secondary rounded-full h-3">
            <div
              className="bg-gradient-to-r from-gold to-gold-light h-3 rounded-full transition-all duration-500"
              style={{ width: `${data.totalInventory > 0 ? (data.soldInventory / data.totalInventory) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
