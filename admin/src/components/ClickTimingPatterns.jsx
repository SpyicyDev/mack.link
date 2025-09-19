import { useMemo } from 'react'
import { Line, Bar } from 'react-chartjs-2'

export function ClickTimingPatterns({ data = [], className = '' }) {
  // Process data to create hourly and daily patterns
  const { hourlyData, weeklyData, heatmapData } = useMemo(() => {
    // Create hourly distribution (0-23 hours)
    const hourlyClicks = new Array(24).fill(0)
    // Create weekly distribution (0-6 days, 0=Sunday)
    const weeklyClicks = new Array(7).fill(0)
    // Create heatmap data (7 days x 24 hours)
    const heatmap = Array(7).fill(null).map(() => Array(24).fill(0))
    
    // Process each data point 
    data.forEach(point => {
      if (point.date && point.clicks) {
        const date = new Date(point.date)
        const hour = date.getHours()
        const dayOfWeek = date.getDay()
        
        hourlyClicks[hour] += point.clicks
        weeklyClicks[dayOfWeek] += point.clicks
        heatmap[dayOfWeek][hour] += point.clicks
      }
    })
    
    return {
      hourlyData: hourlyClicks,
      weeklyData: weeklyClicks,
      heatmapData: heatmap
    }
  }, [data])

  const hourlyChartData = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: 'Clicks by Hour',
        data: hourlyData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const weeklyChartData = {
    labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    datasets: [
      {
        label: 'Clicks by Day',
        data: weeklyData,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { 
          font: { size: 10 },
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: { font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,0.1)' },
      },
    },
  }

  // Generate heat calendar (simplified version)
  const getHeatmapIntensity = (dayIndex, hourIndex) => {
    const clicks = heatmapData[dayIndex][hourIndex]
    const maxClicks = Math.max(...heatmapData.flat())
    if (maxClicks === 0) return 0
    return Math.min(clicks / maxClicks, 1)
  }

  const getHeatmapColor = (intensity) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800'
    if (intensity < 0.25) return 'bg-blue-100 dark:bg-blue-900'
    if (intensity < 0.5) return 'bg-blue-300 dark:bg-blue-700'
    if (intensity < 0.75) return 'bg-blue-500 dark:bg-blue-500'
    return 'bg-blue-700 dark:bg-blue-400'
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Hourly Pattern */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Clicks by Hour of Day
        </h4>
        <div className="h-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <Line data={hourlyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Weekly Pattern */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Clicks by Day of Week  
        </h4>
        <div className="h-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <Bar data={weeklyChartData} options={chartOptions} />
        </div>
      </div>

      {/* Heatmap Calendar */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          Activity Heatmap
        </h4>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          {/* Hour labels */}
          <div className="flex text-xs text-gray-500 dark:text-gray-400 mb-2">
            <div className="w-16"></div>
            {Array.from({ length: 24 }, (_, i) => (
              <div key={i} className="w-4 text-center">
                {i % 6 === 0 ? i : ''}
              </div>
            ))}
          </div>
          
          {/* Heatmap grid */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
            <div key={day} className="flex items-center mb-1">
              <div className="w-16 text-xs text-gray-500 dark:text-gray-400 text-right pr-2">
                {day}
              </div>
              {Array.from({ length: 24 }, (_, hourIndex) => {
                const intensity = getHeatmapIntensity(dayIndex, hourIndex)
                const clicks = heatmapData[dayIndex][hourIndex]
                return (
                  <div
                    key={hourIndex}
                    className={`w-4 h-4 mr-0.5 rounded-sm ${getHeatmapColor(intensity)}`}
                    title={`${day} ${hourIndex}:00 - ${clicks} clicks`}
                  />
                )
              })}
            </div>
          ))}
          
          {/* Legend */}
          <div className="flex items-center justify-center mt-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Less</span>
            <div className="flex mx-2 space-x-1">
              <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-sm"></div>
              <div className="w-3 h-3 bg-blue-700 dark:bg-blue-400 rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  )
}