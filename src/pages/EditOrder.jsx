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
      fetchCompatibleProducts(product._id)
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
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="p-4 bg-white border-b flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Edit Order</h1>
          <p className="text-gray-600 mt-1">Update order details</p>
        </div>
        <button 
          onClick={() => navigate('/orders')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Orders
        </button>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Fixed Sidebar */}
        <div className="w-80 bg-gray-50 border-r flex flex-col">
          {/* Customer Information */}
          <div className="p-4 bg-white border-b">
            <h3 className="text-lg font-semibold mb-4">Customer Information</h3>
            <div className="space-y-3">
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
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex-shrink-0">
              <div className="flex justify-between font-bold text-lg mb-3">
                <span>Total:</span>
                <span className="text-green-600">₹{getTotalAmount().toFixed(2)}</span>
              </div>
              <motion.button
                onClick={handleUpdateOrder}
                disabled={selectedProducts.length === 0}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                whileHover={{ scale: selectedProducts.length === 0 ? 1 : 1.02 }}
                whileTap={{ scale: selectedProducts.length === 0 ? 1 : 0.98 }}
              >
                Update Order
              </motion.button>
            </div>
          </div>
        </div>

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