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
      <div className="mb-8">
        <h1 className="text-blue-800 text-3xl font-bold m-0">Categories</h1>
        <p className="text-slate-600 text-base mt-1">Manage your product categories</p>
      </div>
      
      <div className="relative mb-8 p-8 bg-gradient-to-br from-white/95 to-cyan-50/80 backdrop-blur-xl rounded-3xl border border-cyan-200/50 shadow-2xl shadow-cyan-500/10">
        <div className="absolute -top-4 left-8 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-full shadow-lg">
          {editId ? '✏️ Edit Category' : '➕ Add New Category'}
        </div>
        
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-cyan-500 text-xl">🏷️</span>
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full pl-14 pr-6 py-5 bg-white/70 border-2 border-slate-200/60 rounded-2xl outline-none text-lg transition-all duration-300 focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/20 peer placeholder-transparent"
              placeholder="Category name"
            />
            <label className="absolute left-14 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-600">
              Category Name
            </label>
          </div>

          <div className="relative group">
            <div className="absolute top-5 left-0 pl-4 flex items-start pointer-events-none">
              <span className="text-cyan-500 text-xl">📝</span>
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-14 pr-6 py-5 bg-white/70 border-2 border-slate-200/60 rounded-2xl outline-none text-lg transition-all duration-300 focus:border-cyan-400 focus:bg-white focus:shadow-lg focus:shadow-cyan-500/20 peer placeholder-transparent resize-none h-32"
              placeholder="Description"
            />
            <label className="absolute left-14 -top-2.5 bg-white px-2 text-sm text-cyan-600 font-medium transition-all duration-300 peer-placeholder-shown:text-base peer-placeholder-shown:text-slate-400 peer-placeholder-shown:top-5 peer-focus:-top-2.5 peer-focus:text-sm peer-focus:text-cyan-600">
              Description (Optional)
            </label>
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="submit" 
              className="flex-1 relative overflow-hidden px-8 py-4 bg-gradient-to-r from-cyan-500 via-cyan-600 to-blue-600 text-white font-bold text-lg rounded-2xl transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {editId ? '✅ Update Category' : '🚀 Create Category'}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
            
            {editId && (
              <button 
                type="button" 
                onClick={() => { setEditId(null); setFormData({ name: '', description: '' }) }}
                className="px-8 py-4 bg-gradient-to-r from-slate-400 to-slate-500 text-white font-semibold text-lg rounded-2xl transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                ❌ Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="group relative p-6 bg-white/80 backdrop-blur-lg rounded-2xl border border-cyan-500/20 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.05] hover:-translate-y-2">
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-2xl">📁</span>
            </div>
            
            <div className="mb-4">
              <h4 className="text-xl font-bold text-blue-800 mb-3 pr-8">{category.name}</h4>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">{category.description || 'No description available'}</p>
            </div>
            
            <div className="flex gap-2 mt-6">
              <button 
                onClick={() => handleEdit(category)} 
                className="flex-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                ✏️ Edit
              </button>
              <button 
                onClick={() => handleDelete(category._id)} 
                className="flex-1 px-3 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        ))}
        
        {categories.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-slate-500 text-lg font-medium">No categories added yet</p>
            <p className="text-slate-400 text-sm mt-2">Create your first category using the form above</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Category;