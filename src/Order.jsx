import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import axios from 'axios'

const Order = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchOrders(1)
  }, [])

  const fetchOrders = async (page = 1) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/orders/get?page=${page}`)
      const ordersData = response.data.orders || response.data.data || []
      // Sort orders by creation date (newest first)
      const sortedOrders = ordersData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setOrders(sortedOrders)
      setTotalPages(response.data.totalPages || 1)
      setCurrentPage(page)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    if (!searchTerm) return orders
    return orders.filter(order => 
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/orders/${orderId}`)
      toast.success('Order deleted successfully!')
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      toast.error('Failed to delete order. Please try again.')
    }
  }

  const exportToCSV = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/orders/export/csv')
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `orders-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Orders exported to CSV successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export orders. Please try again.')
    }
  }

  const handlePrintOrder = async (order) => {
    try {
      // Fetch product details for each item
      const [productsResponse, categoriesResponse] = await Promise.all([
        axios.get('https://computer-shop-ecru.vercel.app/api/products/all'),
        axios.get('https://computer-shop-ecru.vercel.app/api/categories/all')
      ])
      const allProducts = productsResponse.data
      const allCategories = categoriesResponse.data
      
      const itemsWithNames = order.items?.map(item => {
        // Handle case where item.product might be an object or string
        let productName = 'Unknown Product'
        let categoryName = 'N/A'
        
        if (typeof item.product === 'object' && item.product?.name) {
          // item.product is already a product object
          productName = item.product.name
          if (item.product.category?.name) {
            categoryName = item.product.category.name
          } else if (item.product.category) {
            // category might be just an ID, look it up
            const category = allCategories.find(c => c._id === item.product.category)
            categoryName = category?.name || 'N/A'
          }
        } else if (typeof item.product === 'string') {
          // item.product is an ID, find the product
          const product = allProducts.find(p => p._id === item.product)
          productName = product?.name || `Product ${item.product}`
          if (product?.category?.name) {
            categoryName = product.category.name
          } else if (product?.category) {
            // category might be just an ID, look it up
            const category = allCategories.find(c => c._id === product.category)
            categoryName = category?.name || 'N/A'
          }
        }
        
        return {
          ...item,
          productName: productName,
          categoryName: categoryName
        }
      }) || []
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Order - ${order._id?.slice(-6)}</title>
          <style>
            @page { margin: 0; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; background: white; padding: 32px; }
            
            .header { text-align: center; margin-bottom: 48px; }
            .header h1 { font-size: 2.5rem; font-weight: bold; color: #374151; margin-bottom: 8px; }
            .header p { font-size: 1.25rem; color: #6b7280; }
            .header hr { width: 128px; margin: 16px auto; border: 1px solid #d1d5db; }
            
            .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
            .info-section h3 { font-size: 1.25rem; font-weight: bold; color: #374151; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            .customer-info { color: #374151; }
            .customer-info p { margin: 4px 0; }
            .customer-name { font-weight: 600; font-size: 1.125rem; }
            .order-info { text-align: right; color: #374151; }
            .order-info p { margin: 4px 0; }
            .order-info span { font-weight: 500; }
            
            table { width: 100%; border-collapse: collapse; border: 2px solid #9ca3af; margin-bottom: 48px; }
            th { border: 2px solid #9ca3af; padding: 24px; color: white; background-color: #1e3a8a; font-weight: bold; }
            td { border: 1px solid #d1d5db; padding: 24px; }
            .item-row:nth-child(even) { background-color: #f9fafb; }
            .item-name { font-weight: 600; color: #374151; margin-bottom: 3px; }
            .item-category { font-size: 0.875rem; color: #6b7280; }
            .qty { text-align: center; font-weight: 500; }
            .price { text-align: right; font-weight: 500; }
            .total-cell { text-align: right; font-weight: bold; }
            
            .totals { display: flex; justify-content: flex-end; margin-bottom: 48px; }
            .totals-box { width: 320px; background-color: #f9fafb; padding: 24px; border-radius: 8px; border: 2px solid #d1d5db; }
            .totals-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1d5db; font-size: 1.125rem; }
            .totals-row span { font-weight: 500; }
            .totals-row.final { font-weight: bold; font-size: 1.5rem; color: #374151; border-top: 2px solid #9ca3af; margin-top: 8px; padding-top: 16px; }
            
            .footer { text-align: center; border-top: 2px solid #d1d5db; padding-top: 32px; }
            .footer p:first-child { font-size: 1.125rem; font-weight: 500; color: #374151; margin-bottom: 8px; }
            .footer p:last-child { color: #6b7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDER</h1>
            <p>Computer Shop</p>
            <hr>
          </div>
          
          <div class="info-section">
            <div>
              <h3>Bill To:</h3>
              <div class="customer-info">
                <p class="customer-name">${order.customerName}</p>
                <p>${order.customerEmail}</p>
                <p>${order.customerPhone}</p>
                <p>${order.address || 'Address not provided'}</p>
              </div>
            </div>
            <div>
              <h3 style="text-align: right;">Order Details:</h3>
              <div class="order-info">
                <p><span>Date:</span> ${new Date().toLocaleDateString()}</p>
                <p><span>Order #:</span> OR-${order._id?.slice(-6)}</p>
                <p><span>Status:</span> Confirmed</p>
              </div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Item Description</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Unit Price</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsWithNames?.map((item, index) => `
                <tr class="item-row">
                  <td>
                    <div class="item-name">${item.productName}</div>
                    <div class="item-category">${item.categoryName}</div>
                  </td>
                  <td class="qty">${item.quantity}</td>
                  <td class="price">₹${item.price.toFixed(2)}</td>
                  <td class="total-cell">₹${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>₹${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
              </div>
              <div class="totals-row">
                <span>Tax (0%):</span>
                <span>₹0.00</span>
              </div>
              <div class="totals-row final">
                <span>TOTAL:</span>
                <span>₹${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>This order confirmation was generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `
      
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
        setTimeout(() => printWindow.close(), 1000)
      }
    } catch (error) {
      console.error('Print error:', error)
      toast.error('Print failed. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading orders...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800">Orders</h1>
              <p className="text-gray-600 text-lg">View and manage customer orders</p>
            </div>
            <div className="flex gap-3">
              <motion.button 
                onClick={exportToCSV}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                📊 Export CSV
              </motion.button>
              <motion.button 
                onClick={() => navigate('/create-order')}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                + Create New Order
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <input
            type="text"
            placeholder="Search orders by customer name, email, or order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 shadow-sm w-full sm:w-96"
          />
          <div className="text-sm text-gray-500">
            Showing {getFilteredOrders().length} orders
          </div>
        </div>
      </div>

      <motion.div 
        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {getFilteredOrders().map((order, index) => (
                <motion.tr 
                  key={order._id}
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">#{order._id?.slice(-6) || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{order.customerName}</div>
                      <div className="text-xs text-gray-500">{order.customerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {order.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">₹{order.totalAmount?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                          try {
                            const [productsResponse, categoriesResponse] = await Promise.all([
                              axios.get('https://computer-shop-ecru.vercel.app/api/products/all'),
                              axios.get('https://computer-shop-ecru.vercel.app/api/categories/all')
                            ])
                            const allProducts = productsResponse.data
                            const allCategories = categoriesResponse.data
                            
                            const productsWithNames = order.items?.map(item => {
                              // Handle case where item.product might be an object or string
                              let productName = 'Unknown Product'
                              let categoryName = 'N/A'
                              
                              if (typeof item.product === 'object' && item.product?.name) {
                                // item.product is already a product object
                                productName = item.product.name
                                if (item.product.category?.name) {
                                  categoryName = item.product.category.name
                                } else if (item.product.category) {
                                  // category might be just an ID, look it up
                                  const category = allCategories.find(c => c._id === item.product.category)
                                  categoryName = category?.name || 'N/A'
                                }
                              } else if (typeof item.product === 'string') {
                                // item.product is an ID, find the product
                                const product = allProducts.find(p => p._id === item.product)
                                productName = product?.name || `Product ${item.product}`
                                if (product?.category?.name) {
                                  categoryName = product.category.name
                                } else if (product?.category) {
                                  // category might be just an ID, look it up
                                  const category = allCategories.find(c => c._id === product.category)
                                  categoryName = category?.name || 'N/A'
                                }
                              }
                              
                              return {
                                name: productName,
                                orderQuantity: item.quantity,
                                sellingRate: item.price,
                                category: { name: categoryName }
                              }
                            }) || []
                            
                            navigate('/quotation', {
                              state: {
                                orderData: {
                                  customer: {
                                    name: order.customerName,
                                    email: order.customerEmail,
                                    phone: order.customerPhone,
                                    address: order.address || 'Address not provided'
                                  },
                                  products: productsWithNames,
                                  totalAmount: order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0
                                }
                              }
                            })
                          } catch (error) {
                            console.error('Error fetching products:', error)
                            toast.error('Failed to load product details. Please try again.')
                          }
                        }}
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
                      >
                        View PDF
                      </button>
                      <button 
                        onClick={() => handlePrintOrder(order)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-100"
                      >
                        Print
                      </button>
                      <button 
                        onClick={() => navigate(`/edit-order/${order._id}`)}
                        className="px-3 py-1 bg-amber-50 text-amber-600 text-xs font-medium rounded-lg hover:bg-amber-100"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order._id)}
                        className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredOrders().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 text-lg mb-2">No orders found</p>
            <p className="text-gray-400 text-sm mb-4">Create your first order to get started</p>
            <button 
              onClick={() => navigate('/create-order')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Order
            </button>
          </div>
        )}
      </motion.div>
      
      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-2">
        <button
          onClick={() => fetchOrders(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            onClick={() => fetchOrders(page)}
            className={`px-3 py-2 rounded ${
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {page}
          </button>
        ))}
        
        <button
          onClick={() => fetchOrders(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Order Details - {selectedOrder._id}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold text-gray-800 mb-3">Order Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(selectedOrder, null, 2)}
                </pre>
              </div>
            </div>

            {selectedOrder.items && selectedOrder.items.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Items</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Product ID</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2 text-sm text-gray-900">{item.product}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">₹{item.price}</td>
                          <td className="px-4 py-2 text-sm font-medium text-green-600">₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Order
