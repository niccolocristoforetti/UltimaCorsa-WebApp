import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  // Pagina protetta: un anonimo viene rimandato al login.
  if (!user) return <Navigate to="/login" />
  return children
}

export default ProtectedRoute
