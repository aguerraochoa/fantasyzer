'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

export default function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleMobileNavigation = (e: React.MouseEvent, href: string) => {
    if (window.innerWidth <= 768) {
      e.preventDefault()
      onClose()
      setTimeout(() => {
        router.push(href)
      }, 300)
    }
  }

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
        {/* Header - Brand & Close Button */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span>Fantasyzer</span>
          </div>
          <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">
            ✕
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div className="sidebar-section">
            <h4 className="sidebar-section-title">Navigation</h4>
            <nav className="sidebar-nav">
              <Link
                href="/"
                className={`sidebar-link ${pathname === '/' ? 'active' : ''}`}
                onClick={(e) => handleMobileNavigation(e, '/')}
              >
                <span className="sidebar-icon">📊</span>
                <span>Weekly Rankings</span>
              </Link>
              <Link
                href="/draft"
                className={`sidebar-link ${pathname === '/draft' ? 'active' : ''}`}
                onClick={(e) => handleMobileNavigation(e, '/draft')}
              >
                <span className="sidebar-icon">📝</span>
                <span>Draft Assistant</span>
              </Link>
            </nav>
          </div>

          <div className="sidebar-divider" style={{ background: 'rgba(255,255,255,0.1)', height: '1px', margin: '0' }} />

          <div style={{ flex: 1 }}>
            {children}
          </div>
        </div>


      </aside>
    </>
  )
}
