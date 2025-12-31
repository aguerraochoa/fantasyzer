'use client'

import { useState } from 'react'
import Navigation from './Navigation'
import Image from 'next/image'
import { getUserLeagues, analyzeWeeklyRankings, getOptimalLineup, getROSRecommendations } from '../lib/api'

export default function WeeklyRankingsPage() {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [discoveredLeagues, setDiscoveredLeagues] = useState<Array<{name: string, id: string, userId: string}>>([])
  const [selectedLeague, setSelectedLeague] = useState<{name: string, id: string, userId: string} | null>(null)
  const [analysis, setAnalysis] = useState<any>(null)
  const [optimalAnalysis, setOptimalAnalysis] = useState<any>(null)
  const [rosAnalysis, setRosAnalysis] = useState<any>(null)
  const [rosterSettings, setRosterSettings] = useState<Record<string, number>>({})

  const getTeamLogoPath = (teamAbbrev: string): string | null => {
    if (!teamAbbrev) return null
    const teamLogoMap: Record<string, string> = {
      "ARI": "/team-logos/Arizona_Cardinals_logo.svg.png",
      "ATL": "/team-logos/Atlanta_Falcons_logo.svg.png",
      "BAL": "/team-logos/Baltimore_Ravens_logo.svg.png",
      "BUF": "/team-logos/Buffalo_Bills_logo.svg.png",
      "CAR": "/team-logos/Carolina_Panthers_logo.svg.png",
      "CHI": "/team-logos/Chicago_Bears_logo.svg.png",
      "CIN": "/team-logos/Cincinnati_Bengals_logo.svg.png",
      "CLE": "/team-logos/Cleveland_Browns_logo.svg.png",
      "DAL": "/team-logos/Dallas_Cowboys.svg.png",
      "DEN": "/team-logos/Denver_Broncos_logo.svg.png",
      "DET": "/team-logos/Detroit_Lions_logo.svg.png",
      "GB": "/team-logos/Green_Bay_Packers_logo.svg.png",
      "HOU": "/team-logos/Houston_Texans_logo.svg.png",
      "IND": "/team-logos/Indianapolis_Colts_logo.svg.png",
      "JAX": "/team-logos/Jacksonville_Jaguars_logo.svg.png",
      "KC": "/team-logos/Kansas_City_Chiefs_logo.svg.png",
      "LV": "/team-logos/Las_Vegas_Raiders_logo.svg.png",
      "LAR": "/team-logos/Los_Angeles_Rams_logo.svg.png",
      "LAC": "/team-logos/NFL_Chargers_logo.svg.png",
      "MIA": "/team-logos/Miami_Dolphins_logo.svg.png",
      "MIN": "/team-logos/Minnesota_Vikings_logo.svg.png",
      "NE": "/team-logos/New_England_Patriots_logo.svg.png",
      "NO": "/team-logos/New_Orleans_Saints_logo.svg.png",
      "NYG": "/team-logos/New_York_Giants_logo.svg.png",
      "NYJ": "/team-logos/New_York_Jets_logo.svg.png",
      "PHI": "/team-logos/Philadelphia_Eagles_logo.svg.png",
      "PIT": "/team-logos/Pittsburgh_Steelers_logo.svg.png",
      "SF": "/team-logos/San_Francisco_49ers_logo.svg.png",
      "SEA": "/team-logos/Seattle_Seahawks_logo.svg.png",
      "TB": "/team-logos/Tampa_Bay_Buccaneers_logo.svg.png",
      "TEN": "/team-logos/Tennessee_Titans_logo.svg.png",
      "WAS": "/team-logos/Washington_football_team_wlogo.svg.png",
    }
    return teamLogoMap[teamAbbrev.toUpperCase()] || null
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
          id: lg.league_id,
          userId: response.user_id || ''
        }))
        setDiscoveredLeagues(leagues)
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

  const handleSelectLeague = async (league: {name: string, id: string, userId: string}) => {
    setSelectedLeague(league)
    setLoading(true)
    setError(null)
    
    try {
      const analysisResponse = await analyzeWeeklyRankings(league.id, league.userId)
      if (analysisResponse.success) {
        setAnalysis(analysisResponse.analysis)
        setRosterSettings(analysisResponse.roster_settings || {})
      }
      
      try {
        const optimalResponse = await getOptimalLineup(league.id, league.userId)
        if (optimalResponse.success) {
          setOptimalAnalysis(optimalResponse)
        }
      } catch (err) {
        console.error('Failed to get optimal lineup:', err)
      }
      
      try {
        const rosResponse = await getROSRecommendations(league.id, league.userId)
        if (rosResponse.success) {
          setRosAnalysis(rosResponse)
        }
      } catch (err) {
        console.error('Failed to get ROS recommendations:', err)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to analyze league')
    } finally {
      setLoading(false)
    }
  }

  const renderPlayerWithLogo = (player: any, rosterSlot?: string, waiverIndicator?: string, freeAgent?: boolean, upgradeInfo?: string) => {
    const logoPath = getTeamLogoPath(player.team || player.get?.('team', ''))
    let positionDisplay = player.position_with_rank || player.position
    
    if (!positionDisplay && rosterSlot) {
      if (rosterSlot === 'DEF' || rosterSlot === 'K') {
        positionDisplay = rosterSlot
      }
    }
    
    const positionText = positionDisplay ? `(${positionDisplay})` : ''
    const statusClass = freeAgent ? 'status-free-agent' : player.is_on_roster ? 'status-on-roster' : ''
    
    return (
      <div 
        className="player-card fade-in"
        style={{ 
          marginBottom: '16px'
        }}
      >
        {logoPath && (
          <div className="player-logo-container">
            <Image 
              src={logoPath} 
              alt={player.team || ''} 
              width={40} 
              height={40}
              style={{
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '8px'
          }}>
            {rosterSlot && (
              <span className="badge" style={{ 
                background: 'rgba(99, 102, 241, 0.2)',
                borderColor: 'rgba(99, 102, 241, 0.4)',
                color: 'var(--primary-light)'
              }}>
                {rosterSlot}
              </span>
            )}
            <strong style={{ fontSize: '1.125rem' }}>{player.name}</strong>
            {positionText && (
              <span style={{ 
                color: 'var(--text-tertiary)',
                fontSize: '0.875rem'
              }}>
                {positionText}
              </span>
            )}
            <span style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '0.875rem'
            }}>
              {player.team || ''}
            </span>
            <span className="badge" style={{ 
              background: 'rgba(139, 92, 246, 0.2)',
              borderColor: 'rgba(139, 92, 246, 0.4)',
              color: 'var(--secondary)'
            }}>
              Rank #{player.rank}
            </span>
            {waiverIndicator && (
              <span className={`status-indicator ${statusClass}`}>
                {waiverIndicator.replace(/[()]/g, '')}
              </span>
            )}
            {freeAgent && (
              <span className="status-indicator status-free-agent">
                ✨ FREE AGENT
              </span>
            )}
          </div>
          {upgradeInfo && (
            <div style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-tertiary)', 
              marginTop: '8px',
              paddingLeft: '4px'
            }}>
              {upgradeInfo}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <aside className="sidebar">
        <h2 style={{ marginBottom: '24px', fontSize: '1.5rem' }}>⚙️ Setup</h2>
        
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.125rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
            🏈 Discover Your Leagues
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
        </div>

        {discoveredLeagues.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <p style={{ 
              fontSize: '0.875rem', 
              color: 'var(--text-secondary)', 
              marginBottom: '12px',
              fontWeight: 600
            }}>
              Your Leagues:
            </p>
            {discoveredLeagues.map((league) => (
              <button
                key={league.id}
                className="btn"
                onClick={() => handleSelectLeague(league)}
                style={{ 
                  width: '100%',
                  marginBottom: '8px',
                  justifyContent: 'flex-start',
                  padding: '12px 16px'
                }}
              >
                <span>🏈</span>
                <span>{league.name}</span>
              </button>
            ))}
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

          <div className="app-title">Weekly Rankings</div>
          <div className="app-caption">
            Get start/sit recommendations and waiver wire suggestions for your leagues.
          </div>

          {!selectedLeague ? (
            <div 
              className="message message-info"
              style={{ 
                padding: '48px',
                textAlign: 'center',
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                maxWidth: '600px',
                margin: '0 auto'
              }}
            >
              <div style={{ fontSize: '4rem', marginBottom: '24px' }}>👈</div>
              <h3 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>Discover Your Leagues</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
                Use the sidebar to enter your Sleeper username and discover your leagues.
              </p>
            </div>
          ) : (
            <>
              <div style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '32px'
              }}>
                <h3 style={{ 
                  fontSize: '1.5rem',
                  marginBottom: '8px',
                  background: 'var(--gradient-primary)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>
                  {selectedLeague.name}
                </h3>
                {rosterSettings && Object.keys(rosterSettings).length > 0 && (
                  <div style={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    marginTop: '12px'
                  }}>
                    {Object.entries(rosterSettings).map(([pos, count]) => (
                      <span key={pos} className="badge">
                        {pos}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {analysis && (
                <>
                  <div className="section-title">
                    <span>🎯 Start/Sit Recommendations</span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '2fr 1fr', 
                    gap: '32px',
                    marginTop: '24px'
                  }}>
                    <div>
                      {analysis.starters && analysis.starters.length > 0 && (
                        <>
                          <div style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '16px',
                            padding: '24px',
                            marginBottom: '24px'
                          }}>
                            <h4 style={{ 
                              marginBottom: '20px',
                              fontSize: '1.25rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>✅</span>
                              <span>RECOMMENDED STARTING LINEUP</span>
                            </h4>
                            {analysis.starters.map((player: any, idx: number) => {
                              const positionDisplay = player.position_with_rank || player.position
                              const waiverIndicator = player.is_waiver_wire ? ' (Free Agent)' : ''
                              const rosterSlot = player.flex_slot || player.position
                              const slotLabel = ['SUPER_FLEX', 'FLEX', 'WRRBTE_FLEX', 'WRRB_FLEX'].includes(rosterSlot) ? 'FLEX' : rosterSlot
                              
                              return (
                                <div key={idx}>
                                  {renderPlayerWithLogo(player, slotLabel, waiverIndicator)}
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                      
                      {analysis.bench && analysis.bench.length > 0 && (
                        <div style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '16px',
                          padding: '24px'
                        }}>
                          <h4 style={{ 
                            marginBottom: '20px',
                            fontSize: '1.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <span>🪑</span>
                            <span>BENCH PLAYERS</span>
                          </h4>
                          {analysis.bench.map((player: any, idx: number) => {
                            const positionDisplay = player.position_with_rank || player.position
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo({...player, position_with_rank: positionDisplay}, 'BN')}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '24px',
                        position: 'sticky',
                        top: '100px'
                      }}>
                        <h4 style={{ 
                          marginBottom: '24px',
                          fontSize: '1.25rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}>
                          <span>💡</span>
                          <span>Waiver Wire Suggestions</span>
                        </h4>
                        
                        {rosterSettings.DEF > 0 && analysis.waiver_suggestions?.defenses && (
                          <>
                            <h5 style={{ 
                              marginBottom: '16px',
                              fontSize: '1rem',
                              color: 'var(--text-secondary)'
                            }}>
                              Top 5 Defenses
                            </h5>
                            {analysis.waiver_suggestions.defenses.slice(0, 5).map((defense: any, idx: number) => {
                              const status = defense.is_on_roster ? 'On Your Roster' : 'Free Agent'
                              return (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                  {renderPlayerWithLogo({...defense, position: 'DEF'}, 'DEF', ` (${status})`)}
                                </div>
                              )
                            })}
                          </>
                        )}
                        
                        {rosterSettings.K > 0 && analysis.waiver_suggestions?.kickers && (
                          <>
                            <h5 style={{ 
                              marginTop: '24px',
                              marginBottom: '16px',
                              fontSize: '1rem',
                              color: 'var(--text-secondary)'
                            }}>
                              Top 5 Kickers
                            </h5>
                            {analysis.waiver_suggestions.kickers.slice(0, 5).map((kicker: any, idx: number) => {
                              const status = kicker.is_on_roster ? 'On Your Roster' : 'Free Agent'
                              return (
                                <div key={idx} style={{ marginBottom: '12px' }}>
                                  {renderPlayerWithLogo({...kicker, position: 'K'}, 'K', ` (${status})`)}
                                </div>
                              )
                            })}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {optimalAnalysis && optimalAnalysis.optimal_starters && (
                <>
                  <hr />
                  <div className="section-title">
                    <span>⭐ Optimal Starting Lineup</span>
                  </div>
                  
                  <div style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginTop: '24px'
                  }}>
                    <h4 style={{ 
                      marginBottom: '20px',
                      fontSize: '1.25rem'
                    }}>
                      🎯 OPTIMAL STARTING LINEUP (Including Best Available Free Agents)
                    </h4>
                    {optimalAnalysis.optimal_starters.map((player: any, idx: number) => {
                      const positionDisplay = player.position_with_rank || player.position
                      const rosterSlot = player.flex_slot || player.position
                      const slotLabel = ['SUPER_FLEX', 'FLEX', 'WRRBTE_FLEX', 'WRRB_FLEX'].includes(rosterSlot) ? 'FLEX' : rosterSlot
                      
                      if (player.is_free_agent) {
                        const currentPlayer = player.replaces_player
                        const upgradeInfo = currentPlayer 
                          ? `   ↳ Upgrade from: ${currentPlayer.name} (Rank #${currentPlayer.rank}) - Improvement: +${currentPlayer.rank - player.rank} ranks`
                          : undefined
                        return (
                          <div key={idx}>
                            {renderPlayerWithLogo({...player, name: `🔄 ${player.name}`}, slotLabel, undefined, true, upgradeInfo)}
                          </div>
                        )
                      } else {
                        return (
                          <div key={idx}>
                            {renderPlayerWithLogo(player, slotLabel)}
                          </div>
                        )
                      }
                    })}
                    
                    {optimalAnalysis.free_agent_upgrades && optimalAnalysis.free_agent_upgrades.length > 0 && (
                      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: '16px' }}>📈 Free Agent Upgrade Summary</h4>
                        <div className="message message-success" style={{ marginBottom: '20px' }}>
                          🚀 <strong>{optimalAnalysis.free_agent_upgrades.length} potential upgrade(s)</strong> with{' '}
                          <strong>+{optimalAnalysis.free_agent_upgrades.reduce((sum: number, u: any) => sum + u.improvement, 0)} total rank improvement</strong>
                        </div>
                        {optimalAnalysis.free_agent_upgrades.map((upgrade: any, idx: number) => (
                          <div 
                            key={idx} 
                            style={{ 
                              marginBottom: '12px',
                              padding: '12px',
                              background: 'rgba(99, 102, 241, 0.05)',
                              borderRadius: '8px',
                              border: '1px solid var(--border-color)'
                            }}
                          >
                            <strong>{upgrade.position}</strong>: {upgrade.add.name} (#{upgrade.add.rank}) replaces {upgrade.drop.name} (#{upgrade.drop.rank}) - <strong style={{ color: 'var(--success)' }}>+{upgrade.improvement} ranks</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {rosAnalysis && (
                <>
                  <hr />
                  <div className="section-title">
                    <span>🔄 ROS Upgrade Recommendations</span>
                  </div>
                  
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '32px',
                    marginTop: '24px'
                  }}>
                    <div style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '24px'
                    }}>
                      <h4 style={{ marginBottom: '24px' }}>📍 Position-Specific Upgrades</h4>
                      {['QB', 'RB', 'WR', 'TE'].map((position) => {
                        const recommendations = rosAnalysis.position_recommendations?.[position] || []
                        const emojis: Record<string, string> = {'QB': '🎯', 'RB': '🏈', 'WR': '⚡', 'TE': '🎪'}
                        
                        return (
                          <div key={position} style={{ marginBottom: '32px' }}>
                            <h5 style={{ 
                              marginBottom: '16px',
                              fontSize: '1rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <span>{emojis[position]}</span>
                              <span>{position}S</span>
                            </h5>
                            {recommendations.length > 0 ? (
                              recommendations.map((rec: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    marginBottom: '20px',
                                    padding: '16px',
                                    background: 'rgba(99, 102, 241, 0.05)',
                                    borderRadius: '12px',
                                    border: '1px solid var(--border-color)'
                                  }}
                                >
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ 
                                      fontSize: '0.75rem',
                                      color: 'var(--text-tertiary)',
                                      marginBottom: '8px',
                                      fontWeight: 600
                                    }}>
                                      DROP:
                                    </div>
                                    {renderPlayerWithLogo(rec.drop)}
                                  </div>
                                  <div style={{ marginBottom: '12px' }}>
                                    <div style={{ 
                                      fontSize: '0.75rem',
                                      color: 'var(--text-tertiary)',
                                      marginBottom: '8px',
                                      fontWeight: 600
                                    }}>
                                      ADD:
                                    </div>
                                    {renderPlayerWithLogo(rec.add)}
                                  </div>
                                  <div className="message message-success" style={{ marginTop: '12px', padding: '12px' }}>
                                    ⬆️ Improvement: <strong>+{rec.improvement} ranks</strong>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="message message-info" style={{ padding: '12px' }}>
                                No upgrades available
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    <div>
                      <div style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        padding: '24px'
                      }}>
                        <h4 style={{ marginBottom: '24px' }}>📈 Best Available Players</h4>
                        
                        <div style={{ marginBottom: '32px' }}>
                          <h5 style={{ 
                            marginBottom: '16px',
                            fontSize: '1rem',
                            color: 'var(--text-secondary)'
                          }}>
                            ➖ DROP (Worst on Roster)
                          </h5>
                          {rosAnalysis.worst_drops && rosAnalysis.worst_drops.length > 0 ? (
                            rosAnalysis.worst_drops.slice(0, 8).map((player: any, idx: number) => {
                              const logoPath = getTeamLogoPath(player.team)
                              return (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    marginBottom: '12px',
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                  }}
                                >
                                  {logoPath && (
                                    <div style={{
                                      width: '36px',
                                      height: '36px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      borderRadius: '8px',
                                      padding: '4px'
                                    }}>
                                      <Image src={logoPath} alt={player.team} width={28} height={28} />
                                    </div>
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                      <span className={`position-tag ${player.position}`} style={{ marginRight: '8px' }}>
                                        {player.position}
                                      </span>
                                      Rank #{player.rank}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                      {player.name} ({player.team})
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="message message-info" style={{ padding: '12px' }}>
                              No players to drop
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h5 style={{ 
                            marginBottom: '16px',
                            fontSize: '1rem',
                            color: 'var(--text-secondary)'
                          }}>
                            ➕ ADD (Best Available)
                          </h5>
                          {rosAnalysis.best_adds && rosAnalysis.best_adds.length > 0 ? (
                            rosAnalysis.best_adds.slice(0, 8).map((player: any, idx: number) => {
                              const logoPath = getTeamLogoPath(player.team)
                              return (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    marginBottom: '12px',
                                    padding: '12px',
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(16, 185, 129, 0.2)'
                                  }}
                                >
                                  {logoPath && (
                                    <div style={{
                                      width: '36px',
                                      height: '36px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      background: 'rgba(16, 185, 129, 0.1)',
                                      borderRadius: '8px',
                                      padding: '4px'
                                    }}>
                                      <Image src={logoPath} alt={player.team} width={28} height={28} />
                                    </div>
                                  )}
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                      <span className={`position-tag ${player.position}`} style={{ marginRight: '8px' }}>
                                        {player.position}
                                      </span>
                                      Rank #{player.rank}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                      {player.name} ({player.team})
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="message message-info" style={{ padding: '12px' }}>
                              No free agents found
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
