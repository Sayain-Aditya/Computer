import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Order = () => {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [compatibleProducts, setCompatibleProducts] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [showCompatible, setShowCompatible] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/products/all')
      setProducts(response.data)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCompatibleProducts = async (productId) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/${productId}/compatible`)
      setCompatibleProducts(response.data)
      setShowCompatible(true)
    } catch (error) {
      console.error('Error fetching compatible products:', error)
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
      alert('Please fill customer details and add products to order')
      return
    }

    const orderData = {
      customer: customerInfo,
      products: selectedProducts.map(item => ({
        product: item._id,
        quantity: item.orderQuantity,
        price: item.sellingRate
      })),
      totalAmount: getTotalAmount()
    }

    try {
      await axios.post('https://computer-shop-ecru.vercel.app/api/orders/create', orderData)
      alert('Order created successfully!')
      
      // Reset form
      setSelectedProducts([])
      setCustomerInfo({ name: '', email: '', phone: '', address: '' })
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order. Please try again.')
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-blue-800 text-3xl font-bold m-0">Create Order</h1>
        <p className="text-slate-600 text-base mt-1">Take customer orders for computer parts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Customer Info */}
        <div className="lg:col-span-1">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-cyan-500/20 shadow-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-blue-800 mb-4">👤 Customer Information</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Customer Name"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-cyan-400"
              />
              <input
                type="email"
                placeholder="Email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-cyan-400"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-cyan-400"
              />
              <textarea
                placeholder="Address"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl outline-none focus:border-cyan-400 h-20 resize-none"
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl border border-cyan-500/20 shadow-xl p-6">
            <h3 className="text-xl font-bold text-blue-800 mb-4">🛒 Order Summary</h3>
            {selectedProducts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No items in order</p>
            ) : (
              <div className="space-y-3">
                {selectedProducts.map(item => (
                  <div key={item._id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-slate-500">${item.sellingRate} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity - 1)}
                        className="w-6 h-6 bg-red-500 text-white rounded text-xs"
                      >
                        -
                      </button>
                      <span className="text-sm font-medium w-8 text-center">{item.orderQuantity}</span>
                      <button
                        onClick={() => updateQuantity(item._id, item.orderQuantity + 1)}
                        className="w-6 h-6 bg-green-500 text-white rounded text-xs"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">${getTotalAmount().toFixed(2)}</span>
                  </div>
                </div>
                <button
                  onClick={handleSubmitOrder}
                  className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:scale-105 transition-all duration-300"
                >
                  🚀 Create Order
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Products Grid */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex justify-between items-center">
            <h3 className="text-xl font-bold text-blue-800">📦 Available Products</h3>
            {showCompatible && (
              <button
                onClick={() => setShowCompatible(false)}
                className="px-4 py-2 bg-slate-500 text-white rounded-lg text-sm"
              >
                Show All Products
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(showCompatible ? compatibleProducts : products).map(product => (
              <div key={product._id} className="bg-white/80 backdrop-blur-lg rounded-xl border border-cyan-500/20 shadow-lg p-4 hover:shadow-xl transition-all duration-300">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-800">{product.name}</h4>
                    <p className="text-sm text-slate-500">{product.category?.name}</p>
                    <p className="text-sm text-slate-600">Brand: {product.brand || 'N/A'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    product.status === 'Active' ? 'bg-green-100 text-green-800' :
                    product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </div>

                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-green-600">${product.sellingRate}</p>
                    <p className="text-sm text-slate-500">Stock: {product.quantity}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => addToOrder(product)}
                    disabled={product.quantity === 0}
                    className="flex-1 px-3 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white text-sm font-medium rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    🛒 Add to Order
                  </button>
                  <button
                    onClick={() => fetchCompatibleProducts(product._id)}
                    className="px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:scale-105 transition-all duration-300"
                  >
                    🔗 Compatible
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(showCompatible ? compatibleProducts : products).length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-slate-500 text-lg font-medium">
                {showCompatible ? 'No compatible products found' : 'No products available'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Order