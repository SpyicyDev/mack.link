import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../providers/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme, setLightTheme, setDarkTheme, setSystemTheme, isDark } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getCurrentIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />
    if (theme === 'light') return <Sun className="w-4 h-4" />
    return <Monitor className="w-4 h-4" />
  }

  const getCurrentLabel = () => {
    if (theme === 'dark') return 'Dark'
    if (theme === 'light') return 'Light'
    return 'System'
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-md transition-colors border
          ${isDark 
            ? 'text-gray-300 hover:text-white hover:bg-gray-700 border-gray-600' 
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-300'
          }
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
        `}
        aria-label={`Current theme: ${getCurrentLabel()}. Click to change theme`}
        title="Toggle theme"
      >
        {getCurrentIcon()}
      </button>

      {isOpen && (
        <div 
          className={`
            absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50
            ${isDark ? 'bg-gray-800 ring-gray-700' : 'bg-white'}
          `}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                setLightTheme()
                setIsOpen(false)
              }}
              className={`
                flex items-center w-full px-4 py-2 text-sm transition-colors
                ${theme === 'light' 
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }
              `}
              role="menuitem"
            >
              <Sun className="w-4 h-4 mr-3" />
              Light
              {theme === 'light' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
            <button
              onClick={() => {
                setDarkTheme()
                setIsOpen(false)
              }}
              className={`
                flex items-center w-full px-4 py-2 text-sm transition-colors
                ${theme === 'dark' 
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }
              `}
              role="menuitem"
            >
              <Moon className="w-4 h-4 mr-3" />
              Dark
              {theme === 'dark' && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
            <button
              onClick={() => {
                setSystemTheme()
                setIsOpen(false)
              }}
              className={`
                flex items-center w-full px-4 py-2 text-sm transition-colors
                ${!localStorage.getItem('theme') 
                  ? (isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900')
                  : (isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100')
                }
              `}
              role="menuitem"
            >
              <Monitor className="w-4 h-4 mr-3" />
              System
              {!localStorage.getItem('theme') && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Simple toggle button version for space-constrained areas
export function SimpleThemeToggle() {
  const { toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        p-2 rounded-md transition-colors
        ${isDark 
          ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${isDark ? 'focus:ring-offset-gray-800' : 'focus:ring-offset-white'}
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  )
}