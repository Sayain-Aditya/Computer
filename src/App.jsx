import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Category from "./Ctaegory";
import Product from "./Product";
import Order from "./Order";

function App() {
  const [activeTab, setActiveTab] = useState('categories')

  const renderContent = () => {
    switch(activeTab) {
      case 'categories':
        return <Category />
      case 'products':
        return <Product />
      case 'orders':
        return <Order />
      default:
        return <div className="p-5 text-center text-slate-500">Coming Soon...</div>
    }
  }

  return (
    <div className="flex bg-gradient-to-br from-sky-50 via-cyan-50 to-cyan-100 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="ml-72 w-full p-5">
        {renderContent()}
      </div>
    </div>
  )
}

export default App;