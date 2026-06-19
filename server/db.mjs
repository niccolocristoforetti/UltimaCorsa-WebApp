import Database from 'better-sqlite3';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

// Percorso assoluto ancorato a questo file, non relativo alla cwd: evita di creare il DB altrove se lancio il server da una cartella diversa
const dbPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'ultima-corsa.db');
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');   // SQLite NON applica le FK di default: va acceso a ogni connessione

// --- Schema (6 tabelle) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE,
    x    INTEGER NOT NULL,                -- coordinate fisse per disegnare la mappa (la rete non cambia)
    y    INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lines (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    color TEXT    NOT NULL          -- hex per disegnare la linea sulla mappa
  );

  -- Junction table: collega stazioni e linee dando un ORDINE (position).
  -- Da qui derivano adiacenza, tratte e stazioni di interscambio.
  CREATE TABLE IF NOT EXISTS line_stations (
    line_id    INTEGER NOT NULL REFERENCES lines(id),
    station_id INTEGER NOT NULL REFERENCES stations(id),
    position   INTEGER NOT NULL,
    PRIMARY KEY (line_id, station_id),   -- una stazione compare al massimo 1 volta per linea
    UNIQUE (line_id, position)           -- due stazioni non occupano la stessa posizione
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    description TEXT    NOT NULL,
    effect      INTEGER NOT NULL CHECK (effect BETWEEN -4 AND 4)  -- vincolo della traccia nel DB
  );

  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT    NOT NULL UNIQUE,
    hash     TEXT    NOT NULL,   -- password hashed (scrypt)
    salt     TEXT    NOT NULL    -- sale per-utente
  );

  CREATE TABLE IF NOT EXISTS games (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id),
    start_station_id INTEGER NOT NULL REFERENCES stations(id),
    end_station_id   INTEGER NOT NULL REFERENCES stations(id),
    status           TEXT    NOT NULL DEFAULT 'playing'
                       CHECK (status IN ('playing', 'completed')),
    score            INTEGER,                       -- NULL finché non completata, poi >= 0
    created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- Seed (gira solo se il DB è vuoto) ---

