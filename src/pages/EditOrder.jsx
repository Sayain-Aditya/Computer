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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-6">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white rounded-xl shadow-sm p-3 sm:p-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 mb-0.5">Edit Order</h1>
          <p className="text-gray-600 text-xs">Update order details</p>
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
        <div className="xl:w-1/3 order-1 xl:order-1 flex flex-col xl:sticky xl:top-6 xl:h-[calc(100vh-8rem)]">
          {/* Customer Info */}
          <div className="p-3 bg-white border border-gray-200 rounded-xl shadow-lg mb-3 flex-shrink-0">
            <h3 className="text-sm font-bold text-gray-900 mb-2 flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Customer Information
            </h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Customer Name *"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-xs transition-all duration-200"
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-xs transition-all duration-200"
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
                className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-xs transition-all duration-200"
              />
              <textarea
                placeholder="Address (Optional)"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-2 py-1.5 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 h-10 resize-none text-xs transition-all duration-200"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg flex flex-col">
            <h3 className="text-base xl:text-lg font-bold text-gray-900 p-3 xl:p-4 border-b border-gray-200 flex items-center flex-shrink-0">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Order Summary
            </h3>
            
            {/* Items Area */}
            <div className="p-3 xl:p-4 flex-1 flex flex-col">
              <div className="mb-3 xl:mb-4">
                {selectedProducts.length === 0 ? (
                  <div className="text-center py-4 xl:py-6">
                    <div className="w-8 xl:w-10 h-8 xl:h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-base xl:text-lg text-gray-400">🛒</span>
                    </div>
                    <p className="text-gray-500 text-xs xl:text-sm">No items in order</p>
                    <p className="text-gray-400 text-xs">Add products to get started</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[120px] xl:max-h-[150px] overflow-y-auto">
                    {selectedProducts.map(item => (
                      <div key={item._id} className="flex justify-between items-center p-2 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-gray-900 truncate">{item.name}</p>
                          <p className="text-xs text-gray-600">₹{item.sellingRate} each</p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                            className="w-6 h-6 bg-red-500 text-white rounded text-xs hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
                          >
                            −
                          </button>
                          <span className="text-xs font-bold w-6 text-center bg-white px-1 py-0.5 rounded border">{item.orderQuantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                            className="w-6 h-6 bg-green-500 text-white rounded text-xs hover:bg-green-600 flex items-center justify-center transition-colors duration-200"
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
              <div className="border-t-2 border-gray-200 pt-3 xl:pt-4 flex-shrink-0">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-2 xl:p-3 rounded-lg mb-3 xl:mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm xl:text-base font-semibold text-gray-700">Total Amount:</span>
                    <span className="text-lg xl:text-xl font-bold text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <motion.button
                  onClick={handleUpdateOrder}
                  disabled={selectedProducts.length === 0}
                  className="w-full px-2 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs shadow-lg transition-all duration-200"
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
        <div className="xl:w-2/3 order-3 xl:order-2 flex-1 xl:min-h-screen">
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
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => {
                    const isSelected = selectedProducts.some(item => item._id === product._id)
                    return (
                    <motion.tr 
                      key={product._id} 
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
                      initial={{ opacity: 0, x: -20, backgroundColor: isSelected ? "#dcfce7" : "transparent" }}
                      animate={{ opacity: 1, x: 0, backgroundColor: isSelected ? "#dcfce7" : "transparent" }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: isSelected ? "#bbf7d0" : "#f9fafb", scale: 1.01 }}
                    >
                      <td className="px-4 py-3">
                        <div className="text-left">
                          <div>{product.name}</div>
                          {product.attributes && Object.keys(product.attributes).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(product.attributes).slice(0, 3).map(([key, value]) => (
                                <span key={key} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.brand || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">₹{product.sellingRate}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{product.quantity}</td>
                      <td className="px-4 py-3">
                        <motion.button
                          onClick={() => addToOrder(product)}
                          disabled={product.quantity === 0}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          whileHover={{ 
                            scale: product.quantity === 0 ? 1 : 1.1,
                            backgroundColor: product.quantity === 0 ? undefined : "#1d4ed8"
                          }}
                          whileTap={{ scale: product.quantity === 0 ? 1 : 0.9 }}
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

            {products.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No products available</p>
              </div>
            )}
          </div>

          {/* Compatible Products Container - Grouped by Category */}
          {showCompatible && compatibleProducts.length > 0 && (
            <div className="compatible-products-section bg-white border border-gray-200 rounded-lg shadow-sm mb-6 mt-6">
              <h3 className="text-lg font-medium text-gray-800 p-3 border-b border-gray-200">Compatible Products</h3>
              <div className="p-3">
                {Object.entries(
                  compatibleProducts.reduce((acc, product) => {
                    // Check if both CPU and motherboard are selected
                    const hasCPU = selectedProducts.some(item => 
                      item.category?.name?.toLowerCase().includes('cpu') || 
                      item.category?.name?.toLowerCase().includes('processor')
                    )
                    const hasMotherboard = selectedProducts.some(item => 
                      item.category?.name?.toLowerCase().includes('motherboard')
                    )
                    
                    // If both CPU and motherboard are selected, show all compatible products (motherboard compatibility takes priority)
                    // If only CPU is selected, only show motherboards
                    if (hasCPU && !hasMotherboard && !product.category?.name?.toLowerCase().includes('motherboard')) {
                      return acc
                    }
                    
                    const categoryName = product.category?.name || 'Uncategorized'
                    if (!acc[categoryName]) acc[categoryName] = []
                    acc[categoryName].push(product)
                    return acc
                  }, {})
                ).map(([categoryName, products]) => (
                  <div key={categoryName} className="mb-4">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2 border-b pb-1">{categoryName}</h4>
                    <div className="space-y-2">
                      {products.map((product) => (
                        <div key={product._id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand || 'N/A'} • ₹{product.sellingRate} • Stock: {product.quantity}</p>
                          </div>
                          <button
                            onClick={() => addToOrder(product)}
                            disabled={product.quantity === 0}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Add
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