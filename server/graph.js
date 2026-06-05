import db from './db.mjs';

// Costruisce la lista di adiacenza della rete: per ogni stazione, l'insieme
// delle stazioni direttamente collegate (adiacenti su almeno una linea).
// Le adiacenze derivano da coppie di line_stations consecutive sulla stessa linea.
export function buildAdjacency() {
  const adj = new Map();
  const link = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a).add(b);
  };

  // Tutte le righe ordinate per linea e posizione: due righe consecutive nella
  // stessa linea sono una tratta. Il grafo è NON orientato (si viaggia in entrambi i sensi).
  const rows = db.prepare(`
    SELECT line_id, station_id, position
    FROM line_stations
    ORDER BY line_id, position
  `).all();

  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (prev.line_id === curr.line_id) {
      link(prev.station_id, curr.station_id);
      link(curr.station_id, prev.station_id);
    }
  }
  return adj;
}

// BFS: distanze minime (numero di fermate) dalla stazione source a tutte le
// stazioni raggiungibili. Ritorna Map<stationId, distanza>.
// La prima volta che si raggiunge una stazione, ci si arriva dal cammino più corto.
export function bfsDistances(adj, source) {
  const dist = new Map([[source, 0]]);
  const queue = [source];
  while (queue.length > 0) {
    const node = queue.shift();
    for (const neighbor of adj.get(node) ?? []) {
      if (!dist.has(neighbor)) {            // non ancora visitata = la raggiungo ora dal cammino più corto
        dist.set(neighbor, dist.get(node) + 1);
        queue.push(neighbor);
      }
    }
  }
  return dist;
}

// Distanza minima (numero di fermate) tra due stazioni, o null se irraggiungibili.
export function distance(adj, a, b) {
  return bfsDistances(adj, a).get(b) ?? null;
}

// Chiave non orientata per una tratta (coppia di stazioni): "minId-maxId".
const segmentKey = (a, b) => (a < b ? `${a}-${b}` : `${b}-${a}`);

// Per ogni tratta (coppia di stazioni adiacenti), l'insieme delle linee su cui
// esiste. Ritorna Map<"minId-maxId", Set<lineId>>.
export function lineSegments() {
  const segments = new Map();
  const rows = db.prepare(`
    SELECT line_id, station_id, position
    FROM line_stations
    ORDER BY line_id, position
  `).all();
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const curr = rows[i];
    if (prev.line_id === curr.line_id) {
      const k = segmentKey(prev.station_id, curr.station_id);
      if (!segments.has(k)) segments.set(k, new Set());
      segments.get(k).add(curr.line_id);
    }
  }
  return segments;
}

// Insieme degli id delle stazioni di interscambio (servite da > 1 linea).
export function interchanges() {
  const rows = db.prepare(`
    SELECT station_id
    FROM line_stations
    GROUP BY station_id
    HAVING COUNT(DISTINCT line_id) > 1
  `).all();
  return new Set(rows.map((r) => r.station_id));
}

export { segmentKey };
