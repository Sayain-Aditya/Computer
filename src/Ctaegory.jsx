import React, { useState, useEffect } from 'react'
import axios from 'axios'

const Category = () => {
  const [categories, setCategories] = useState([])
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [editId, setEditId] = useState(null)

  useEffect(() => {
    fetchCategories()
  }, [])

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
        await axios.put(`https://computer-shop-ecru.vercel.app/api/categories/update/${editId}`, formData)
      } else {
        await axios.post('https://computer-shop-ecru.vercel.app/api/categories/create', formData)
      }
      fetchCategories()
      setFormData({ name: '', description: '' })
      setEditId(null)
    } catch (error) {
      console.error('Error saving category:', error)
    }
  }

  const handleEdit = (category) => {
    setFormData({ name: category.name, description: category.description })
    setEditId(category._id)
  }

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://computer-shop-ecru.vercel.app/api/categories/delete/${id}`)
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categories</h1>
        <p className="text-gray-600 text-sm mt-1">Manage your product categories</p>
      </div>
      
      <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          {editId ? 'Edit Category' : 'Add New Category'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              placeholder="Enter category name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 h-20 resize-none"
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="flex gap-3">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              {editId ? 'Update' : 'Create'} Category
            </button>
            
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setFormData({ name: '', description: '' }) }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{category.description || 'No description available'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(category)} 
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(category._id)} 
                        className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {categories.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No categories found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first category using the form above</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Category;