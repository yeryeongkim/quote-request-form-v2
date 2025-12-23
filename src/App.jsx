import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import QuoteRequestForm from './components/QuoteRequestForm'
import Admin from './components/Admin'
import AdminLogin from './components/AdminLogin'
import AdminRegister from './components/AdminRegister'
import SpaceSearch from './components/SpaceSearch'
import HostHome from './components/HostHome'
import HostDashboard from './components/HostDashboard'
import HostBookings from './components/HostBookings'
import HostQuoteForm from './components/HostQuoteForm'
import { DEFAULT_COUNTRY } from './lib/countryConfig'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {/* 기본 경로는 기본 국가로 리다이렉트 */}
          <Route path="/" element={<Navigate to={`/${DEFAULT_COUNTRY}`} replace />} />
          <Route path="/quote" element={<Navigate to={`/${DEFAULT_COUNTRY}/quote`} replace />} />

          {/* 국가별 게스트 라우팅 */}
          <Route path="/:country" element={<SpaceSearch />} />
          <Route path="/:country/quote" element={<QuoteRequestForm />} />

          {/* 관리자 */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />

          {/* 기존 /host 경로는 기본 국가로 리다이렉트 */}
          <Route path="/host" element={<Navigate to={`/host/${DEFAULT_COUNTRY}`} replace />} />
          <Route path="/host/quotes" element={<Navigate to={`/host/${DEFAULT_COUNTRY}/quotes`} replace />} />
          <Route path="/host/dashboard" element={<Navigate to={`/host/${DEFAULT_COUNTRY}/dashboard`} replace />} />

          {/* 국가별 호스트 라우팅 */}
          <Route path="/host/:country" element={<HostHome />} />
          <Route path="/host/:country/quotes" element={<HostDashboard />} />
          <Route path="/host/:country/dashboard" element={<HostBookings />} />
          <Route path="/host/:country/quote/:requestId" element={<HostQuoteForm />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
