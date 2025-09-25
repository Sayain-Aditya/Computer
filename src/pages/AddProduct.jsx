import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { toast } from 'react-toastify'
import axios from 'axios'

const AddProduct = () => {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [categoryAttributes, setCategoryAttributes] = useState([])
  const [backendAttributes, setBackendAttributes] = useState([])
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
  const [bulkAttributes, setBulkAttributes] = useState('')
  const [showBulkInput, setShowBulkInput] = useState(false)
  const [showAIPrompt, setShowAIPrompt] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await axios.get('https://computer-b.vercel.app/api/categories/all')
      const data = Array.isArray(response.data) ? response.data : 
                   (response.data?.categories || response.data?.data || [])
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const fetchCategoryAttributes = async (categoryId) => {
    try {
      const response = await axios.get(`https://computer-b.vercel.app/api/attributes/category/${categoryId}/attributes`)
      
      if (response.data && response.data.attributes) {
        const fetchedAttrs = Object.keys(response.data.attributes)
        setBackendAttributes(fetchedAttrs)
        
        // Add fetched attributes directly to formData.attributes
        setFormData(prev => ({
          ...prev,
          attributes: {
            ...prev.attributes,
            ...response.data.attributes
          }
        }))
      }
      setCategoryAttributes([])
    } catch (error) {
      console.error('Error fetching category attributes:', error)
      setCategoryAttributes([])
    }
  }

  const handleCategoryChange = (categoryId) => {
    console.log('Category changed to:', categoryId)
    setFormData({ ...formData, category: categoryId, attributes: {} })
    setBackendAttributes([])
    if (categoryId) {
      fetchCategoryAttributes(categoryId)
    } else {
      setCategoryAttributes([])
    }
    setNewAttribute({ key: '', value: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await axios.post('https://computer-b.vercel.app/api/products/create', formData)
      toast.success('Product created successfully!')
      navigate('/products')
    } catch (error) {
      console.error('Error creating product:', error)
      toast.error('Failed to create product')
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

  const addBulkAttributes = () => {
    if (!bulkAttributes.trim()) return
    
    const lines = bulkAttributes.split('\n')
    const newAttrs = {}
    
    lines.forEach(line => {
      const trimmedLine = line.trim()
      if (trimmedLine && trimmedLine.includes(':')) {
        const [key, ...valueParts] = trimmedLine.split(':')
        const value = valueParts.join(':').trim()
        if (key.trim() && value) {
          newAttrs[key.trim()] = value
        }
      }
    })
    
    if (Object.keys(newAttrs).length > 0) {
      setFormData({
        ...formData,
        attributes: {
          ...formData.attributes,
          ...newAttrs
        }
      })
      setBulkAttributes('')
      setShowBulkInput(false)
      toast.success(`Added ${Object.keys(newAttrs).length} attributes`)
    } else {
      toast.error('No valid attributes found. Use format: key: value')
    }
  }

  const generateAIAttributes = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a product name or link')
      return
    }
    
    if (!formData.category) {
      toast.error('Please select a category first')
      return
    }
    
    setIsGenerating(true)
    try {
      // First, get existing attributes from API
      const attributesResponse = await axios.get(`https://computer-b.vercel.app/api/attributes/category/${formData.category}/attributes`)
      
      let existingAttributes = {}
      if (attributesResponse.data && attributesResponse.data.attributes) {
        existingAttributes = attributesResponse.data.attributes
      }
      
      const existingAttrNames = Object.keys(existingAttributes)
      
      if (existingAttrNames.length === 0) {
        toast.error('No attributes found for this category')
        return
      }
      
      // Use AI to generate values for existing attributes based on product details
      const response = await axios.post(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        contents: [{
          parts: [{
            text: `Analyze this product: "${aiPrompt}"

If this is a product URL/link, extract the product information from it.
If this is a product name/model, use your knowledge of that specific product.

Generate accurate values ONLY for these specific attributes: ${existingAttrNames.join(', ')}

Rules:
- Return ONLY the attributes listed above
- Format: "attributeName: actualValue"
- Each pair on a new line
- Use REAL specifications for the specific product mentioned
- Be as accurate as possible to the actual product
- If an attribute doesn't apply, use "N/A"
- No explanations or extra text

Example format:
Processor: Intel Core i7-12700H
RAM: 16GB DDR4
Storage: 512GB NVMe SSD`
          }]
        }]
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const generatedText = response.data.candidates[0].content.parts[0].text
      const lines = generatedText.split('\n')
      const aiAttributes = {}
      
      lines.forEach(line => {
        const trimmedLine = line.trim()
        if (trimmedLine && trimmedLine.includes(':')) {
          const [key, ...valueParts] = trimmedLine.split(':')
          const value = valueParts.join(':').trim().replace(/\s+/g, '')
          if (key.trim() && value && existingAttrNames.includes(key.trim())) {
            aiAttributes[key.trim()] = value
          }
        }
      })
      
      // Merge with existing attributes
      const finalAttributes = { ...existingAttributes, ...aiAttributes }
      
      setFormData(prev => ({
        ...prev,
        attributes: {
          ...prev.attributes,
          ...finalAttributes
        }
      }))
      
      setShowAIPrompt(false)
      setAiPrompt('')
      toast.success(`Generated values for ${Object.keys(aiAttributes).length} attributes based on product details`)
    } catch (error) {
      console.error('Error generating AI attributes:', error)
      if (error.response?.status === 429) {
        toast.error('Rate limit exceeded. Please wait a moment and try again.')
      } else if (error.response?.status === 400) {
        toast.error('Invalid API key. Please check your Gemini API key.')
      } else {
        toast.error('Failed to generate attributes. Please try again.')
      }
    } finally {
      setIsGenerating(false)
    }
  }



  return (
    <motion.div 
      className="max-w-4xl mx-auto px-4 sm:px-6"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-gray-600 text-sm mt-1">Add a new product to your inventory</p>
        </div>
        <motion.button 
          onClick={() => navigate('/products')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 whitespace-nowrap"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Products
        </motion.button>
      </div>
      
      <motion.div 
        className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
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
              onChange={(e) => handleCategoryChange(e.target.value)}
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
            <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Attributes</h4>
            
            {showBulkInput ? (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Bulk Add Attributes (one per line, format: key: value)
                </label>
                <textarea
                  value={bulkAttributes}
                  onChange={(e) => setBulkAttributes(e.target.value)}
                  placeholder={`socketType: AM4\nramType: DDR4\npcieVersion: 4.0\nformFactor: ATX`}
                  className="w-full px-3 py-2 border border-blue-300 rounded focus:outline-none focus:border-blue-500 h-24 text-sm"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={addBulkAttributes}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    Add All
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAttributes('')}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBulkInput(false)}
                    className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    Single Add
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
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
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 whitespace-nowrap"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkInput(true)}
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 whitespace-nowrap"
                >
                  Bulk Add
                </button>
                <button
                  type="button"
                  onClick={() => setShowAIPrompt(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded hover:from-green-600 hover:to-blue-600 whitespace-nowrap"
                >
                  ✨ Gemini AI
                </button>
              </div>
            )}

            {showAIPrompt && (
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded">
                <label className="block text-sm font-medium text-green-700 mb-2">
                  🤖 Enter product name, model, or link for accurate AI-generated attributes
                </label>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="e.g., ASUS ROG Strix G15 G513QM, Dell XPS 13 9310, or product URL"
                  className="w-full px-3 py-2 border border-green-300 rounded focus:outline-none focus:border-green-500 text-sm mb-2"
                  disabled={isGenerating}
                />
                <p className="text-xs text-green-600 mb-3">💡 Tip: Paste a product link or specific model name for most accurate specifications</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generateAIAttributes}
                    disabled={isGenerating}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded hover:from-green-700 hover:to-blue-700 text-sm disabled:opacity-50"
                  >
                    {isGenerating ? '🔄 Generating...' : '✨ Generate Attributes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiPrompt('')}
                    className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    disabled={isGenerating}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAIPrompt(false)}
                    className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    disabled={isGenerating}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {Object.keys(formData.attributes).length > 0 && (
              <div className="mb-2">
                <p className="text-xs text-gray-500">{Object.keys(formData.attributes).length} attributes added</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.entries(formData.attributes).map(([key, value]) => {
                const isBackendAttribute = backendAttributes.includes(key)
                return (
                  <div key={key} className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-200 rounded">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">{key}</label>
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setFormData({
                          ...formData,
                          attributes: {
                            ...formData.attributes,
                            [key]: e.target.value
                          }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        placeholder={`Enter ${key.toLowerCase()}`}
                      />
                    </div>
                    {!isBackendAttribute && (
                      <button
                        type="button"
                        onClick={() => removeAttribute(key)}
                        className="text-red-600 hover:text-red-800 text-xs whitespace-nowrap mt-4"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-4">
            <motion.button 
              type="submit" 
              className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Product
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default AddProduct