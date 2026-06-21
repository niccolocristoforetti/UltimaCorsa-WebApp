[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/iZes9Qfg)
# Exam #1: "Ultima Corsa"
## Student: s359369 CRISTOFORETTI NICCOLO' 

## React Client Application Routes

- Route `/`: Home pubblica, unica pagina visibile anche agli utenti anonimi. Mostra
  sempre le istruzioni di gioco; in cima, i bottoni "Gioca"/"Classifica" se l'utente è
  loggato, altrimenti un invito ad accedere.
- Route `/login`: form di accesso (username e password); non accessibile se già loggato (reindirizza alla Home).
- Route `/play`: partita completa (protetta). Tutto il gioco vive qui come macchina a
  stati interna (setup -> pianificazione -> esecuzione -> risultato -> classifica), senza
  cambi di URL.
- Route `/leaderboard`: classifica generale (protetta), come pagina a sé raggiungibile dalla Home.

## API Server

### Autenticazione
- POST `/api/sessions` - login.
  - body: `{ username, password }`
  - risposta: `{ id, username }` dell'utente.
  - errori: `401` con messaggio se le credenziali sono errate.
- GET `/api/sessions/current` - restituisce l'utente attualmente loggato.
  - nessun parametro
  - risposta: `{ id, username }`.
  - errori: `401` se non autenticato.
- DELETE `/api/sessions/current` - logout dell'utente corrente.
  - nessun parametro
  - risposta: `200` senza corpo.

### Rete metropolitana (richiedono autenticazione)
- GET `/api/network/full` - mappa completa per la fase di Setup.
  - nessun parametro
  - risposta: `{ stations: [{id, name, x, y}], lines: [{id, name, color, stations: [id...]}] }` con le coordinate delle stazioni e le stazioni di ogni linea in ordine.
  - errori: `401` se non autenticato.
- GET `/api/network/segments` - stazioni ed elenco delle tratte per la fase di Pianificazione, senza alcuna informazione sulle linee.
  - nessun parametro
  - risposta: `{ stations: [{id, name, x, y}], segments: [[idA, idB], ...] }`
  - errori: `401` se non autenticato.

### Partite (richiedono autenticazione)
- POST `/api/games` - crea una nuova partita; il server assegna casualmente partenza e arrivo a distanza di almeno 3 tratte.
  - nessun body
  - risposta: `{ id, start: {id, name, x, y}, end: {id, name, x, y} }`
  - errori: `401` se non autenticato.
- POST `/api/games/:id/route` - invia il percorso costruito; il server lo valida (anche rispetto ai 90 secondi), estrae un evento casuale per tratta e calcola il punteggio.
  - body: `{ route: [stationId, ...] }` (sequenza di stazioni, dalla partenza all'arrivo)
  - risposta: `{ valid: true, legs: [{from, fromName, to, toName, event: {description, effect}, coins}], score }` se il percorso è valido (i nomi delle stazioni di ogni tratta sono risolti dal server); `{ valid: false, score: 0 }` altrimenti (fase di esecuzione saltata).
  - errori: `401` se non autenticato; `404` se la partita non esiste o non è dell'utente; `409` se la partita è già conclusa; `422` se `route` non è un array di interi.
- GET `/api/leaderboard` - classifica generale: il miglior punteggio di ogni giocatore, in ordine decrescente.
  - nessun parametro
  - risposta: `[{ username, best }, ...]`
  - errori: `401` se non autenticato.

## Database Tables

- Tabella `stations` - le stazioni della rete (id, nome univoco, coordinate `x`/`y` per il rendering della mappa).
- Tabella `lines` - le linee della metro (id, nome univoco, colore per il rendering della mappa).
- Tabella `line_stations` - associazione ordinata stazione-linea (`position`). Codifica l'ordine della rete; le tratte e le stazioni di interscambio sono derivate da qui, non memorizzate.
- Tabella `events` - gli eventi casuali estratti durante il viaggio (descrizione + effetto da -4 a +4).
- Tabella `users` - gli utenti registrati (username, password memorizzata con hash e sale per-utente).
- Tabella `games` - le partite giocate (utente, stazioni di partenza/arrivo assegnate, stato, punteggio finale).

## Main React Components

- `App` (in `App.jsx`): radice dell'app, route principali e controllo sessione attiva al caricamento.
- `NavBar` (in `NavBar.jsx`): barra superiore, sempre visibile; mostra utente loggato e bottone di logout.
- `ProtectedRoute` (in `ProtectedRoute.jsx`): blocca le pagine riservate agli utenti registrati, rimandando un anonimo alla Home.
- `Home` (in `Home.jsx`): pagina pubblica con istruzioni di gioco; punto di accesso a gioco e classifica per chi è loggato.
- `LoginForm` (in `LoginForm.jsx`): form di accesso.
- `GamePage` (in `GamePage.jsx`): macchina a stati che gestisce l'intera partita, alternando le fasi sotto, senza mai cambiare URL.
- `SetupPhase` (in `SetupPhase.jsx`): mostra la rete completa (stazioni e linee) prima dell'inizio della pianificazione.
- `PlanningPhase` (in `PlanningPhase.jsx`): il giocatore ricostruisce il percorso entro 90 secondi; gestisce il countdown e l'invio (anche automatico, a tempo scaduto).
- `ExecutionPhase` (in `ExecutionPhase.jsx`): rivela il viaggio tappa per tappa con gli eventi e l'effetto sulle monete.
- `ResultPage` (in `ResultPage.jsx`): punteggio finale della partita appena conclusa.
- `Leaderboard` (in `Leaderboard.jsx`): classifica generale; riutilizzato sia come pagina (`/leaderboard`) sia come fase interna di `GamePage`.
- `NetworkMap` (in `NetworkMap.jsx`): mappa SVG della rete, condivisa fra Setup e Pianificazione (con o senza le linee colorate).
- `RouteBuilder` (in `RouteBuilder.jsx`): elenco delle tratte selezionabili durante la Pianificazione.

## Screenshot

![Classifica generale](./img/Classifica.png)

![Partita in corso](./img/Partita.png)

## Users Credentials

- `valerio`, `catullo`
- `romeo`, `montecchi` (ha già giocato alcune partite)
- `giulietta`, `capuleti` (ha già giocato alcune partite)

## Use of AI Tools

Utilizzato Claude per:
- Controllo e correzione su come strutturare la funzione `validateRoute` in `game.js`: confrontando il codice con i requisiti della traccia (cambio linea solo negli interscambi, ogni tratta usata una sola volta) e testandolo
- Supporto nell'implementazione di `bfsDistances` in `graph.js` verificando i risultati confrontando le distanze calcolate con quelle attese su alcune coppie di stazioni della rete
- Supporto nell'implementazione del CSS: verificando visivamente nel browser ogni modifica (colori, spaziature, layout) e correggendo a mano dove non corrispondeva a quanto volevo
- Supporto per la creazione dell'SVG della mappa verificando il risultato nel browser ad ogni modifica
- Supporto nella creazione di certi commenti di riepilogo del codice, rileggendoli e modificando alcune parti troppo macchinose
