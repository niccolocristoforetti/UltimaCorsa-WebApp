import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('ultima-corsa.db');
db.pragma('foreign_keys = ON');   // SQLite NON applica le FK di default: va acceso a ogni connessione

// --- Schema (6 tabelle) ---

db.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    id   INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT    NOT NULL UNIQUE
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

  // 1) Stazioni: inserisco e costruisco una mappa nome -> id (mai id hardcoded)
  const stationNames = [
    'Parona', 'Borgo Trento', 'Castelvecchio', 'Porta Nuova', 'Fiera',
    'Corso Milano', 'San Zeno', 'Piazza Bra', 'Veronetta', 'Porta Vescovo',
    'Borgo Venezia', 'Stadio Bentegodi', 'Santa Lucia', 'Borgo Roma',
    'Quinzano', 'Avesa', 'Ponte Pietra', 'Grezzana',
  ];
  const insertStation = db.prepare('INSERT INTO stations (name) VALUES (?)');
  const stationId = {};
  for (const name of stationNames) {
    stationId[name] = insertStation.run(name).lastInsertRowid;
  }

  // 2) Linee: inserisco e costruisco mappa nome -> id
  const lineDefs = [
    { name: 'Gialla', color: '#f1c40f' },
    { name: 'Blu',    color: '#2980b9' },
    { name: 'Verde',  color: '#27ae60' },
    { name: 'Nera',   color: '#2c3e50' },
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

export default db;
