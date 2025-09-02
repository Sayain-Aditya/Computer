import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import axios from 'axios'

const Order = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/orders/get')
      setOrders(response.data.data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this order?')) return
    
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/orders/${orderId}`)
      alert('Order deleted successfully!')
      fetchOrders()
    } catch (error) {
      console.error('Error deleting order:', error)
      alert('Failed to delete order. Please try again.')
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
            @page { margin: 0.4in; size: A4; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; line-height: 1.4; color: #333; background: white; font-size: 12px; }
            
            .container { max-width: 100%; margin: 0 auto; padding: 10px; }
            
            .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
            .header h1 { font-size: 1.8rem; font-weight: bold; color: #1e3a8a; margin-bottom: 3px; }
            .header .company { font-size: 1rem; color: #666; font-weight: 500; }
            
            .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
            .info-box { background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #1e3a8a; }
            .info-title { font-size: 0.9rem; font-weight: bold; color: #1e3a8a; margin-bottom: 8px; text-transform: uppercase; }
            .customer-name { font-size: 1rem; font-weight: bold; color: #333; margin-bottom: 3px; }
            .info-item { margin-bottom: 2px; color: #555; font-size: 0.85rem; }
            .order-details { text-align: left; }
            .order-details .info-item { display: flex; justify-content: space-between; }
            .order-details .label { font-weight: 600; }
            
            .items-section { margin-bottom: 20px; }
            .items-title { font-size: 1rem; font-weight: bold; color: #1e3a8a; margin-bottom: 10px; text-transform: uppercase; }
            
            .items-table { width: 100%; border-collapse: collapse; }
            .items-table th { background: #1e3a8a; color: white; padding: 8px; text-align: left; font-weight: bold; font-size: 0.8rem; }
            .items-table th:nth-child(2), .items-table th:nth-child(3), .items-table th:nth-child(4) { text-align: center; }
            .items-table th:nth-child(4) { text-align: right; }
            .items-table td { padding: 8px; border-bottom: 1px solid #eee; font-size: 0.8rem; }
            .items-table tbody tr:nth-child(even) { background: #f8f9fa; }
            
            .item-name { font-weight: 600; color: #333; margin-bottom: 2px; }
            .item-category { font-size: 0.75rem; color: #666; font-style: italic; }
            .qty-cell, .price-cell { text-align: center; font-weight: 500; }
            .total-cell { text-align: right; font-weight: bold; color: #1e3a8a; }
            
            .summary-section { display: flex; justify-content: flex-end; margin-bottom: 15px; }
            .summary-box { background: #f8f9fa; padding: 12px; border-radius: 6px; min-width: 250px; border: 1px solid #1e3a8a; }
            .summary-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #ddd; font-size: 0.85rem; }
            .summary-row:last-child { border-bottom: none; }
            .summary-label { font-weight: 500; }
            .summary-value { font-weight: 600; }
            .summary-total { background: #1e3a8a; color: white; margin: 8px -12px -12px -12px; padding: 8px 12px; border-radius: 0 0 5px 5px; }
            .summary-total .summary-row { border-bottom: none; font-size: 0.9rem; font-weight: bold; }
            
            .footer { text-align: center; border-top: 1px solid #1e3a8a; padding-top: 10px; }
            .footer .thank-you { font-size: 1rem; font-weight: bold; color: #1e3a8a; margin-bottom: 5px; }
            .footer .note { color: #666; font-size: 0.75rem; }
            
            @media print {
              .container { padding: 0; }
              .header { page-break-after: avoid; }
              .info-section { page-break-after: avoid; }
              .items-section { page-break-inside: auto; }
              .summary-section { page-break-inside: avoid; }
              .footer { page-break-before: avoid; }
              body { font-size: 11px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>ORDER</h1>
              <div class="company">Computer Shop</div>
            </div>
            
            <div class="info-section">
              <div class="info-box">
                <div class="info-title">Bill To</div>
                <div class="customer-name">${order.customerName}</div>
                <div class="info-item">${order.customerEmail}</div>
                <div class="info-item">${order.customerPhone}</div>
                <div class="info-item">${order.address || 'Address not provided'}</div>
              </div>
              
              <div class="info-box order-details">
                <div class="info-title">Order Details</div>
                <div class="info-item">
                  <span class="label">Date:</span>
                  <span>${new Date().toLocaleDateString()}</span>
                </div>
                <div class="info-item">
                  <span class="label">Order #:</span>
                  <span>OR-${order._id?.slice(-6)}</span>
                </div>
                <div class="info-item">
                  <span class="label">Status:</span>
                  <span>Confirmed</span>
                </div>
              </div>
            </div>
            
            <div class="items-section">
              <div class="items-title">Order Items</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsWithNames?.map((item, index) => `
                    <tr>
                      <td>
                        <div class="item-name">${item.productName}</div>
                        <div class="item-category">${item.categoryName}</div>
                      </td>
                      <td class="qty-cell">${item.quantity}</td>
                      <td class="price-cell">$${item.price.toFixed(2)}</td>
                      <td class="total-cell">$${(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>
            
            <div class="summary-section">
              <div class="summary-box">
                <div class="summary-row">
                  <span class="summary-label">Subtotal:</span>
                  <span class="summary-value">$${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Tax (0%):</span>
                  <span class="summary-value">$0.00</span>
                </div>
                <div class="summary-row">
                  <span class="summary-label">Shipping:</span>
                  <span class="summary-value">$0.00</span>
                </div>
                <div class="summary-total">
                  <div class="summary-row">
                    <span class="summary-label">TOTAL:</span>
                    <span class="summary-value">$${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="thank-you">Thank you for your business!</div>
              <div class="note">This order confirmation was generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
            </div>
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
      alert('Print failed. Please try again.')
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
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {orders.length} orders found
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
              {orders.map((order, index) => (
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
                    <span className="text-sm font-semibold text-gray-800">${order.totalAmount?.toFixed(2) || '0.00'}</span>
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
                            alert('Failed to load product details. Please try again.')
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

        {orders.length === 0 && (
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
                          <td className="px-4 py-2 text-sm text-gray-600">${item.price}</td>
                          <td className="px-4 py-2 text-sm font-medium text-green-600">${(item.price * item.quantity).toFixed(2)}</td>
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
