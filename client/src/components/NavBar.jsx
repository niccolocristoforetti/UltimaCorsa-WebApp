import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import API from '../API'
import './NavBar.css'

function NavBar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await API.logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <nav>
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
