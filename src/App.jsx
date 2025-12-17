import { BrowserRouter, Routes, Route } from 'react-router-dom'
import QuoteRequestForm from './components/QuoteRequestForm'
import Admin from './components/Admin'
import AdminLogin from './components/AdminLogin'
import AdminRegister from './components/AdminRegister'
import SpaceSearch from './components/SpaceSearch'
import HostHome from './components/HostHome'
import HostDashboard from './components/HostDashboard'
import HostBookings from './components/HostBookings'
import HostQuoteForm from './components/HostQuoteForm'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route path="/" element={<SpaceSearch />} />
          <Route path="/quote" element={<QuoteRequestForm />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/host" element={<HostHome />} />
          <Route path="/host/quotes" element={<HostDashboard />} />
          <Route path="/host/dashboard" element={<HostBookings />} />
          <Route path="/host/quote/:requestId" element={<HostQuoteForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
