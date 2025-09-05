import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import axios from 'axios'

const CreateOrder = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [compatibleProducts, setCompatibleProducts] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [showCompatible, setShowCompatible] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)


  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    // Check if there are any motherboards or CPUs in selected products
    const hasMotherboard = selectedProducts.some(item => 
      item.category?.name?.toLowerCase().includes('motherboard')
    )
    const hasCPU = selectedProducts.some(item => 
      item.category?.name?.toLowerCase().includes('cpu') || 
      item.category?.name?.toLowerCase().includes('processor')
    )
    
    // Hide compatible products if no motherboard or CPU is selected
    if (!hasMotherboard && !hasCPU) {
      setShowCompatible(false)
      setCompatibleProducts([])
    }
  }, [selectedProducts])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/products/all')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/categories/all')
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const getFilteredProducts = () => {
    return products
  }

  const fetchCompatibleProducts = async (productId) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/${productId}/compatible`)
      const compatibleData = response.data.compatibleProducts || []
      setCompatibleProducts(compatibleData)
      setShowCompatible(true)
      if (compatibleData.length === 0) {
        toast.info('No compatible products found')
      }
    } catch (error) {
      console.error('Error fetching compatible products:', error)
      setCompatibleProducts([])
      setShowCompatible(true)
      toast.error('Failed to fetch compatible products')
    }
  }

  const getCompatibleMotherboards = (cpuProduct) => {
    const cpuAttrs = cpuProduct.attributes || {}
    
    // Only proceed if CPU has all three required attributes
    if (!cpuAttrs.socketType || !cpuAttrs.ChipsetSupport || !cpuAttrs.RamType) {
      return []
    }
    
    return products.filter(product => {
      if (!product.category?.name?.toLowerCase().includes('motherboard')) return false
      
      const mbAttrs = product.attributes || {}
      
      // Require ALL three attributes to match exactly
      return mbAttrs.socketType === cpuAttrs.socketType &&
             mbAttrs.ChipsetSupport === cpuAttrs.ChipsetSupport &&
             mbAttrs.RamType === cpuAttrs.RamType
    })
  }

  const addToOrder = (product, quantity = 1) => {
    const existingItem = selectedProducts.find(item => item._id === product._id)
    if (existingItem) {
      setSelectedProducts(selectedProducts.map(item =>
        item._id === product._id 
          ? { ...item, orderQuantity: item.orderQuantity + quantity }
          : item
      ))
    } else {
      setSelectedProducts([...selectedProducts, { ...product, orderQuantity: quantity }])
    }
    
    // Auto-show compatible products if motherboard is added
    if (product.category?.name?.toLowerCase().includes('motherboard')) {
      fetchCompatibleProducts(product._id)
      setTimeout(() => {
        const element = document.querySelector('.compatible-products-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    }
    
    // Auto-show compatible motherboards if CPU is added
    if (product.category?.name?.toLowerCase().includes('cpu') || product.category?.name?.toLowerCase().includes('processor')) {
      const compatibleMBs = getCompatibleMotherboards(product)
      setCompatibleProducts(compatibleMBs)
      setShowCompatible(true)
      if (compatibleMBs.length === 0) {
        toast.info('No compatible motherboards found')
      }
      setTimeout(() => {
        const element = document.querySelector('.compatible-products-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    }
  }

  const removeFromOrder = (productId) => {
    setSelectedProducts(selectedProducts.filter(item => item._id !== productId))
  }

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromOrder(productId)
    } else {
      setSelectedProducts(selectedProducts.map(item =>
        item._id === productId ? { ...item, orderQuantity: quantity } : item
      ))
    }
  }

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, item) => total + (item.sellingRate * item.orderQuantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || selectedProducts.length === 0) {
      toast.error('Please fill customer details and add products to order')
      return
    }
    
    if (customerInfo.phone && customerInfo.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerInfo.email)) {
      toast.error('Please enter a valid email address')
      return
    }

    const orderData = {
      customerName: customerInfo.name,
      customerEmail: customerInfo.email,
      customerPhone: customerInfo.phone,
      address: customerInfo.address,
      items: selectedProducts.map(item => ({
        product: item._id,
        quantity: item.orderQuantity,
        price: item.sellingRate
      })),
      totalAmount: getTotalAmount()
    }

    try {
      await axios.post('https://computer-shop-ecru.vercel.app/api/orders/create', orderData)
      
      // Update stock for each product in the order
      for (const item of selectedProducts) {
        try {
          console.log(`Updating stock for product ${item._id}, reducing by ${item.orderQuantity}`)
          // Try both API endpoints to see which one works
          try {
            const response = await axios.put(`https://computer-shop-ecru.vercel.app/api/products/update-stock/${item._id}`, {
              quantity: item.orderQuantity
            })
            console.log(`Stock update response (update-stock):`, response.data)
          } catch (err1) {
            console.log('update-stock failed, trying update endpoint')
            const response = await axios.put(`https://computer-shop-ecru.vercel.app/api/products/update/${item._id}`, {
              quantity: item.quantity - item.orderQuantity
            })
            console.log(`Stock update response (update):`, response.data)
          }
        } catch (stockError) {
          console.error(`Error updating stock for product ${item._id}:`, stockError)
        }
      }
      
      toast.success('Order created successfully!')
      navigate('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Failed to create order. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">Create Order</h1>
          <p className="text-gray-600 text-sm sm:text-base">Take customer orders for computer parts</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="w-full sm:w-auto px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm sm:text-base font-medium shadow-sm"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 flex-1">
        {/* Left Sidebar - Customer Info and Order Summary */}
        <div className="xl:w-1/3 order-1 xl:order-1 flex flex-col">
          {/* Customer Info */}
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-lg mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
            Customer Information
          </h3>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200"
              />
            </div>
            <div className="relative">
              <input
                type="email"
                placeholder="Email Address *"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200"
              />
            </div>
            <div className="relative">
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                value={customerInfo.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setCustomerInfo({...customerInfo, phone: value})
                }}
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200"
              />
            </div>
            <div className="relative">
              <textarea
                placeholder="Address (Optional)"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-24 resize-none text-sm transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 p-6 border-b border-gray-200 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
            Order Summary
          </h3>
          
          {/* Items Area */}
          <div className="p-6">
            {selectedProducts.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">🛒</span>
                </div>
                <p className="text-gray-500 text-lg">No items in order</p>
                <p className="text-gray-400 text-sm mt-1">Add products to get started</p>
              </div>
            ) : (
              <div className="space-y-4 mb-6">
                {selectedProducts.map(item => (
                  <div key={item._id} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-600 mt-1">₹{item.sellingRate} each</p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                        className="w-9 h-9 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center transition-colors duration-200 shadow-sm"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-10 text-center bg-white px-2 py-1 rounded border">{item.orderQuantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                        className="w-9 h-9 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center transition-colors duration-200 shadow-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Total and Buttons */}
            <div className="border-t-2 border-gray-200 pt-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                  <span className="text-2xl font-bold text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                  <motion.button
                    onClick={handleSubmitOrder}
                    disabled={selectedProducts.length === 0}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-200"
                    whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                  >
                    🛍️ Create Order
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      const quotationData = {
                        customerName: customerInfo.name,
                        customerEmail: customerInfo.email,
                        customerPhone: customerInfo.phone,
                        address: customerInfo.address,
                        type: 'Quotation',
                        items: selectedProducts.map(item => ({
                          product: item._id,
                          quantity: item.orderQuantity,
                          price: item.sellingRate
                        })),
                        totalAmount: getTotalAmount(),
                        status: 'Pending'
                      }

                      try {
                        await axios.post('https://computer-shop-ecru.vercel.app/api/orders/create', quotationData)
                        toast.success('Quote generated successfully!')
                      } catch (error) {
                        console.error('Error generating quotation:', error)
                        toast.error('Failed to generate quotation. Please try again.')
                      }
                    }}
                    disabled={selectedProducts.length === 0}
                    className="flex-1 px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-200"
                    whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                  >
                    📄 Generate Quote
                  </motion.button>
                </div>
              </div>
          </div>
        </div>

        </div>

        {/* Products Section - Second on mobile */}
        <div className="xl:w-2/3 order-3 xl:order-2 flex-1">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
              Available Products
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200"
              >
                <option value="">🏷️ All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {showCompatible && (
                <button
                  onClick={() => setShowCompatible(false)}
                  className="w-full sm:w-auto px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 text-sm font-medium transition-all duration-200 shadow-sm"
                >
                  🔄 Show All Products
                </button>
              )}
            </div>
          </div>

          {/* Available Products Container - Mobile Card Layout */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg mb-6 overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredProducts().map((product, index) => {
                    const isSelected = selectedProducts.some(item => item._id === product._id)
                    return (
                    <motion.tr 
                      key={product._id} 
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-green-50' : ''}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
                          <div className="font-medium">{product.name}</div>
                          {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(product.attributes).slice(0, 2).map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.brand || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">₹{product.sellingRate}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.quantity}</td>
                      <td className="px-4 py-3">
                        <motion.button
                          onClick={() => addToOrder(product)}
                          disabled={product.quantity === 0}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: product.quantity === 0 ? 1 : 1.05 }}
                          whileTap={{ scale: product.quantity === 0 ? 1 : 0.95 }}
                        >
                          Add
                        </motion.button>
                      </td>
                    </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View */}
            <div className="md:hidden">
              {getFilteredProducts().map((product, index) => {
                const isSelected = selectedProducts.some(item => item._id === product._id)
                return (
                  <motion.div 
                    key={product._id} 
                    className={`p-3 border-b border-gray-200 ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0 mr-3">
                        <button 
                          onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left w-full"
                        >
                          <p className="font-medium text-sm truncate">{product.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{product.category?.name} • ₹{product.sellingRate}</p>
                        </button>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">{product.quantity}</span>
                        <motion.button
                          onClick={() => addToOrder(product)}
                          disabled={product.quantity === 0}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ scale: product.quantity === 0 ? 1 : 1.05 }}
                          whileTap={{ scale: product.quantity === 0 ? 1 : 0.95 }}
                        >
                          {product.quantity === 0 ? 'Out' : 'Add'}
                        </motion.button>
                      </div>
                    </div>
                    
                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(product.attributes).slice(0, 3).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {getFilteredProducts().length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl text-gray-400">📦</span>
                </div>
                <p className="text-gray-500 text-lg">No products available</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            )}
          </div>

          {/* Compatible Products Container - Mobile Friendly */}
          {showCompatible && compatibleProducts.length > 0 && (
            <div className="compatible-products-section bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg mb-6">
              <h3 className="text-xl font-bold text-blue-900 p-6 border-b border-blue-200 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                🔗 Compatible Products
              </h3>
              <div className="p-4">
                {Object.entries(
                  compatibleProducts.reduce((acc, product) => {
                    const categoryName = product.category?.name || 'Uncategorized'
                    if (!acc[categoryName]) acc[categoryName] = []
                    acc[categoryName].push(product)
                    return acc
                  }, {})
                ).map(([categoryName, products]) => (
                  <div key={categoryName} className="mb-6">
                    <h4 className="font-semibold text-gray-700 text-sm mb-3 border-b pb-2">{categoryName}</h4>
                    <div className="space-y-3">
                      {products.map((product) => (
                        <div key={product._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-blue-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all duration-200">
                          <div className="flex-1 mb-3 sm:mb-0">
                            <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                            <p className="text-xs text-gray-600 mt-1">{product.brand || 'N/A'} • ₹{product.sellingRate} • Stock: {product.quantity}</p>
                          </div>
                          <button
                            onClick={() => addToOrder(product)}
                            disabled={product.quantity === 0}
                            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-sm"
                          >
                            {product.quantity === 0 ? '❌ Out of Stock' : '➕ Add'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal - Mobile Friendly */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 pr-4">{selectedProduct.name}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl flex-shrink-0 transition-colors duration-200"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600"><strong>Category:</strong> {selectedProduct.category?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Brand:</strong> {selectedProduct.brand || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Model:</strong> {selectedProduct.modelNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600"><strong>Price:</strong> <span className="text-green-600 font-medium text-lg">₹{selectedProduct.sellingRate}</span></p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600"><strong>Stock:</strong> {selectedProduct.quantity}</p>
                <p className="text-sm text-gray-600"><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    selectedProduct.status === 'Active' ? 'bg-green-100 text-green-800' :
                    selectedProduct.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600"><strong>Warranty:</strong> {selectedProduct.warranty || 'N/A'}</p>
              </div>
            </div>
            
            {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Attributes:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-3 rounded-lg text-sm">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => { addToOrder(selectedProduct); setShowModal(false) }}
                disabled={selectedProduct.quantity === 0}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 shadow-lg"
              >
                {selectedProduct.quantity === 0 ? '❌ Out of Stock' : '🛒 Add to Order'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-4 bg-gray-500 text-white rounded-xl hover:bg-gray-600 font-semibold transition-all duration-200 shadow-lg"
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

export default CreateOrder