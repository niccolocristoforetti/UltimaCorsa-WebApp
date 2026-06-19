const BASE = 'http://localhost:3001/api'

// I componenti usano solo try/catch senza toccare res.ok o il JSON di errore.

async function login(username, password) {
  const res = await fetch(`${BASE}/sessions`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function logout() {
  await fetch(`${BASE}/sessions/current`, {
    method: 'DELETE',
    credentials: 'include',
  })
}

async function getCurrentUser() {
  const res = await fetch(`${BASE}/sessions/current`, { credentials: 'include' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function getNetworkFull() {
  const res = await fetch(`${BASE}/network/full`, { credentials: 'include' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function getNetworkSegments() {
  const res = await fetch(`${BASE}/network/segments`, { credentials: 'include' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function createGame() {
  const res = await fetch(`${BASE}/games`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function submitRoute(gameId, route) {
  const res = await fetch(`${BASE}/games/${gameId}/route`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ route }),
  })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

async function getLeaderboard() {
  const res = await fetch(`${BASE}/leaderboard`, { credentials: 'include' })
  if (!res.ok) throw new Error((await res.json()).error)
  return res.json()
}

const API = { login, logout, getCurrentUser, getNetworkFull, getNetworkSegments, createGame, submitRoute, getLeaderboard }
export default API
