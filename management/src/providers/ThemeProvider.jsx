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
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      return savedTheme || 'system'
    } catch {
      return 'system'
    }
  })
  
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('theme')
      if (savedTheme === 'light') return 'light'
      if (savedTheme === 'dark') return 'dark'
      
      // For 'system' or no saved theme, use system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
      
      return 'light'
    } catch {
      // Fallback if localStorage is not available
      return 'light'
    }
  })

  useEffect(() => {
    // Apply theme to document immediately
    const root = document.documentElement
    
    // Tailwind CSS only uses 'dark' class - remove it for light mode, add it for dark mode
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }

    // Save themeMode to localStorage
    try {
      localStorage.setItem('theme', themeMode)
    } catch (error) {
      // Handle localStorage errors gracefully
      console.warn('Could not save theme to localStorage:', error)
    }
  }, [theme, themeMode])

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      // Only update if using system theme
      if (themeMode === 'system') {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themeMode])

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    setThemeMode(nextTheme)
  }

  const setLightTheme = () => {
    setTheme('light')
    setThemeMode('light')
  }
  
  const setDarkTheme = () => {
    setTheme('dark')
    setThemeMode('dark')
  }
  
  const setSystemTheme = () => {
    setThemeMode('system')
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    setTheme(systemTheme)
  }

  const value = {
    theme,
    themeMode,
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