import { Link as LinkIcon, LogOut, Moon, Sun } from 'lucide-react'
import { authService } from '../services/auth'
import { useTheme } from '../providers/ThemeProvider'

export function Header() {
  const user = authService.getUser();
  const { theme, toggleTheme } = useTheme()
  
  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700/50 transition-colors" role="banner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-4 sm:py-6">
          <div className="flex items-center min-w-0">
            <LinkIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 mr-3" aria-hidden="true" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">link.mackhaymond.co</h1>
              <p className="hidden sm:block text-sm text-gray-600 dark:text-gray-300">URL Shortener Management</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {user && (
              <nav className="flex items-center space-x-4" role="navigation" aria-label="User menu">
                <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300" role="status" aria-live="polite">
                  <img 
                    src={user.avatar_url} 
                    alt={`${user.login}'s profile picture`}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="truncate max-w-[10rem] sm:max-w-none">Welcome, {user.login}!</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 rounded"
                  aria-label={`Sign out of ${user.login}'s account`}
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}