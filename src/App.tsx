import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { CarFront, ScrollText, PieChart } from 'lucide-react'
import Dashboard from './pages/Dashboard'
import History from './pages/History'
import Statistics from './pages/Statistics'

function Navigation() {
  const location = useLocation()
  
  return (
    <nav className="sticky bottom-0 w-full bg-slate-900 border-t border-slate-800 text-slate-400">
      <div className="flex justify-around items-center h-16">
        <Link 
          to="/" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/' ? 'text-purple-400' : 'hover:text-slate-200'}`}
        >
          <CarFront className="mb-1" size={24} />
          <span className="text-xs font-medium">Tracker</span>
        </Link>
        <Link 
          to="/history" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/history' ? 'text-purple-400' : 'hover:text-slate-200'}`}
        >
          <ScrollText className="mb-1" size={24} />
          <span className="text-xs font-medium">Historique</span>
        </Link>
        <Link 
          to="/stats" 
          className={`flex flex-col items-center justify-center w-full h-full ${location.pathname === '/stats' ? 'text-purple-400' : 'hover:text-slate-200'}`}
        >
          <PieChart className="mb-1" size={24} />
          <span className="text-xs font-medium">Stats</span>
        </Link>
      </div>
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-slate-950">
        <header className="bg-slate-900 border-b border-slate-800 p-4 shrink-0 shadow-md z-10">
          <h1 className="text-xl font-bold text-center text-white m-0 tracking-tight">Carnet AAC</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/history" element={<History />} />
            <Route path="/stats" element={<Statistics />} />
          </Routes>
        </main>
        
        <Navigation />
      </div>
    </Router>
  )
}

export default App
