import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation()
  
  const menuItems = [
    { id: 'categories', label: 'Categories', path: '/categories' },
    { id: 'products', label: 'Products', path: '/products' },
    { id: 'orders', label: 'Orders', path: '/orders' },
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' }
  ]

  return (
    <motion.div 
      className={`sidebar ${isOpen ? 'w-64' : 'w-16'} h-screen bg-gray-800 text-white fixed left-0 top-0 shadow-lg transition-all duration-300`}
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div className={`${isOpen ? 'block' : 'hidden'}`}>
          <h2 className="text-xl font-bold text-white m-0">
            Computer Shop
          </h2>
          <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <div className="w-5 h-5 flex flex-col justify-center space-y-1">
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
            <div className="w-full h-0.5 bg-white"></div>
          </div>
        </button>
      </div>
      
      <nav className="py-4">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
          >
            <Link
              to={item.path}
              className={`flex items-center mx-2 my-1 px-3 py-3 rounded text-sm ${
                location.pathname === item.path
                  ? 'bg-blue-600 text-white font-medium' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              title={!isOpen ? item.label : ''}
            >
              <span className="w-5 h-5 flex-shrink-0">
                {item.id === 'categories' && '📁'}
                {item.id === 'products' && '📦'}
                {item.id === 'orders' && '📋'}
                {item.id === 'dashboard' && '📊'}
              </span>
              {isOpen && <span className="ml-3">{item.label}</span>}
            </Link>
          </motion.div>
        ))}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-700 rounded text-center">
        <p className="text-xs text-gray-400 m-0">v1.0.0</p>
      </div>
    </motion.div>
  )
}

export default Sidebar