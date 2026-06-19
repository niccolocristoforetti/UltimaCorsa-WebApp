import { useState, useEffect } from 'react'
import API from '../API'
import NetworkMap from './NetworkMap'
import './SetupPhase.css'

// Fase di Setup: mostro la rete completa, il giocatore parte quando vuole
function SetupPhase({ onReady }) {
  const [network, setNetwork] = useState(null)

  useEffect(() => {
    API.getNetworkFull().then(data => setNetwork(data))
  }, [])

  if (!network) return <p>Caricamento rete...</p>

  // Tratte ricavate dalle linee: ogni coppia di stazioni consecutive lungo una linea; servono alla mappa per riconoscere gli interscambi
  const segments = network.lines.flatMap(l => l.stations.slice(1).map((id, i) => [l.stations[i], id]))

  return (
    <div className="setup-phase">
      <h2>Rete metropolitana di Verona</h2>
      <NetworkMap stations={network.stations} segments={segments} lines={network.lines} />
      <div className="legend">
        {network.lines.map(line => (
          <span key={line.id} className="legend-item">
            <span className="line-dot" style={{ backgroundColor: line.color }} />
            {line.name}
          </span>
        ))}
      </div>
      <button onClick={onReady}>Sono pronto</button>
    </div>
  )
}

export default SetupPhase
