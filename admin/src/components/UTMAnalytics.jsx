import { useMemo } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'

export function UTMAnalytics({ 
  utmSourceData = [], 
  utmMediumData = [], 
  utmCampaignData = [],
  className = '' 
}) {
  // Prepare data for visualization
  const chartData = useMemo(() => {
    const sourceData = {
      labels: utmSourceData.map(item => item.key || 'Direct'),
      datasets: [{
        label: 'UTM Source',
        data: utmSourceData.map(item => item.clicks || 0),
        backgroundColor: [
          '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
          '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
        ].slice(0, utmSourceData.length),
      }]
    }

    const mediumData = {
      labels: utmMediumData.map(item => item.key || 'Direct'),
      datasets: [{
        label: 'UTM Medium',
        data: utmMediumData.map(item => item.clicks || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      }]
    }

    const campaignData = {
      labels: utmCampaignData.map(item => item.key || 'Direct'),
      datasets: [{
        label: 'UTM Campaign',
        data: utmCampaignData.map(item => item.clicks || 0),
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      }]
    }

    return { sourceData, mediumData, campaignData }
  }, [utmSourceData, utmMediumData, utmCampaignData])

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 11 }
        }
      }
    }
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 10 },
          maxRotation: 45,
        }
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.1)' }
      }
    }
  }

  // Calculate totals and percentages
  const totalSourceClicks = utmSourceData.reduce((sum, item) => sum + (item.clicks || 0), 0)
  const totalMediumClicks = utmMediumData.reduce((sum, item) => sum + (item.clicks || 0), 0)
  const totalCampaignClicks = utmCampaignData.reduce((sum, item) => sum + (item.clicks || 0), 0)

  return (
    <div className={`space-y-6 ${className}`}>
      {/* UTM Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 dark:text-blue-400 text-sm font-semibold">S</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Sources</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {utmSourceData.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalSourceClicks.toLocaleString()} clicks
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <span className="text-green-600 dark:text-green-400 text-sm font-semibold">M</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mediums</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {utmMediumData.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalMediumClicks.toLocaleString()} clicks
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">C</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Campaigns</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {utmCampaignData.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalCampaignClicks.toLocaleString()} clicks
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* UTM Source Distribution */}
      {utmSourceData.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Traffic Sources
          </h4>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="h-64">
              <Doughnut data={chartData.sourceData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      )}

      {/* UTM Medium & Campaign Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UTM Medium */}
        {utmMediumData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Traffic Mediums
            </h4>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="h-48">
                <Bar data={chartData.mediumData} options={barOptions} />
              </div>
            </div>
          </div>
        )}

        {/* UTM Campaign */}
        {utmCampaignData.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
              Campaign Performance
            </h4>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="h-48">
                <Bar data={chartData.campaignData} options={barOptions} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detailed UTM Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Source Table */}
        {utmSourceData.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Top Sources
            </h5>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {utmSourceData.slice(0, 5).map((item, index) => (
                  <div key={index} className="px-4 py-2 flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.key || 'Direct'}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.clicks?.toLocaleString() || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Medium Table */}
        {utmMediumData.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Top Mediums
            </h5>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {utmMediumData.slice(0, 5).map((item, index) => (
                  <div key={index} className="px-4 py-2 flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.key || 'Direct'}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.clicks?.toLocaleString() || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaign Table */}
        {utmCampaignData.length > 0 && (
          <div>
            <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
              Top Campaigns
            </h5>
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {utmCampaignData.slice(0, 5).map((item, index) => (
                  <div key={index} className="px-4 py-2 flex justify-between items-center">
                    <span className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.key || 'Direct'}
                    </span>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {item.clicks?.toLocaleString() || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}