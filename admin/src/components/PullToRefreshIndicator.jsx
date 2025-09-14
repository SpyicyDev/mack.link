import { RefreshCw } from 'lucide-react'

export function PullToRefreshIndicator({ 
  isVisible, 
  isRefreshing, 
  pullDistance, 
  threshold = 60 
}) {
  if (!isVisible && !isRefreshing) return null

  const progress = Math.min(pullDistance / threshold, 1)
  const rotation = progress * 360

  return (
    <div 
      className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-200 ease-out"
      style={{
        transform: `translate(-50%, ${isRefreshing ? '0' : '-100%'})`,
        opacity: isRefreshing ? 1 : Math.min(progress, 0.8)
      }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg border border-gray-200 dark:border-gray-700">
        <RefreshCw 
          className={`w-6 h-6 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          style={{
            transform: isRefreshing ? '' : `rotate(${rotation}deg)`
          }}
        />
      </div>
    </div>
  )
}