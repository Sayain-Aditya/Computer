import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import axios from 'axios'
import { formatIndianCurrency } from '../utils/formatters'

const CompatibilityCheck = ({ selectedProducts, onAddProduct, categories, products }) => {
  const [compatibleProducts, setCompatibleProducts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedProducts.length > 0) {
      fetchCompatibleProducts()
    } else {
      setCompatibleProducts([])
    }
  }, [selectedProducts])

  const fetchCompatibleProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching sequential compatible products for selected items:', selectedProducts.map(p => p._id))
      
      const selectedProductIds = selectedProducts.map(item => item._id)
      const response = await axios.post('https://computer-shop-backend-five.vercel.app/api/products/compatibility/sequential', {
        selectedProducts: selectedProductIds
      })
      
      console.log('Sequential compatibility API response:', response.data)
      
      let compatibleData = response.data.compatibleProducts || []
      console.log('Raw compatible products from backend:', compatibleData.length)
      
      // Merge with complete product data from products API
      compatibleData = compatibleData.map(compatibleProduct => {
        const fullProduct = products.find(p => p._id === compatibleProduct._id)
        if (fullProduct) {
          return {
            ...compatibleProduct,
            sellingRate: fullProduct.sellingRate,
            quantity: fullProduct.quantity,
            brand: fullProduct.brand,
            category: fullProduct.category,
            attributes: fullProduct.attributes
          }
        }
        return compatibleProduct
      })
      
      console.log('Compatible products after merging with full data:', compatibleData.length)
      
      // Filter out products from categories already selected
      const selectedCategories = selectedProducts.map(item => item.category?._id).filter(Boolean)
      console.log('Already selected categories:', selectedCategories)
      
      compatibleData = compatibleData.filter(product => 
        !selectedCategories.includes(product.category?._id)
      )
      
      console.log('Compatible products after filtering:', compatibleData.length)
      setCompatibleProducts(compatibleData)
      
      if (compatibleData.length === 0) {
        toast.info('No compatible products found')
      }
    } catch (error) {
      console.error('Error fetching compatible products:', error)
      setCompatibleProducts([])
      toast.error('Failed to fetch compatible products')
    } finally {
      setLoading(false)
    }
  }

  if (selectedProducts.length === 0) {
    return null
  }

  return (
    <div className="compatible-products-section bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-lg mb-6">
      <h3 className="text-xl font-bold text-blue-900 p-6 border-b border-blue-200 flex items-center">
        <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
        🔗 Compatible Products
      </h3>
      
      {loading ? (
        <div className="p-6 text-center">
          <div className="text-blue-600">Loading compatible products...</div>
        </div>
      ) : (
        <div className="p-4">
          {compatibleProducts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No compatible products found</div>
            </div>
          ) : (
            Object.entries(
              compatibleProducts.reduce((acc, product) => {
                const categoryName = product.category?.name || 
                  categories?.find(cat => cat._id === product.category?._id)?.name || 
                  'Uncategorized'
                if (!acc[categoryName]) acc[categoryName] = []
                acc[categoryName].push(product)
                return acc
              }, {})
            ).map(([categoryName, products]) => (
              <div key={categoryName} className="mb-6">
                <h4 className="font-semibold text-gray-700 text-sm mb-3 border-b pb-2">{categoryName}</h4>
                <div className="space-y-3">
                  {products.map((product) => (
                    <div key={product._id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-white border border-blue-200 rounded-xl hover:shadow-md hover:border-blue-300 transition-all duration-200">
                      <div className="flex-1 mb-3 sm:mb-0">
                        <p className="font-semibold text-sm text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-600 mt-1">
                          {product.brand || 'N/A'} • {formatIndianCurrency(product.sellingRate || 0)} • Stock: {product.quantity || 0}
                        </p>
                      </div>
                      <motion.button
                        onClick={() => onAddProduct(product)}
                        disabled={!product.quantity || product.quantity === 0}
                        className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 shadow-sm"
                        whileHover={{ scale: (!product.quantity || product.quantity === 0) ? 1 : 1.02 }}
                        whileTap={{ scale: (!product.quantity || product.quantity === 0) ? 1 : 0.98 }}
                      >
                        {!product.quantity || product.quantity === 0 ? '❌ Out of Stock' : '➕ Add'}
                      </motion.button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default CompatibilityCheck