import React from 'react'

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'categories', label: 'Categories' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'dashboard', label: 'Dashboard' }
  ]

  return (
    <div className="w-64 h-screen bg-gray-800 text-white fixed left-0 top-0 shadow-lg ">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white m-0">
          Computer Shop
        </h2>
        <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
      </div>
      
      <nav className="py-4">
        {menuItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mx-4 my-1 px-4 py-3 cursor-pointer rounded text-sm ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white font-medium' 
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>
      
      <div className="absolute bottom-4 left-4 right-4 p-3 bg-gray-700 rounded text-center">
        <p className="text-xs text-gray-400 m-0">v1.0.0</p>
      </div>
    </div>
  )
}

export default Sidebar