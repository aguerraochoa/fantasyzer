'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

export default function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const pathname = usePathname()

  // Close sidebar when route changes on mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        // Ensure sidebar is "closed" in terms of mobile overlay when resizing to desktop
        // (Though desktop sidebar is always visible via CSS, this clears mobile state)
        onClose()
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [onClose])

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header mobile-only">
          <div className="sidebar-brand">Fantasyzer</div>
          <button className="sidebar-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Navigation Links */}
        <div className="sidebar-section">
          <h4 className="sidebar-section-title">Navigation</h4>
          <nav className="sidebar-nav">
            <Link 
              href="/" 
              className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📊</span>
              Weekly Rankings
            </Link>
            <Link 
              href="/draft" 
              className={`sidebar-link ${pathname === '/draft' ? 'active' : ''}`}
            >
              <span className="sidebar-icon">📝</span>
              Draft Assistant
            </Link>
          </nav>
        </div>

        {/* Separator */}
        <div className="sidebar-divider" />

        {/* Page Specific Content (League Setup, etc) */}
        <div className="sidebar-content">
          {children}
        </div>
      </aside>
    </>
  )
}
