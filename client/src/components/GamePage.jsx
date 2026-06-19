import { useState } from 'react'
import API from '../API'
import SetupPhase from './SetupPhase'
import PlanningPhase from './PlanningPhase'
import ExecutionPhase from './ExecutionPhase'
import ResultPage from './ResultPage'
import Leaderboard from './Leaderboard'

// Tutta la partita vive in questo componente come macchina a stati: setup → planning → execution → result (→ leaderboard interna). Cambio fase = cambio di stato, niente cambi di URL e nessun reload
function GamePage() {
  const [phase, setPhase] = useState('setup')

  // Dati condivisi fra le fasi: gameId/start/end dalla creazione partita, result dall'invio del percorso
  const [gameId, setGameId] = useState(null)
  const [start, setStart] = useState(null)
  const [end, setEnd] = useState(null)
  const [result, setResult] = useState(null)

  // Setup → Planning. createGame() stampa created_at lato server: è il t0 dei 90 secondi, quindi va chiamato qui e non prima
  async function handleReady() {
    const game = await API.createGame()
    setGameId(game.id)
    setStart(game.start)
    setEnd(game.end)
    setPhase('planning')
  }

  // Planning → Execution: PlanningPhase mi passa il percorso scelto (o quello parziale, se è scattato l'autosubmit), io lo invio al server e salvo il risultato
  async function handleSubmit(route) {
    const result = await API.submitRoute(gameId, route)
    setResult(result)
    setPhase('execution')
  }

  // Execution → Result: cronaca rivelata, mostro il punteggio finale.
  function handleFinished() {
    setPhase('result')
  }

  // Result → Setup: azzero lo stato e ricomincio da capo.
  function handleRestart() {
    setGameId(null)
    setStart(null)
    setEnd(null)
    setResult(null)
    setPhase('setup')
  }

  // Result → Leaderboard e ritorno: nessun cambio di URL, quindi nessuno smontaggio di GamePage e nessuna perdita di result
  function handleShowLeaderboard() {
    setPhase('leaderboard')
  }

  function handleBackFromLeaderboard() {
    setPhase('result')
  }

  if (phase === 'setup')
    return <SetupPhase onReady={handleReady} />

  if (phase === 'planning')
    return <PlanningPhase start={start} end={end} onSubmit={handleSubmit} />

  if (phase === 'execution')
    return <ExecutionPhase result={result} onFinished={handleFinished} />

  if (phase === 'result')
    return <ResultPage result={result} onRestart={handleRestart} onShowLeaderboard={handleShowLeaderboard} />

  if (phase === 'leaderboard')
    return <Leaderboard onBack={handleBackFromLeaderboard} />

  return null
}

export default GamePage
