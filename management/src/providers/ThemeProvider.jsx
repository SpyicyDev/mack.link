import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext()

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      // Check localStorage first
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme
      }
      
      // Check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      
      return 'light'
    } catch (error) {
      // Fallback if localStorage is not available
      return 'light'
    }
  })

  useEffect(() => {
    // Apply theme to document immediately
    const root = document.documentElement
    
    // Remove both classes first to ensure clean state
    root.classList.remove('light', 'dark')
    
    // Add the current theme class
    root.classList.add(theme)

    // Save to localStorage only if it's a valid theme
    try {
      if (theme === 'light' || theme === 'dark') {
        localStorage.setItem('theme', theme)
      }
    } catch (error) {
      // Handle localStorage errors gracefully
      console.warn('Could not save theme to localStorage:', error)
    }
  }, [theme])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark')
  }

  const setLightTheme = () => {
    setTheme('light')
  }
  
  const setDarkTheme = () => {
    setTheme('dark')
  }
  
  const setSystemTheme = () => {
    try {
      localStorage.removeItem('theme')
    } catch (error) {
      console.warn('Could not remove theme from localStorage:', error)
    }
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(systemTheme)
  }

  const value = {
    theme,
    toggleTheme,
    setLightTheme,
    setDarkTheme,
    setSystemTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}