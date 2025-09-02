import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import axios from 'axios'

const QuotationList = () => {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/orders/get')
      // Filter only quotations (type: 'Quotation')
      const quotationData = response.data.data?.filter(order => order.type === 'Quotation') || []
      setQuotations(quotationData)
    } catch (error) {
      console.error('Error fetching quotations:', error)
      setQuotations([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteQuotation = async (quotationId) => {
    if (!confirm('Are you sure you want to delete this quotation?')) return
    
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/orders/${quotationId}`)
      alert('Quotation deleted successfully!')
      fetchQuotations()
    } catch (error) {
      console.error('Error deleting quotation:', error)
      alert('Failed to delete quotation. Please try again.')
    }
  }

  const handleConvertToOrder = async (quotationId) => {
    if (!confirm('Are you sure you want to convert this quotation to an order?')) return
    
    try {
      await axios.put(`https://computer-shop-ecru.vercel.app/api/orders/${quotationId}/convert`)
      alert('Quotation converted to order successfully!')
      fetchQuotations()
    } catch (error) {
      console.error('Error converting quotation:', error)
      alert('Failed to convert quotation. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading quotations...</div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800">Quotation List</h1>
              <p className="text-gray-600 text-lg">View and manage customer quotations</p>
            </div>
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
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {quotations.length} quotations found
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
                <motion.tr 
                  key={quotation._id}
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-800">#QT-{quotation._id?.slice(-6) || 'N/A'}</div>
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
                    <span className="text-sm font-semibold text-gray-800">${quotation.totalAmount?.toFixed(2) || '0.00'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      quotation.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-600' :
                      quotation.status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                      quotation.status === 'Cancelled' ? 'bg-rose-50 text-rose-600' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {quotation.status}
                    </span>
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
                                    name: quotation.customerName,
                                    email: quotation.customerEmail,
                                    phone: quotation.customerPhone,
                                    address: quotation.address || 'Address not provided'
                                  },
                                  products: productsWithNames,
                                  totalAmount: quotation.totalAmount || 0
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
                        View
                      </button>
                      <button 
                        onClick={() => handleConvertToOrder(quotation._id)}
                        className="px-3 py-1 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-lg hover:bg-emerald-100"
                      >
                        Convert
                      </button>
                      <button 
                        onClick={() => handleDeleteQuotation(quotation._id)}
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
      </motion.div>
    </div>
  )
}

export default QuotationList