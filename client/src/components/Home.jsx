import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import './Home.css'

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
          <strong>Pianificazione.</strong> Le linee colorate scompaiono dalla mappa: restano solo le
          stazioni con i loro nomi. A parte, hai l'elenco di tutte le tratte (i collegamenti diretti tra due
          stazioni vicine): devi ricostruire a memoria il percorso dalla stazione di partenza a quella di
          arrivo, scegliendo le tratte giuste una dopo l'altra, in ordine, entro 90 secondi.
        </li>
        <li>
          <strong>Esecuzione.</strong> Se il percorso è corretto, scopri tappa per tappa cosa è successo
          durante il viaggio: ogni tratta può portare un piccolo imprevisto che fa guadagnare o perdere
          monete (anche nessuno, a volte va tutto bene). Se invece il percorso è sbagliato o lo invii fuori
          tempo, la corsa non parte e chiudi la partita con 0 monete.
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
