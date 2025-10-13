import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const BulkImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [step, setStep] = useState(1);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories/all');
      const data = Array.isArray(response.data) ? response.data : 
                   (response.data?.categories || response.data?.data || []);
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel') {
        setFile(selectedFile);
        setResults(null);
      } else {
        toast.error('Please select a valid Excel file (.xlsx or .xls)');
        e.target.value = '';
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/bulk-import/template', {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'product-import-template.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download template');
    }
  };

  const handleUpload = async () => {
    if (!selectedCategory) {
      toast.error('Please select a category first');
      return;
    }
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('excelFile', file);
    formData.append('categoryId', selectedCategory);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/bulk-import/products',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setResults(response.data.data);
      setSelectedProducts([]);
      toast.success(response.data.message);
      setFile(null);
      document.getElementById('fileInput').value = '';
      setStep(3);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to import products');
    } finally {
      setUploading(false);
    }
  };

  const handleProductSelect = (index, checked) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, results.success[index].productData]);
    } else {
      setSelectedProducts(selectedProducts.filter((_, i) => i !== selectedProducts.findIndex(p => p.name === results.success[index].productData.name)));
    }
  };

  const createSelectedProductsHandler = async () => {
    if (!selectedProducts.length) {
      toast.error('Please select products to create');
      return;
    }

    setCreating(true);
    try {
      const response = await axios.post('http://localhost:5000/api/bulk-import/create', {
        selectedProducts
      });
      toast.success(response.data.message);
      setStep(1);
      setResults(null);
      setSelectedProducts([]);
      setSelectedCategory('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create products');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-4 sm:p-8 border border-blue-200">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-gray-800">Bulk Product Import</h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Step {step}: {step === 1 ? 'Select Category' : step === 2 ? 'Upload Excel File' : 'Review Results'}
          </p>
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <motion.div 
          className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">📁 Select Product Category</h2>
          <p className="text-gray-600 mb-6">Choose the category for the products you want to import</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <motion.div
                key={category._id}
                onClick={() => {
                  setSelectedCategory(category._id);
                  setStep(2);
                }}
                className="p-4 border-2 rounded-xl cursor-pointer transition-all border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-medium text-gray-800">{category.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{category.description || 'No description'}</p>
              </motion.div>
            ))}
          </div>
          
          {categories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No categories found. Please create categories first.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Step 2: File Upload */}
      {step === 2 && (
        <motion.div 
          className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📦 Upload Products for: {categories.find(c => c._id === selectedCategory)?.name}</h2>
            <button 
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-800"
            >
              Change Category
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            <motion.button
              onClick={downloadTemplate}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md"
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
            >
              📥 Download Template
            </motion.button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <div className="mb-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            
            <input
              id="fileInput"
              type="file"
              accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <label htmlFor="fileInput" className="cursor-pointer">
              <span className="text-lg font-medium text-gray-700">
                {file ? file.name : 'Choose Excel file or drag and drop'}
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Supports .xlsx and .xls files up to 10MB
              </p>
            </label>
          </div>

          {file && (
            <motion.div 
              className="mt-6 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.button
                onClick={handleUpload}
                disabled={uploading}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={!uploading ? { scale: 1.02, y: -1 } : {}}
                whileTap={!uploading ? { scale: 0.98 } : {}}
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  '🚀 Import Products'
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Step 3: Results */}
      {step === 3 && results && (
        <motion.div 
          className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">📊 Product Preview</h2>
            <div className="flex gap-2">
              <button 
                onClick={createSelectedProductsHandler}
                disabled={creating || !selectedProducts.length}
                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50"
              >
                {creating ? 'Creating...' : `Create ${selectedProducts.length} Selected`}
              </button>
              <button 
                onClick={() => { setStep(1); setResults(null); setSelectedCategory(''); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Import More
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{results.total}</div>
              <div className="text-sm text-blue-700">Total Rows</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{results.success.length}</div>
              <div className="text-sm text-green-700">Successfully Imported</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{results.errors.length}</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
          </div>

          {results.success.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-blue-700 mb-3">📎 Product Preview - Select to Add</h3>
              <div className="bg-blue-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {results.success.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-blue-200 last:border-b-0">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        onChange={(e) => handleProductSelect(index, e.target.checked)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <div>
                        <div className="text-sm font-medium text-blue-800">{item.name}</div>
                        <div className="text-xs text-blue-600">₹{item.productData.sellingRate} • {item.attributesAdded} AI attributes</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate('/add-product', { state: { productData: item.productData, isEdit: true } })}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {results.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-red-700 mb-3">❌ Import Errors</h3>
              <div className="bg-red-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                {results.errors.map((error, index) => (
                  <div key={index} className="py-2 border-b border-red-200 last:border-b-0">
                    <div className="text-sm text-red-800">
                      <strong>Row {error.row}:</strong> {error.error}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default BulkImport;