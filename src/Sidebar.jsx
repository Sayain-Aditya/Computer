import React from 'react'

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'categories', label: '📁 Categories' },
    { id: 'products', label: '📦 Products' },
    { id: 'orders', label: '🛒 Orders' },
    { id: 'dashboard', label: '📊 Dashboard' }
  ]

  return (
    <div className="w-72 h-screen bg-gradient-to-br from-blue-800 to-slate-900 text-white fixed left-0 top-0 shadow-2xl backdrop-blur-lg">
      <div className="p-8 border-b border-cyan-500/20">
        <h2 className="text-2xl font-bold text-cyan-400 m-0">
          💻 Computer Shop
        </h2>
        <p className="text-slate-400 text-sm mt-1">Admin Panel</p>
      </div>
      
      <nav className="py-5">
        {menuItems.map(item => (
          <div
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`mx-5 my-2 px-5 py-4 cursor-pointer rounded-xl transition-all duration-300 text-base ${
              activeTab === item.id 
                ? 'bg-cyan-500/20 border border-cyan-400 font-semibold text-cyan-400 transform translate-x-1' 
                : 'border border-transparent font-normal text-slate-300 hover:bg-cyan-500/10 hover:translate-x-1'
            }`}
          >
            {item.label}
          </div>
        ))}
      </nav>
      
      <div className="absolute bottom-5 left-5 right-5 p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
        <p className="text-xs text-slate-400 text-center m-0">v1.0.0</p>
      </div>
    </div>
  )
}

export default Sidebar