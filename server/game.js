import { lineSegments, interchanges, segmentKey } from './graph.js';
import { getEvents, getStations } from './db.mjs';

// Esegue il viaggio su un percorso già validato: un evento casuale per tratta,
// monete da 20 in giù/su, punteggio finale mai negativo (floor a 0).
export function playRoute(route) {
  const events = getEvents();
  // Mappa id->nome costruita una volta: la cronaca porta già i nomi, così il client non deve avere l'intera lista stazioni solo per tradurre gli id
  const nameById = new Map(getStations().map((s) => [s.id, s.name]));
  let coins = 20;
  const legs = [];
  for (let i = 1; i < route.length; i++) {
    const event = events[Math.floor(Math.random() * events.length)];
    coins += event.effect;
    legs.push({
      from: route[i - 1],
      fromName: nameById.get(route[i - 1]),
      to: route[i],
      toName: nameById.get(route[i]),
      event: { description: event.description, effect: event.effect },
      coins,
    });
  }
  return { legs, score: Math.max(0, coins) };
}

// Verifica che un percorso (array di id stazione) sia valido:
//  1) parte da startId,
//  2) arriva a endId,
//  3) ogni tratta è un'adiacenza reale,
//  4) i cambi di linea avvengono solo nelle stazioni di interscambio,
//  5) nessuna tratta è usata più di una volta (selezionabile una sola volta per partita).
// La traccia consente in generale di ripetere una STAZIONE (in tratte diverse); su questa rete, che è un albero, ciò non può comunque accadere (servirebbe riusare una tratta).
// Ritorna true/false.
export function validateRoute(route, startId, endId) {
  // 1-2) deve essere un array con almeno una tratta, con estremi corretti
  if (!Array.isArray(route) || route.length < 2) return false;
  if (route[0] !== startId || route[route.length - 1] !== endId) return false;

  const segments = lineSegments();
  const interchange = interchanges();

  // 3-5) percorro tratta per tratta: linee possibili + tratte già usate
  const usedSegments = new Set();
  let possible = null;
  for (let i = 1; i < route.length; i++) {
    const junction = route[i - 1];           // stazione tra la tratta precedente e questa
    const key = segmentKey(route[i - 1], route[i]);
    const lines = segments.get(key);
    if (!lines) return false;                // tratta inesistente: stazioni non adiacenti
    if (usedSegments.has(key)) return false; // tratta già usata: selezionabile una sola volta
    usedSegments.add(key);

    if (i === 1) {
      possible = new Set(lines);             // prima tratta: qualsiasi linea che la contiene
    } else if (interchange.has(junction)) {
      possible = new Set(lines);             // interscambio: posso cambiare linea liberamente
    } else {
      // stazione normale: devo restare su una linea già in corso (intersezione).
      // Verifica fatta per requisito della traccia, non perché ci siano segmenti paralleli (la rete non ne ha): con tratte mono-linea l'intersezione è banale.
      possible = new Set([...possible].filter((l) => lines.has(l)));
      if (possible.size === 0) return false; // cambio di linea fuori da un interscambio
    }
  }
  return true;
}
