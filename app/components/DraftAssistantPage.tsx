'use client'

import { useState } from 'react'
import Navigation from './Navigation'
import PlayerCard from './PlayerCard'
import { loadRankings, refreshDraftPicks, getUserLeagues, getLeagueDrafts, type Player } from '../lib/api'

export default function DraftAssistantPage() {
  const [players, setPlayers] = useState<Player[]>([])
  const [sleeperPlayers, setSleeperPlayers] = useState<Record<string, any>>({})
  const [draftId, setDraftId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showTop10, setShowTop10] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [username, setUsername] = useState('')
  const [discoveredLeagues, setDiscoveredLeagues] = useState<Array<{name: string, id: string}>>([])
  const [discoveredDrafts, setDiscoveredDrafts] = useState<Record<string, any[]>>({})

  const handleLoadRankings = async (scoringFormat: 'Standard' | 'Half-PPR' | 'PPR') => {
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await loadRankings(scoringFormat)
      if (response.success) {
        setPlayers(response.players)
        setSleeperPlayers(response.sleeper_players)
        setSuccess(`✅ Loaded ${response.count} ${scoringFormat} players successfully!`)
      } else {
        setError(response.error || 'Failed to load rankings')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load rankings')
    } finally {
      setLoading(false)
    }
  }

  const handleRefreshDraftPicks = async () => {
    if (!draftId || players.length === 0) {
      setError('Please load rankings and set a draft ID first')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await refreshDraftPicks(draftId, players, sleeperPlayers)
      if (response.success) {
        setPlayers(response.players)
        setSuccess(`✅ Draft picks refreshed! ${response.drafted_count} players drafted.`)
      } else {
        setError(response.error || 'Failed to refresh draft picks')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to refresh draft picks')
    } finally {
      setLoading(false)
    }
  }

  const handleFindLeagues = async () => {
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await getUserLeagues(username.trim())
      if (response.success && response.leagues) {
        const leagues = response.leagues.map((lg: any) => ({
          name: lg.name || `League ${lg.league_id}`,
          id: lg.league_id
        }))
        setDiscoveredLeagues(leagues)
        
        // Fetch drafts for each league
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
        setSuccess(`✅ Found ${leagues.length} leagues.`)
      } else {
        setError('No leagues found')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to find leagues')
    } finally {
      setLoading(false)
    }
  }

  const handleConnectDraft = (draftId: string) => {
    setDraftId(draftId)
    setSuccess(`✅ Connected to draft ${draftId}`)
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
    <div className="flex">
      <aside className="sidebar">
        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>⚙️ Setup</h2>
        
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
            🎯 FantasyPros Rankings
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
            Choose your scoring format:
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn" 
              onClick={() => handleLoadRankings('Standard')}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>📊</span>
              <span>Standard</span>
            </button>
            
            <button 
              className="btn" 
              onClick={() => handleLoadRankings('Half-PPR')}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>📈</span>
              <span>Half-PPR</span>
            </button>
            
            <button 
              className="btn" 
              onClick={() => handleLoadRankings('PPR')}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>🏈</span>
              <span>PPR</span>
            </button>
          </div>
        </div>

        <div style={{ 
          borderTop: '1px solid var(--border-color)', 
          paddingTop: '24px',
          marginBottom: '32px'
        }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
            🏈 Sleeper Discovery
          </h3>
          <input
            type="text"
            className="input"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginBottom: '12px' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Season: {new Date().getFullYear()}
          </p>
          
          <button 
            className="btn btn-primary" 
            onClick={handleFindLeagues}
            disabled={loading || !username.trim()}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <span>🔎</span>
            <span>Find my leagues</span>
          </button>

          {discoveredLeagues.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
                Your Leagues:
              </p>
              {discoveredLeagues.map((league) => {
                const drafts = discoveredDrafts[league.id] || []
                return (
                  <div key={league.id} style={{ marginBottom: '12px' }}>
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
                              marginBottom: '8px',
                              justifyContent: 'flex-start',
                              padding: '10px 16px'
                            }}
                          >
                            <span>🏈</span>
                            <span>{league.name}</span>
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
            borderTop: '1px solid var(--border-color)', 
            paddingTop: '24px'
          }}>
            <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              Draft ID
            </h3>
            <input
              type="text"
              className="input"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              placeholder="Draft ID"
              style={{ marginBottom: '12px' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleRefreshDraftPicks}
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>🔄</span>
              <span>Refresh Draft Picks</span>
            </button>
          </div>
        )}
      </aside>

      <main className="main-content">
        <Navigation />
        
        <div className="container">
          {error && (
            <div className="message message-error">
              <span>❌</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="message message-success">
              <span>{success}</span>
            </div>
          )}
          {loading && <div className="spinner"></div>}

          <div className="app-title">Draft Assistant</div>
          <div className="app-caption">
            Load FantasyPros rankings and manage multiple fantasy leagues with Sleeper integration.
          </div>

          {players.length === 0 ? (
            <div 
              className="message message-info"
              style={{ 
                padding: '32px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px'
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👈</div>
              <h3 style={{ marginBottom: '12px' }}>Get Started</h3>
              <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>
                Use the sidebar to load FantasyPros rankings
              </p>
              <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
                <h4 style={{ marginBottom: '12px' }}>Quick Start:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎯</span>
                    <span>Click one of the scoring format buttons (Standard, Half-PPR, or PPR)</span>
                  </li>
                  <li style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>⚡</span>
                    <span>Rankings are automatically loaded from FantasyPros</span>
                  </li>
                  <li style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>✨</span>
                    <span>No file download needed!</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <>
              <div className="section-title">
                <span>Top Available Overall</span>
              </div>
              
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '16px',
                marginBottom: '24px'
              }}>
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
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
                      accentColor: 'var(--primary)'
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
                />
              ))}

              <hr />

              <div className="section-title">
                <span>🔍 Player Search</span>
              </div>
              <input
                type="text"
                className="input"
                placeholder="Search player by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: '24px', maxWidth: '500px' }}
              />
              
              {searchQuery && searchResults.length > 0 && (
                <div>
                  {searchResults.map((player) => (
                    <PlayerCard
                      key={`${player.name}-${player.overall_rank}`}
                      player={player}
                      sleeperPlayers={sleeperPlayers}
                    />
                  ))}
                </div>
              )}

              <hr />

              <div className="section-title">
                <span>Top 3 By Position</span>
              </div>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: '24px',
                marginTop: '24px'
              }}>
                <div>
                  <div className="pos-header">Running Backs</div>
                  {topRB.map((player, idx) => (
                    <PlayerCard
                      key={`${player.name}-${player.overall_rank}`}
                      player={player}
                      index={idx + 1}
                      sleeperPlayers={sleeperPlayers}
                    />
                  ))}
                </div>
                <div>
                  <div className="pos-header">Wide Receivers</div>
                  {topWR.map((player, idx) => (
                    <PlayerCard
                      key={`${player.name}-${player.overall_rank}`}
                      player={player}
                      index={idx + 1}
                      sleeperPlayers={sleeperPlayers}
                    />
                  ))}
                </div>
                <div>
                  <div className="pos-header">Quarterbacks</div>
                  {topQB.map((player, idx) => (
                    <PlayerCard
                      key={`${player.name}-${player.overall_rank}`}
                      player={player}
                      index={idx + 1}
                      sleeperPlayers={sleeperPlayers}
                    />
                  ))}
                </div>
                <div>
                  <div className="pos-header">Tight Ends</div>
                  {topTE.map((player, idx) => (
                    <PlayerCard
                      key={`${player.name}-${player.overall_rank}`}
                      player={player}
                      index={idx + 1}
                      sleeperPlayers={sleeperPlayers}
                    />
                  ))}
                </div>
              </div>

              <hr />

              <div className="section-title">
                <span>Drafted Players</span>
              </div>
              {drafted.length === 0 ? (
                <div 
                  className="message message-info"
                  style={{ textAlign: 'center', padding: '24px' }}
                >
                  No drafted players detected yet.
                </div>
              ) : (
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                  marginTop: '24px'
                }}>
                  {drafted.map((player, idx) => (
                    <div 
                      key={`${player.name}-${player.overall_rank}`}
                      style={{
                        padding: '16px',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        width: '40px',
                        height: '40px',
                        background: 'var(--gradient-primary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: 800,
                        fontSize: '0.875rem'
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, marginBottom: '4px' }}>
                          {player.name}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {player.team} • {player.position} #{player.position_rank}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
