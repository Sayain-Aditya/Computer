import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Product = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    modelNumber: '',
    quantity: 0,
    sellingRate: 0,
    costRate: 0,
    status: 'Active',
    warranty: '',
    attributes: {}
  })
  const [newAttribute, setNewAttribute] = useState({ key: '', value: '' })
  const [editId, setEditId] = useState(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await axios.put(`https://computer-shop-ecru.vercel.app/api/products/update/${editId}`, formData)
      } else {
        await axios.post('https://computer-shop-ecru.vercel.app/api/products/create', formData)
      }
      fetchProducts()
      setFormData({
        name: '', category: '', brand: '', modelNumber: '',
        quantity: 0, sellingRate: 0, costRate: 0, status: 'Active', warranty: '', attributes: {}
      })
      setEditId(null)
    } catch (error) {
      console.error('Error saving product:', error)
    }
  }

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      category: product.category._id,
      brand: product.brand || '',
      modelNumber: product.modelNumber || '',
      quantity: product.quantity,
      sellingRate: product.sellingRate,
      costRate: product.costRate || 0,
      status: product.status,
      warranty: product.warranty || '',
      attributes: product.attributes || {}
    })
    setEditId(product._id)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/products/delete/${id}`)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const addAttribute = () => {
    if (newAttribute.key && newAttribute.value) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          [newAttribute.key]: newAttribute.value
        }
      })
      setNewAttribute({ key: '', value: '' })
    }
  }

  const removeAttribute = (key) => {
    const updatedAttributes = { ...formData.attributes }
    delete updatedAttributes[key]
    setFormData({ ...formData, attributes: updatedAttributes })
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-blue-800 text-3xl font-bold m-0">Products</h1>
        <p className="text-slate-600 text-base mt-1">Manage your computer parts inventory</p>
      </div>
      
      <div className="relative mb-8 p-8 bg-gradient-to-br from-white/95 to-cyan-50/80 backdrop-blur-xl rounded-3xl border border-cyan-200/50 shadow-2xl shadow-cyan-500/10">
        <div className="absolute -top-4 left-8 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
          {editId ? '✏️ Edit Product' : '➕ Add New Product'}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative group">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white peer placeholder-transparent"
              placeholder="Product name"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Product Name</label>
          </div>

          <div className="relative group">
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Category</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Brand"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Brand</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              value={formData.modelNumber}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Model Number"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Model Number</label>
          </div>

          <div className="relative group">
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Quantity"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Quantity</label>
          </div>

          <div className="relative group">
            <input
              type="number"
              step="0.01"
              value={formData.sellingRate}
              onChange={(e) => setFormData({ ...formData, sellingRate: parseFloat(e.target.value) })}
              required
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Selling Rate"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Selling Rate</label>
          </div>

          <div className="relative group">
            <input
              type="number"
              step="0.01"
              value={formData.costRate}
              onChange={(e) => setFormData({ ...formData, costRate: parseFloat(e.target.value) })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Cost Rate"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Cost Rate</label>
          </div>

          <div className="relative group">
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Status</label>
          </div>

          <div className="relative group">
            <input
              type="text"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              className="w-full px-4 py-4 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400 focus:bg-white"
              placeholder="Warranty"
            />
            <label className="absolute left-4 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium">Warranty</label>
          </div>

          {/* Attributes Section */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-lg font-semibold text-blue-800">🔧 Product Attributes</h4>
            
            {/* Add New Attribute */}
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Attribute name (e.g., Socket)"
                value={newAttribute.key}
                onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
                className="flex-1 px-4 py-3 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400"
              />
              <input
                type="text"
                placeholder="Value (e.g., AM4)"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                className="flex-1 px-4 py-3 bg-white/70 border-2 border-slate-200/60 rounded-xl outline-none text-base transition-all duration-300 focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={addAttribute}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-xl hover:scale-105 transition-all duration-300"
              >
                ➕ Add
              </button>
            </div>

            {/* Display Attributes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(formData.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                  <span className="text-sm">
                    <strong className="text-cyan-700">{key}:</strong> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttribute(key)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ❌
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-4 pt-4">
            <button 
              type="submit" 
              className="flex-1 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]"
            >
              {editId ? '✅ Update Product' : '🚀 Create Product'}
            </button>
            
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setFormData({ name: '', category: '', brand: '', modelNumber: '', quantity: 0, sellingRate: 0, costRate: 0, status: 'Active', warranty: '', attributes: {} }) }}
                className="px-8 py-4 bg-gradient-to-r from-slate-400 to-slate-500 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:scale-[1.02]"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product._id} className="group relative p-6 bg-white/80 backdrop-blur-lg rounded-2xl border border-cyan-500/20 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] hover:-translate-y-2">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-2xl">📦</span>
            </div>
            
            <div className="mb-4">
              <h4 className="text-xl font-bold text-blue-800 mb-2 pr-8">{product.name}</h4>
              <p className="text-sm text-slate-500 mb-2">{product.category?.name}</p>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Brand: {product.brand || 'N/A'}</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  product.status === 'Active' ? 'bg-green-100 text-green-800' :
                  product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status}
                </span>
              </div>
              <div className="mt-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Price:</span>
                  <span className="font-semibold text-green-600">${product.sellingRate}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Stock:</span>
                  <span className="font-semibold">{product.quantity}</span>
                </div>
                {Object.keys(product.attributes || {}).length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <p className="text-xs text-slate-500 mb-1">Attributes:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(product.attributes).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded">
                          {key}: {value}
                        </span>
                      ))}
                      {Object.keys(product.attributes).length > 2 && (
                        <span className="text-xs text-slate-400">+{Object.keys(product.attributes).length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleEdit(product)} 
                className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => handleDelete(product._id)} 
                className="flex-1 px-3 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 text-lg font-medium">No products added yet</p>
            <p className="text-slate-400 text-sm mt-2">Create your first product using the form above</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Product