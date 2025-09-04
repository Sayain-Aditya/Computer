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
    categoryProducts: []
  });
  const [categories, setCategories] = useState([]);
  const [selectedOrderCategory, setSelectedOrderCategory] = useState('');
  const [selectedSalesCategory, setSelectedSalesCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedOrderCategory) {
      fetchCategoryData('orders', selectedOrderCategory);
    }
  }, [selectedOrderCategory]);

  useEffect(() => {
    if (selectedSalesCategory) {
      fetchCategoryData('sales', selectedSalesCategory);
    }
  }, [selectedSalesCategory]);

  const fetchCategoryData = async (type, categoryId) => {
    try {
      // Fetch all orders and filter by category
      const ordersRes = await fetch('https://computer-shop-ecru.vercel.app/api/orders/get');
      const ordersResponse = await ordersRes.json();
      const allOrders = ordersResponse.orders || ordersResponse.data || [];
      
      // Filter orders by category
      const filteredOrders = allOrders.filter(order => {
        return order.items?.some(item => {
          const productCategory = typeof item.product === 'object' 
            ? item.product?.category?._id || item.product?.category
            : null;
          return productCategory === categoryId;
        });
      });
      
      const currentYear = new Date().getFullYear();
      const monthlyData = Array(12).fill(0);
      
      filteredOrders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth();
          if (type === 'orders') {
            monthlyData[month]++;
          } else {
            const orderTotal = order.items?.reduce((total, item) => {
              const productCategory = typeof item.product === 'object' 
                ? item.product?.category?._id || item.product?.category
                : null;
              if (productCategory === categoryId) {
                return total + ((item.price || 0) * (item.quantity || 0));
              }
              return total;
            }, 0) || 0;
            monthlyData[month] += orderTotal;
          }
        }
      });
      
      if (type === 'orders') {
        setStats(prev => ({ ...prev, yearlyOrders: monthlyData }));
      } else {
        setStats(prev => ({ ...prev, yearlySales: monthlyData }));
      }
    } catch (error) {
      console.error(`Error fetching category ${type} data:`, error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [categoriesRes, ordersRes, productsRes] = await Promise.all([
        fetch('https://computer-shop-ecru.vercel.app/api/categories/all'),
        fetch('https://computer-shop-ecru.vercel.app/api/orders/get'),
        fetch('https://computer-shop-ecru.vercel.app/api/products/all')
      ]);

      const categories = await categoriesRes.json()
      const ordersResponse = await ordersRes.json()
      const products = await productsRes.json()
      
      const orders = ordersResponse.orders || ordersResponse.data || []
      
      // Process yearly orders data
      const currentYear = new Date().getFullYear()
      const monthlyOrders = Array(12).fill(0)
      const monthlySales = Array(12).fill(0)

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt)
        if (orderDate.getFullYear() === currentYear) {
          const month = orderDate.getMonth()
          monthlyOrders[month]++
          // Calculate actual total from items
          const orderTotal = order.items?.reduce((total, item) => {
            return total + ((item.price || 0) * (item.quantity || 0))
          }, 0) || 0
          monthlySales[month] += orderTotal
        }
      })

      // Process category-wise products
      const categoryCount = {}
      const productList = products.products || products
      productList.forEach(product => {
        const categoryName = product.category?.name || 'Uncategorized'
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1
      })

      setCategories(categories)
      setStats({
        totalCategories: categories.length,
        yearlyOrders: monthlyOrders,
        yearlySales: monthlySales,
        categoryProducts: Object.entries(categoryCount)
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data: ' + error.message);
    }
  };

  const currentYear = new Date().getFullYear();

  // Filter data based on selected category
  const getFilteredOrderData = () => {
    if (!selectedOrderCategory) {
      // Show all data when no category is selected
      return stats.yearlyOrders.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
    }
    return stats.yearlyOrders.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  };

  const getFilteredSalesData = () => {
    if (!selectedSalesCategory) {
      // Show all data when no category is selected
      return stats.yearlySales.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
    }
    return stats.yearlySales.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
  };

  const fiveYears = Array.from({length: 5}, (_, i) => (currentYear - 4 + i).toString());
  
  const ordersChartData = {
    labels: fiveYears,
    datasets: [{
      label: 'Yearly Orders',
      data: [0, 0, 0, 0, getFilteredOrderData()],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const salesChartData = {
    labels: fiveYears,
    datasets: [{
      label: 'Yearly Sales (₹)',
      data: [0, 0, 0, 0, getFilteredSalesData()],
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
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <div className="text-center">Loading...</div>
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
          <p className="text-2xl sm:text-3xl font-bold text-green-600">{Array.isArray(stats.yearlyOrders) ? stats.yearlyOrders.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0) : 0}</p>
        </div>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <h3 className="text-sm sm:text-lg font-semibold text-gray-600">Total Sales (Yearly)</h3>
          <p className="text-xl sm:text-3xl font-bold text-purple-600">₹{Array.isArray(stats.yearlySales) ? stats.yearlySales.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0).toLocaleString() : 0}</p>
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
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
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
              className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
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