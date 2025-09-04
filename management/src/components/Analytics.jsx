import { useMemo, useEffect, useState } from 'react'
import { http } from '../services/http'
import { BarChart3, TrendingUp, Clock, Globe } from 'lucide-react'

export function Analytics({ links }) {
  const [range, setRange] = useState({ from: new Date(Date.now()-7*86400000).toISOString().slice(0,10), to: new Date().toISOString().slice(0,10) })
  const [ts, setTs] = useState(null)
  const [overview, setOverview] = useState(null)
  const [refTop, setRefTop] = useState(null)
  const [dimension, setDimension] = useState('ref')
  const [shortcode, setShortcode] = useState(Object.keys(links)[0])

  useEffect(() => {
    let ignore = false
    async function load() {
      if (!shortcode) return
      try {
        const tsData = await http.get(`/api/analytics/timeseries?shortcode=${encodeURIComponent(shortcode)}&from=${range.from}&to=${range.to}`)
        const ov = await http.get(`/api/analytics/overview?shortcode=${encodeURIComponent(shortcode)}`)
        const ref = await http.get(`/api/analytics/breakdown?shortcode=${encodeURIComponent(shortcode)}&dimension=${dimension}&from=${range.from}&to=${range.to}&limit=5`)
        if (!ignore) { setTs(tsData); setOverview(ov); setRefTop(ref) }
      } catch (e) {}
    }
    load()
    return () => { ignore = true }
  }, [shortcode, range.from, range.to, dimension])
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 p-4 flex items-center gap-3 flex-wrap">
        <div className="text-sm text-gray-600 dark:text-gray-300">Shortcode:</div>
        <select value={shortcode || ''} onChange={(e)=>setShortcode(e.target.value)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          {Object.keys(links).map(sc => (<option key={sc} value={sc}>{sc}</option>))}
        </select>

        <div className="text-sm text-gray-600 dark:text-gray-300 ml-2">Date range:</div>
        <input type="date" value={range.from} onChange={(e)=>setRange(r=>({...r, from:e.target.value}))} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        <span className="text-gray-500">to</span>
        <input type="date" value={range.to} onChange={(e)=>setRange(r=>({...r, to:e.target.value}))} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />

        <div className="text-sm text-gray-600 dark:text-gray-300 ml-2">Breakdown:</div>
        <select value={dimension} onChange={(e)=>setDimension(e.target.value)} className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option value="ref">Referrer</option>
          <option value="country">Country</option>
          <option value="device">Device</option>
        </select>

        <div className="ml-auto flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
          {overview && (
            <>
              <span>Total: <span className="font-semibold">{overview.totalClicks.toLocaleString()}</span></span>
              <span>Today: <span className="font-semibold">{overview.clicksToday.toLocaleString()}</span></span>
            </>
          )}
        </div>
      </div>
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
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                        {link.clicks.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No links with clicks yet</p>
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
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {link.shortcode}
                      </p>
                      {link.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {link.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatDate(link.created)}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {link.clicks.toLocaleString()} clicks
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No links created yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Timeseries and breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Clicks Over Time
            </h3>
          </div>
          <div className="p-6">
            {ts?.points?.length ? (
              <div className="space-y-2">
                {ts.points.map(p => (
                  <div key={p.date} className="flex items-center">
                    <div className="w-24 text-xs text-gray-600 dark:text-gray-300">{p.date}</div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${Math.min(100, Math.max(2, p.clicks))}%` }} />
                      </div>
                    </div>
                    <div className="w-10 text-xs text-gray-900 dark:text-white text-right">{p.clicks}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data for selected range</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-700/50 transition-colors">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Top {dimension === 'ref' ? 'Referrers' : dimension === 'country' ? 'Countries' : 'Devices'}</h3>
          </div>
          <div className="p-6">
            {refTop?.items?.length ? (
              <div className="space-y-2">
                {refTop.items.map(i => (
                  <div key={i.key} className="flex items-center justify-between text-sm">
                    <span className="truncate max-w-[60%]" title={i.key}>{i.key || 'direct'}</span>
                    <span className="text-gray-700 dark:text-gray-300">{i.clicks}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data for selected range</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}