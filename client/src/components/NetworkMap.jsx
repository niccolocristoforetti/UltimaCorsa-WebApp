import './NetworkMap.css'

// Per ogni stazione, da che parte sta l'etichetta rispetto al pallino (schema validato con le anteprime matplotlib)
const ANCHOR = {
  'Corso Milano': 'above', 'San Zeno': 'above', 'Piazza Bra': 'above-right-near',
  'Porta Vescovo': 'above', 'Borgo Venezia': 'above',
  'Stadio Bentegodi': 'above', 'Santa Lucia': 'above', 'Borgo Roma': 'above-right-near',
  'Parona': 'above', 'Borgo Trento': 'above-right', 'Fiera': 'below',
  'Quinzano': 'above', 'Avesa': 'above-right', 'Ponte Pietra': 'above-right', 'Grezzana': 'above-right',
  'Castelvecchio': 'above-right', 'Porta Nuova': 'above-right', 'Veronetta': 'below',
}

// Per ogni ancoraggio: scostamento dx,dy in unità SVG (asse Y verso il basso, dy negativo = sopra il pallino), ancoraggio orizzontale (textAnchor) e verticale (baseline) del testo
const OFFSET = {
  above: { dx: 0, dy: -14, textAnchor: 'middle', baseline: 'auto' },
  below: { dx: 0, dy: 14, textAnchor: 'middle', baseline: 'hanging' },
  'above-right': { dx: 12, dy: -12, textAnchor: 'start', baseline: 'auto' },
  'above-right-near': { dx: 7, dy: -12, textAnchor: 'start', baseline: 'auto' },
  left: { dx: -14, dy: 0, textAnchor: 'end', baseline: 'middle' },
  right: { dx: 14, dy: 0, textAnchor: 'start', baseline: 'middle' },
}

// Mappa SVG della rete: stazioni come cerchi, posizionate con le coordinate fisse di db.mjs (asse Y già coerente con SVG, nessuna inversione necessaria)
// lines è opzionale: presente nel Setup (disegno le linee colorate), assente in Pianificazione (solo i pallini)
function NetworkMap({ stations, segments, lines }) {
  // Grado di ogni stazione = quante tratte la toccano; nella rete fissa solo gli interscambi arrivano a 3+ (due linee che si incrociano), i passaggi sono 2 e i capolinea 1
  const degree = {}
  for (const [a, b] of segments) {
    degree[a] = (degree[a] || 0) + 1
    degree[b] = (degree[b] || 0) + 1
  }

  // Coordinate per id: servono a tradurre la sequenza di stazioni di una linea in punti da unire
  const coord = {}
  for (const s of stations) coord[s.id] = s

  return (
    <svg className="network-map" viewBox="20 -60 760 620" xmlns="http://www.w3.org/2000/svg">
      {lines && lines.map(line => (
        <polyline
          key={line.id}
          points={line.stations.map(id => `${coord[id].x},${coord[id].y}`).join(' ')}
          fill="none"
          stroke={line.color}
          className="network-line"
        />
      ))}
      {stations.map(s => {
        const { dx, dy, textAnchor, baseline } = OFFSET[ANCHOR[s.name]]
        // In Pianificazione (lines assente) tengo tutte le stazioni uguali: evidenziare gli interscambi rivelerebbe un'informazione che il giocatore deve ricordare da solo
        const interchange = Boolean(lines) && (degree[s.id] || 0) >= 3
        return (
          <g key={s.id}>
            <circle cx={s.x} cy={s.y} r={interchange ? 11 : 9} className="station-dot" />
            <text x={s.x + dx} y={s.y + dy} textAnchor={textAnchor} dominantBaseline={baseline} className={interchange ? 'station-label interchange' : 'station-label'}>{s.name}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default NetworkMap
