import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // null = nessuno loggato; { id, username } = utente loggato.
  const [user, setUser] = useState(null)
  // true finché non arriva la risposta del controllo sessione all'avvio (vedi App.jsx).
  const [loading, setLoading] = useState(true)

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// AuthContext non è esportato: l'unico modo di accederci è useAuth().
export function useAuth() {
  return useContext(AuthContext)
}
