import React from 'react'

const ProductPreview = ({ scrapedData, onConfirm, onCancel }) => {
  if (!scrapedData) return null

  const filterAttributes = (attributes) => {
    return Object.entries(attributes).filter(([key, value]) => {
      const cleanKey = key.trim()
      const cleanValue = value.trim()
      return cleanKey.length > 2 && 
             cleanValue.length > 1 && 
             !cleanKey.includes('cm') &&
             !cleanKey.includes('kg') &&
             cleanKey !== cleanValue
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Preview Extracted Data</h3>
        
        <div className="space-y-3 mb-6">
          {scrapedData.name && (
            <div>
              <label className="text-sm font-medium text-gray-600">Product Name:</label>
              <p className="text-gray-800">{scrapedData.name}</p>
            </div>
          )}
          
          {scrapedData.brand && (
            <div>
              <label className="text-sm font-medium text-gray-600">Brand:</label>
              <p className="text-gray-800">{scrapedData.brand}</p>
            </div>
          )}
          
          {scrapedData.modelNumber && (
            <div>
              <label className="text-sm font-medium text-gray-600">Model Number:</label>
              <p className="text-gray-800">{scrapedData.modelNumber}</p>
            </div>
          )}
          
          {scrapedData.sellingRate && (
            <div>
              <label className="text-sm font-medium text-gray-600">Price:</label>
              <p className="text-gray-800">₹{scrapedData.sellingRate}</p>
            </div>
          )}
          
          {scrapedData.attributes && Object.keys(scrapedData.attributes).length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">All Specifications:</label>
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {Object.entries(scrapedData.attributes).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-2 rounded text-sm">
                    <span className="font-medium">{key}:</span> {value}
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {Object.keys(scrapedData.attributes).length} attributes found - All will be added for compatibility matching
              </p>
            </div>
          )}
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Use This Data
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProductPreview