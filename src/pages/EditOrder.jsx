import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import axios from 'axios'

const EditOrder = () => {
  const navigate = useNavigate()
  const { id } = useParams()
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrder()
    fetchProducts()
    fetchCategories()
  }, [id])

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

  const fetchOrder = async () => {
    try {
      const [orderResponse, productsResponse] = await Promise.all([
        axios.get(`https://computer-shop-ecru.vercel.app/api/orders/get`),
        axios.get('https://computer-shop-ecru.vercel.app/api/products/all')
      ])
      
      const order = orderResponse.data.data?.find(o => o._id === id)
      const allProducts = productsResponse.data
      
      if (order) {
        setCustomerInfo({
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
          address: order.address || ''
        })
        
        // Convert order items to selected products format with actual product names
        const orderProducts = order.items?.map(item => {
          let productName = 'Unknown Product'
          let productId = item.product
          
          if (typeof item.product === 'object' && item.product?.name) {
            productName = item.product.name
            productId = item.product._id
          } else if (typeof item.product === 'string') {
            const product = allProducts.find(p => p._id === item.product)
            productName = product?.name || `Product ${item.product}`
            productId = item.product
          }
          
          return {
            _id: productId,
            name: productName,
            sellingRate: item.price,
            orderQuantity: item.quantity
          }
        }) || []
        
        setSelectedProducts(orderProducts)
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

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

  const fetchCompatibleProducts = async (productId) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/${productId}/compatible`)
      let compatibleData = response.data.compatibleProducts || []
      
      // If no compatible products found and the selected product is a CPU, show all motherboards
      if (compatibleData.length === 0) {
        const selectedProduct = products.find(p => p._id === productId)
        const categoryName = selectedProduct?.category?.name?.toLowerCase() || ''
        
        if (categoryName.includes('cpu') || categoryName.includes('processor')) {
          // Filter all products to show only motherboards
          compatibleData = products.filter(product => 
            product.category?.name?.toLowerCase().includes('motherboard')
          )
        }
      }
      
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
    const categoryName = product.category?.name?.toLowerCase() || ''
    if (categoryName.includes('motherboard')) {
      fetchCompatibleProducts(product._id)
      setTimeout(() => {
        const element = document.querySelector('.compatible-products-section')
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 500)
    }
    
    // Auto-show compatible motherboards if CPU is added
    if (categoryName.includes('cpu') || categoryName.includes('processor')) {
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

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter(item => item._id !== productId))
    } else {
      setSelectedProducts(selectedProducts.map(item =>
        item._id === productId ? { ...item, orderQuantity: quantity } : item
      ))
    }
  }

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, item) => total + (item.sellingRate * item.orderQuantity), 0)
  }

  const handleUpdateOrder = async () => {
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
      await axios.put(`https://computer-shop-ecru.vercel.app/api/orders/update/${id}`, orderData)
      
      // Update stock for each product in the updated order
      for (const item of selectedProducts) {
        try {
          console.log(`Updating stock for product ${item._id}, reducing by ${item.orderQuantity}`)
          try {
            const response = await axios.put(`https://computer-shop-ecru.vercel.app/api/products/update-stock/${item._id}`, {
              quantity: item.orderQuantity
            })
            console.log(`Stock update response (update-stock):`, response.data)
          } catch (err1) {
            console.log('update-stock failed, trying update endpoint')
            const currentProduct = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/all`)
            const product = currentProduct.data.find(p => p._id === item._id)
            const newQuantity = product.quantity - item.orderQuantity
            const response = await axios.put(`https://computer-shop-ecru.vercel.app/api/products/update/${item._id}`, {
              quantity: newQuantity
            })
            console.log(`Stock update response (update):`, response.data)
          }
        } catch (stockError) {
          console.error(`Error updating stock for product ${item._id}:`, stockError)
        }
      }
      
      toast.success('Order updated successfully!')
      navigate('/orders')
    } catch (error) {
      console.error('Error updating order:', error)
      toast.error('Failed to update order. Please try again.')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading order...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white rounded-xl shadow-sm p-3 sm:p-4 lg:p-6">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-1">Edit Order</h1>
          <p className="text-gray-600 text-xs sm:text-sm">Update order details</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm font-medium shadow-sm min-h-[44px]"
        >
          ← Back to Orders
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1">
        {/* Left Sidebar - Customer Info and Order Summary */}
        <div className="lg:w-1/3 order-1 lg:order-1 flex flex-col lg:sticky lg:top-6 lg:h-[calc(100vh-8rem)]">
          {/* Customer Info */}
          <div className="p-4 sm:p-5 bg-white border border-gray-200 rounded-xl shadow-lg mb-4 flex-shrink-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-3 sm:mb-4 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></span>
              Customer Information
            </h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200 min-h-[44px]"
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200 min-h-[44px]"
              />
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
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200 min-h-[44px]"
              />
              <textarea
                placeholder="Address (Optional)"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 h-20 sm:h-24 resize-none text-sm transition-all duration-200"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-gray-900 p-4 sm:p-5 border-b border-gray-200 flex items-center flex-shrink-0">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 sm:mr-3"></span>
              Order Summary
            </h3>
            
            {/* Items Area */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col">
              <div className="mb-4 sm:mb-5">
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <div className="w-12 sm:w-16 h-12 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                      <span className="text-xl sm:text-2xl text-gray-400">🛒</span>
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">No items in order</p>
                    <p className="text-gray-400 text-xs sm:text-sm mt-1">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[200px] sm:max-h-[250px] lg:max-h-[300px] overflow-y-auto">
                    {selectedProducts.map(item => (
                      <div key={item._id} className="flex justify-between items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">₹{item.sellingRate} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center justify-center transition-colors duration-200 shadow-sm"
                          >
                            −
                          </button>
                          <span className="text-sm font-bold w-8 sm:w-10 text-center bg-white px-2 py-1 rounded border">{item.orderQuantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                            className="w-8 h-8 sm:w-9 sm:h-9 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 flex items-center justify-center transition-colors duration-200 shadow-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Total and Buttons */}
              <div className="border-t-2 border-gray-200 pt-4 sm:pt-5 flex-shrink-0">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm sm:text-base font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <motion.button
                  onClick={handleUpdateOrder}
                  disabled={selectedProducts.length === 0}
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base shadow-lg transition-all duration-200 min-h-[48px]"
                  whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                >
                  🔄 Update Order
                </motion.button>
              </div>
            </div>
          </div>
        </div>

        {/* Products Section - Second on mobile */}
        <div className="lg:w-2/3 order-2 lg:order-2 flex-1">
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 bg-white rounded-xl shadow-sm p-4 sm:p-5">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 sm:mr-3"></span>
              Available Products
            </h3>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200 min-h-[44px]"
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
                  className="w-full sm:w-auto px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-lg hover:from-gray-700 hover:to-gray-800 text-sm font-medium transition-all duration-200 shadow-sm min-h-[44px]"
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
                  {products.map((product, index) => {
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
              {products.map((product, index) => {
                const isSelected = selectedProducts.some(item => item._id === product._id)
                return (
                  <motion.div 
                    key={product._id} 
                    className={`p-4 border-b border-gray-200 ${isSelected ? 'bg-green-50' : 'hover:bg-gray-50'}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-sm sm:text-base truncate">{product.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">{product.category?.name} • ₹{product.sellingRate}</p>
                      </div>
                      
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{product.quantity}</span>
                        <motion.button
                          onClick={() => addToOrder(product)}
                          disabled={product.quantity === 0}
                          className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm min-h-[40px] min-w-[60px]"
                          whileHover={{ scale: product.quantity === 0 ? 1 : 1.05 }}
                          whileTap={{ scale: product.quantity === 0 ? 1 : 0.95 }}
                        >
                          {product.quantity === 0 ? 'Out' : 'Add'}
                        </motion.button>
                      </div>
                    </div>
                    
                    {product.attributes && Object.keys(product.attributes).length > 0 && (
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {Object.entries(product.attributes).slice(0, 2).map(([key, value]) => (
                          <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {key}: {value}
                          </span>
                        ))}
                        {Object.keys(product.attributes).length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{Object.keys(product.attributes).length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>

            {products.length === 0 && (
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
              <h3 className="text-lg sm:text-xl font-bold text-blue-900 p-4 sm:p-6 border-b border-blue-200 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 sm:mr-3"></span>
                🔗 Compatible Products
              </h3>
              <div className="p-4 sm:p-5">
                {Object.entries(
                  compatibleProducts.reduce((acc, product) => {
                    const categoryName = product.category?.name || 'Uncategorized'
                    if (!acc[categoryName]) acc[categoryName] = []
                    acc[categoryName].push(product)
                    return acc
                  }, {})
                ).map(([categoryName, products]) => (
                  <div key={categoryName} className="mb-6">
                    <h4 className="font-semibold text-gray-700 text-sm sm:text-base mb-3 border-b pb-2">{categoryName}</h4>
                    <div className="space-y-3 sm:space-y-4">
                      {products.map((product) => (
                        <div key={product._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 sm:p-5 bg-white border border-blue-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all duration-200">
                          <div className="flex-1 mb-3 sm:mb-0">
                            <p className="font-semibold text-sm sm:text-base text-gray-900">{product.name}</p>
                            <p className="text-xs sm:text-sm text-gray-600 mt-1">{product.brand || 'N/A'} • ₹{product.sellingRate} • Stock: {product.quantity}</p>
                          </div>
                          <button
                            onClick={() => addToOrder(product)}
                            disabled={product.quantity === 0}
                            className="w-full sm:w-auto px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-sm min-h-[44px]"
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
    </div>
  )
}

export default EditOrder