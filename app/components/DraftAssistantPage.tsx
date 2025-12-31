'use client'

import { useState, useEffect } from 'react'
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
        <h2>Setup</h2>
        
        <div className="mt-4">
          <h3>🎯 FantasyPros Rankings</h3>
          <p>Choose your scoring format:</p>
          
          <button 
            className="btn" 
            onClick={() => handleLoadRankings('Standard')}
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            📊 Standard
          </button>
          
          <button 
            className="btn" 
            onClick={() => handleLoadRankings('Half-PPR')}
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            📈 Half-PPR
          </button>
          
          <button 
            className="btn" 
            onClick={() => handleLoadRankings('PPR')}
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            🏈 PPR
          </button>
        </div>

        <div className="mt-4" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
          <h3>🏈 Sleeper: Discover Leagues & Drafts</h3>
          <input
            type="text"
            className="input"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ marginTop: '8px' }}
          />
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            Using current season: {new Date().getFullYear()}
          </p>
          
          <button 
            className="btn" 
            onClick={handleFindLeagues}
            disabled={loading || !username.trim()}
            style={{ width: '100%', marginTop: '8px' }}
          >
            🔎 Find my leagues
          </button>

          {discoveredLeagues.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <p><strong>Your Leagues (click a draft to connect):</strong></p>
              {discoveredLeagues.map((league) => {
                const drafts = discoveredDrafts[league.id] || []
                return (
                  <div key={league.id} style={{ marginTop: '8px' }}>
                    {drafts.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#6b7280' }}>No drafts found</p>
                    ) : (
                      drafts.map((draft: any) => {
                        const draftId = draft.draft_id || draft.draft_id
                        return (
                          <button
                            key={draftId}
                            className="btn"
                            onClick={() => handleConnectDraft(String(draftId))}
                            style={{ width: '100%', marginTop: '4px', fontSize: '12px' }}
                          >
                            🏈 {league.name}
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
          <div className="mt-4" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
            <h3>Draft ID</h3>
            <input
              type="text"
              className="input"
              value={draftId}
              onChange={(e) => setDraftId(e.target.value)}
              placeholder="Draft ID"
              style={{ marginTop: '8px' }}
            />
            <button 
              className="btn btn-primary" 
              onClick={handleRefreshDraftPicks}
              disabled={loading}
              style={{ width: '100%', marginTop: '8px' }}
            >
              🔄 Refresh Draft Picks
            </button>
          </div>
        )}
      </aside>

      <main className="main-content">
        <Navigation />
        
        <div className="container">
          {error && <div className="message message-error">{error}</div>}
          {success && <div className="message message-success">{success}</div>}
          {loading && <div className="spinner"></div>}

          <div className="app-title">Fantasyzer</div>
          <div className="app-caption">
            Load FantasyPros rankings and manage multiple fantasy leagues with Sleeper integration.
          </div>

          {players.length === 0 ? (
            <div className="message message-info">
              👈 Use the sidebar to load FantasyPros rankings
              <h3 style={{ marginTop: '16px' }}>Quick Start Options:</h3>
              <p><strong>🎯 FantasyPros Rankings (Recommended):</strong></p>
              <ul>
                <li>Click one of the scoring format buttons (Standard, Half-PPR, or PPR)</li>
                <li>Rankings are automatically loaded from FantasyPros</li>
                <li>No file download needed!</li>
              </ul>
            </div>
          ) : (
            <>
              <div className="section-title">
                Top Available Overall
                <label style={{ marginLeft: '16px', fontSize: '14px', fontWeight: 'normal' }}>
                  <input
                    type="checkbox"
                    checked={showTop10}
                    onChange={(e) => setShowTop10(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Show top 10 (otherwise top 5)
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

              <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

              <div className="section-title">Player Search</div>
              <input
                type="text"
                className="input"
                placeholder="Search player by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ marginBottom: '16px' }}
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

              <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

              <div className="section-title">Top 3 By Position (Available)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div className="pos-header">RB</div>
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
                  <div className="pos-header">WR</div>
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
                  <div className="pos-header">QB</div>
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
                  <div className="pos-header">TE</div>
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

              <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />

              <div className="section-title">Drafted Players</div>
              {drafted.length === 0 ? (
                <p>No drafted players detected yet.</p>
              ) : (
                drafted.map((player, idx) => (
                  <div key={`${player.name}-${player.overall_rank}`} style={{ marginBottom: '8px' }}>
                    {idx + 1}. <strong>{player.name}</strong> ({player.team}) — {player.position} #{player.position_rank}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

