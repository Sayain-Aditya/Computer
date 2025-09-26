import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import axios from 'axios'
import { formatIndianCurrency } from '../utils/formatters'
import CompatibilityCheck from './CompatibilityCheck'

const CreateOrder = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])

  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showCartModal, setShowCartModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [pendingProduct, setPendingProduct] = useState(null)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const response = await axios.get('https://computer-b.vercel.app/api/cart/')
      const cartItems = response.data.data.items.map(item => ({
        ...item.product,
        orderQuantity: item.quantity
      }))
      setSelectedProducts(cartItems)
    } catch (error) {
      console.error('Error loading cart:', error)
    }
  }

  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      fetchProducts()
    }, 500)
    return () => clearTimeout(delayedSearch)
  }, [searchTerm, selectedCategory])



  const fetchProducts = async () => {
    try {
      let url
      
      // Determine which API to use based on filters
      if (searchTerm.trim() && selectedCategory) {
        // Both search and category - use search API with category parameter as fallback
        url = `https://computer-b.vercel.app/api/products/search?q=${encodeURIComponent(searchTerm)}`
      } else if (searchTerm.trim()) {
        // Only search
        url = `https://computer-b.vercel.app/api/products/search?q=${encodeURIComponent(searchTerm)}`
      } else if (selectedCategory) {
        // Only category - use dedicated category API
        url = `https://computer-b.vercel.app/api/products/category/${selectedCategory}`
      } else {
        // No filters
        url = 'https://computer-b.vercel.app/api/products/all'
      }
      
      console.log('Fetching products with URL:', url)
      const response = await axios.get(url)
      console.log('API Response:', response.data)
      
      // Handle different response structures
      let productsArray = []
      if (Array.isArray(response.data)) {
        productsArray = response.data
      } else if (response.data && Array.isArray(response.data.products)) {
        productsArray = response.data.products
      } else if (response.data && Array.isArray(response.data.data)) {
        productsArray = response.data.data
      } else {
        console.log('Unexpected response structure:', response.data)
        productsArray = []
      }
      
      // If both search and category, apply client-side category filter
      if (searchTerm.trim() && selectedCategory && productsArray.length > 0) {
        productsArray = productsArray.filter(product => product.category?._id === selectedCategory)
        console.log('Applied client-side category filtering for combined search+category')
      }
      
      console.log('Final products array:', productsArray)
      setProducts(Array.isArray(productsArray) ? productsArray : [])
    } catch (error) {
      console.error('Error fetching products:', error)
      console.error('Error details:', error.response?.data)
      
      // Handle 404 as empty result (no products found)
      if (error.response?.status === 404) {
        setProducts([])
        return
      }
      
      // Fallback to /all endpoint for other errors
      try {
        console.log('Trying fallback to /all endpoint')
        const fallbackResponse = await axios.get('https://computer-b.vercel.app/api/products/all')
        const fallbackData = Array.isArray(fallbackResponse.data) ? fallbackResponse.data : 
                            (fallbackResponse.data?.products || fallbackResponse.data?.data || [])
        setProducts(fallbackData)
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError)
        setProducts([])
      }
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://computer-b.vercel.app/api/categories/all')
      const data = Array.isArray(response.data) ? response.data : 
                   (response.data?.categories || response.data?.data || [])
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }









  const addToOrder = async (product, quantity = 1, skipConfirm = false) => {
    const existingItem = selectedProducts.find(item => item._id === product._id)
    if (existingItem && !skipConfirm && quantity > 0) {
      setPendingProduct({ product, quantity })
      setShowConfirmModal(true)
      return
    }
    
    try {
      const response = await axios.post('https://computer-b.vercel.app/api/cart/items', {
        productId: product._id,
        quantity: quantity
      })
      const cartItems = response.data.data.items.map(item => ({
        ...item.product,
        orderQuantity: item.quantity
      }))
      setSelectedProducts(cartItems)
      toast.success(`${product.name} added to cart`)
    } catch (error) {
      console.error('Error updating cart:', error)
      toast.error(`Failed to add ${product.name} to cart`)
    }
  }

  const removeFromOrder = async (productId) => {
    try {
      const response = await axios.delete(`https://computer-b.vercel.app/api/cart/items/${productId}`)
      const cartItems = response.data.data.items.map(item => ({
        ...item.product,
        orderQuantity: item.quantity
      }))
      setSelectedProducts(cartItems)
    } catch (error) {
      console.error('Error removing from cart:', error)
      toast.error('Failed to remove item from cart')
    }
  }

  const updateQuantity = async (productId, quantity) => {
    try {
      let response
      if (quantity <= 0) {
        response = await axios.delete(`https://computer-b.vercel.app/api/cart/items/${productId}`)
      } else {
        response = await axios.put(`https://computer-b.vercel.app/api/cart/items/${productId}`, {
          quantity: quantity
        })
      }
      const cartItems = response.data.data.items.map(item => ({
        ...item.product,
        orderQuantity: item.quantity
      }))
      setSelectedProducts(cartItems)
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  const clearCart = async () => {
    try {
      await axios.delete('https://computer-b.vercel.app/api/cart')
      setSelectedProducts([])
      toast.success('Cart cleared successfully')
    } catch (error) {
      console.error('Error clearing cart:', error)
      toast.error('Failed to clear cart')
    }
  }

  const getTotalAmount = () => {
    return selectedProducts.reduce((total, item) => total + (item.sellingRate * item.orderQuantity), 0)
  }

  const handleSubmitOrder = async () => {
    // Validation
    if (!customerInfo.name?.trim()) {
      toast.error('Customer name is required')
      return
    }

    if (!customerInfo.email?.trim()) {
      toast.error('Customer email is required')
      return
    }

    if (selectedProducts.length === 0) {
      toast.error('Please add at least one product to the order')
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

    // Validate products have valid data
    const invalidProducts = selectedProducts.filter(item =>
      !item._id || !item.orderQuantity || item.orderQuantity <= 0 || !item.sellingRate
    )

    if (invalidProducts.length > 0) {
      toast.error('Some products have invalid data. Please check quantities and prices.')
      return
    }

    const orderData = {
      customerName: customerInfo.name.trim(),
      customerEmail: customerInfo.email.trim(),
      customerPhone: customerInfo.phone || '',
      address: customerInfo.address?.trim() || '',
      items: selectedProducts.map(item => ({
        product: item._id,
        quantity: parseInt(item.orderQuantity),
        price: parseFloat(item.sellingRate)
      })),
      totalAmount: parseFloat(getTotalAmount().toFixed(2))
      // Let backend generate orderId automatically
    }

    try {
      console.log('Creating order with data:', orderData)
      const response = await axios.post('https://computer-b.vercel.app/api/orders/create', orderData)
      console.log('Order created successfully:', response.data)

      // Update stock for each product in the order
      for (const item of selectedProducts) {
        try {
          console.log(`Updating stock for product ${item._id}, reducing by ${item.orderQuantity}`)
          // Try both API endpoints to see which one works
          try {
            const stockResponse = await axios.put(`https://computer-b.vercel.app/api/products/update-stock/${item._id}`, {
              quantity: item.orderQuantity
            })
            console.log(`Stock update response (update-stock):`, stockResponse.data)
          } catch (err1) {
            console.log('update-stock failed, trying update endpoint')
            const stockResponse = await axios.put(`https://computer-b.vercel.app/api/products/update/${item._id}`, {
              quantity: item.quantity - item.orderQuantity
            })
            console.log(`Stock update response (update):`, stockResponse.data)
          }
        } catch (stockError) {
          console.error(`Error updating stock for product ${item._id}:`, stockError)
          // Don't fail the entire order if stock update fails
        }
      }

      toast.success('✅ Order created successfully!')
      // Cart automatically cleared by backend
      setSelectedProducts([])
      setCustomerInfo({ name: '', email: '', phone: '', address: '' })
      // Navigate after a short delay
      setTimeout(() => {
        navigate('/orders')
      }, 1500)
    } catch (error) {
      console.error('Error creating order:', error)
      console.error('Error details:', error.response?.data)

      // More specific error messages
      if (error.response?.status === 400) {
        toast.error(`Invalid order data: ${error.response.data.message || 'Please check all fields'}`)
      } else if (error.response?.status === 500) {
        toast.error('Server error. Please try again later.')
      } else if (error.code === 'NETWORK_ERROR') {
        toast.error('Network error. Please check your connection.')
      } else {
        toast.error(`Failed to create order: ${error.response?.data?.message || error.message || 'Please try again.'}`)
      }
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

      {/* Customer Info Section */}
      <div className="mb-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Customer Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Customer Name *"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm transition-all duration-200"
          />
          <input
            type="email"
            placeholder="Email Address *"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm transition-all duration-200"
          />
          <input
            type="tel"
            placeholder="Phone Number (10 digits)"
            value={customerInfo.phone}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, '').slice(0, 10)
              setCustomerInfo({ ...customerInfo, phone: value })
            }}
            maxLength={10}
            pattern="[0-9]{10}"
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm transition-all duration-200"
          />
          <input
            type="text"
            placeholder="Address (Optional)"
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
            className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 text-sm transition-all duration-200"
          />
        </div>
      </div>

      {/* Products Section */}
      <div className="flex-1">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
            Available Products
          </h3>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-sm transition-all duration-200"
            />
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
                      className={`${isSelected ? 'bg-green-50' : ''}`}
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
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatIndianCurrency(product.sellingRate)}</td>
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
                  className={`p-3 border-b border-gray-200 ${isSelected ? 'bg-green-50' : ''}`}
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
                        <p className="text-xs text-gray-500 mt-0.5">{product.category?.name} • {formatIndianCurrency(product.sellingRate)}</p>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{product.quantity}</span>
                      <motion.button
                        onClick={() => {
                          const existingItem = selectedProducts.find(item => item._id === product._id)
                          if (existingItem) {
                            setPendingProduct({ product, quantity: 1 })
                            setShowConfirmModal(true)
                          } else {
                            addToOrder(product)
                          }
                        }}
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

        {/* Compatibility Check Component */}
        <CompatibilityCheck 
          selectedProducts={selectedProducts} 
          onAddProduct={addToOrder}
          categories={categories}
          products={products}
        />
      </div>

      {/* Cart Modal */}
      {showCartModal && (
        <div className="fixed inset-0 bg-transparent flex items-start justify-end z-50 p-4" style={{ backdropFilter: 'blur(2px)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full sm:w-96 h-[calc(100vh-8rem)] overflow-y-auto shadow-2xl mt-16 mr-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Order Summary
              </h3>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl transition-colors duration-200"
              >
                ×
              </button>
            </div>

            {selectedProducts.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-gray-400">🛒</span>
                </div>
                <p className="text-gray-500 text-lg">No items in cart</p>
                <p className="text-gray-400 text-sm mt-1">Add products to get started</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                  {selectedProducts.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">{item.name}</p>
                        <p className="text-sm text-gray-600">{formatIndianCurrency(item.sellingRate)} each</p>
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <button
                          onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                          className="w-8 h-8 bg-red-500 text-white rounded text-sm hover:bg-red-600 flex items-center justify-center transition-colors duration-200"
                        >
                          −
                        </button>
                        <span className="text-sm font-bold w-8 text-center bg-white px-2 py-1 rounded border">{item.orderQuantity}</span>
                        <button
                          onClick={() => addToOrder(item)}
                          className="w-8 h-8 bg-green-500 text-white rounded text-sm hover:bg-green-600 flex items-center justify-center transition-colors duration-200"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-gray-200 pt-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-700">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">{formatIndianCurrency(getTotalAmount())}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex gap-3">
                      <motion.button
                        onClick={() => {
                          handleSubmitOrder()
                          setShowCartModal(false)
                        }}
                        disabled={selectedProducts.length === 0}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-200"
                        whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                        whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                      >
                        🛍️ Create Order
                      </motion.button>
                    <motion.button
                      onClick={async () => {
                        // Validation for quotation
                        if (!customerInfo.name?.trim()) {
                          toast.error('Customer name is required for quotation')
                          return
                        }

                        if (!customerInfo.email?.trim()) {
                          toast.error('Customer email is required for quotation')
                          return
                        }

                        if (selectedProducts.length === 0) {
                          toast.error('Please add at least one product to generate quotation')
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

                        const quotationData = {
                          customerName: customerInfo.name.trim(),
                          customerEmail: customerInfo.email.trim(),
                          customerPhone: customerInfo.phone || '',
                          address: customerInfo.address?.trim() || '',
                          type: 'Quotation',
                          items: selectedProducts.map(item => ({
                            product: item._id,
                            quantity: parseInt(item.orderQuantity),
                            price: parseFloat(item.sellingRate)
                          })),
                          totalAmount: parseFloat(getTotalAmount().toFixed(2))
                        }

                        try {
                          await axios.post('https://computer-b.vercel.app/api/orders/create', quotationData)
                          toast.success('Quotation generated and saved successfully!')
                          // Cart automatically cleared by backend
                          setSelectedProducts([])
                          setShowCartModal(false)
                          setTimeout(() => {
                            navigate('/quotation-list')
                          }, 1500)
                        } catch (error) {
                          console.error('Error generating quotation:', error)
                          console.error('Error details:', error.response?.data)

                          // More specific error messages
                          if (error.response?.status === 400) {
                            toast.error(`Invalid quotation data: ${error.response.data.message || 'Please check all fields'}`)
                          } else if (error.response?.status === 500) {
                            toast.error('Server error. Please try again later.')
                          } else if (error.code === 'NETWORK_ERROR') {
                            toast.error('Network error. Please check your connection.')
                          } else {
                            toast.error(`Failed to generate quotation: ${error.response?.data?.message || error.message || 'Please try again.'}`)
                          }
                        }
                      }}
                      disabled={selectedProducts.length === 0}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-200"
                      whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                      whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                    >
                      📄 Generate Quote
                    </motion.button>
                    </div>
                    <motion.button
                      onClick={clearCart}
                      disabled={selectedProducts.length === 0}
                      className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-lg transition-all duration-200"
                      whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                      whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                    >
                      🗑️ Clear Cart
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
                <p className="text-sm text-gray-600"><strong>Price:</strong> <span className="text-green-600 font-medium text-lg">{formatIndianCurrency(selectedProduct.sellingRate)}</span></p>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-600"><strong>Stock:</strong> {selectedProduct.quantity}</p>
                <p className="text-sm text-gray-600"><strong>Status:</strong>
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${selectedProduct.status === 'Active' ? 'bg-green-100 text-green-800' :
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

      {/* Floating Cart Button */}
      <button
        onClick={() => setShowCartModal(true)}
        className="fixed top-2 right-8 w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full hover:from-green-700 hover:to-green-800 shadow-lg transition-all duration-200 flex items-center justify-center z-40"
      >
        <span className="text-2xl">🛒</span>
        {selectedProducts.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {selectedProducts.reduce((total, item) => total + item.orderQuantity, 0)}
          </span>
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirmModal && pendingProduct && (
        <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Item Already Added</h3>
            <p className="text-gray-600 mb-6">
              Do you want to add this item again?<br/>
              Current quantity: {selectedProducts.find(item => item._id === pendingProduct.product._id)?.orderQuantity || 0}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  addToOrder(pendingProduct.product, pendingProduct.quantity, true)
                  setShowConfirmModal(false)
                  setPendingProduct(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Yes, Add More
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  setPendingProduct(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CreateOrder