[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iZes9Qfg)
# Exam #1: "Ultima Corsa"
## Student: s359369 CRISTOFORETTI NICCOLO' 

## React Client Application Routes

- Route `/`: page content and purpose
- Route `/something/:param`: page content and purpose, param specification
- ...

## API Server

### Autenticazione
- POST `/api/sessions` - login.
  - body: `{ username, password }`
  - risposta: `{ id, username }` dell'utente, oppure `401` con messaggio se le credenziali sono errate.
- GET `/api/sessions/current` - restituisce l'utente attualmente loggato.
  - nessun parametro
  - risposta: `{ id, username }` se autenticato, altrimenti `401`.
- DELETE `/api/sessions/current` - logout dell'utente corrente.
  - nessun parametro
  - risposta: `200` senza corpo.

### Rete metropolitana (richiedono autenticazione)
- GET `/api/network/full` - mappa completa per la fase di Setup.
  - nessun parametro
  - risposta: `{ stations: [{id, name}], lines: [{id, name, color, stations: [id...]}] }` con le stazioni di ogni linea in ordine.
- GET `/api/network/segments` - stazioni ed elenco delle tratte per la fase di Pianificazione, senza alcuna informazione sulle linee.
  - nessun parametro
  - risposta: `{ stations: [{id, name}], segments: [[idA, idB], ...] }`

### Partite (richiedono autenticazione)
- POST `/api/games` - crea una nuova partita; il server assegna casualmente partenza e arrivo a distanza di almeno 3 tratte.
  - nessun body
  - risposta: `{ id, start: {id, name}, end: {id, name} }`

## Database Tables

- Tabella `stations` - le stazioni della rete (id, nome univoco).
- Tabella `lines` - le linee della metro (id, nome univoco, colore per il rendering della mappa).
- Tabella `line_stations` - associazione ordinata stazione-linea (`position`). Codifica l'ordine della rete; le tratte e le stazioni di interscambio sono derivate da qui, non memorizzate.
- Tabella `events` - gli eventi casuali estratti durante il viaggio (descrizione + effetto da -4 a +4).
- Tabella `users` - gli utenti registrati (username, password memorizzata con hash e sale per-utente).
- Tabella `games` - le partite giocate (utente, stazioni di partenza/arrivo assegnate, stato, punteggio finale).

## Main React Components

- `ListOfSomething` (in `List.js`): component purpose and main functionality
- `GreatButton` (in `GreatButton.js`): component purpose and main functionality
- ...

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](./img/screenshot.jpg)

## Users Credentials

- `valerio`, `catullo`
- `romeo`, `montecchi` (ha già giocato alcune partite)
- `giulietta`, `capuleti` (ha già giocato alcune partite)

## Use of AI Tools
Briefly describe whether you used any AI tools (e.g., ChatGPT, GitHub Copilot, Claude) while working on this project, for which purposes (e.g., clarifying concepts, debugging, generating code), and how you verified or adapted their output.
If you did not use any AI tools, simply state so.
