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
      const productsResponse = await axios.get('https://computer-shop-ecru.vercel.app/api/products/all')
      const allProducts = productsResponse.data
      
      const itemsWithNames = order.items?.map(item => {
        const product = allProducts.find(p => p._id === item.product)
        return {
          ...item,
          productName: product?.name || `Product ${item.product}`,
          categoryName: product?.category?.name || 'N/A'
        }
      }) || []
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
            .header { text-center; margin-bottom: 48px; }
            .header h1 { font-size: 2.5rem; font-weight: bold; color: #1f2937; margin-bottom: 8px; }
            .header p { font-size: 1.25rem; color: #4b5563; }
            .header hr { width: 128px; margin: 16px auto; border: 1px solid #d1d5db; }
            .section { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-bottom: 48px; }
            .section h3 { font-size: 1.25rem; font-weight: bold; color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
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
            .item-name { font-weight: 600; color: #1f2937; }
            .item-category { font-size: 0.875rem; color: #4b5563; }
            .qty { text-align: center; font-weight: 500; }
            .price { text-align: right; font-weight: 500; }
            .total-cell { text-align: right; font-weight: bold; }
            .totals { display: flex; justify-content: flex-end; margin-bottom: 48px; }
            .totals-box { width: 320px; background-color: #f9fafb; padding: 24px; border-radius: 8px; border: 2px solid #d1d5db; }
            .totals-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #d1d5db; font-size: 1.125rem; }
            .totals-row span { font-weight: 500; }
            .totals-row.final { font-weight: bold; font-size: 1.5rem; color: #1f2937; border-top: 2px solid #9ca3af; margin-top: 8px; padding-top: 16px; }
            .footer { text-align: center; border-top: 2px solid #d1d5db; padding-top: 32px; }
            .footer p:first-child { font-size: 1.125rem; font-weight: 500; color: #374151; margin-bottom: 8px; }
            .footer p:last-child { color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>ORDER DETAILS</h1>
            <p>Computer Shop</p>
            <hr>
          </div>
          
          <div class="section">
            <div>
              <h3>Bill To:</h3>
              <div class="customer-info">
                <p class="customer-name">${order.customerName}</p>
                <p>${order.customerEmail}</p>
                <p>${order.customerPhone}</p>
                <p>${order.address || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3>Order Details:</h3>
              <div class="order-info">
                <p><span>Date:</span> ${new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span>Order #:</span> OR-${order._id?.slice(-6)}</p>
                <p><span>Type:</span> ${order.type}</p>
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
                  <td class="price">$${item.price}</td>
                  <td class="total-cell">$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') || ''}
            </tbody>
          </table>
          
          <div class="totals">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>$${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
              </div>
              <div class="totals-row">
                <span>Tax (0%):</span>
                <span>$0.00</span>
              </div>
              <div class="totals-row final">
                <span>TOTAL:</span>
                <span>$${order.items?.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) || '0.00'}</span>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Order processed on ${new Date().toLocaleDateString()}</p>
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
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Orders</h1>
          <p className="text-gray-600 text-sm mt-1">View and manage customer orders</p>
        </div>
        <button 
          onClick={() => navigate('/create-order')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Create New Order
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order, index) => (
                <motion.tr 
                  key={order._id}
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #{order._id?.slice(-6) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{order.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.customerEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{order.customerPhone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {order.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    ${order.totalAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          navigate('/quotation', {
                            state: {
                              orderData: {
                                customer: {
                                  name: order.customerName,
                                  email: order.customerEmail,
                                  phone: order.customerPhone,
                                  address: order.address || 'N/A'
                                },
                                products: order.items?.map(item => ({
                                  name: `Product ${item.product}`,
                                  orderQuantity: item.quantity,
                                  sellingRate: item.price,
                                  category: { name: 'N/A' }
                                })) || [],
                                totalAmount: order.items?.reduce((total, item) => total + (item.price * item.quantity), 0) || 0
                              }
                            }
                          })
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                      >
                        View PDF
                      </button>
                      <button 
                        onClick={() => handlePrintOrder(order)}
                        className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                      >
                        Print
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order._id)}
                        className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
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