if (db.prepare('SELECT COUNT(*) AS n FROM stations').get().n === 0) {

  // 1) Stazioni con coordinate: layout octolineare stile metro di Londra (solo segmenti a 0/45/90 gradi, passo regolare di 100), interscambi (Castelvecchio, Porta Nuova, Veronetta) sugli incroci, nessuna intersezione fuori da essi
  const stationDefs = [
    { name: 'Parona',           x: 100, y: 100 },
    { name: 'Borgo Trento',     x: 200, y: 200 },
    { name: 'Castelvecchio',    x: 300, y: 300 },
    { name: 'Porta Nuova',      x: 300, y: 400 },
    { name: 'Fiera',            x: 300, y: 500 },
    { name: 'Corso Milano',     x: 100, y: 300 },
    { name: 'San Zeno',         x: 200, y: 300 },
    { name: 'Piazza Bra',       x: 400, y: 300 },
    { name: 'Veronetta',        x: 500, y: 300 },
    { name: 'Porta Vescovo',    x: 600, y: 300 },
    { name: 'Borgo Venezia',    x: 700, y: 300 },
    { name: 'Stadio Bentegodi', x: 100, y: 400 },
    { name: 'Santa Lucia',      x: 200, y: 400 },
    { name: 'Borgo Roma',       x: 400, y: 400 },
    { name: 'Quinzano',         x: 200, y:   0 },
    { name: 'Avesa',            x: 300, y: 100 },
    { name: 'Ponte Pietra',     x: 400, y: 200 },
    { name: 'Grezzana',         x: 600, y: 200 },
  ];
  const insertStation = db.prepare('INSERT INTO stations (name, x, y) VALUES (?, ?, ?)');
  const stationId = {};
  for (const s of stationDefs) {
    stationId[s.name] = insertStation.run(s.name, s.x, s.y).lastInsertRowid;
  }

  // 2) Linee: inserisco e costruisco mappa nome -> id
  const lineDefs = [
    { name: 'Gialla', color: '#f1c40f' },
    { name: 'Blu',    color: '#1a5276' },
    { name: 'Verde',  color: '#27ae60' },
    { name: 'Nera',   color: '#000000' },
  ];
  const insertLine = db.prepare('INSERT INTO lines (name, color) VALUES (?, ?)');
  const lineId = {};
  for (const l of lineDefs) {
    lineId[l.name] = insertLine.run(l.name, l.color).lastInsertRowid;
  }

  // 3) line_stations: la rete come sequenze ORDINATE. La position è l'indice nell'array.
  const network = {
    Gialla: ['Parona', 'Borgo Trento', 'Castelvecchio', 'Porta Nuova', 'Fiera'],
    Blu:    ['Corso Milano', 'San Zeno', 'Castelvecchio', 'Piazza Bra', 'Veronetta', 'Porta Vescovo', 'Borgo Venezia'],
    Verde:  ['Stadio Bentegodi', 'Santa Lucia', 'Porta Nuova', 'Borgo Roma'],
    Nera:   ['Quinzano', 'Avesa', 'Ponte Pietra', 'Veronetta', 'Grezzana'],
  };
  const insertLineStation = db.prepare(
    'INSERT INTO line_stations (line_id, station_id, position) VALUES (?, ?, ?)'
  );
  for (const [line, stations] of Object.entries(network)) {
    stations.forEach((name, position) => {
      insertLineStation.run(lineId[line], stationId[name], position);
    });
  }

  // 4) Eventi (10, effetti distribuiti da -4 a +4)
  const events = [
    ['Riesci a prendere la coincidenza', 0],
    ['Una nonna in carrozza ti offre la pearà da passeggio', 1],
    ['Vagone quasi vuoto: viaggi comodo fino al centro', 1],
    ['La metro viaggia in orario', 2],
    ['Un passeggero ti offre un goto di Amarone', 3],
    ['Trovi un biglietto ATV ancora valido sul sedile', 4],
    ['Il convoglio rallenta per un guasto sulla linea', -1],
    ['Linea deviata per il Tocatì: cambio al volo', -2],
    ['Sciopero ATV improvviso: corsa soppressa, paghi il taxi', -3],
    ['Allagamento in galleria: il convoglio resta bloccato', -4],
  ];
  const insertEvent = db.prepare('INSERT INTO events (description, effect) VALUES (?, ?)');
  for (const [description, effect] of events) {
    insertEvent.run(description, effect);
  }

  // 5) Utenti (password hashed con scrypt + sale). Credenziali per il README:
  //    valerio / catullo   |   romeo / montecchi   |   giulietta / capuleti
  const insertUser = db.prepare('INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)');
  const userId = {};
  const seedUsers = [
    ['valerio', 'catullo'],
    ['romeo', 'montecchi'],
    ['giulietta', 'capuleti'],
  ];
  for (const [username, password] of seedUsers) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 32).toString('hex');
    userId[username] = insertUser.run(username, hash, salt).lastInsertRowid;
  }

  // 6) Partite completate: giulietta e romeo hanno già giocato con successo
  const insertGame = db.prepare(`
    INSERT INTO games (user_id, start_station_id, end_station_id, status, score, created_at)
    VALUES (?, ?, ?, 'completed', ?, ?)
  `);
  const seedGames = [
    ['giulietta', 'Parona', 'Fiera',        24, '2026-05-20 18:30:00'],
    ['giulietta', 'Grezzana', 'Borgo Roma', 31, '2026-05-22 10:15:00'],
    ['giulietta', 'Corso Milano', 'Veronetta', 18, '2026-05-25 21:00:00'],
    ['romeo',     'Borgo Venezia', 'Stadio Bentegodi', 27, '2026-05-21 09:45:00'],
    ['romeo',     'Fiera', 'Quinzano',      15, '2026-05-24 14:20:00'],
  ];
  for (const [username, start, end, score, createdAt] of seedGames) {
    insertGame.run(userId[username], stationId[start], stationId[end], score, createdAt);
  }

  console.log('Database creato e popolato.');
}

// --- Query per la rete ---

export function getStations() {
  return db.prepare('SELECT id, name, x, y FROM stations').all();
}

// Linee con le rispettive stazioni in ordine di percorrenza (position).
export function getLinesWithStations() {
  const lines = db.prepare('SELECT id, name, color FROM lines').all();
  const stmt = db.prepare(`
    SELECT station_id FROM line_stations
    WHERE line_id = ? ORDER BY position
  `);
  return lines.map((l) => ({
    ...l,
    stations: stmt.all(l.id).map((r) => r.station_id),
  }));
}

// --- Query per le partite ---

// Crea una partita in corso: lo score resta NULL finché non viene completata.
export function createGame(userId, startId, endId) {
  const info = db.prepare(`
    INSERT INTO games (user_id, start_station_id, end_station_id)
    VALUES (?, ?, ?)
  `).run(userId, startId, endId);
  return db.prepare('SELECT * FROM games WHERE id = ?').get(info.lastInsertRowid);
}

export function getEvents() {
  return db.prepare('SELECT id, description, effect FROM events').all();
}

export function getGameById(id) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

export function completeGame(id, score) {
  db.prepare("UPDATE games SET status = 'completed', score = ? WHERE id = ?").run(score, id);
}

// Classifica generale: un solo dato per giocatore, il suo miglior punteggio.
export function getLeaderboard() {
  return db.prepare(`
    SELECT u.username, MAX(g.score) AS best
    FROM games g JOIN users u ON u.id = g.user_id
    WHERE g.status = 'completed'
    GROUP BY u.id
    ORDER BY best DESC
  `).all();
}

// --- Query per l'autenticazione ---

// Utente completo (con hash e salt): serve a verificare la password al login.
export function getUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

// Solo i campi sicuri (NO hash/salt): usato da deserializeUser per popolare req.user.
export function getUserById(id) {
  return db.prepare('SELECT id, username FROM users WHERE id = ?').get(id);
}

export default db;
