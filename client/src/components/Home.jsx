import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

// Home: l'unica pagina visibile anche a chi non è loggato. Le istruzioni le mostro sempre (utili anche
// a chi ha già un account); cambia solo l'area azioni in cima, in base a "user": bottoni di gioco se
// loggato, invito al login se anonimo. Niente mappa, come richiesto per i visitatori anonimi
function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="home">
      {user
        ? (
          <div className="home-actions">
            <button onClick={() => navigate('/play')}>Gioca</button>
            <button onClick={() => navigate('/leaderboard')}>Classifica</button>
          </div>
        )
        : (
          <div className="home-actions">
            <Link to="/login">Accedi per giocare</Link>
          </div>
        )}

      <h2>Come si gioca a Ultima Corsa</h2>
      <p>
        Ultima Corsa è un gioco a turno singolo ambientato sulla rete della metropolitana di Verona.
        Lo scopo è ricostruire a memoria il percorso tra due stazioni, partendo da 20 monete che
        cambiano in base a cosa succede durante il viaggio.
      </p>

      <h3>Le fasi di una partita</h3>
      <ol>
        <li>
          <strong>Osservazione.</strong> Vedi la mappa completa della rete: tutte le stazioni e tutte
          le linee, con i loro colori. Hai tutto il tempo che vuoi per studiartela.
        </li>
        <li>
          <strong>Pianificazione.</strong> Le linee colorate scompaiono: vedi solo le stazioni e i
          collegamenti diretti fra di loro (le "tratte"). Devi ricostruire a memoria il percorso da una
          stazione di partenza a una di arrivo, scegliendo le tratte giuste, entro 90 secondi.
        </li>
        <li>
          <strong>Esecuzione.</strong> Se il percorso è corretto, scopri tappa per tappa cosa è successo
          durante il viaggio: ogni tratta può portare un piccolo imprevisto che fa guadagnare o perdere
          monete (anche nessuno, a volte va tutto bene).
        </li>
        <li>
          <strong>Risultato.</strong> Vedi quante monete ti restano e puoi confrontarti con tutti gli
          altri giocatori nella classifica generale.
        </li>
      </ol>
    </div>
  )
}

export default Home
