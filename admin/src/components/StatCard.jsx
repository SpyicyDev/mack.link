export function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const safeColor = color || 'text-gray-600 dark:text-gray-400';
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 p-4 xs:p-5 sm:p-6 transition-colors">
      <div className="flex items-start">
        <div className={`flex-shrink-0 p-2 xs:p-2.5 sm:p-2 rounded-lg ${safeColor.includes('blue') ? 'bg-blue-50 dark:bg-blue-900/20' : 
          safeColor.includes('green') ? 'bg-green-50 dark:bg-green-900/20' : 
          safeColor.includes('purple') ? 'bg-purple-50 dark:bg-purple-900/20' : 
          safeColor.includes('orange') ? 'bg-orange-50 dark:bg-orange-900/20' : 
          'bg-gray-50 dark:bg-gray-900/20'}`}>
          <Icon className={`w-4 h-4 xs:w-5 xs:h-5 sm:w-5 sm:h-5 ${safeColor}`} />
        </div>
        <div className="ml-3 xs:ml-4 sm:ml-4 flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-xl xs:text-2xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
