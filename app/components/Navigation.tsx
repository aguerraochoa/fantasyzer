'use client'

interface NavigationProps {
  onToggleSidebar: () => void
}

export default function Navigation({ onToggleSidebar }: NavigationProps) {
  return (
    <nav className="nav">
      <div className="nav-left">
        <button
          className="hamburger-btn mobile-only"
          onClick={onToggleSidebar}
          aria-label="Open menu"
        >
          ☰
        </button>
      </div>

      <div className="nav-center">Fantasyzer</div>

      <div className="nav-right">
        {/* Placeholder for right side if needed (e.g. user profile) */}
      </div>
    </nav>
  )
}
