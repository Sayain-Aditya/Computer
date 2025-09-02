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
      <div className="no-print mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <button 
          onClick={() => navigate('/orders')}
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base"
        >
          Back to Orders
        </button>
        <div className="no-print flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button 
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm sm:text-base"
          >
            Print Quotation
          </button>
          <button 
            onClick={handleWhatsAppShare}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            📱 WhatsApp
          </button>
        </div>
      </div>

      <div ref={quotationRef} className="print-content p-4 sm:p-8 bg-white" style={{minHeight: '100vh'}}>
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">QUOTATION</h1>
          <p className="text-xl text-gray-600">Computer Shop</p>
          <hr className="w-32 mx-auto mt-4 border-gray-300" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-12 mb-8 sm:mb-12">
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Bill To:</h3>
            <div className="text-gray-700 space-y-1">
              <p className="font-semibold text-lg">{orderData.customer.name}</p>
              <p>{orderData.customer.email}</p>
              <p>{orderData.customer.phone}</p>
              <p>{orderData.customer.address}</p>
            </div>
          </div>
          <div className="md:text-right">
            <h3 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-gray-200 pb-2">Quote Details:</h3>
            <div className="text-gray-700 space-y-1">
              <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
              <p><span className="font-medium">Quote #:</span> QT-{Date.now().toString().slice(-6)}</p>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-gray-400 min-w-[500px]">
            <thead>
              <tr>
                <th className="border-2 border-gray-400 px-6 py-4 text-left text-white bg-blue-900 font-bold">Item Description</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-center text-white bg-blue-900 font-bold">Qty</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-right text-white bg-blue-900 font-bold">Unit Price</th>
                <th className="border-2 border-gray-400 px-6 py-4 text-right text-white bg-blue-900 font-bold">Total</th>
              </tr>
            </thead>
            <tbody>
              {orderData.products.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="border border-gray-300 px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-800">{typeof item.name === 'string' ? item.name : `Product ${item.name?._id || 'Unknown'}`}</p>
                      <p className="text-sm text-gray-600">{item.category?.name}</p>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-6 py-4 text-center font-medium">{item.orderQuantity}</td>
                  <td className="border border-gray-300 px-6 py-4 text-right font-medium">${item.sellingRate}</td>
                  <td className="border border-gray-300 px-6 py-4 text-right font-bold">${(item.sellingRate * item.orderQuantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        <div className="flex justify-center md:justify-end mb-8 sm:mb-12">
          <div className="w-full max-w-80 bg-gray-50 p-4 sm:p-6 rounded-lg border-2 border-gray-300">
            <div className="flex justify-between py-3 border-b border-gray-300 text-lg">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">${orderData.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-300 text-lg">
              <span className="font-medium">Tax (0%):</span>
              <span className="font-semibold">$0.00</span>
            </div>
            <div className="flex justify-between py-4 font-bold text-2xl text-gray-800 border-t-2 border-gray-400 mt-2">
              <span>TOTAL:</span>
              <span>${orderData.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="text-center border-t-2 border-gray-300 pt-8">
          <p className="text-lg font-medium text-gray-700 mb-2">Thank you for your business!</p>
          <p className="text-gray-600">This quotation is valid for 30 days from the date of issue.</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            margin: 0;
            size: A4;
            @top-left { content: ""; }
            @top-center { content: ""; }
            @top-right { content: ""; }
            @bottom-left { content: ""; }
            @bottom-center { content: ""; }
            @bottom-right { content: ""; }
          }
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            box-sizing: border-box;
          }
          .no-print {
            display: none !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          html, body {
            height: 100%;
            overflow: hidden;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </motion.div>
  )
}

export default Quotation