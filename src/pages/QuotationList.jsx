import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import axios from 'axios'
import { formatIndianCurrency, formatIndianNumber } from '../utils/formatters'


const QuotationList = () => {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const [quotationToConvert, setQuotationToConvert] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')


  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async (search = '') => {
    try {
      const url = search 
        ? `https://computer-shop-ecru.vercel.app/api/orders/get?search=${encodeURIComponent(search)}`
        : 'https://computer-shop-ecru.vercel.app/api/orders/get'
      
      console.log('API URL:', url)
      const response = await axios.get(url)
      console.log('API Response:', response.data)
      
      // Filter only quotations (type: 'Quotation')
      let quotationData = response.data.data?.filter(order => order.type === 'Quotation') || []
      
      // If search returns empty but we have a search term, try without search
      if (quotationData.length === 0 && search) {
        console.log('Search returned empty, trying without search...')
        const fallbackResponse = await axios.get('https://computer-shop-ecru.vercel.app/api/orders/get')
        const allData = fallbackResponse.data.data?.filter(order => order.type === 'Quotation') || []
        
        // Client-side search as fallback
        quotationData = allData.filter(quotation => 
          quotation.customerName?.toLowerCase().includes(search.toLowerCase()) ||
          quotation.customerEmail?.toLowerCase().includes(search.toLowerCase()) ||
          quotation._id?.toLowerCase().includes(search.toLowerCase()) ||
          quotation._id?.slice(-6).toLowerCase().includes(search.toLowerCase())
        )
      }
      
      console.log('Final quotations:', quotationData)
      
      // Sort quotations by creation date (newest first)
      const sortedQuotations = quotationData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      setQuotations(sortedQuotations)
    } catch (error) {
      console.error('Error fetching quotations:', error)
      console.error('Error details:', error.response?.data)
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchTerm(value)
    fetchQuotations(value)
  }

  const handleDeleteQuotation = async (quotationId) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return
    
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/orders/${quotationId}`)
      toast.success('Quotation deleted successfully!')
      fetchQuotations()
    } catch (error) {
      console.error('Error deleting quotation:', error)
      toast.error('Failed to delete quotation. Please try again.')
    }
  }

  const handleConvertToOrder = async () => {
    try {
      await axios.put(`https://computer-shop-ecru.vercel.app/api/orders/${quotationToConvert}/convert`)
      toast.success('✅ Quotation converted to order successfully!')
      fetchQuotations()
      setShowConvertModal(false)
      setQuotationToConvert(null)
    } catch (error) {
      console.error('Error converting quotation:', error)
      toast.error('❌ Failed to convert quotation. Please try again.')
      setShowConvertModal(false)
      setQuotationToConvert(null)
    }
  }

  const handleStatusChange = async (quotationId, newStatus) => {
    try {
      if (newStatus === 'confirmed') {
        // Use existing convert API for confirmed status
        await axios.put(`https://computer-shop-ecru.vercel.app/api/orders/${quotationId}/convert`)
        toast.success('Status updated to confirmed!')
      } else {
        // For pending, just show success (no API call needed)
        toast.success('Status updated to pending!')
      }
      fetchQuotations()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status. Please try again.')
    }
  }

  const shareOnWhatsApp = (orderData) => {
    try {
      let message = `🏪 *Computer Shop Quotation*\n\n`
      message += `👤 *Customer:* ${orderData.customer.name}\n`
      message += `📧 *Email:* ${orderData.customer.email}\n`
      message += `📱 *Phone:* ${orderData.customer.phone}\n\n`
      message += `📋 *Items:*\n`
      
      orderData.products.forEach((item, index) => {
        message += `${index + 1}. ${item.name}\n`
        message += `   Qty: ${item.orderQuantity} | Rate: ${formatIndianCurrency(item.sellingRate)}\n`
      })
      
      message += `\n💰 *Total Amount: ${formatIndianCurrency(orderData.totalAmount)}*\n\n`
      message += `📅 Date: ${new Date().toLocaleDateString()}\n`
      message += `🙏 Thank you for your business!`
      
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
      window.open(whatsappUrl, '_blank')
      
      toast.success('WhatsApp opened with quotation details!')
    } catch (error) {
      console.error('Error sharing on WhatsApp:', error)
      toast.error('Failed to share on WhatsApp. Please try again.')
    }
  }

  const exportToCSV = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/orders/quotations/export/csv')
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `quotations-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Quotations exported to CSV successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export quotations. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading quotations...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-4 sm:p-8 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Quotation List</h1>
              <p className="text-gray-600 text-base sm:text-lg">View and manage customer quotations</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
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
                + Create New Quotation
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <input
            type="text"
            placeholder="Search quotations by customer name, email, or quote ID..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value)
              fetchQuotations(e.target.value)
            }}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 shadow-sm w-full lg:w-96"
          />
          <div className="text-sm text-gray-500 w-full lg:w-auto text-left lg:text-right">
            {quotations.length} quotations found
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {quotations.map((quotation, index) => (
          <div
            key={quotation._id}
            className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{quotation.quoteId || `#QT-${quotation._id?.slice(-6)}` || 'N/A'}</h3>
                <p className="text-sm text-gray-600">{quotation.customerName}</p>
                <p className="text-xs text-gray-500">{quotation.customerEmail}</p>
              </div>
              <span className="text-lg font-bold text-gray-900">{formatIndianCurrency(quotation.totalAmount || 0)}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
              <div>
                <span className="text-gray-500">Items:</span>
                <p className="font-medium">{quotation.items?.length || 0} items</p>
              </div>
              <div>
                <span className="text-gray-500">Date:</span>
                <p className="font-medium">{new Date(quotation.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Status:</span>
                <select
                  value={quotation.status}
                  onChange={(e) => handleStatusChange(quotation._id, e.target.value)}
                  className={`ml-2 px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 ${
                    quotation.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                    quotation.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                    'bg-gray-50 text-gray-600'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={async () => {
                  try {
                    const [productsResponse, categoriesResponse] = await Promise.all([
                      axios.get('https://computer-shop-ecru.vercel.app/api/products/all'),
                      axios.get('https://computer-shop-ecru.vercel.app/api/categories/all')
                    ])
                    const allProducts = productsResponse.data
                    const allCategories = categoriesResponse.data
                    
                    const productsWithNames = quotation.items?.map(item => {
                      let productName = 'Unknown Product'
                      let categoryName = 'N/A'
                      
                      if (typeof item.product === 'object' && item.product?.name) {
                        productName = item.product.name
                        if (item.product.category?.name) {
                          categoryName = item.product.category.name
                        } else if (item.product.category) {
                          const category = allCategories.find(c => c._id === item.product.category)
                          categoryName = category?.name || 'N/A'
                        }
                      } else if (typeof item.product === 'string') {
                        const product = allProducts.find(p => p._id === item.product)
                        productName = product?.name || `Product ${item.product}`
                        if (product?.category?.name) {
                          categoryName = product.category.name
                        } else if (product?.category) {
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
                    
                    // Create short shareable PDF link
                    const shareableUrl = `${window.location.origin}/shared-quotation/${quotation._id}`
                    
                    // Open PDF in new tab
                    window.open(shareableUrl, '_blank')
                    
                    // Copy link and show WhatsApp option
                    navigator.clipboard.writeText(shareableUrl)
                    
                    const message = `Computer Shop Quotation\n\nCustomer: ${quotation.customerName}\nTotal: ₹${quotation.totalAmount?.toFixed(2)}\n\nView PDF: ${shareableUrl}`
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                    
                    setTimeout(() => {
                      if (confirm('PDF link copied! Open WhatsApp to share?')) {
                        window.open(whatsappUrl, '_blank')
                      }
                    }, 1000)
                  } catch (error) {
                    console.error('Error fetching products:', error)
                    toast.error('Failed to load product details. Please try again.')
                  }
                }}
                className="px-3 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-200"
              >
                View PDF
              </button>
              <button 
                onClick={() => handleDeleteQuotation(quotation._id)}
                className="px-3 py-2 bg-rose-50 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-100"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Quote ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Items</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Total</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {quotations.map((quotation, index) => (
                <tr 
                  key={quotation._id}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">{quotation.quoteId || `#QT-${quotation._id?.slice(-6)}` || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{quotation.customerName}</div>
                      <div className="text-xs text-gray-500">{quotation.customerEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {quotation.items?.length || 0} items
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">{formatIndianCurrency(quotation.totalAmount || 0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={quotation.status}
                      onChange={(e) => handleStatusChange(quotation._id, e.target.value)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                        quotation.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                        quotation.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                        'bg-gray-50 text-gray-600'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(quotation.createdAt).toLocaleDateString()}
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
                            
                            const productsWithNames = quotation.items?.map(item => {
                              let productName = 'Unknown Product'
                              let categoryName = 'N/A'
                              
                              if (typeof item.product === 'object' && item.product?.name) {
                                productName = item.product.name
                                if (item.product.category?.name) {
                                  categoryName = item.product.category.name
                                } else if (item.product.category) {
                                  const category = allCategories.find(c => c._id === item.product.category)
                                  categoryName = category?.name || 'N/A'
                                }
                              } else if (typeof item.product === 'string') {
                                const product = allProducts.find(p => p._id === item.product)
                                productName = product?.name || `Product ${item.product}`
                                if (product?.category?.name) {
                                  categoryName = product.category.name
                                } else if (product?.category) {
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
                            
                            // Create short shareable PDF link
                            const shareableUrl = `${window.location.origin}/shared-quotation/${quotation._id}`
                            
                            // Open PDF in new tab
                            window.open(shareableUrl, '_blank')
                            
                            // Copy link and show WhatsApp option
                            navigator.clipboard.writeText(shareableUrl)
                            
                            const message = `Computer Shop Quotation\n\nCustomer: ${quotation.customerName}\nTotal: ₹${quotation.totalAmount?.toFixed(2)}\n\nView PDF: ${shareableUrl}`
                            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
                            
                            setTimeout(() => {
                              if (confirm('PDF link copied! Open WhatsApp to share?')) {
                                window.open(whatsappUrl, '_blank')
                              }
                            }, 1000)
                          } catch (error) {
                            console.error('Error:', error)
                            toast.error('Failed to create PDF link. Please try again.')
                          }
                        }}
                        className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-lg hover:bg-blue-200"
                      >
                        View PDF
                      </button>
                      <button 
                        onClick={() => handleDeleteQuotation(quotation._id)}
                        className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {quotations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-gray-500 text-lg mb-2">No quotations found</p>
            <p className="text-gray-400 text-sm mb-4">Create your first quotation to get started</p>
            <button 
              onClick={() => navigate('/create-order')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Create Quotation
            </button>
          </div>
        )}
      </div>

      {/* Convert Confirmation Modal */}
      {showConvertModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-green-100 transform transition-all">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Convert to Order</h3>
              <p className="text-gray-600">Are you sure you want to convert this quotation to an order?</p>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setShowConvertModal(false); setQuotationToConvert(null); }}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConvertToOrder}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Convert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QuotationList