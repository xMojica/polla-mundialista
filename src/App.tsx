import { useEffect, useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import './App.css'
import { defaultPoolState } from './data/defaultData'
import { getStandings, getWinnersByMatch } from './lib/scoring'
import {
  getSyncMode,
  loadPoolState,
  savePoolState,
  subscribeToPoolState,
} from './lib/poolStore'
import type { Match, PoolState } from './types'

type DraftScores = Record<string, { home: string; away: string }>
const ADMIN_SESSION_KEY = 'polla-admin-enabled'
const adminAccessCode = import.meta.env.VITE_ADMIN_ACCESS_CODE?.trim()

function createEmptyDraft(matches: Match[]) {
  return matches.reduce<DraftScores>((draft, match) => {
    draft[match.id] = { home: '', away: '' }
    return draft
  }, {})
}

function createResultDraft(matches: Match[]) {
  return matches.reduce<DraftScores>((draft, match) => {
    draft[match.id] = {
      home: match.actualScore?.home.toString() ?? '',
      away: match.actualScore?.away.toString() ?? '',
    }
    return draft
  }, {})
}

function App() {
  const [poolState, setPoolState] = useState<PoolState>(defaultPoolState)
  const [participantName, setParticipantName] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [participantDraft, setParticipantDraft] = useState(() =>
    createEmptyDraft(defaultPoolState.matches),
  )
  const [resultDraft, setResultDraft] = useState(() => createResultDraft(defaultPoolState.matches))
  const [syncMode, setSyncMode] = useState<'local' | 'supabase'>(getSyncMode())
  const [saving, setSaving] = useState(false)
  const [isAdmin, setIsAdmin] = useState(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(ADMIN_SESSION_KEY) === 'true'
  })

  useEffect(() => {
    let mounted = true

    void loadPoolState().then((loadedState) => {
      if (!mounted) {
        return
      }

      setPoolState(loadedState)
      setResultDraft(createResultDraft(loadedState.matches))
      setSyncMode(getSyncMode())
    })

    const unsubscribe = subscribeToPoolState((nextState) => {
      if (!mounted) {
        return
      }

      setPoolState(nextState)
      setResultDraft(createResultDraft(nextState.matches))
      setSyncMode(getSyncMode())
    })

    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const standings = useMemo(() => getStandings(poolState), [poolState])
  const sortedStandings = useMemo(
    () =>
      [...standings].sort(
        (left, right) =>
          left.rank - right.rank ||
          right.exactHits - left.exactHits ||
          left.participant.name.localeCompare(right.participant.name, 'es'),
      ),
    [standings],
  )
  const resolvedMatches = useMemo(
    () => poolState.matches.filter((match) => match.actualScore !== null).length,
    [poolState.matches],
  )
  const topRank = sortedStandings[0]?.rank ?? null
  const leaders = topRank === null ? [] : sortedStandings.filter((entry) => entry.rank === topRank)
  const bestScore = sortedStandings[0]?.exactHits ?? 0

  async function persistState(nextState: PoolState) {
    setSaving(true)

    try {
      const savedState = await savePoolState(nextState)
      setPoolState(savedState)
      setSyncMode(getSyncMode())
    } finally {
      setSaving(false)
    }
  }

  function handleParticipantScoreChange(matchId: string, side: 'home' | 'away', value: string) {
    setParticipantDraft((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [side]: value,
      },
    }))
  }

  function handleResultChange(matchId: string, side: 'home' | 'away', value: string) {
    setResultDraft((current) => ({
      ...current,
      [matchId]: {
        ...current[matchId],
        [side]: value,
      },
    }))
  }

  async function handleSaveResults() {
    const nextMatches = poolState.matches.map((match) => {
      const draft = resultDraft[match.id]

      if (!draft.home || !draft.away) {
        return {
          ...match,
          actualScore: null,
        }
      }

      return {
        ...match,
        actualScore: {
          home: Number(draft.home),
          away: Number(draft.away),
        },
      }
    })

    await persistState({
      ...poolState,
      matches: nextMatches,
    })
  }

  async function handleAddParticipant(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!isAdmin) {
      window.alert('Solo un administrador puede agregar participantes.')
      return
    }

    const trimmedName = participantName.trim()
    if (!trimmedName) {
      return
    }

    const hasIncompleteScores = poolState.matches.some((match) => {
      const prediction = participantDraft[match.id]
      return !prediction.home || !prediction.away
    })

    if (hasIncompleteScores) {
      window.alert('Completa todos los marcadores antes de guardar el participante.')
      return
    }

    const participant = {
      id: uuid(),
      name: trimmedName,
      createdAt: new Date().toISOString(),
      predictions: poolState.matches.reduce<Record<string, { home: number; away: number }>>(
        (accumulator, match) => {
          accumulator[match.id] = {
            home: Number(participantDraft[match.id].home),
            away: Number(participantDraft[match.id].away),
          }
          return accumulator
        },
        {},
      ),
    }

    await persistState({
      ...poolState,
      participants: [...poolState.participants, participant],
    })

    setParticipantName('')
    setParticipantDraft(createEmptyDraft(poolState.matches))
  }

  function handleAdminUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!adminAccessCode) {
      window.alert('Configura VITE_ADMIN_ACCESS_CODE para habilitar la edicion de resultados.')
      return
    }

    if (adminCode !== adminAccessCode) {
      window.alert('Codigo de administrador invalido.')
      return
    }

    window.localStorage.setItem(ADMIN_SESSION_KEY, 'true')
    setIsAdmin(true)
    setAdminCode('')
  }

  function handleAdminLogout() {
    window.localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAdmin(false)
    setAdminCode('')
  }

  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Polla mundialista en vivo</p>
          <h1>{poolState.title}</h1>
          <p className="hero-copy">{poolState.subtitle}</p>
        </div>

        <div className="hero-stats">
          <article className="stat-card">
            <span className="stat-label">Participantes</span>
            <strong>{poolState.participants.length}</strong>
          </article>
          <article className="stat-card">
            <span className="stat-label">Partidos cerrados</span>
            <strong>
              {resolvedMatches}/{poolState.matches.length}
            </strong>
          </article>
          <article className="stat-card accent">
            <span className="stat-label">Valor por entrada</span>
            <strong>{poolState.prize}</strong>
          </article>
        </div>
      </header>

      <section className="status-bar">
        <span className={`status-pill ${syncMode}`}>{syncMode === 'supabase' ? 'En vivo' : 'Solo local'}</span>
        <span className={`status-pill ${isAdmin ? 'admin' : 'viewer'}`}>
          {isAdmin ? 'Administrador' : 'Vista publica'}
        </span>
        <span className="status-copy">
          {saving ? 'Guardando cambios...' : `Ultima actualizacion: ${new Date(poolState.updatedAt).toLocaleString('es-CO')}`}
        </span>
      </section>

      <main className="content-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Ranking en vivo</h2>
            </div>
          </div>

          <div className="leaderboard-summary">
            <article className="summary-card summary-card-primary">
              <span className="summary-label">Lideran</span>
              <strong>{leaders.length > 0 ? leaders.map((entry) => entry.participant.name).join(', ') : 'Sin datos'}</strong>
              <span>{bestScore} aciertos exactos</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Puesto compartido</span>
              <strong>{topRank ?? '-'}</strong>
              <span>{leaders.length} participante(s)</span>
            </article>
            <article className="summary-card">
              <span className="summary-label">Partidos resueltos</span>
              <strong>
                {resolvedMatches}/{poolState.matches.length}
              </strong>
              <span>marcadores oficiales</span>
            </article>
          </div>

          <div className="table-wrap">
            <table className="prediction-table">
              <thead>
                <tr>
                  <th className="rank-head">Puesto</th>
                  <th className="participant-head">Participante</th>
                  {poolState.matches.map((match) => (
                    <th key={match.id}>
                      <div className="match-column-head">
                        <strong>{match.homeTeam}</strong>
                        <span>vs</span>
                        <strong>{match.awayTeam}</strong>
                        <small>{match.kickoff}</small>
                      </div>
                    </th>
                  ))}
                  <th>Aciertos</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((entry) => (
                  <tr key={entry.participant.id}>
                    <td className="rank-cell">#{entry.rank}</td>
                    <td className="participant-cell">{entry.participant.name}</td>
                    {poolState.matches.map((match) => {
                      const prediction = entry.participant.predictions[match.id]
                      const isWinner =
                        !!match.actualScore &&
                        prediction.home === match.actualScore.home &&
                        prediction.away === match.actualScore.away

                      return (
                        <td key={match.id} className={isWinner ? 'hit-cell' : ''}>
                          <span className="prediction-chip">
                            {prediction.home} - {prediction.away}
                          </span>
                        </td>
                      )
                    })}
                    <td className="total-cell">{entry.exactHits}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="sidebar">
          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Resultados oficiales</h2>
              </div>
            </div>

            <div className="match-list">
              {poolState.matches.map((match) => {
                const winners = getWinnersByMatch(match, poolState.participants)

                return (
                  <article className="match-card" key={match.id}>
                    <div className="match-card-head">
                      <span className="match-kickoff">{match.kickoff}</span>
                      <span className={`match-state ${match.actualScore ? 'closed' : 'open'}`}>
                        {match.actualScore ? 'Final' : 'Pendiente'}
                      </span>
                    </div>

                    <div className="match-scoreboard">
                      <div className="team-block">
                        <span className="team-side">Local</span>
                        <strong>{match.homeTeam}</strong>
                      </div>

                      {isAdmin ? (
                        <label className="score-editor">
                          <input
                            inputMode="numeric"
                            min="0"
                            type="number"
                            value={resultDraft[match.id]?.home ?? ''}
                            onChange={(event) =>
                              handleResultChange(match.id, 'home', event.target.value)
                            }
                          />
                          <span>-</span>
                          <input
                            inputMode="numeric"
                            min="0"
                            type="number"
                            value={resultDraft[match.id]?.away ?? ''}
                            onChange={(event) =>
                              handleResultChange(match.id, 'away', event.target.value)
                            }
                          />
                        </label>
                      ) : (
                        <div className="official-score">
                          {match.actualScore ? (
                            <strong>
                              {match.actualScore.home} - {match.actualScore.away}
                            </strong>
                          ) : (
                            <span>-</span>
                          )}
                        </div>
                      )}

                      <div className="team-block team-block-away">
                        <span className="team-side">Visitante</span>
                        <strong>{match.awayTeam}</strong>
                      </div>
                    </div>

                    <div className="winners-list">
                      <span>Acertaron</span>
                      {winners.length > 0 ? (
                        <div className="winner-chips">
                          {winners.map((participant) => (
                            <span className="winner-chip" key={participant.id}>
                              {participant.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="muted">
                          {match.actualScore ? 'Sin aciertos exactos.' : 'Sin resultado oficial.'}
                        </p>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {isAdmin && (
              <button className="primary-button results-button" onClick={() => void handleSaveResults()} type="button">
                Guardar resultados
              </button>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2>Acceso administrador</h2>
              </div>
            </div>

            <div className="admin-access">
              {isAdmin ? (
                <button className="secondary-button" onClick={handleAdminLogout} type="button">
                  Cerrar sesion de administrador
                </button>
              ) : (
                <form className="admin-form" onSubmit={handleAdminUnlock}>
                  <label className="field">
                    <span>Codigo de administrador</span>
                    <input
                      placeholder="Ingresa tu codigo"
                      type="password"
                      value={adminCode}
                      onChange={(event) => setAdminCode(event.target.value)}
                    />
                  </label>
                  <button className="secondary-button" type="submit">
                    Entrar como administrador
                  </button>
                </form>
              )}
            </div>
          </section>

          {isAdmin && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2>Agregar participante</h2>
                </div>
              </div>

              <form className="participant-form" onSubmit={(event) => void handleAddParticipant(event)}>
                <label className="field">
                  <span>Nombre del participante</span>
                  <input
                    maxLength={80}
                    placeholder="Ej. Maria Fernanda"
                    value={participantName}
                    onChange={(event) => setParticipantName(event.target.value)}
                  />
                </label>

                <div className="prediction-form-grid">
                  {poolState.matches.map((match) => (
                    <div className="prediction-editor" key={match.id}>
                      <span>
                        {match.homeTeam} vs {match.awayTeam}
                      </span>
                      <div className="compact-score">
                        <input
                          inputMode="numeric"
                          min="0"
                          type="number"
                          placeholder="0"
                          value={participantDraft[match.id]?.home ?? ''}
                          onChange={(event) =>
                            handleParticipantScoreChange(match.id, 'home', event.target.value)
                          }
                        />
                        <span>-</span>
                        <input
                          inputMode="numeric"
                          min="0"
                          type="number"
                          placeholder="0"
                          value={participantDraft[match.id]?.away ?? ''}
                          onChange={(event) =>
                            handleParticipantScoreChange(match.id, 'away', event.target.value)
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="primary-button" type="submit">
                  Guardar participante
                </button>
              </form>
            </section>
          )}
        </aside>
      </main>

      <footer className="app-footer">
        <div className="footer-card">
          <span className="footer-label">Responsable</span>
          <strong className="footer-name">Alirio Mojica</strong>
          <a className="footer-link" href="tel:3206133984">
            3206133984
          </a>
        </div>

        <div className="footer-card footer-card-highlight">
          <span className="footer-label">Desarrollo</span>
          <strong className="footer-name">Santiago Mojica</strong>
          <a
            className="footer-social"
            href="https://www.linkedin.com/in/santiagomojica/"
            rel="noreferrer"
            target="_blank"
          >
            <svg
              aria-hidden="true"
              className="linkedin-icon"
              viewBox="0 0 24 24"
            >
              <path d="M6.94 8.5H3.56V20h3.38V8.5ZM5.25 3A1.97 1.97 0 1 0 5.3 6.94 1.97 1.97 0 0 0 5.25 3Zm15.19 9.82c0-3.46-1.85-5.07-4.32-5.07-1.99 0-2.88 1.09-3.38 1.86V8.5H9.37c.04.74 0 11.5 0 11.5h3.37v-6.42c0-.34.03-.68.13-.92.27-.68.89-1.39 1.93-1.39 1.36 0 1.9 1.04 1.9 2.57V20h3.37v-7.18Z" />
            </svg>
            <span>Ver LinkedIn</span>
          </a>
        </div>
      </footer>
    </div>
  )
}

export default App
