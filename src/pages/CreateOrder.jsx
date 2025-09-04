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
    // Check if there are any motherboards in selected products
    const hasMotherboard = selectedProducts.some(item => 
      item.category?.name?.toLowerCase().includes('motherboard')
    )
    
    // Hide compatible products if no motherboard is selected
    if (!hasMotherboard) {
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
    <div className="h-screen flex flex-col overflow-hidden p-2">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Create Order</h1>
          <p className="text-gray-600 text-sm mt-1">Take customer orders for computer parts</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="w-full sm:w-auto px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm sm:text-base"
        >
          Back to Orders
        </button>
      </div>

      <div className="flex flex-col xl:flex-row gap-4 flex-1 min-h-0">
        {/* Customer Info - Fixed */}
        <div className="xl:w-1/3 order-2 xl:order-1 flex flex-col">
          <div className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm mb-4 flex-shrink-0">
          <h3 className="text-base font-medium text-gray-800 mb-2">Customer Information</h3>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Customer Name"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
            />
            <input
              type="email"
              placeholder="Email (e.g., user@example.com)"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
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
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 text-sm"
            />
            <textarea
              placeholder="Address"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
              className="w-full px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:border-blue-500 h-12 resize-none text-sm"
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-96 relative">
          <h3 className="text-lg font-medium text-gray-800 p-4 pb-3">Order Summary</h3>
          
          {/* Scrollable Items Area */}
          <div className="px-4 overflow-y-auto" style={{height: '220px', scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitScrollbar: {display: 'none'}}}>
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items in order</p>
            ) : (
              <div className="space-y-2 pb-2">
                {selectedProducts.map(item => (
                  <div key={item._id} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-gray-500">₹{item.sellingRate} each</p>
                    </div>
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
              </div>
            )}
          </div>
          
          {/* Absolutely Positioned Total and Buttons */}
          <div className="absolute bottom-0 left-0 right-0 bg-white px-4 pb-4 pt-3 border-t">
            <div className="flex justify-between font-bold text-lg mb-3">
              <span>Total:</span>
              <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
                <motion.button
                  onClick={handleSubmitOrder}
                  disabled={selectedProducts.length === 0}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                  className="flex-1 px-3 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                  whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                >
                  Generate Quote
                </motion.button>
              </div>
            </div>
        </div>
        </div>

        {/* Products Section - Single Scrollable Area */}
        <div className="xl:w-2/3 order-1 xl:order-2 overflow-y-auto">
          <div className="mb-3 flex justify-between items-center">
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
            </div>
          </div>

          {/* Available Products Container */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="hidden md:table-cell px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-900">
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
                      <td className="hidden md:table-cell px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">{product.brand || 'N/A'}</td>
                      <td className="px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium text-green-600">₹{product.sellingRate}</td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-2 text-xs sm:text-sm text-gray-500">{product.quantity}</td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.status === 'Active' ? 'bg-green-100 text-green-800' :
                          product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                          <motion.button
                            onClick={() => addToOrder(product)}
                            disabled={product.quantity === 0}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ 
                              scale: product.quantity === 0 ? 1 : 1.1,
                              backgroundColor: product.quantity === 0 ? undefined : "#1d4ed8"
                            }}
                            whileTap={{ scale: product.quantity === 0 ? 1 : 0.9 }}
                          >
                            Add
                          </motion.button>

                        </div>
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
            <div className="compatible-products-section bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
              <h3 className="text-lg font-medium text-gray-800 p-3 border-b border-gray-200">Compatible Products</h3>
              <div className="p-3">
                {Object.entries(
                  compatibleProducts.reduce((acc, product) => {
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