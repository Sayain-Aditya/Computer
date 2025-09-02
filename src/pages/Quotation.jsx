import React, { useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const Quotation = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const quotationRef = useRef()
  const { orderData } = location.state || {}

  if (!orderData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No order data found</p>
        <button 
          onClick={() => navigate('/orders')}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const handlePrint = () => {
    // Add a small delay to ensure styles are applied
    setTimeout(() => {
      window.print()
    }, 100)
  }

  const handleWhatsAppShare = () => {
    const message = `Computer Shop Quotation for ${orderData.customer.name}\nTotal: $${orderData.totalAmount.toFixed(2)}\n\nItems:\n${orderData.products.map(item => `• ${item.name} - Qty: ${item.orderQuantity} - $${(item.sellingRate * item.orderQuantity).toFixed(2)}`).join('\n')}\n\nTo get the PDF version, please use the Print button and save as PDF.\n\nThank you for your business!`
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
    
    // Show instruction to user
    alert('WhatsApp opened with quotation details.\n\nTo share PDF:\n1. Use the Print button\n2. Select "Save as PDF"\n3. Save the PDF\n4. Attach it to your WhatsApp message')
  }

  return (
    <motion.div 
      className="max-w-4xl mx-auto bg-white"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="no-print mb-4 flex justify-between items-center">
        <button 
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Orders
        </button>
        <div className="flex gap-2">
          <button 
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Print Quotation
          </button>
          <button 
            onClick={handleWhatsAppShare}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            📱 WhatsApp
          </button>
        </div>
      </div>

      <div ref={quotationRef} className="p-8 border border-gray-200 rounded-lg bg-white">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">QUOTATION</h1>
          <p className="text-gray-600 mt-2">Computer Shop</p>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Bill To:</h3>
            <div className="text-gray-600">
              <p className="font-medium">{orderData.customer.name}</p>
              <p>{orderData.customer.email}</p>
              <p>{orderData.customer.phone}</p>
              <p>{orderData.customer.address}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quote Details:</h3>
            <div className="text-gray-600">
              <p>Date: {new Date().toLocaleDateString()}</p>
              <p>Quote #: QT-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-navy-800">
                <th className="border border-gray-300 px-4 py-2 text-left text-white bg-blue-900">Item</th>
                <th className="border border-gray-300 px-4 py-2 text-center text-white bg-blue-900">Qty</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-white bg-blue-900">Unit Price</th>
                <th className="border border-gray-300 px-4 py-2 text-right text-white bg-blue-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.products.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.category?.name}</p>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">{item.orderQuantity}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${item.sellingRate}</td>
                  <td className="border border-gray-300 px-4 py-2 text-right">${(item.sellingRate * item.orderQuantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b">
              <span>Subtotal:</span>
              <span>${orderData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span>Tax (0%):</span>
              <span>$0.00</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-lg">
              <span>Total:</span>
              <span>${orderData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-gray-600 text-sm">
          <p>Thank you for your business!</p>
          <p>This quotation is valid for 30 days from the date of issue.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          .sidebar {
            display: none !important;
          }
          .ml-60 {
            margin-left: 0 !important;
          }
          .flex {
            display: block !important;
          }
          .bg-gray-50 {
            background: white !important;
          }
          body {
            margin: 0;
            padding: 0;
          }
          * {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default Quotation