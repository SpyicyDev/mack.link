import { useMemo } from 'react'
import { BarChart3, TrendingUp, Clock, Globe } from 'lucide-react'

export function Analytics({ links }) {
  const analytics = useMemo(() => {
    const linkEntries = Object.entries(links)
    
    if (linkEntries.length === 0) {
      return {
        totalLinks: 0,
        totalClicks: 0,
        averageClicks: 0,
        topLinks: [],
        recentLinks: [],
        clicksToday: 0
      }
    }

    const totalLinks = linkEntries.length
    const totalClicks = linkEntries.reduce((sum, [, link]) => sum + (link.clicks || 0), 0)
    const averageClicks = Math.round(totalClicks / totalLinks * 100) / 100

    // Get top 5 most clicked links
    const topLinks = linkEntries
      .sort(([, a], [, b]) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map(([shortcode, link]) => ({
        shortcode,
        url: link.url,
        clicks: link.clicks || 0,
        description: link.description
      }))

    // Get 5 most recent links
    const recentLinks = linkEntries
      .sort(([, a], [, b]) => new Date(b.created) - new Date(a.created))
      .slice(0, 5)
      .map(([shortcode, link]) => ({
        shortcode,
        url: link.url,
        clicks: link.clicks || 0,
        created: link.created,
        description: link.description
      }))

    // Simple clicks today calculation (this would be more accurate with proper timestamp tracking)
    const today = new Date().toDateString()
    const clicksToday = linkEntries.reduce((sum, [, link]) => {
      if (link.lastClicked && new Date(link.lastClicked).toDateString() === today) {
        return sum + 1 // This is simplified - in reality you'd track individual clicks
      }
      return sum
    }, 0)

    return {
      totalLinks,
      totalClicks,
      averageClicks,
      topLinks,
      recentLinks,
      clicksToday
    }
  }, [links])

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const StatCard = ({ icon: Icon, title, value, subtitle, color = "text-gray-600 dark:text-gray-400" }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 p-6 transition-colors">
      <div className="flex items-center">
        <div className={`flex-shrink-0 ${color}`}>
          <Icon className="w-8 h-8" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{title}</dt>
            <dd className="text-2xl font-bold text-gray-900 dark:text-white">{value}</dd>
            {subtitle && (
              <dd className="text-sm text-gray-600 dark:text-gray-300">{subtitle}</dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Globe}
          title="Total Links"
          value={analytics.totalLinks}
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={BarChart3}
          title="Total Clicks"
          value={analytics.totalClicks.toLocaleString()}
          color="text-green-600 dark:text-green-400"
        />
        <StatCard
          icon={TrendingUp}
          title="Average Clicks"
          value={analytics.averageClicks}
          subtitle="per link"
          color="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          icon={Clock}
          title="Clicks Today"
          value={analytics.clicksToday}
          subtitle="estimated"
          color="text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Top Performing Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
              Top Performing Links
            </h3>
          </div>
          <div className="p-6">
            {analytics.topLinks.length > 0 ? (
              <div className="space-y-4">
                {analytics.topLinks.map((link, index) => (
                  <div key={link.shortcode} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white rounded-full ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-yellow-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {link.shortcode}
                          </p>
                          {link.description && (
                            <p className="text-xs text-gray-500 truncate">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {link.clicks.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No links with clicks yet</p>
            )}
          </div>
        </div>

        {/* Recent Links */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <Clock className="w-5 h-5 mr-2 text-orange-600" />
              Recently Created
            </h3>
          </div>
          <div className="p-6">
            {analytics.recentLinks.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentLinks.map((link) => (
                  <div key={link.shortcode} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {link.shortcode}
                      </p>
                      {link.description && (
                        <p className="text-xs text-gray-500 truncate">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        {formatDate(link.created)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-sm text-gray-600">
                        {link.clicks.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No links created yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance Distribution */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
            Click Distribution
          </h3>
        </div>
        <div className="p-6">
          {analytics.totalClicks > 0 ? (
            <div className="space-y-3">
              {Object.entries(links)
                .sort(([, a], [, b]) => (b.clicks || 0) - (a.clicks || 0))
                .slice(0, 10)
                .map(([shortcode, link]) => {
                  const percentage = Math.round(((link.clicks || 0) / analytics.totalClicks) * 100)
                  return (
                    <div key={shortcode} className="flex items-center">
                      <div className="w-24 text-sm text-gray-600 truncate">
                        {shortcode}
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.max(percentage, 2)}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-16 text-sm text-gray-900 text-right">
                        {link.clicks || 0} ({percentage}%)
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No click data available</p>
          )}
        </div>
      </div>
    </div>
  )
}