import './ResultPage.css'

// Fase di Risultato: mostro il punteggio finale (le monete rimaste, già azzerate dal server se negative) e lascio scegliere se rigiocare o andare a vedere come ci si posiziona in classifica
function ResultPage({ result, onRestart, onShowLeaderboard }) {
  return (
    <div className="result-page">
      <h2>Risultato</h2>
      {result.valid
        ? <p>Sei arrivato a destinazione!</p>
        : <p>Percorso non valido o inviato fuori tempo: la corsa è saltata.</p>}
      <p className="final-score">{result.score} monete</p>
      <div className="result-actions">
        <button onClick={onRestart}>Nuova partita</button>
        <button onClick={onShowLeaderboard}>Vedi classifica</button>
      </div>
    </div>
  )
}

export default ResultPage
