'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="nav">
      <Link 
        href="/draft" 
        className={pathname === '/draft' ? 'btn btn-primary' : 'btn'}
        style={{ textDecoration: 'none' }}
      >
        <span>🏈</span>
        <span>Draft Assistant</span>
      </Link>
      <div className="nav-center">Fantasyzer</div>
      <Link 
        href="/" 
        className={pathname === '/' ? 'btn btn-primary' : 'btn'}
        style={{ textDecoration: 'none' }}
      >
        <span>📊</span>
        <span>Weekly Rankings</span>
      </Link>
    </nav>
  )
}
