import { Link as LinkIcon, BarChart3 } from 'lucide-react'

export function BottomNav({ currentView, setCurrentView }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 pb-safe"
      role="navigation"
      aria-label="Primary"
    >
      <div className="grid grid-cols-2 h-14">
        <button
          type="button"
          onClick={() => setCurrentView('links')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentView === 'links'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          aria-current={currentView === 'links' ? 'page' : undefined}
          aria-label="Links"
        >
          <LinkIcon className="w-5 h-5" />
          <span className="text-xs mt-0.5 font-medium">Links</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center justify-center h-full transition-colors ${
            currentView === 'analytics'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100'
          }`}
          aria-current={currentView === 'analytics' ? 'page' : undefined}
          aria-label="Analytics"
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-xs mt-0.5 font-medium">Analytics</span>
        </button>
      </div>
    </nav>
  )
}
