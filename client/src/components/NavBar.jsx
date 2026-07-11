import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import API from '../API'
import './NavBar.css'

function NavBar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await API.logout()
    setUser(null)
    navigate('/')
  }

  return (
    <nav>
      {/* Link di navigazione sempre presenti: le regole (in Home) e la classifica restano raggiungibili anche durante una partita, senza dover cambiare URL a mano o fare logout */}
      {user && (
        <div className="nav-links">
          <NavLink to="/">Regole</NavLink>
          <NavLink to="/leaderboard">Classifica</NavLink>
        </div>
      )}
      <span className="title">Ultima Corsa</span>
      <div className="user-area">
        {user && (
          <>
            <span>{user.username}</span>
            <button onClick={handleLogout}>Esci</button>
          </>
        )}
      </div>
    </nav>
  )
}

export default NavBar
