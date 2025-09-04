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
    if (showCompatible) return compatibleProducts
    if (!selectedCategory) return products
    return products.filter(product => product.category?._id === selectedCategory)
  }

  const fetchCompatibleProducts = async (productId) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/${productId}/compatible`)
      const compatibleData = response.data.compatibleProducts || []
      const selectedMotherboard = response.data.product
      
      // Include the selected motherboard in the display
      const productsToShow = selectedMotherboard ? [selectedMotherboard, ...compatibleData] : compatibleData
      
      setCompatibleProducts(productsToShow)
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
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Customer Info */}
        <div className="xl:col-span-1 order-2 xl:order-1">
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Customer Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <input
                type="email"
                placeholder="Email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <textarea
                placeholder="Address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 h-20 resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Order Summary</h3>
            {selectedProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No items in order</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map(item => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
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
                        alert('Please fill customer details and add products to generate quote')
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
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                    whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
                  >
                    Generate Quote
                  </motion.button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="xl:col-span-2 order-1 xl:order-2">
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
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="hidden md:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                    <th className="hidden lg:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getFilteredProducts().map((product, index) => (
                    <motion.tr 
                      key={product._id} 
                      className="hover:bg-gray-50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ backgroundColor: "#f9fafb", scale: 1.01 }}
                    >
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-gray-900">
                        <button 
                          onClick={() => { setSelectedProduct(product); setShowModal(true) }}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {product.name}
                        </button>
                      </td>
                      <td className="hidden md:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">{product.category?.name || 'N/A'}</td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">{product.brand || 'N/A'}</td>
                      <td className="px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium text-green-600">₹{product.sellingRate}</td>
                      <td className="hidden sm:table-cell px-2 sm:px-4 py-3 text-xs sm:text-sm text-gray-500">{product.quantity}</td>
                      <td className="hidden lg:table-cell px-2 sm:px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          product.status === 'Active' ? 'bg-green-100 text-green-800' :
                          product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-3">
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
                          {product.category?.name?.toLowerCase().includes('motherboard') && (
                            <motion.button
                              onClick={() => fetchCompatibleProducts(product._id)}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"
                              whileHover={{ 
                                scale: 1.1,
                                backgroundColor: "#7c3aed"
                              }}
                              whileTap={{ scale: 0.9 }}
                            >
                              Compatible
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {getFilteredProducts().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {showCompatible ? 'No compatible products found' : 
                   selectedCategory ? 'No products in this category' : 'No products available'}
                </p>
              </div>
            )}
          </div>
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