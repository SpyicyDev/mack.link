export function StatCard({ icon: Icon, title, value, subtitle, color }) {
  const safeColor = color || 'text-gray-600 dark:text-gray-400'

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 p-4 xs:p-5 sm:p-6 transition-colors h-full">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 p-1.5 sm:p-2 rounded-lg ${
            safeColor.includes('blue')
              ? 'bg-blue-50 dark:bg-blue-900/20'
              : safeColor.includes('green')
                ? 'bg-green-50 dark:bg-green-900/20'
                : safeColor.includes('purple')
                  ? 'bg-purple-50 dark:bg-purple-900/20'
                  : safeColor.includes('orange')
                    ? 'bg-orange-50 dark:bg-orange-900/20'
                    : 'bg-gray-50 dark:bg-gray-900/20'
          }`}
        >
          <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${safeColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] xs:text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            {title}
          </p>
          <p className="text-xl xs:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs xs:text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
