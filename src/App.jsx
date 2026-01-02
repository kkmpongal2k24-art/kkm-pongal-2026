import { useState, useEffect } from 'react'
import { Routes, Route, useParams } from 'react-router-dom'
import Header from './components/Header'
import Navigation from './components/Navigation'
import Dashboard from './components/Dashboard'
import Contributors from './components/Contributors'
import Expenses from './components/Expenses'
import Games from './components/Games'
import Winners from './components/Winners'
import './App.css'

function App() {
  const { year } = useParams()
  const [currentYear, setCurrentYear] = useState(year || '2025')
  const [data, setData] = useState({})

  useEffect(() => {
    const initializeData = () => {
      const savedData = localStorage.getItem('pongalGameData')
      if (savedData) {
        const parsedData = JSON.parse(savedData)
        setData(parsedData)
      } else {
        const initialData = {
          [currentYear]: {
            contributors: [],
            expenses: [],
            games: [],
            winners: {}
          }
        }
        setData(initialData)
        localStorage.setItem('pongalGameData', JSON.stringify(initialData))
      }
    }

    initializeData()
  }, [currentYear])

  const saveData = (newData) => {
    setData(newData)
    localStorage.setItem('pongalGameData', JSON.stringify(newData))
  }

  const yearData = data[currentYear] || { contributors: [], expenses: [], games: [], winners: {} }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        currentYear={currentYear}
        setCurrentYear={setCurrentYear}
        data={data}
        saveData={saveData}
      />
      <Navigation />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 min-h-screen">
        <div className="max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard data={yearData} currentYear={currentYear} />} />
            <Route path="/dashboard" element={<Dashboard data={yearData} currentYear={currentYear} />} />
            <Route path="/contributors" element={<Contributors data={yearData} saveData={saveData} currentYear={currentYear} allData={data} />} />
            <Route path="/expenses" element={<Expenses data={yearData} saveData={saveData} currentYear={currentYear} allData={data} />} />
            <Route path="/games" element={<Games data={yearData} saveData={saveData} currentYear={currentYear} allData={data} />} />
            <Route path="/winners" element={<Winners data={yearData} saveData={saveData} currentYear={currentYear} allData={data} />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

export default App
