import { useState, useEffect } from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Contributors from './components/Contributors'
import Expenses from './components/Expenses'
import Games from './components/Games'
import Winners from './components/Winners'
import { getYearData, yearsApi } from './lib/api'
import './App.css'

function App() {
  const { year } = useParams()
  const [currentYear, setCurrentYear] = useState(year || '2026')
  const [data, setData] = useState({})
  const [availableYears, setAvailableYears] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load available years
  useEffect(() => {
    const loadAvailableYears = async () => {
      try {
        const years = await yearsApi.getAll()
        setAvailableYears(years.map(y => y.year))

        // If no years exist, create the current year
        if (years.length === 0) {
          await yearsApi.create(currentYear)
          setAvailableYears([currentYear])
        }
      } catch (err) {
        console.error('Failed to load years:', err)
        setError('Failed to load years')
      }
    }

    loadAvailableYears()
  }, [currentYear])

  // Load data for current year
  useEffect(() => {
    const loadYearData = async () => {
      if (!currentYear) return

      setIsLoading(true)
      setError(null)

      try {
        const yearData = await getYearData(currentYear)
        setData(prevData => ({
          ...prevData,
          [currentYear]: yearData
        }))
      } catch (err) {
        console.error('Failed to load year data:', err)
        setError(`Failed to load data for ${currentYear}`)

        // Fallback to empty data structure
        setData(prevData => ({
          ...prevData,
          [currentYear]: {
            contributors: [],
            expenses: [],
            games: [],
            winners: {}
          }
        }))
      } finally {
        setIsLoading(false)
      }
    }

    loadYearData()
  }, [currentYear])

  // Refresh data for current year (used by components after data changes)
  const refreshData = async () => {
    try {
      const yearData = await getYearData(currentYear)
      setData(prevData => ({
        ...prevData,
        [currentYear]: yearData
      }))

      // Refresh available years in case a new year was added
      const years = await yearsApi.getAll()
      setAvailableYears(years.map(y => y.year))
    } catch (err) {
      console.error('Failed to refresh data:', err)
      setError('Failed to refresh data')
    }
  }

  // Legacy saveData function - now triggers a refresh instead
  const saveData = async () => {
    await refreshData()
  }

  const yearData = data[currentYear] || { contributors: [], expenses: [], games: [], winners: {} }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Pongal {currentYear} data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        data={data}
        availableYears={availableYears}
        saveData={saveData}
        refreshData={refreshData}
      />
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard data={yearData} currentYear={currentYear} />} />
            <Route path="/dashboard" element={<Dashboard data={yearData} currentYear={currentYear} />} />
            <Route path="/contributors" element={<Contributors data={yearData} refreshData={refreshData} currentYear={currentYear} />} />
            <Route path="/expenses" element={<Expenses data={yearData} refreshData={refreshData} currentYear={currentYear} />} />
            <Route path="/games" element={<Games data={yearData} refreshData={refreshData} currentYear={currentYear} />} />
            <Route path="/winners" element={<Winners data={yearData} refreshData={refreshData} currentYear={currentYear} />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
