'use client'

import { useState } from 'react'
import Navigation from './Navigation'
import PlayerCard from './PlayerCard'
import { loadRankings, refreshDraftPicks, getUserLeagues, getLeagueDrafts, type Player } from '../lib/api'

import Sidebar from './Sidebar'

export default function DraftAssistantPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sleeperPlayers, setSleeperPlayers] = useState<Record<string, any>>({})
  const [draftId, setDraftId] = useState<string>('')
  const [loadingLeagues, setLoadingLeagues] = useState(false)
  const [loadingRankings, setLoadingRankings] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showTop10, setShowTop10] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [username, setUsername] = useState('')
  const [discoveredLeagues, setDiscoveredLeagues] = useState<Array<{ name: string, id: string }>>([])
  const [discoveredDrafts, setDiscoveredDrafts] = useState<Record<string, any[]>>({})
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Get current NFL season year (March 1 to end of February)
  // March 1, 2025 to Feb 28, 2026 → returns 2025
  const getCurrentSeasonYear = (): number => {
    const now = new Date()
    // If we're on or after March 1st, use current year
    // Otherwise, use previous year
    if (now.getMonth() >= 2) { // getMonth() is 0-indexed, so 2 = March
      return now.getFullYear()
    } else {
      return now.getFullYear() - 1
    }
  }

  const handleLoadRankings = async (scoringFormat: 'Standard' | 'Half-PPR' | 'PPR') => {
    setLoadingRankings(true)
    setError(null)

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }

    try {
      const response = await loadRankings(scoringFormat)
      if (response.success) {
        setPlayers(response.players)
        setSleeperPlayers(response.sleeper_players)
      } else {
        setError(response.error || 'Failed to load rankings')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rankings')
    } finally {
      setLoadingRankings(false)
    }
  }

  const handleRefreshDraftPicks = async () => {
    if (!draftId || players.length === 0) {
      setError('Please load rankings and set a draft ID first')
      return
    }

    setLoadingRankings(true)
    setError(null)

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }

    try {
      const response = await refreshDraftPicks(draftId, players, sleeperPlayers)
      if (response.success) {
        setPlayers(response.players)
      } else {
        setError(response.error || 'Failed to refresh draft picks')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh draft picks')
    } finally {
      setLoadingRankings(false)
    }
  }

  const handleFindLeagues = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }

    setLoadingLeagues(true)
    setError(null)

    try {
      const response = await getUserLeagues(username.trim())
      if (response.success && response.leagues) {
        const leagues = response.leagues.map((lg: any) => ({
          name: lg.name || `League ${lg.league_id}`,
          id: lg.league_id
        }))
        setDiscoveredLeagues(leagues)

        const draftsMap: Record<string, any[]> = {}
        for (const league of leagues) {
          try {
            const draftsResponse = await getLeagueDrafts(league.id)
            if (draftsResponse.success) {
              draftsMap[league.id] = draftsResponse.drafts || []
            }
          } catch (err) {
            draftsMap[league.id] = []
          }
        }
        setDiscoveredDrafts(draftsMap)
      } else {
        setError('No leagues found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find leagues')
    } finally {
      setLoadingLeagues(false)
    }
  }

  const handleConnectDraft = (draftId: string) => {
    setDraftId(draftId)
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false)
    }
  }

  const getTopPlayers = (position?: string, limit: number = 5) => {
    let filtered = players.filter(p => !p.drafted)
    if (position) {
      filtered = filtered.filter(p => p.position === position)
    }
    return filtered
      .sort((a, b) => a.overall_rank - b.overall_rank)
      .slice(0, limit)
  }

  const getDraftedPlayers = () => {
    return players
      .filter(p => p.drafted)
      .sort((a, b) => a.overall_rank - b.overall_rank)
  }

  const searchPlayers = () => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return players.filter(p =>
      p.name.toLowerCase().includes(query) && !p.drafted
    )
  }

  const topOverall = getTopPlayers(undefined, showTop10 ? 10 : 5)
  const topRB = getTopPlayers('RB', 3)
  const topWR = getTopPlayers('WR', 3)
  const topQB = getTopPlayers('QB', 3)
  const topTE = getTopPlayers('TE', 3)
  const drafted = getDraftedPlayers()
  const searchResults = searchPlayers()

  return (
    <div>
      <Navigation onToggleSidebar={() => setIsSidebarOpen(true)} />

      <div className="container" style={{ paddingTop: 'var(--spacing-md)', paddingBottom: 'var(--spacing-2xl)' }}>
        {error && (
          <div className="message message-error">
            <span>{error}</span>
          </div>
        )}

        <div className="main-layout">
          {/* Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                <h3 className="section-title" style={{ fontSize: '1.125rem', margin: 0 }}>Setup</h3>
                {loadingRankings && <div className="spinner-small"></div>}
              </div>
            </div>

            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                FantasyPros Rankings
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-md)' }}>
                Choose your scoring format:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                <button
                  className="btn"
                  onClick={() => handleLoadRankings('Standard')}
                  disabled={loadingRankings}
                  style={{ width: '100%' }}
                >
                  Standard
                </button>

                <button
                  className="btn"
                  onClick={() => handleLoadRankings('Half-PPR')}
                  disabled={loadingRankings}
                  style={{ width: '100%' }}
                >
                  Half-PPR
                </button>

                <button
                  className="btn"
                  onClick={() => handleLoadRankings('PPR')}
                  disabled={loadingRankings}
                  style={{ width: '100%' }}
                >
                  PPR
                </button>
              </div>
            </div>

            <div style={{
              borderTop: '1px solid var(--border-light)',
              paddingTop: 'var(--spacing-xl)',
              marginBottom: 'var(--spacing-xl)'
            }}>
              <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                Sleeper Discovery
              </h4>
              <input
                type="text"
                className="input"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ marginBottom: 'var(--spacing-sm)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                Season: {getCurrentSeasonYear()}
              </p>

              <button
                className="btn btn-primary"
                onClick={handleFindLeagues}
                disabled={loadingLeagues || !username.trim()}
                style={{ width: '100%' }}
              >
                Find my leagues
              </button>

              {discoveredLeagues.length > 0 && (
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-md)', fontWeight: 500 }}>
                    Your Leagues:
                  </p>
                  {discoveredLeagues.map((league) => {
                    const drafts = discoveredDrafts[league.id] || []
                    return (
                      <div key={league.id} style={{ marginBottom: 'var(--spacing-md)' }}>
                        {drafts.length === 0 ? (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No drafts found</p>
                        ) : (
                          drafts.map((draft: any) => {
                            const draftId = draft.draft_id || draft.draft_id
                            return (
                              <button
                                key={draftId}
                                className="btn"
                                onClick={() => handleConnectDraft(String(draftId))}
                                style={{
                                  width: '100%',
                                  fontSize: '0.875rem',
                                  marginBottom: 'var(--spacing-xs)',
                                  justifyContent: 'flex-start'
                                }}
                              >
                                {league.name}
                              </button>
                            )
                          })
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {draftId && (
              <div style={{
                borderTop: '1px solid var(--border-light)',
                paddingTop: 'var(--spacing-xl)'
              }}>
                <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  Draft ID
                </h4>
                <input
                  type="text"
                  className="input"
                  value={draftId}
                  onChange={(e) => setDraftId(e.target.value)}
                  placeholder="Draft ID"
                  style={{ marginBottom: 'var(--spacing-md)' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleRefreshDraftPicks}
                  disabled={loadingRankings}
                  style={{ width: '100%' }}
                >
                  Refresh Draft Picks
                </button>
              </div>
            )}
          </Sidebar>

          {/* Main Content */}
          <main>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
              <h1 className="app-title" style={{ margin: 0 }}>Draft Assistant</h1>
              {loadingRankings && <div className="spinner-small"></div>}
            </div>
            <p className="app-caption" style={{ marginBottom: 'var(--spacing-2xl)' }}>
              Load FantasyPros rankings and manage multiple fantasy leagues with Sleeper integration.
            </p>

            {players.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>👆</div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Get Started</h3>
                <p style={{ marginBottom: 'var(--spacing-xl)', color: 'var(--text-secondary)' }}>
                  <span className="desktop-only">Use the sidebar to load FantasyPros rankings</span>
                  <span className="mobile-only">Click "League Setup" above to load FantasyPros rankings</span>
                </p>
                <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                  <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Quick Start:</h4>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    <li style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <span>🎯</span>
                      <span>Click one of the scoring format buttons (Standard, Half-PPR, or PPR)</span>
                    </li>
                    <li style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <span>⚡</span>
                      <span>Rankings are automatically loaded from FantasyPros</span>
                    </li>
                    <li style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <span>✨</span>
                      <span>No file download needed!</span>
                    </li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                <div className="section-title">Top Available Overall</div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  marginBottom: 'var(--spacing-lg)'
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)'
                  }}>
                    <input
                      type="checkbox"
                      checked={showTop10}
                      onChange={(e) => setShowTop10(e.target.checked)}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--accent-primary)'
                      }}
                    />
                    <span>Show top 10</span>
                  </label>
                </div>

                {topOverall.map((player, idx) => (
                  <PlayerCard
                    key={`${player.name}-${player.overall_rank}`}
                    player={player}
                    index={idx + 1}
                    sleeperPlayers={sleeperPlayers}
                    hideInjuryOnMobile={true}
                  />
                ))}

                <div className="section-title">Player Search</div>
                <input
                  type="text"
                  className="input"
                  placeholder="Search player by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: 'var(--spacing-lg)', maxWidth: '500px' }}
                />

                {searchQuery && searchResults.length > 0 && (
                  <div>
                    {searchResults.map((player) => (
                      <PlayerCard
                        key={`${player.name}-${player.overall_rank}`}
                        player={player}
                        sleeperPlayers={sleeperPlayers}
                        hideInjuryOnMobile={true}
                      />
                    ))}
                  </div>
                )}

                <div className="section-title">Top 3 By Position</div>
                <div style={{ marginTop: 'var(--spacing-lg)' }}>
                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h5 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Running Backs</h5>
                    {topRB.map((player, idx) => (
                      <PlayerCard
                        key={`${player.name}-${player.overall_rank}`}
                        player={player}
                        index={idx + 1}
                        sleeperPlayers={sleeperPlayers}
                        hideInjuryOnMobile={true}
                      />
                    ))}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h5 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Wide Receivers</h5>
                    {topWR.map((player, idx) => (
                      <PlayerCard
                        key={`${player.name}-${player.overall_rank}`}
                        player={player}
                        index={idx + 1}
                        sleeperPlayers={sleeperPlayers}
                        hideInjuryOnMobile={true}
                      />
                    ))}
                  </div>
                  <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <h5 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Quarterbacks</h5>
                    {topQB.map((player, idx) => (
                      <PlayerCard
                        key={`${player.name}-${player.overall_rank}`}
                        player={player}
                        index={idx + 1}
                        sleeperPlayers={sleeperPlayers}
                        hideInjuryOnMobile={true}
                      />
                    ))}
                  </div>
                  <div>
                    <h5 style={{ marginBottom: 'var(--spacing-md)', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)', fontWeight: 600 }}>Tight Ends</h5>
                    {topTE.map((player, idx) => (
                      <PlayerCard
                        key={`${player.name}-${player.overall_rank}`}
                        player={player}
                        index={idx + 1}
                        sleeperPlayers={sleeperPlayers}
                        hideInjuryOnMobile={true}
                      />
                    ))}
                  </div>
                </div>

                {drafted.length > 0 && (
                  <>
                    <div className="section-title">Drafted Players</div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 'var(--spacing-md)',
                      marginTop: 'var(--spacing-lg)'
                    }}>
                      {drafted.map((player, idx) => (
                        <div
                          key={`${player.name}-${player.overall_rank}`}
                          className="card"
                          style={{ padding: 'var(--spacing-md)' }}
                        >
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--spacing-md)'
                          }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: 'var(--accent-primary)',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 600,
                              fontSize: '0.875rem'
                            }}>
                              {idx + 1}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                {(() => {
                                  // Format player name for mobile
                                  const isDefense = player.position === 'DEF' || player.position === 'DST'
                                  if (isDefense) {
                                    // For defenses, remove city: "Pittsburgh Steelers" -> "Steelers", "Los Angeles Rams" -> "Rams"
                                    const parts = player.name.trim().split(' ')
                                    if (parts.length > 1) {
                                      // Take the last word as the team name
                                      const teamName = parts[parts.length - 1]
                                      return (
                                        <>
                                          <span className="desktop-only">{player.name}</span>
                                          <span className="mobile-only">{teamName}</span>
                                        </>
                                      )
                                    }
                                    return player.name
                                  } else {
                                    // For players, use first initial: "Dak Prescott" -> "D. Prescott"
                                    const parts = player.name.trim().split(' ')
                                    if (parts.length >= 2) {
                                      const firstName = parts[0]
                                      const lastName = parts.slice(1).join(' ')
                                      return (
                                        <>
                                          <span className="desktop-only">{player.name}</span>
                                          <span className="mobile-only">{firstName[0]}. {lastName}</span>
                                        </>
                                      )
                                    }
                                    return player.name
                                  }
                                })()}
                              </div>
                              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {player.team} • {player.position} #{player.position_rank}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
