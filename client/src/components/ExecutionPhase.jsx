import { useState, useEffect } from 'react'
import './ExecutionPhase.css'

// Colore dell'effetto in base al segno: guadagno verde, perdita rosso, evento neutro (0) nero
function effectClass(effect) {
  if (effect > 0) return 'positive'
  if (effect < 0) return 'negative'
  return 'neutral'
}

// Fase di Esecuzione: il percorso è già stato inviato e validato, qui rivelo la cronaca del viaggio tappa per tappa. Eventi e monete arrivano già tutti dal server: questa è solo presentazione, non chiedo nulla tappa per tappa
function ExecutionPhase({ result, onFinished }) {
  // Quante tappe ho già svelato: parte da 0 e cresce di una ogni secondo finché non le ho mostrate tutte
  const [shown, setShown] = useState(0)

  const legs = result.legs ?? []

  // Svelo una tappa alla volta: se ne mancano, programmo un setTimeout che ne mostra un'altra e lo ripulisco in cleanup (stessa struttura del timer di Pianificazione)
  useEffect(() => {
    if (shown >= legs.length) return
    const timeout = setTimeout(() => setShown(s => s + 1), 1000)
    return () => clearTimeout(timeout)
  }, [shown, legs.length])

  // Percorso invalido o fuori tempo: non c'è nessun viaggio da rivelare
  if (!result.valid) {
    return (
      <div className="execution-phase">
        <h2>La corsa non è partita</h2>
        <p>Percorso non valido o inviato fuori tempo: nessuna corsa, 0 monete.</p>
        <button onClick={onFinished}>Vai al risultato</button>
      </div>
    )
  }

  // Bottone abilitato solo a cronaca completata: prima il giocatore guarda il viaggio scorrere
  const done = shown >= legs.length

  return (
    <div className="execution-phase">
      <h2>In viaggio...</h2>
      <p className="coins-start">Parti con 20 monete</p>
      <ol className="legs">
        {legs.slice(0, shown).map(leg => (
          <li key={`${leg.from}-${leg.to}`} className="leg">
            <span className="leg-route">{leg.fromName} → {leg.toName}</span>
            <span className="leg-event">{leg.event.description}</span>
            <span className={`leg-effect ${effectClass(leg.event.effect)}`}>
              {leg.event.effect > 0 ? `+${leg.event.effect}` : leg.event.effect}
            </span>
            <span className="leg-coins">{leg.coins} monete</span>
          </li>
        ))}
      </ol>
      <button onClick={onFinished} disabled={!done}>Vai al risultato</button>
    </div>
  )
}

export default ExecutionPhase
