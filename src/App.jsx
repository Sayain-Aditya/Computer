import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Category from "./Category";
import Product from "./Product";
import Order from "./Order";
import AddProduct from "./pages/AddProduct";
import EditProduct from "./pages/EditProduct";
import CreateOrder from "./pages/CreateOrder";
import Quotation from "./pages/Quotation";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <Router>
      <div className="flex bg-gray-50 min-h-screen">
        <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
        <div className={`${sidebarOpen ? 'ml-64' : 'ml-16'} w-full p-4 transition-all duration-300`}>
          <Routes>
            <Route path="/" element={<Navigate to="/categories" replace />} />
            <Route path="/categories" element={<Category />} />
            <Route path="/products" element={<Product />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/edit-product/:id" element={<EditProduct />} />
            <Route path="/orders" element={<Order />} />
            <Route path="/create-order" element={<CreateOrder />} />
            <Route path="/quotation" element={<Quotation />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App;