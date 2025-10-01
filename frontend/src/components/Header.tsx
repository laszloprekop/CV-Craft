import React from 'react'
import { useLocation } from 'react-router-dom'

export const Header: React.FC = () => {
  const location = useLocation()
  
  return (
    <header className="bg-primary border-b border-primary-hover px-4 py-3 flex items-center justify-between">
      <h1 className="text-lg font-bold text-text-inverse m-0">
        CV Generator
      </h1>
      <nav className="flex gap-4 items-center">
        <a 
          href="/" 
          className={`text-sm font-medium transition-colors ${
            location.pathname === '/' 
              ? 'text-text-inverse' 
              : 'text-text-inverse/70 hover:text-text-inverse'
          }`}
        >
          My CVs
        </a>
        <a 
          href="/editor" 
          className={`text-sm font-medium transition-colors ${
            location.pathname.includes('/editor') 
              ? 'text-text-inverse' 
              : 'text-text-inverse/70 hover:text-text-inverse'
          }`}
        >
          Editor
        </a>
      </nav>
    </header>
  )
}