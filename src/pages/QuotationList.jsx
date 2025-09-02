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
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quotation List</h1>
          <p className="text-gray-600 text-sm mt-1">View and manage customer quotations</p>
        </div>
        <button 
          onClick={() => navigate('/create-order')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Create New Quotation
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {quotations.map((quotation, index) => (
                <motion.tr 
                  key={quotation._id}
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    #QT-{quotation._id?.slice(-6) || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{quotation.customerName}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{quotation.customerEmail}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{quotation.customerPhone}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {quotation.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">
                    ${quotation.totalAmount?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      quotation.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                      quotation.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      quotation.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {quotation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(quotation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          navigate('/quotation', {
                            state: {
                              orderData: {
                                customer: {
                                  name: quotation.customerName,
                                  email: quotation.customerEmail,
                                  phone: quotation.customerPhone,
                                  address: quotation.address || 'N/A'
                                },
                                products: quotation.items?.map(item => ({
                                  name: `Product ${item.product}`,
                                  orderQuantity: item.quantity,
                                  sellingRate: item.price,
                                  category: { name: 'N/A' }
                                })) || [],
                                totalAmount: quotation.totalAmount || 0
                              }
                            }
                          })
                        }}
                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleConvertToOrder(quotation._id)}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                      >
                        Convert
                      </button>
                      <button 
                        onClick={() => handleDeleteQuotation(quotation._id)}
                        className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200"
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
      </div>
    </div>
  )
}

export default QuotationList