import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../API'
import './Leaderboard.css'

// Classifica generale
// onBack è opzionale: usato da GamePage per tornare a result senza toccare l'URL; se assente (route /leaderboard standalone) torno indietro nella cronologia del browser
function Leaderboard({ onBack }) {
  const [rows, setRows] = useState(null)
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate(-1))

  useEffect(() => {
    API.getLeaderboard().then(data => setRows(data))
  }, [])

  if (!rows) return <p>Caricamento classifica...</p>

  return (
    <div className="leaderboard">
      <h2>Classifica generale</h2>
      {rows.length === 0
        ? <p>Nessuna partita giocata finora.</p>
        : (
          <table>
            <thead>
              <tr><th>#</th><th>Giocatore</th><th>Miglior punteggio</th></tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.username}>
                  <td>{i + 1}</td>
                  <td>{row.username}</td>
                  <td>{row.best}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <button onClick={handleBack}>Torna indietro</button>
    </div>
  )
}

export default Leaderboard
