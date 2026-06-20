import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import API from './API'
import LoginForm from './components/LoginForm'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import GamePage from './components/GamePage'
import Leaderboard from './components/Leaderboard'
import Home from './components/Home'

function App() {
  const { user, setUser, loading, setLoading } = useAuth()

  // Al primo render chiedo al server se esiste già una sessione attiva per non perdere il login dopo un ricaricamento della pagina.
  useEffect(() => {
    API.getCurrentUser()
      .then(user => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [setUser, setLoading])

// Aspetto la risposta del controllo sessione prima di valutare le route protette: altrimenti un utente già loggato verrebbe rimandato alla home.
  if (loading) return null

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <LoginForm />} />
        <Route path="/play"  element={<ProtectedRoute><GamePage /></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/"      element={<Home />} />
      </Routes>
    </>
  )
}

export default App
