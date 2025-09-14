import { Link as LinkIcon, BarChart3 } from 'lucide-react'

export function BottomNav({ currentView, setCurrentView }) {
  return (
    <nav
      className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-t border-gray-200 dark:border-gray-700 pb-safe"
      role="navigation"
      aria-label="Primary"
    >
      <div className="grid grid-cols-2 h-20">
        <button
          type="button"
          onClick={() => setCurrentView('links')}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 touch-target ${
            currentView === 'links'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          aria-current={currentView === 'links' ? 'page' : undefined}
          aria-label="Links"
        >
          <LinkIcon className={`w-6 h-6 mb-1.5 transition-transform ${currentView === 'links' ? 'scale-110' : ''}`} />
          <span className={`text-xs font-medium ${currentView === 'links' ? 'font-semibold' : ''}`}>Links</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('analytics')}
          className={`flex flex-col items-center justify-center h-full transition-all duration-200 touch-target ${
            currentView === 'analytics'
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
              : 'text-gray-600 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
          }`}
          aria-current={currentView === 'analytics' ? 'page' : undefined}
          aria-label="Analytics"
        >
          <BarChart3 className={`w-6 h-6 mb-1.5 transition-transform ${currentView === 'analytics' ? 'scale-110' : ''}`} />
          <span className={`text-xs font-medium ${currentView === 'analytics' ? 'font-semibold' : ''}`}>Analytics</span>
        </button>
      </div>
    </nav>
  )
}
