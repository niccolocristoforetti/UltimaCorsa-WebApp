import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';
// L'import di db.mjs inizializza schema e dati (il seed parte solo se il DB è vuoto).
import {
  getUserByUsername, getUserById, getStations, getLinesWithStations,
  createGame, getGameById, completeGame, getLeaderboard,
} from './db.mjs';
import { buildAdjacency, bfsDistances, lineSegments } from './graph.js';
import { validateRoute, playRoute } from './game.js';

// La rete è fissa per tutta la vita del server: costruisco grafo e tratte una volta sola.
const adjacency = buildAdjacency();
const segments = [...lineSegments().keys()].map((k) => k.split('-').map(Number));

// Mescola in una nuova copia, non tocca l'array originale.
function shuffled(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Autenticazione locale: username + password verificata con scrypt e sale.
passport.use(new LocalStrategy((username, password, done) => {
  const user = getUserByUsername(username);
  if (!user) return done(null, false, { message: 'Credenziali errate' });

  crypto.scrypt(password, user.salt, 32, (err, derivedKey) => {
    if (err) return done(err);
    const storedHash = Buffer.from(user.hash, 'hex');
    // Confronto a tempo costante: evita di trapelare informazioni tramite il timing.
    const ok = storedHash.length === derivedKey.length &&
               crypto.timingSafeEqual(storedHash, derivedKey);
    if (!ok) return done(null, false, { message: 'Credenziali errate' });
    // Espongo solo i campi non sensibili: hash e salt restano nel DB.
    return done(null, { id: user.id, username: user.username });
  });
}));

// In sessione tengo solo l'id; l'utente completo lo recupero quando serve.
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, getUserById(id)));

const app = express();
const port = 3001;

// Client e server sono su origini diverse: abilito la mia origine e i cookie di sessione.
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
// La sessione gestisce il cookie e mi mette a disposizione req.session.
app.use(session({
  secret: 'ultima-corsa-secret',   // andrebbe in una variabile d'ambiente
  resave: false,
  saveUninitialized: false,
}));
// Passport si appoggia alla sessione, quindi va dopo.
app.use(passport.initialize());
app.use(passport.session());

// Blocca le richieste non autenticate sulle rotte riservate.
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  return res.status(401).json({ error: 'Non autenticato' });
}

// Login: verifico le credenziali e, se valide, apro la sessione.
app.post('/api/sessions', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message });
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json(req.user);
    });
  })(req, res, next);
});

// Utente loggato corrente (401 se nessuno è loggato).
app.get('/api/sessions/current', isLoggedIn, (req, res) => {
  res.json(req.user);
});

// Logout: chiudo la sessione corrente.
app.delete('/api/sessions/current', (req, res) => {
  req.logout(() => res.end());
});

// Mappa completa (fase di Setup): stazioni e linee con l'ordine di percorrenza.
app.get('/api/network/full', isLoggedIn, (req, res) => {
  res.json({ stations: getStations(), lines: getLinesWithStations() });
});

// Vista per la Pianificazione: stazioni e tratte, volutamente SENZA le linee.
// Ricostruire la rete a memoria è il cuore del gioco. L'elenco arriva mescolato
// (non raggruppato per linea) e in un ordine diverso ad ogni richiesta, altrimenti
// memorizzare la posizione sullo schermo diventerebbe una scorciatoia.
app.get('/api/network/segments', isLoggedIn, (req, res) => {
  res.json({ stations: getStations(), segments: shuffled(segments) });
});

// Nuova partita: il server assegna partenza e arrivo casuali a distanza >= 3 tratte.
app.post('/api/games', isLoggedIn, (req, res) => {
  const stations = getStations();
  const start = stations[Math.floor(Math.random() * stations.length)];
  // Le distanze BFS da start: ogni stazione della rete ha almeno una candidata a
  // distanza >= 3 (il raggio dell'albero è superiore), quindi la scelta esiste sempre.
  const dist = bfsDistances(adjacency, start.id);
  const candidates = stations.filter((s) => (dist.get(s.id) ?? 0) >= 3);
  const end = candidates[Math.floor(Math.random() * candidates.length)];

  const game = createGame(req.user.id, start.id, end.id);
  res.json({ id: game.id, start, end });
});

// Invio del percorso: valido tutto lato server (proprietà, tempo, regole) e,
// se il percorso è buono, eseguo il viaggio estraendo un evento per tratta.
app.post('/api/games/:id/route', isLoggedIn, (req, res) => {
  const game = getGameById(Number(req.params.id));
  // 404 anche per partite altrui: non rivelo l'esistenza di risorse non mie.
  if (!game || game.user_id !== req.user.id) {
    return res.status(404).json({ error: 'Partita non trovata' });
  }
  if (game.status !== 'playing') {
    return res.status(409).json({ error: 'Partita già conclusa' });
  }

  const route = req.body?.route;
  if (!Array.isArray(route) || !route.every(Number.isInteger)) {
    return res.status(422).json({ error: 'Percorso malformato' });
  }

  // I 90 secondi vanno verificati qui, non solo nel client (created_at è UTC).
  // Tolleranza di 5s per la latenza di rete e l'autosubmit allo scadere.
  const elapsed = (Date.now() - new Date(game.created_at.replace(' ', 'T') + 'Z').getTime()) / 1000;
  const inTime = elapsed <= 95;

  const valid = inTime && validateRoute(route, game.start_station_id, game.end_station_id);
  if (!valid) {
    // Percorso invalido o fuori tempo: esecuzione saltata, si perdono le 20 monete.
    completeGame(game.id, 0);
    return res.json({ valid: false, score: 0 });
  }

  const { legs, score } = playRoute(route);
  completeGame(game.id, score);
  res.json({ valid: true, legs, score });
});

// Classifica generale: miglior punteggio di ogni giocatore, in ordine decrescente.
app.get('/api/leaderboard', isLoggedIn, (req, res) => {
  res.json(getLeaderboard());
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
