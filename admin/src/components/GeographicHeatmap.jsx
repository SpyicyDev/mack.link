import { useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps'

// Simplified world map data URL - using a smaller, free topology
const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

export function GeographicHeatmap({ data = [], className = '' }) {
  // Prepare data for visualization
  const countryData = useMemo(() => {
    const countryMap = new Map()
    let maxClicks = 0
    
    // Process the data to create country -> clicks mapping
    data.forEach(item => {
      const clicks = item.clicks || 0
      if (clicks > maxClicks) maxClicks = clicks
      
      // Handle country code mapping - the data uses country codes like 'US', 'GB', etc.
      countryMap.set(item.key, clicks)
    })
    
    return { countryMap, maxClicks }
  }, [data])

  // Get fill color based on click intensity
  const getFillColor = (geoId, countryMap, maxClicks) => {
    const clicks = countryMap.get(geoId) || 0
    if (clicks === 0) return '#f3f4f6' // gray-100
    
    const intensity = Math.min(clicks / maxClicks, 1)
    
    // Color scale from light blue to dark blue
    if (intensity < 0.2) return '#dbeafe' // blue-100
    if (intensity < 0.4) return '#bfdbfe' // blue-200  
    if (intensity < 0.6) return '#93c5fd' // blue-300
    if (intensity < 0.8) return '#60a5fa' // blue-400
    return '#3b82f6' // blue-500
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Legend */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>Geographic Distribution</span>
        <div className="flex items-center space-x-2">
          <span>Less</span>
          <div className="flex space-x-1">
            <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-200 dark:bg-blue-800 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-300 dark:bg-blue-700 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-400 dark:bg-blue-600 rounded-sm"></div>
            <div className="w-3 h-3 bg-blue-500 dark:bg-blue-500 rounded-sm"></div>
          </div>
          <span>More</span>
        </div>
      </div>

      {/* World Map */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 120
          }}
          width={800}
          height={400}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.properties.ISO_A2 // Use ISO_A2 country code
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFillColor(geoId, countryData.countryMap, countryData.maxClicks)}
                      stroke="#e5e7eb"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: { 
                          outline: 'none',
                          fill: '#1d4ed8',
                          cursor: 'pointer'
                        },
                        pressed: { outline: 'none' }
                      }}
                      onMouseEnter={() => {
                        // Could add tooltip here
                      }}
                    />
                  )
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Top Countries List */}
      {data.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Top Countries ({data.length})
          </h4>
          <div className="space-y-1">
            {data.slice(0, 5).map((country) => (
              <div key={country.key} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  {country.key === '??' ? 'Unknown' : country.key}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {country.clicks?.toLocaleString() || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}