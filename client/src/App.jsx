import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import API from './API'
import LoginForm from './components/LoginForm'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { setUser, loading, setLoading } = useAuth()

  // Al primo render chiedo al server se esiste già una sessione attiva.
  // Serve per non perdere il login dopo un ricaricamento della pagina.
  useEffect(() => {
    API.getCurrentUser()
      .then(user => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Aspetto la risposta del controllo sessione prima di valutare le route protette:
  // altrimenti un utente già loggato verrebbe rimandato al login per un istante.
  if (loading) return null

  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/"      element={<ProtectedRoute><div>Pagina principale</div></ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App
