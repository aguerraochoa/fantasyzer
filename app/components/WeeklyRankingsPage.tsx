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
        // We need to get user_id from the API response
        // For now, we'll store it with each league
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
      // Analyze weekly rankings
      const analysisResponse = await analyzeWeeklyRankings(league.id, league.userId)
      if (analysisResponse.success) {
        setAnalysis(analysisResponse.analysis)
        setRosterSettings(analysisResponse.roster_settings || {})
      }
      
      // Get optimal lineup
      try {
        const optimalResponse = await getOptimalLineup(league.id, league.userId)
        if (optimalResponse.success) {
          setOptimalAnalysis(optimalResponse)
        }
      } catch (err) {
        console.error('Failed to get optimal lineup:', err)
      }
      
      // Get ROS recommendations
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
    const slotText = rosterSlot ? `**${rosterSlot}** ` : ''
    const freeAgentText = freeAgent ? ' ✨ FREE AGENT' : ''
    const positionDisplay = player.position_with_rank || player.position
    
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        marginBottom: '12px',
        padding: '8px',
        borderRadius: '8px',
        backgroundColor: '#f9fafb'
      }}>
        {logoPath && (
          <div style={{ 
            flexShrink: 0,
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#ffffff',
            borderRadius: '6px',
            padding: '4px'
          }}>
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
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ lineHeight: '1.5' }}>
            {slotText && <strong>{rosterSlot} </strong>}
            <strong>{player.name}</strong> ({positionDisplay}) - {player.team || ''} - <strong>Rank #{player.rank}</strong>
            {waiverIndicator}
            {freeAgentText}
          </div>
          {upgradeInfo && <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{upgradeInfo}</div>}
        </div>
      </div>
    )
  }

  return (
    <div className="flex">
      <aside className="sidebar">
        <h2>Setup</h2>
        
        <div className="mt-4">
          <h3>🏈 Discover Your Leagues</h3>
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
        </div>

        {discoveredLeagues.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <p><strong>Your Leagues (click to analyze):</strong></p>
            {discoveredLeagues.map((league) => (
              <button
                key={league.id}
                className="btn"
                onClick={() => handleSelectLeague(league)}
                style={{ width: '100%', marginTop: '8px', fontSize: '12px' }}
              >
                🏈 {league.name}
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className="main-content">
        <Navigation />
        
        <div className="container">
          {error && <div className="message message-error">{error}</div>}
          {success && <div className="message message-success">{success}</div>}
          {loading && <div className="spinner"></div>}

          <div className="app-title">Weekly Rankings</div>
          <div className="app-caption">
            Get start/sit recommendations and waiver wire suggestions for your leagues.
          </div>

          {!selectedLeague ? (
            <div className="message message-info">
              👈 Use the sidebar to discover your leagues and select one to analyze.
            </div>
          ) : (
            <>
              <h3>Analyzing: {selectedLeague.name}</h3>
              
              {rosterSettings && Object.keys(rosterSettings).length > 0 && (
                <div className="message message-info" style={{ marginTop: '16px' }}>
                  <strong>Roster Requirements:</strong>{' '}
                  {Object.entries(rosterSettings).map(([pos, count]) => `${pos}: ${count}`).join(', ')}
                </div>
              )}

              {analysis && (
                <>
                  <div className="section-title" style={{ marginTop: '32px' }}>🎯 Start/Sit Recommendations</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginTop: '16px' }}>
                    <div>
                      {analysis.starters && analysis.starters.length > 0 && (
                        <>
                          <h4>✅ RECOMMENDED STARTING LINEUP:</h4>
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
                        </>
                      )}
                      
                      {analysis.bench && analysis.bench.length > 0 && (
                        <>
                          <h4 style={{ marginTop: '24px' }}>🪑 BENCH PLAYERS:</h4>
                          {analysis.bench.map((player: any, idx: number) => {
                            const positionDisplay = player.position_with_rank || player.position
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo({...player, position_with_rank: positionDisplay}, 'BN')}
                              </div>
                            )
                          })}
                        </>
                      )}
                    </div>
                    
                    <div>
                      <h4>💡 Waiver Wire Suggestions</h4>
                      
                      {rosterSettings.DEF > 0 && analysis.waiver_suggestions?.defenses && (
                        <>
                          <h5>Top 5 Defenses:</h5>
                          {analysis.waiver_suggestions.defenses.slice(0, 5).map((defense: any, idx: number) => {
                            const status = defense.is_on_roster ? 'On Your Roster' : 'Free Agent'
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo(defense, undefined, ` (${status})`)}
                              </div>
                            )
                          })}
                        </>
                      )}
                      
                      {rosterSettings.K > 0 && analysis.waiver_suggestions?.kickers && (
                        <>
                          <h5 style={{ marginTop: '16px' }}>Top 5 Kickers:</h5>
                          {analysis.waiver_suggestions.kickers.slice(0, 5).map((kicker: any, idx: number) => {
                            const status = kicker.is_on_roster ? 'On Your Roster' : 'Free Agent'
                            return (
                              <div key={idx}>
                                {renderPlayerWithLogo(kicker, undefined, ` (${status})`)}
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
                  <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <div className="section-title">⭐ Optimal Starting Lineup with Free Agent Analysis</div>
                  
                  <div>
                    <h4>🎯 OPTIMAL STARTING LINEUP (Including Best Available Free Agents):</h4>
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
                      <div style={{ marginTop: '24px' }}>
                        <h4>📈 Free Agent Upgrade Summary:</h4>
                        <div className="message message-success">
                          🚀 <strong>{optimalAnalysis.free_agent_upgrades.length} potential upgrade(s)</strong> with{' '}
                          <strong>+{optimalAnalysis.free_agent_upgrades.reduce((sum: number, u: any) => sum + u.improvement, 0)} total rank improvement</strong>
                        </div>
                        {optimalAnalysis.free_agent_upgrades.map((upgrade: any, idx: number) => (
                          <div key={idx} style={{ marginTop: '8px' }}>
                            • <strong>{upgrade.position}</strong>: {upgrade.add.name} (#{upgrade.add.rank}) replaces {upgrade.drop.name} (#{upgrade.drop.rank}) - <strong>+{upgrade.improvement} ranks</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {rosAnalysis && (
                <>
                  <hr style={{ margin: '32px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                  <div className="section-title">🔄 ROS Upgrade Recommendations</div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                    <div>
                      <h4>📍 Position-Specific Upgrades</h4>
                      {['QB', 'RB', 'WR', 'TE'].map((position) => {
                        const recommendations = rosAnalysis.position_recommendations?.[position] || []
                        const emojis: Record<string, string> = {'QB': '🎯', 'RB': '🏈', 'WR': '⚡', 'TE': '🎪'}
                        
                        return (
                          <div key={position} style={{ marginTop: '16px' }}>
                            <h5>{emojis[position]} {position}S</h5>
                            {recommendations.length > 0 ? (
                              recommendations.map((rec: any, idx: number) => (
                                <div key={idx} style={{ marginTop: '8px' }}>
                                  <div><strong>Drop:</strong></div>
                                  {renderPlayerWithLogo(rec.drop)}
                                  <div style={{ marginTop: '4px' }}><strong>Add:</strong></div>
                                  {renderPlayerWithLogo(rec.add)}
                                  <div className="message message-success" style={{ marginTop: '4px' }}>
                                    ⬆️ Improvement: +{rec.improvement} ranks
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="message message-info">No upgrades available</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    <div>
                      <h4>📈 Best Available Players</h4>
                      
                      <h5>➖ DROP (Worst on Roster)</h5>
                      {rosAnalysis.worst_drops && rosAnalysis.worst_drops.length > 0 ? (
                        rosAnalysis.worst_drops.slice(0, 8).map((player: any, idx: number) => {
                          const logoPath = getTeamLogoPath(player.team)
                          return (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              marginBottom: '8px',
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: '#f9fafb'
                            }}>
                              {logoPath && (
                                <div style={{ 
                                  flexShrink: 0,
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  padding: '2px'
                                }}>
                                  <Image 
                                    src={logoPath} 
                                    alt={player.team} 
                                    width={28} 
                                    height={28}
                                    style={{
                                      objectFit: 'contain',
                                      maxWidth: '100%',
                                      maxHeight: '100%'
                                    }}
                                  />
                                </div>
                              )}
                              <div>
                                <strong>{player.position}</strong> Rank #{player.rank} - {player.name} ({player.team})
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="message message-info">No players to drop</div>
                      )}
                      
                      <h5 style={{ marginTop: '16px' }}>➕ ADD (Best Available)</h5>
                      {rosAnalysis.best_adds && rosAnalysis.best_adds.length > 0 ? (
                        rosAnalysis.best_adds.slice(0, 8).map((player: any, idx: number) => {
                          const logoPath = getTeamLogoPath(player.team)
                          return (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '12px', 
                              marginBottom: '8px',
                              padding: '6px',
                              borderRadius: '6px',
                              backgroundColor: '#f9fafb'
                            }}>
                              {logoPath && (
                                <div style={{ 
                                  flexShrink: 0,
                                  width: '32px',
                                  height: '32px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: '#ffffff',
                                  borderRadius: '4px',
                                  padding: '2px'
                                }}>
                                  <Image 
                                    src={logoPath} 
                                    alt={player.team} 
                                    width={28} 
                                    height={28}
                                    style={{
                                      objectFit: 'contain',
                                      maxWidth: '100%',
                                      maxHeight: '100%'
                                    }}
                                  />
                                </div>
                              )}
                              <div>
                                <strong>{player.position}</strong> Rank #{player.rank} - {player.name} ({player.team})
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <div className="message message-info">No free agents found</div>
                      )}
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

