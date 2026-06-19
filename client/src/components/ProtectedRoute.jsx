import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  // Pagina protetta: un anonimo viene rimandato alla home (pubblica, mostra le istruzioni).
  if (!user) return <Navigate to="/" />
  return children
}

export default ProtectedRoute
