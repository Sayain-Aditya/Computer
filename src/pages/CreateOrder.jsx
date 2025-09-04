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
      console.log('Fetching compatible products for product ID:', productId)
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/${productId}/compatible`)
<<<<<<< HEAD
      console.log('API Response:', response.data)
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
          console.log('Showing all motherboards for CPU:', compatibleData.length)
        }
      }
      
      console.log('Compatible products found:', compatibleData.length, compatibleData)
      setCompatibleProducts(compatibleData)
=======
      const compatibleData = response.data.compatibleProducts || []
      const selectedMotherboard = response.data.product
      
      // Include the selected motherboard in the display
      const productsToShow = selectedMotherboard ? [selectedMotherboard, ...compatibleData] : compatibleData
      
      setCompatibleProducts(productsToShow)
>>>>>>> 2dc2f892f2ad53fd02e97b61567965bd09ab31fb
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
    
    // Auto-show compatible products if motherboard or CPU is added
    const categoryName = product.category?.name?.toLowerCase() || ''
    if (categoryName.includes('motherboard') || 
        categoryName.includes('cpu') || 
        categoryName.includes('processor')) {
      console.log('Fetching compatible products for:', product.name, 'Category:', categoryName)
      fetchCompatibleProducts(product._id)
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
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Create Order</h1>
          <p className="text-gray-600 mt-1">Take customer orders for computer parts</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Orders
        </button>
      </div>

<<<<<<< HEAD
      <div className="flex flex-1 min-h-0">
        {/* Fixed Sidebar */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          {/* Customer Information */}
          <div className="p-4 bg-white border-b">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
=======
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Customer Info */}
        <div className="xl:col-span-1 order-1 xl:order-1">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h3>
            <div className="space-y-4">
>>>>>>> 2dc2f892f2ad53fd02e97b61567965bd09ab31fb
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
              <input
                type="email"
                placeholder="Email (e.g., user@example.com)"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
              <input
                type="tel"
                placeholder="Phone (10 digits)"
                value={customerInfo.phone}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10)
                  setCustomerInfo({...customerInfo, phone: value})
                }}
                maxLength={10}
                pattern="[0-9]{10}"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              />
              <textarea
                placeholder="Address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 h-16 resize-none text-sm"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="flex-1 flex flex-col bg-white min-h-0">
            <h3 className="text-lg font-semibold p-4 pb-3 border-b flex-shrink-0">Order Summary</h3>
            <div className="flex-1 p-4 overflow-y-auto min-h-0">
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No items in order</p>
              ) : (
                <div className="space-y-2">
                  {selectedProducts.map(item => (
                    <div key={item._id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">₹{item.sellingRate} each</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                          className="w-6 h-6 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                        >
                          -
                        </button>
                        <span className="font-medium w-6 text-center text-xs">{item.orderQuantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                          className="w-6 h-6 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
<<<<<<< HEAD
                  ))}
=======
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                        className="w-6 h-6 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.orderQuantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                        className="w-6 h-6 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <motion.button
                    onClick={handleSubmitOrder}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Order
                  </motion.button>
                  <motion.button
                    onClick={async () => {
                      if (!customerInfo.name || !customerInfo.email || selectedProducts.length === 0) {
                        toast.error('Please fill customer details and add products to generate quote')
                        return
                      }

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
                        toast.success('Quotation generated and saved successfully!')
                        navigate('/quotation-list')
                      } catch (error) {
                        console.error('Error generating quotation:', error)
                        toast.error('Failed to generate quotation. Please try again.')
                      }
                    }}
                    disabled={selectedProducts.length === 0}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                  >
                    Generate Quote
                  </motion.button>
>>>>>>> 2dc2f892f2ad53fd02e97b61567965bd09ab31fb
                </div>
              )}
            </div>
            <div className="p-4 border-t flex-shrink-0">
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>Total:</span>
                <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={handleSubmitOrder}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                >
                  Create Order
                </motion.button>
                <motion.button
                  onClick={async () => {
                    if (!customerInfo.name || !customerInfo.email || selectedProducts.length === 0) {
                      alert('Please fill customer details and add products to generate quote')
                      return
                    }
                    
                    if (customerInfo.phone && customerInfo.phone.length !== 10) {
                      alert('Phone number must be exactly 10 digits')
                      return
                    }
                    
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                    if (!emailRegex.test(customerInfo.email)) {
                      alert('Please enter a valid email address')
                      return
                    }

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
                      alert('Quotation generated and saved successfully!')
                      navigate('/quotation-list')
                    } catch (error) {
                      console.error('Error generating quotation:', error)
                      alert('Failed to generate quotation. Please try again.')
                    }
                  }}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                >
                  Generate Quote
                </motion.button>
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        {/* Scrollable Products Section */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-4 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Available Products</h3>
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {showCompatible && (
                    <button
                      onClick={() => setShowCompatible(false)}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Show All Products
                    </button>
                  )}
                </div>
              </div>
=======
        {/* Products Table */}
        <div className="xl:col-span-2 order-2 xl:order-2">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-800">Available Products</h3>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {showCompatible && (
                <button
                  onClick={() => setShowCompatible(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                >
                  Show All Products
                </button>
              )}
>>>>>>> 2dc2f892f2ad53fd02e97b61567965bd09ab31fb
            </div>
            
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
                  {getFilteredProducts().map((product, index) => {
                    const isSelected = selectedProducts.some(item => item._id === product._id)
                    return (
                    <motion.tr 
                      key={product._id} 
                      className={`hover:bg-gray-50 ${isSelected ? 'bg-gray-50' : ''}`}
                      initial={{ opacity: 0, x: -20, backgroundColor: isSelected ? "#f9fafb" : "transparent" }}
                      animate={{ opacity: 1, x: 0, backgroundColor: isSelected ? "#dcfce7" : "transparent" }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: isSelected ? "#bbf7d0" : "#f9fafb", scale: 1.01 }}
                    >
                      <td className="px-4 py-3">
                        <button 
                          onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="text-blue-600 hover:text-blue-800 hover:underline text-left"
                        >
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

            {getFilteredProducts().length === 0 && (
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

      {/* Product Details Modal */}
      {showModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedProduct.name}</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2"><strong>Category:</strong> {selectedProduct.category?.name || 'N/A'}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Brand:</strong> {selectedProduct.brand || 'N/A'}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Model:</strong> {selectedProduct.modelNumber || 'N/A'}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Price:</strong> <span className="text-green-600 font-medium">₹{selectedProduct.sellingRate}</span></p>
                <p className="text-sm text-gray-600 mb-2"><strong>Cost:</strong> ₹{selectedProduct.costRate || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2"><strong>Stock:</strong> {selectedProduct.quantity}</p>
                <p className="text-sm text-gray-600 mb-2"><strong>Status:</strong> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    selectedProduct.status === 'Active' ? 'bg-green-100 text-green-800' :
                    selectedProduct.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {selectedProduct.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-2"><strong>Warranty:</strong> {selectedProduct.warranty || 'N/A'}</p>
              </div>
            </div>
            
            {selectedProduct.attributes && Object.keys(selectedProduct.attributes).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attributes:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(selectedProduct.attributes).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 p-2 rounded text-xs">
                      <strong>{key}:</strong> {value}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { addToOrder(selectedProduct); setShowModal(false) }}
                disabled={selectedProduct.quantity === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to Order
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
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