import { useState, useMemo } from 'react'
import { Bar, Line } from 'react-chartjs-2'
import { Target, Plus, Trash2, Edit3 } from 'lucide-react'

export function ConversionGoals({ 
  data: _data = [], 
  onCreateGoal: _onCreateGoal, 
  onDeleteGoal: _onDeleteGoal, 
  onEditGoal: _onEditGoal,
  className = '' 
}) {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetClicks: 100,
    timeframe: 'month',
    shortcode: 'all'
  })

  const goalAnalytics = useMemo(() => {
    // Mock goals data for demonstration
    const mockGoals = [
      {
        id: 1,
        name: 'Q4 Marketing Campaign',
        targetClicks: 1000,
        currentClicks: 450,
        timeframe: 'month',
        status: 'active',
        created: '2024-01-15'
      },
      {
        id: 2,
        name: 'Social Media Push',
        targetClicks: 500,
        currentClicks: 620,
        timeframe: 'week',
        status: 'completed',
        created: '2024-01-20'
      }
    ]
    
    return mockGoals.map(goal => ({
      ...goal,
      progress: Math.min((goal.currentClicks / goal.targetClicks) * 100, 100),
      isCompleted: goal.currentClicks >= goal.targetClicks,
      remainingClicks: Math.max(goal.targetClicks - goal.currentClicks, 0)
    }))
  }, [])

  const handleCreateGoal = () => {
    // In real implementation, this would call the API
    console.log('Creating goal:', newGoal)
    setShowCreateForm(false)
    setNewGoal({ name: '', targetClicks: 100, timeframe: 'month', shortcode: 'all' })
  }

  const getStatusColor = (status, isCompleted) => {
    if (isCompleted) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
    if (status === 'active') return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
    return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/30'
  }

  const progressChartData = {
    labels: goalAnalytics.map(goal => goal.name),
    datasets: [
      {
        label: 'Progress',
        data: goalAnalytics.map(goal => goal.progress),
        backgroundColor: goalAnalytics.map(goal => 
          goal.isCompleted ? 'rgba(16, 185, 129, 0.6)' : 'rgba(59, 130, 246, 0.6)'
        ),
        borderColor: goalAnalytics.map(goal => 
          goal.isCompleted ? 'rgb(16, 185, 129)' : 'rgb(59, 130, 246)'
        ),
        borderWidth: 1,
      }
    ]
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Conversion Goals
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track progress towards your click targets and campaign goals
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Goal
        </button>
      </div>

      {/* Create Goal Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
            Create New Goal
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Goal Name
              </label>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Q4 Marketing Campaign"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Clicks
              </label>
              <input
                type="number"
                value={newGoal.targetClicks}
                onChange={(e) => setNewGoal(prev => ({ ...prev, targetClicks: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timeframe
              </label>
              <select
                value={newGoal.timeframe}
                onChange={(e) => setNewGoal(prev => ({ ...prev, timeframe: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Link Scope
              </label>
              <select
                value={newGoal.shortcode}
                onChange={(e) => setNewGoal(prev => ({ ...prev, shortcode: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Links</option>
                <option value="specific">Specific Link</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateGoal}
              disabled={!newGoal.name}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Active Goals</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {goalAnalytics.filter(g => !g.isCompleted).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Completed</p>
              <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                {goalAnalytics.filter(g => g.isCompleted).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Avg Progress</p>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {Math.round(goalAnalytics.reduce((sum, g) => sum + g.progress, 0) / goalAnalytics.length || 0)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      {goalAnalytics.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-4">
            Goal Progress Overview
          </h4>
          <div className="h-64">
            <Bar 
              data={progressChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false }
                },
                scales: {
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 12 } }
                  },
                  y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                      font: { size: 12 },
                      callback: (value) => `${value}%`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Goals List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Goal Details
          </h4>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {goalAnalytics.map((goal) => (
            <div key={goal.id} className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {goal.name}
                    </h5>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status, goal.isCompleted)}`}>
                      {goal.isCompleted ? 'Completed' : 'Active'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{goal.currentClicks.toLocaleString()} / {goal.targetClicks.toLocaleString()} clicks</span>
                    <span>•</span>
                    <span>{goal.timeframe}</span>
                    <span>•</span>
                    <span>{Math.round(goal.progress)}% complete</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.min(goal.progress, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}