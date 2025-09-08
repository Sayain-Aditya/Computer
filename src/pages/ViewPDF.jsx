import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

const ViewPDF = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [quotationData, setQuotationData] = useState(null)
  const [loading, setLoading] = useState(true)

  const formatIndianNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num)
  }

  useEffect(() => {
    const fetchQuotationData = async () => {
      try {
        console.log('Fetching quotation with ID:', id)
        const quotationResponse = await axios.get('https://computer-shop-backend-five.vercel.app/api/orders/quotations/search')
        console.log('Quotation response:', quotationResponse.data)
        
        const quotation = quotationResponse.data.data?.find(q => q._id === id)
        console.log('Found quotation:', quotation)
        
        if (!quotation) {
          console.log('No quotation found')
          setLoading(false)
          return
        }
        
        const productsWithNames = quotation.items?.map(item => {
          const product = item.product || {}
          return {
            name: item.name || product?.name || 'Product',
            orderQuantity: item.quantity,
            sellingRate: item.price,
            description: product?.description || '',
            category: product?.brand || 'No Category'
          }
        }) || []
        
        console.log('Processed products:', productsWithNames)
        
        setQuotationData({
          customer: {
            name: quotation.customerName,
            email: quotation.customerEmail,
            phone: quotation.customerPhone,
            address: quotation.address || 'Address not provided'
          },
          products: productsWithNames,
          totalAmount: quotation.totalAmount || 0,
          createdAt: quotation.createdAt
        })
      } catch (error) {
        console.error('Error fetching quotation:', error)
      }
      setLoading(false)
    }
    
    if (id) fetchQuotationData()
  }, [id])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
  }

  if (!quotationData) {
    console.log('No quotation data available')
    return <div className="flex items-center justify-center min-h-screen"><p className="text-gray-500">Quotation not found</p></div>
  }
  
  console.log('Rendering with quotation data:', quotationData)

  return (
    <div className="min-h-screen bg-white">
      <button 
        onClick={() => {
          const shareableUrl = `${window.location.origin}/shared-quotation/${id}`
          const message = `Computer Shop Quotation\n\nCustomer: ${quotationData.customer.name}\nTotal: ₹${quotationData.totalAmount?.toFixed(2)}\n\nView PDF: ${shareableUrl}`
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
          window.open(whatsappUrl, '_blank')
        }}
        className="no-print fixed top-4 right-32 z-50 px-4 py-2 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700"
      >
        📱 WhatsApp
      </button>
      <button 
        onClick={() => window.print()}
        className="no-print fixed top-4 right-4 z-50 px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
      >
        🖨️ Print
      </button>

      <div className="print-content p-4">
        <button 
          onClick={() => navigate('/quotation-list')}
          className="no-print mb-4 px-4 py-2 bg-gray-600 text-white rounded-full shadow-lg hover:bg-gray-700"
        >
          ← Back
        </button>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">QUOTATION</h1>
          <p className="text-xl text-gray-600">Computer Shop</p>
          <hr className="w-32 mx-auto mt-4 border-gray-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Bill To:</h3>
            <div className="text-gray-700 space-y-1">
              <p className="font-semibold text-lg">{quotationData.customer.name}</p>
              <p>{quotationData.customer.email}</p>
              <p>{quotationData.customer.phone}</p>
              <p>{quotationData.customer.address}</p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Quote Details:</h3>
            <div className="text-gray-700 space-y-1">
              <p><span className="font-medium">Date:</span> {new Date(quotationData.createdAt).toLocaleDateString()}</p>
              <p><span className="font-medium">Quote #:</span> QT-{id?.slice(-6)}</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <table className="w-full border-collapse border-2 border-gray-400">
            <thead>
              <tr>
                <th className="border-2 border-gray-400 px-6 py-4 text-left text-white bg-blue-900 font-bold">Item Description</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-center text-white bg-blue-900 font-bold">Qty</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-right text-white bg-blue-900 font-bold">Unit Price</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-right text-white bg-blue-900 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {quotationData.products.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{item.name}</p>
                      {item.description && item.description !== 'N/A' && item.description.trim() && (
                        <p className="text-sm text-gray-600">{item.description}</p>
                      )}
                      {item.category && <p className="text-xs text-gray-500">{item.category}</p>}
                    </div>
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-medium">{item.orderQuantity}</td>
                  <td className="border border-gray-300 px-6 py-4 text-right font-medium">₹{formatIndianNumber(item.sellingRate)}</td>
                  <td className="border border-gray-300 px-6 py-4 text-right font-bold">₹{formatIndianNumber((item.sellingRate * item.orderQuantity).toFixed(2))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-12">
          <div className="w-80 bg-gray-50 p-6 rounded-lg border-2 border-gray-300">
            <div className="flex justify-between py-3 border-b border-gray-300 text-lg">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">₹{formatIndianNumber(quotationData.totalAmount.toFixed(2))}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-300 text-lg">
              <span className="font-medium">Tax (0%):</span>
              <span className="font-semibold">₹0.00</span>
            </div>
            <div className="flex justify-between py-4 font-bold text-2xl text-gray-800 border-t-2 border-gray-400 mt-2">
              <span>TOTAL:</span>
              <span>₹{formatIndianNumber(quotationData.totalAmount.toFixed(2))}</span>
            </div>
          </div>
        </div>

        <div className="text-center border-t-2 border-gray-300 pt-8">
          <p className="text-lg font-medium text-gray-700 mb-2">Thank you for your business!</p>
          <p className="text-base text-gray-600">This quotation is valid for 30 days from the date of issue.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0; size: A4; }
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  )
}

export default ViewPDF