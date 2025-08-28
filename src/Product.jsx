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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Products</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your computer parts inventory</p>
      </div>
      
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {editId ? 'Edit Product' : 'Add New Product'}
        </h3>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter brand"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Model Number</label>
            <input
              type="text"
              value={formData.modelNumber}
              onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter model number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selling Rate</label>
            <input
              type="number"
              step="0.01"
              value={formData.sellingRate}
              onChange={(e) => setFormData({ ...formData, sellingRate: parseFloat(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cost Rate</label>
            <input
              type="number"
              step="0.01"
              value={formData.costRate}
              onChange={(e) => setFormData({ ...formData, costRate: parseFloat(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
            <input
              type="text"
              value={formData.warranty}
              onChange={(e) => setFormData({ ...formData, warranty: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter warranty period"
            />
          </div>

          <div className="md:col-span-2">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Product Attributes</h4>
            
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Attribute name (e.g., Socket)"
                value={newAttribute.key}
                onChange={(e) => setNewAttribute({ ...newAttribute, key: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Value (e.g., AM4)"
                value={newAttribute.value}
                onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={addAttribute}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Add
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(formData.attributes).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
                  <span className="text-sm">
                    <strong>{key}:</strong> {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttribute(key)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 flex gap-3 pt-4">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              {editId ? 'Update' : 'Create'} Product
            </button>
            
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setFormData({ name: '', category: '', brand: '', modelNumber: '', quantity: 0, sellingRate: 0, costRate: 0, status: 'Active', warranty: '', attributes: {} }) }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div key={product._id} className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
            <div className="mb-3">
              <h4 className="text-lg font-medium text-gray-800 mb-1">{product.name}</h4>
              <p className="text-sm text-gray-500 mb-2">{product.category?.name}</p>
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Brand: {product.brand || 'N/A'}</span>
                <span className={`px-2 py-1 rounded text-xs ${
                  product.status === 'Active' ? 'bg-green-100 text-green-800' :
                  product.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {product.status}
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-green-600">${product.sellingRate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-medium">{product.quantity}</span>
                </div>
                {Object.keys(product.attributes || {}).length > 0 && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">Attributes:</p>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(product.attributes).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          {key}: {value}
                        </span>
                      ))}
                      {Object.keys(product.attributes).length > 2 && (
                        <span className="text-xs text-gray-400">+{Object.keys(product.attributes).length - 2} more</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => handleEdit(product)} 
                className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDelete(product._id)} 
                className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        
        {products.length === 0 && (
          <div className="col-span-full text-center py-8">
            <p className="text-gray-500">No products found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first product using the form above</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Product