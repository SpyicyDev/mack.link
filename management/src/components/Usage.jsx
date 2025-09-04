import { useEffect, useState } from 'react'
import { http } from '../services/http'

export function Usage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false
    async function load() {
      setLoading(true)
      try {
        const res = await http.get('/api/usage')
        if (!ignore) setData(res)
      } catch (e) {
        if (!ignore) setError(e?.message || 'Failed to load usage')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    load()
    const id = setInterval(load, 60_000)
    return () => { ignore = true; clearInterval(id) }
  }, [])

  if (loading) return <div className="text-sm text-gray-500">Loading usage…</div>
  if (error) return <div className="text-sm text-red-600">{error}</div>
  if (!data) return null

  const limits = data.limits || {}
  const workers = data.workers || { available: false }
  const d1 = data.d1 || {}

  const Stat = ({ label, value, limit, accent }) => (
    <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900 dark:text-white">{value.toLocaleString()}</div>
      {limit !== undefined && (
        <div className="mt-1 text-xs text-gray-600 dark:text-gray-300">Limit: <span className={accent}>{limit.toLocaleString()}</span></div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Usage & Limits</h2>
        {!workers.available && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 dark:text-amber-300 dark:bg-amber-900/20 dark:border-amber-800">
            To see Workers usage, set <code>CF_ACCOUNT_ID</code> and <code>CF_API_TOKEN</code> in Worker vars.
          </div>
        )}
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Cloudflare Workers (last 24h)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Requests" value={workers.daily?.requests || 0} limit={limits.workers_requests} accent="text-blue-600 dark:text-blue-400" />
          <Stat label="Subrequests" value={workers.daily?.subrequests || 0} limit={limits.workers_subrequests} accent="text-blue-600 dark:text-blue-400" />
          <Stat label="CPU ms" value={workers.daily?.cpuMs || 0} limit={limits.workers_cpu_ms} accent="text-purple-600 dark:text-purple-400" />
          <Stat label="Wall time ms" value={workers.daily?.wallTimeMs || 0} limit={limits.workers_wall_ms} accent="text-purple-600 dark:text-purple-400" />
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">Cloudflare D1 (approximate)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Links rows" value={d1.linksCount || 0} limit={limits.d1_rows} accent="text-green-600 dark:text-green-400" />
          <Stat label="analytics_day rows" value={d1.analyticsDayCount || 0} limit={limits.d1_rows} accent="text-green-600 dark:text-green-400" />
          <Stat label="analytics_agg rows" value={d1.analyticsAggCount || 0} limit={limits.d1_rows} accent="text-green-600 dark:text-green-400" />
          <Stat label="analytics_day_agg rows" value={d1.analyticsDayAggCount || 0} limit={limits.d1_rows} accent="text-green-600 dark:text-green-400" />
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Tip: Configure `USAGE_LIMITS` in Worker vars as JSON, e.g. {'{"workers_requests": 100000, "d1_rows": 1000000}'}</div>
      </section>
    </div>
  )
}


