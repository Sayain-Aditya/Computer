import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { formatIndianCurrency } from './utils/formatters';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCategories: 0,
    yearlyOrders: Array(12).fill(0),
    yearlySales: Array(12).fill(0),
    categoryProducts: [],
    totalYearlyOrders: 0,
    totalYearlySales: 0
  });
  const [categories, setCategories] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [selectedOrderCategory, setSelectedOrderCategory] = useState('');
  const [selectedSalesCategory, setSelectedSalesCategory] = useState('');
  const [filteredOrdersData, setFilteredOrdersData] = useState(Array(12).fill(0));
  const [filteredSalesData, setFilteredSalesData] = useState(Array(12).fill(0));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if data is cached
    const cachedData = sessionStorage.getItem('dashboardData')
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData)
        setStats(parsed.stats)
        setCategories(parsed.categories)
        setAllOrders(parsed.orders)
        setLoading(false)
        return
      } catch (e) {
        console.log('Cache invalid, fetching fresh data')
      }
    }
    
    fetchDashboardData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrderCategory && allOrders.length > 0) {
      const filteredData = filterOrdersByCategory(selectedOrderCategory, 'orders');
      setFilteredOrdersData(filteredData);
    } else if (!selectedOrderCategory && allOrders.length > 0) {
      // Reset to all orders
      setFilteredOrdersData(stats.yearlyOrders);
    }
  }, [selectedOrderCategory, allOrders, stats.yearlyOrders]);

  useEffect(() => {
    if (selectedSalesCategory && allOrders.length > 0) {
      const filteredData = filterOrdersByCategory(selectedSalesCategory, 'sales');
      setFilteredSalesData(filteredData);
    } else if (!selectedSalesCategory && allOrders.length > 0) {
      // Reset to all sales
      setFilteredSalesData(stats.yearlySales);
    }
  }, [selectedSalesCategory, allOrders, stats.yearlySales]);

  const filterOrdersByCategory = (categoryId, type) => {
    const currentYear = new Date().getFullYear();
    const monthlyData = Array(12).fill(0);
    
    allOrders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      if (orderDate.getFullYear() === currentYear) {
        const month = orderDate.getMonth();
        
        // Check if order has items from the selected category
        const hasCategory = order.items?.some(item => 
          item.product?.category === categoryId || item.product?.category?._id === categoryId
        );
        
        if (hasCategory) {
          if (type === 'orders') {
            monthlyData[month]++;
          } else {
            const orderTotal = order.items
              ?.filter(item => item.product?.category === categoryId || item.product?.category?._id === categoryId)
              ?.reduce((total, item) => total + ((item.price || 0) * (item.quantity || 0)), 0) || 0;
            monthlyData[month] += orderTotal;
          }
        }
      }
    });
    
    return monthlyData;
  };

  const fetchDashboardData = async () => {
    try {
      // Fetch only essential data first
      const [categoriesRes, ordersRes] = await Promise.all([
        fetch('https://computer-shop-backend-five.vercel.app/api/categories/all'),
        fetch('https://computer-shop-backend-five.vercel.app/api/orders/get')
      ]);

      const categories = await categoriesRes.json()
      const ordersResponse = await ordersRes.json()
      
      // Fetch products separately to avoid blocking
      const productsRes = await fetch('https://computer-shop-backend-five.vercel.app/api/products/all')
      const products = await productsRes.json()
      
      const orders = ordersResponse.orders || ordersResponse.data || []
      setAllOrders(orders)
      
      // Process yearly orders data (exclude quotations)
      const currentYear = new Date().getFullYear()
      const monthlyOrders = Array(12).fill(0)
      const monthlySales = Array(12).fill(0)
      let totalOrdersCount = 0
      let totalSalesAmount = 0

      orders.forEach(order => {
        // Skip quotations, only count actual orders
        if (order.type === 'Quotation') return
        
        const orderDate = new Date(order.createdAt)
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth()
          monthlyOrders[month]++
          totalOrdersCount++
          
          // Calculate actual total from items
          const orderTotal = order.items?.reduce((total, item) => {
            return total + ((item.price || 0) * (item.quantity || 0))
          }, 0) || 0
          monthlySales[month] += orderTotal
          totalSalesAmount += orderTotal
        }
      })

      // Process category-wise products with fallback
      const categoryCount = {}
      const productList = products?.products || products || []
      if (Array.isArray(productList)) {
        productList.forEach(product => {
          const categoryName = product.category?.name || 'Uncategorized'
          categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
        })
      }

      const newStats = {
        totalCategories: categories.length,
        yearlyOrders: monthlyOrders,
        yearlySales: monthlySales,
        categoryProducts: Object.entries(categoryCount),
        totalYearlyOrders: totalOrdersCount,
        totalYearlySales: totalSalesAmount
      }
      
      setFilteredOrdersData(monthlyOrders)
      setFilteredSalesData(monthlySales)
      
      setCategories(categories)
      setStats(newStats)
      
      // Cache data for 5 minutes
      try {
        sessionStorage.setItem('dashboardData', JSON.stringify({
          stats: newStats,
          categories,
          orders,
          timestamp: Date.now()
        }))
      } catch (e) {
        console.log('Failed to cache data')
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data: ' + error.message);
    }
  };

  const currentYear = new Date().getFullYear();

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const ordersChartData = {
    labels: months,
    datasets: [{
      label: selectedOrderCategory ? `Orders - ${categories.find(c => c._id === selectedOrderCategory)?.name || 'Category'}` : 'Monthly Orders',
      data: filteredOrdersData,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const salesChartData = {
    labels: months,
    datasets: [{
      label: selectedSalesCategory ? `Sales - ${categories.find(c => c._id === selectedSalesCategory)?.name || 'Category'}` : 'Monthly Sales (₹)',
      data: filteredSalesData,
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgba(34, 197, 94, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const categoryChartData = {
    labels: stats.categoryProducts.map(([category]) => category),
    datasets: [{
      data: stats.categoryProducts.map(([, count]) => count),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4',
        '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ],
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverBorderWidth: 3,
    }],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
      },
    },
    cutout: '60%',
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white p-4 sm:p-6 rounded-lg shadow animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="text-center text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="text-center text-red-600">{error}</div>
        <div className="mt-4">
          <button 
            onClick={() => { setError(null); setLoading(true); fetchDashboardData().finally(() => setLoading(false)); }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">Total Categories</h3>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.totalCategories}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">Total Orders (Yearly)</h3>
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.totalYearlyOrders || 0}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">Total Sales (Yearly)</h3>
          <p className="text-xl sm:text-3xl font-bold text-purple-600">{formatIndianCurrency(stats.totalYearlySales || 0)}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">Total Products</h3>
          <p className="text-2xl sm:text-3xl font-bold text-orange-600">{Array.isArray(stats.categoryProducts) ? stats.categoryProducts.reduce((sum, [, count]) => sum + count, 0) : 0}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Yearly Orders</h3>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          <div className="mb-4">
            <select
              value={selectedOrderCategory}
              onChange={(e) => {
                setSelectedOrderCategory(e.target.value);
                if (!e.target.value) {
                  fetchDashboardData();
                }
              }}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-48 sm:h-64">
            <Bar data={ordersChartData} options={barChartOptions} />
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Yearly Sales</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="mb-4">
            <select
              value={selectedSalesCategory}
              onChange={(e) => {
                setSelectedSalesCategory(e.target.value);
                if (!e.target.value) {
                  fetchDashboardData();
                }
              }}
              className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="h-48 sm:h-64">
            <Bar data={salesChartData} options={barChartOptions} />
          </div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-100 lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800">Products by Category</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Distribution</span>
              <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            </div>
          </div>
          <div className="h-48 sm:h-64">
            <Doughnut data={categoryChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;