import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import axios from 'axios'

const Product = () => {
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [editId, setEditId] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchProducts(1)
    fetchCategories()
  }, [])

  const fetchProducts = async (page = 1) => {
    try {
      const response = await axios.get(`https://computer-shop-ecru.vercel.app/api/products/all?page=${page}`)
      console.log('API Response:', response.data)
      setProducts(response.data.products || response.data)
      setTotalPages(response.data.totalPages || 1)
      setCurrentPage(page)
      console.log('Total Pages:', response.data.totalPages)
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

  const handleEdit = (product) => {
    // Navigate to edit page with product ID
    navigate(`/edit-product/${product._id}`)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/products/delete/${id}`)
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
    }
  }

  const exportToCSV = async () => {
    try {
      const response = await axios.get('https://computer-shop-ecru.vercel.app/api/products/export/csv')
      
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      toast.success('Products exported to CSV successfully!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export products. Please try again.')
    }
  }



  const getFilteredProducts = () => {
    let filtered = products
    
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category?._id === selectedCategory)
    }
    
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.modelNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return filtered
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-slate-50 to-gray-100 rounded-2xl p-8 border border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2 text-gray-800">Products</h1>
              <p className="text-gray-600 text-lg">Manage your computer parts inventory</p>
            </div>
            <div className="flex gap-3">
              <motion.button 
                onClick={exportToCSV}
                className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                📊 Export CSV
              </motion.button>
              <motion.button 
                onClick={() => navigate('/add-product')}
                className="px-6 py-3 bg-gray-800 text-white rounded-xl font-medium shadow-sm hover:shadow-md"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                + Add Product
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 shadow-sm w-full sm:w-64"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-gray-400 shadow-sm w-full sm:w-auto"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {getFilteredProducts().length} products found
          </div>
        </div>
      </div>
      


      <motion.div 
        className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {getFilteredProducts().map((product, index) => (
                <motion.tr 
                  key={product._id}
                  className="hover:bg-gray-50"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{product.name}</div>
                      <div className="text-xs text-gray-500">{product.modelNumber || 'No model'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">
                      {product.category?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{product.brand || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-800">₹{product.sellingRate}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-medium ${
                      product.quantity > 10 ? 'text-emerald-600' :
                      product.quantity > 0 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                      product.status === 'Inactive' ? 'bg-gray-50 text-gray-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <motion.button 
                        onClick={() => handleEdit(product)} 
                        className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Edit
                      </motion.button>
                      <motion.button 
                        onClick={() => handleDelete(product._id)} 
                        className="px-3 py-1 bg-rose-50 text-rose-600 text-xs font-medium rounded-lg hover:bg-rose-100"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {getFilteredProducts().length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-500 text-lg mb-2">
              {selectedCategory ? 'No products in this category' : 'No products found'}
            </p>
            <p className="text-gray-400 text-sm">Create your first product using the button above</p>
          </div>
        )}
      </motion.div>
      
      {/* Pagination */}
      <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => fetchProducts(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => fetchProducts(page)}
              className={`px-3 py-2 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => fetchProducts(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
    </div>
  )
}

export default Product