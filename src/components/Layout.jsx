import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Sidebar from './Sidebar'
import Header from './Header'
import './layout.css'

export default function Layout({ title, children }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#05070d]">
      {/* Mobile Backdrop */}
      <div 
        className={`vanguard-mobile-backdrop ${isMobileOpen ? 'is-open' : ''}`}
        onClick={() => setIsMobileOpen(false)}
        aria-hidden={!isMobileOpen}
      />

      {/* Sidebar */}
      <Sidebar isMobileOpen={isMobileOpen} setIsMobileOpen={setIsMobileOpen} />

      {/* Main Content Area */}
      <div className="lg:ml-[250px] min-h-screen flex flex-col transition-all duration-300">
        {/* Header */}
        <Header 
          title={title} 
          onMenuClick={() => setIsMobileOpen(true)} 
        />

        {/* Page Content */}
        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 p-4 sm:p-6 lg:p-8"
        >
          <div className="max-w-[1400px] mx-auto">
            {children || <Outlet />}
          </div>
        </motion.main>
      </div>
    </div>
  )
}
