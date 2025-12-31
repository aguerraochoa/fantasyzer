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
      "JAC": "/team-logos/Jacksonville_Jaguars_logo.svg.png", // Sleeper uses JAC
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
      <div className="player-card fade-in" style={{ marginBottom: 'var(--spacing-sm)' }}>
        {logoPath && (
          <div className="player-logo-container">
            <Image 
              src={logoPath} 
              alt={player.team || ''} 
              width={32} 
              height={32}
              style={{
                objectFit: 'contain',
                maxWidth: '100%',
                maxHeight: '100%'
              }}
            />
          </div>
        )}
        <div className="player-content" style={{ flex: 1, minWidth: 0 }}>
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap',
            flex: 1
          }}>
            {rosterSlot && (
              <span className="badge" style={{ 
                background: 'rgba(74, 111, 165, 0.15)',
                borderColor: 'rgba(74, 111, 165, 0.3)',
                color: 'var(--royal-blue)'
              }}>
                {rosterSlot}
              </span>
            )}
            <strong style={{ fontSize: '0.9375rem', fontWeight: 600 }}>{player.name}</strong>
            {positionText && (
              <span style={{ 
                color: 'var(--text-tertiary)',
                fontSize: '0.8125rem'
              }}>
                {positionText}
              </span>
            )}
            <span style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '0.8125rem'
            }}>
              {player.team || ''}
            </span>
            <span className="badge" style={{ 
              background: 'rgba(157, 180, 212, 0.2)',
              borderColor: 'rgba(157, 180, 212, 0.4)',
              color: 'var(--periwinkle)'
            }}>
              #{player.rank}
            </span>
            {waiverIndicator && (
              <span className={`status-indicator ${statusClass}`} style={{ fontSize: '0.6875rem', padding: '0.1875rem 0.5rem' }}>
                {waiverIndicator.replace(/[()]/g, '')}
              </span>
            )}
            {freeAgent && (
              <span className="status-indicator status-free-agent" style={{ fontSize: '0.6875rem', padding: '0.1875rem 0.5rem' }}>
                ✨ FREE AGENT
              </span>
            )}
          </div>
          {upgradeInfo && (
            <span style={{ 
              fontSize: '0.75rem', 
              color: 'var(--text-tertiary)',
              whiteSpace: 'nowrap'
            }}>
              {upgradeInfo}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Navigation />
      
      <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
        {error && (
          <div className="message message-error">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="message message-success">
            <span>{success}</span>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--spacing-2xl)', marginTop: 'var(--spacing-xl)' }}>
          {/* Sidebar */}
          <aside className="sidebar" style={{ position: 'sticky', top: 'var(--spacing-xl)', alignSelf: 'start', maxHeight: 'calc(100vh - var(--spacing-2xl))', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: 'var(--spacing-lg)', fontSize: '1.125rem', fontWeight: 600 }}>League Setup</h3>
            
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '0.9375rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                Discover Your Leagues
              </h4>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', marginBottom: 'var(--spacing-sm)' }}>
                Enter your Sleeper username to find your leagues
              </p>
              <input
                type="text"
                className="input"
                placeholder="your_username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ marginBottom: 'var(--spacing-sm)' }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
                Season: {new Date().getFullYear()}
              </p>
              
              <button 
                className="btn btn-primary" 
                onClick={handleFindLeagues}
                disabled={loading || !username.trim()}
                style={{ width: '100%' }}
              >
                Find my leagues
              </button>
            </div>

            {discoveredLeagues.length > 0 && (
              <div>
                <p style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)', 
                  marginBottom: 'var(--spacing-md)',
                  fontWeight: 500
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
                      marginBottom: 'var(--spacing-xs)',
                      justifyContent: 'flex-start'
                    }}
                  >
                    {league.name}
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main>
            <h1 className="app-title">Weekly Rankings</h1>
            <p className="app-caption">
              Get start/sit recommendations and waiver wire suggestions for your leagues.
            </p>

            {!selectedLeague ? (
              <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', maxWidth: '600px' }}>
                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-lg)' }}>👈</div>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Discover Your Leagues</h3>
                <p style={{ color: 'var(--text-secondary)' }}>
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
                  <div className="section-title">🎯 Start/Sit Recommendations</div>
                  
                  <div style={{ marginTop: 'var(--spacing-md)' }}>
                    {analysis.starters && analysis.starters.length > 0 && (
                      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)' }}>
                        <h4 style={{ 
                          marginBottom: 'var(--spacing-md)',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}>
                          ✅ Recommended Starting Lineup
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
                    )}
                    
                    {analysis.bench && analysis.bench.length > 0 && (
                      <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)' }}>
                        <h4 style={{ 
                          marginBottom: 'var(--spacing-md)',
                          fontSize: '1rem',
                          fontWeight: 600
                        }}>
                          🪑 Bench Players
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
                    
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                      <h4 style={{ 
                        marginBottom: 'var(--spacing-md)',
                        fontSize: '1rem',
                        fontWeight: 600
                      }}>
                        💡 Waiver Wire Suggestions
                      </h4>
                      
                      {rosterSettings.DEF > 0 && analysis.waiver_suggestions?.defenses && (
                        <>
                          <h5 style={{ 
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            Top 5 Defenses
                          </h5>
                          {analysis.waiver_suggestions.defenses.slice(0, 5).map((defense: any, idx: number) => {
                            const status = defense.is_on_roster ? 'On Your Roster' : 'Free Agent'
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo({...defense, position: 'DEF'}, 'DEF', ` (${status})`)}
                              </div>
                            )
                          })}
                        </>
                      )}
                      
                      {rosterSettings.K > 0 && analysis.waiver_suggestions?.kickers && (
                        <>
                          <h5 style={{ 
                            marginTop: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            Top 5 Kickers
                          </h5>
                          {analysis.waiver_suggestions.kickers.slice(0, 5).map((kicker: any, idx: number) => {
                            const status = kicker.is_on_roster ? 'On Your Roster' : 'Free Agent'
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo({...kicker, position: 'K'}, 'K', ` (${status})`)}
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}

              {optimalAnalysis && optimalAnalysis.optimal_starters && (
                <>
                  <div className="section-title">⭐ Optimal Starting Lineup</div>
                  
                  <div className="card" style={{ padding: 'var(--spacing-lg)', marginTop: 'var(--spacing-md)' }}>
                    <h4 style={{ 
                      marginBottom: 'var(--spacing-md)',
                      fontSize: '1rem',
                      fontWeight: 600
                    }}>
                      🎯 Optimal Starting Lineup (Including Best Available Free Agents)
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
                      <div style={{ marginTop: 'var(--spacing-lg)', paddingTop: 'var(--spacing-md)', borderTop: '1px solid var(--border-light)' }}>
                        <h4 style={{ marginBottom: 'var(--spacing-sm)', fontSize: '0.9375rem', fontWeight: 600 }}>📈 Free Agent Upgrade Summary</h4>
                        <div className="message message-success" style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-sm)' }}>
                          🚀 <strong>{optimalAnalysis.free_agent_upgrades.length} potential upgrade(s)</strong> with{' '}
                          <strong>+{optimalAnalysis.free_agent_upgrades.reduce((sum: number, u: any) => sum + u.improvement, 0)} total rank improvement</strong>
                        </div>
                        {optimalAnalysis.free_agent_upgrades.map((upgrade: any, idx: number) => (
                          <div 
                            key={idx} 
                            style={{ 
                              marginBottom: 'var(--spacing-sm)',
                              padding: 'var(--spacing-sm)',
                              background: 'rgba(74, 111, 165, 0.05)',
                              borderRadius: 'var(--radius-md)',
                              border: '1px solid var(--border-light)',
                              fontSize: '0.875rem'
                            }}
                          >
                            <strong>{upgrade.position}</strong>: {upgrade.add.name} (#{upgrade.add.rank}) replaces {upgrade.drop.name} (#{upgrade.drop.rank}) - <strong style={{ color: 'var(--accent-success)' }}>+{upgrade.improvement} ranks</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {rosAnalysis && (
                <>
                  <div className="section-title">🔄 ROS Upgrade Recommendations</div>
                  
                  <div style={{ marginTop: 'var(--spacing-md)' }}>
                    <div className="card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)' }}>
                      <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>📍 Position-Specific Upgrades</h4>
                      {['QB', 'RB', 'WR', 'TE'].map((position) => {
                        const recommendations = rosAnalysis.position_recommendations?.[position] || []
                        const emojis: Record<string, string> = {'QB': '🎯', 'RB': '🏈', 'WR': '⚡', 'TE': '🎪'}
                        
                        return (
                          <div key={position} style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h5 style={{ 
                              marginBottom: 'var(--spacing-sm)',
                              fontSize: '0.875rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--spacing-xs)',
                              fontWeight: 600
                            }}>
                              <span>{emojis[position]}</span>
                              <span>{position}S</span>
                            </h5>
                            {recommendations.length > 0 ? (
                              recommendations.map((rec: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  style={{ 
                                    marginBottom: 'var(--spacing-md)',
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(74, 111, 165, 0.05)',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border-light)'
                                  }}
                                >
                                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                    <div style={{ 
                                      fontSize: '0.6875rem',
                                      color: 'var(--text-tertiary)',
                                      marginBottom: 'var(--spacing-xs)',
                                      fontWeight: 600,
                                      textTransform: 'uppercase'
                                    }}>
                                      DROP:
                                    </div>
                                    {renderPlayerWithLogo(rec.drop)}
                                  </div>
                                  <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                    <div style={{ 
                                      fontSize: '0.6875rem',
                                      color: 'var(--text-tertiary)',
                                      marginBottom: 'var(--spacing-xs)',
                                      fontWeight: 600,
                                      textTransform: 'uppercase'
                                    }}>
                                      ADD:
                                    </div>
                                    {renderPlayerWithLogo(rec.add)}
                                  </div>
                                  <div className="message message-success" style={{ marginTop: 'var(--spacing-sm)', padding: 'var(--spacing-sm)', fontSize: '0.8125rem' }}>
                                    ⬆️ Improvement: <strong>+{rec.improvement} ranks</strong>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="message message-info" style={{ padding: 'var(--spacing-sm)', fontSize: '0.8125rem' }}>
                                No upgrades available
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                      <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem', fontWeight: 600 }}>📈 Best Available Players</h4>
                        
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                          <h5 style={{ 
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            ➖ DROP (Worst on Roster)
                          </h5>
                          {rosAnalysis.worst_drops && rosAnalysis.worst_drops.length > 0 ? (
                            rosAnalysis.worst_drops.slice(0, 8).map((player: any, idx: number) => {
                              const logoPath = getTeamLogoPath(player.team)
                              return (
                                <div 
                                  key={idx} 
                                  className="player-card"
                                  style={{ 
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    borderColor: 'rgba(239, 68, 68, 0.2)',
                                    padding: 'var(--spacing-sm)'
                                  }}
                                >
                                  {logoPath && (
                                    <div className="player-logo-container" style={{ width: '32px', height: '32px' }}>
                                      <Image src={logoPath} alt={player.team} width={24} height={24} />
                                    </div>
                                  )}
                                  <div className="player-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                      <span className={`position-tag ${player.position}`}>
                                        {player.position}
                                      </span>
                                      <span className="badge">#{player.rank}</span>
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{player.name}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>({player.team})</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="message message-info" style={{ padding: 'var(--spacing-sm)', fontSize: '0.8125rem' }}>
                              No players to drop
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <h5 style={{ 
                            marginBottom: 'var(--spacing-sm)',
                            fontSize: '0.875rem',
                            color: 'var(--text-secondary)',
                            fontWeight: 600
                          }}>
                            ➕ ADD (Best Available)
                          </h5>
                          {rosAnalysis.best_adds && rosAnalysis.best_adds.length > 0 ? (
                            rosAnalysis.best_adds.slice(0, 8).map((player: any, idx: number) => {
                              const logoPath = getTeamLogoPath(player.team)
                              return (
                                <div 
                                  key={idx} 
                                  className="player-card"
                                  style={{ 
                                    background: 'rgba(16, 185, 129, 0.05)',
                                    borderColor: 'rgba(16, 185, 129, 0.2)',
                                    padding: 'var(--spacing-sm)'
                                  }}
                                >
                                  {logoPath && (
                                    <div className="player-logo-container" style={{ width: '32px', height: '32px' }}>
                                      <Image src={logoPath} alt={player.team} width={24} height={24} />
                                    </div>
                                  )}
                                  <div className="player-content">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', flexWrap: 'wrap' }}>
                                      <span className={`position-tag ${player.position}`}>
                                        {player.position}
                                      </span>
                                      <span className="badge">#{player.rank}</span>
                                      <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{player.name}</span>
                                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>({player.team})</span>
                                    </div>
                                  </div>
                                </div>
                              )
                            })
                          ) : (
                            <div className="message message-info" style={{ padding: 'var(--spacing-sm)', fontSize: '0.8125rem' }}>
                              No free agents found
                            </div>
                          )}
                        </div>
                    </div>
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
