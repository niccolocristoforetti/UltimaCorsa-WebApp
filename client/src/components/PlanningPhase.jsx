import { useState, useEffect } from 'react'
import API from '../API'
import NetworkMap from './NetworkMap'
import RouteBuilder from './RouteBuilder'
import './PlanningPhase.css'

const segmentKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// Ricostruisce il percorso (array di id stazione) dalle tratte scelte, nell'ordine in cui sono state cliccate: parto da startId e ad ogni tratta mi sposto sull'estremo diverso dalla stazione in cui mi trovo. Se una tratta non tocca quella stazione il percorso resta spezzato: non lo controllo qui, lo rifiuta il server alla validazione.
function buildRoute(selected, startId) {
  const route = [startId]
  for (const [a, b] of selected) {
    const last = route[route.length - 1]
    route.push(a === last ? b : a)
  }
  return route
}

// Fase di Pianificazione: il giocatore ricostruisce a memoria il percorso entro 90 secondi
function PlanningPhase({ start, end, onSubmit }) {
  const [network, setNetwork] = useState(null)
  // Tratte scelte finora, nell'ordine di selezione
  const [selected, setSelected] = useState([])
  const [timeLeft, setTimeLeft] = useState(90)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    API.getNetworkSegments().then(data => setNetwork(data))
  }, [])

  // Countdown: ad ogni render programmo un solo setTimeout che toglie 1 secondo, e lo ripulisco in cleanup prima del render seguente. A 0 invio il percorso così com'è (autosubmit)
  useEffect(() => {
    if (sent) return
    if (timeLeft <= 0) {
      handleSubmit()
      return
    }
    const timeout = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timeout)
  }, [timeLeft, sent])

  function handleSubmit() {
    setSent(true)
    onSubmit(buildRoute(selected, start.id))
  }

  // Click su una tratta: la toglie se era già scelta (ovunque si trovi nell'elenco), altrimenti la aggiunge in fondo.
  function toggleSegment(a, b) {
    const key = segmentKey(a, b)
    setSelected(s => (
      s.some(([x, y]) => segmentKey(x, y) === key)
        ? s.filter(([x, y]) => segmentKey(x, y) !== key)
        : [...s, [a, b]]
    ))
  }

  if (!network) return <p>Caricamento rete...</p>

  const stationName = id => network.stations.find(s => s.id === id)?.name

  return (
    <div className="planning-phase">
      <h2>Da {start.name} a {end.name}</h2>
      <p className="timer">Tempo rimasto: {timeLeft}s</p>
      <div className="planning-actions">
        <button onClick={handleSubmit} disabled={sent}>Invia percorso</button>
      </div>
      <NetworkMap stations={network.stations} segments={network.segments} />
      <RouteBuilder
        segments={network.segments}
        stationName={stationName}
        selected={selected}
        onToggleSegment={toggleSegment}
      />
    </div>
  )
}

export default PlanningPhase
