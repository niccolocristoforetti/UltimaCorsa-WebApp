import './RouteBuilder.css'

// Chiave non orientata di una tratta, identica a quella del server: serve a riconoscere se una tratta è già stata scelta
const segmentKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`)

// Mostro TUTTE le tratte della rete (no filtri sulle mosse legali: ricostruire il percorso è lo scopo del gioco): ogni tratta è un toggle, cliccarla la seleziona, cliccarla di nuovo la deseleziona
function RouteBuilder({ segments, stationName, selected, onToggleSegment }) {
  const selectedKeys = new Set(selected.map(([a, b]) => segmentKey(a, b)))

  return (
    <div className="route-builder">
      <h3>Elenco delle tratte</h3>
      <div className="segment-list">
        {segments.map(([a, b]) => {
          const isSelected = selectedKeys.has(segmentKey(a, b))
          return (
            <button
              key={segmentKey(a, b)}
              onClick={() => onToggleSegment(a, b)}
              className={isSelected ? 'segment-selected' : ''}
            >
              {stationName(a)} — {stationName(b)}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default RouteBuilder
