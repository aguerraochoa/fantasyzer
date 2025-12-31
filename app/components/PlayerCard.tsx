'use client'

import Image from 'next/image'

interface Player {
  name: string
  team: string
  position: string
  overall_rank: number
  position_rank: number
  tier: number
  bye_week: number
  sos_season: string
  ecr_vs_adp: number
  sleeper_id?: string
  drafted?: boolean
  injury_status?: string
}

interface PlayerCardProps {
  player: Player
  index?: number
  sleeperPlayers?: Record<string, any>
}

export default function PlayerCard({ player, index, sleeperPlayers }: PlayerCardProps) {
  const getTeamLogoPath = (teamAbbrev: string): string | null => {
    if (!teamAbbrev) return null
    
    const teamLogoMap: Record<string, string> = {
      "ARI": "/team_logos/Arizona_Cardinals_logo.svg.png",
      "ATL": "/team_logos/Atlanta_Falcons_logo.svg.png",
      "BAL": "/team_logos/Baltimore_Ravens_logo.svg.png",
      "BUF": "/team_logos/Buffalo_Bills_logo.svg.png",
      "CAR": "/team_logos/Carolina_Panthers_logo.svg.png",
      "CHI": "/team_logos/Chicago_Bears_logo.svg.png",
      "CIN": "/team_logos/Cincinnati_Bengals_logo.svg.png",
      "CLE": "/team_logos/Cleveland_Browns_logo.svg.png",
      "DAL": "/team_logos/Dallas_Cowboys.svg.png",
      "DEN": "/team_logos/Denver_Broncos_logo.svg.png",
      "DET": "/team_logos/Detroit_Lions_logo.svg.png",
      "GB": "/team_logos/Green_Bay_Packers_logo.svg.png",
      "HOU": "/team_logos/Houston_Texans_logo.svg.png",
      "IND": "/team_logos/Indianapolis_Colts_logo.svg.png",
      "JAX": "/team_logos/Jacksonville_Jaguars_logo.svg.png",
      "JAC": "/team_logos/Jacksonville_Jaguars_logo.svg.png", // Sleeper uses JAC
      "KC": "/team_logos/Kansas_City_Chiefs_logo.svg.png",
      "LV": "/team_logos/Las_Vegas_Raiders_logo.svg.png",
      "LAR": "/team_logos/Los_Angeles_Rams_logo.svg.png",
      "LAC": "/team_logos/NFL_Chargers_logo.svg.png",
      "MIA": "/team_logos/Miami_Dolphins_logo.svg.png",
      "MIN": "/team_logos/Minnesota_Vikings_logo.svg.png",
      "NE": "/team_logos/New_England_Patriots_logo.svg.png",
      "NO": "/team_logos/New_Orleans_Saints_logo.svg.png",
      "NYG": "/team_logos/New_York_Giants_logo.svg.png",
      "NYJ": "/team_logos/New_York_Jets_logo.svg.png",
      "PHI": "/team_logos/Philadelphia_Eagles_logo.svg.png",
      "PIT": "/team_logos/Pittsburgh_Steelers_logo.svg.png",
      "SF": "/team_logos/San_Francisco_49ers_logo.svg.png",
      "SEA": "/team_logos/Seattle_Seahawks_logo.svg.png",
      "TB": "/team_logos/Tampa_Bay_Buccaneers_logo.svg.png",
      "TEN": "/team_logos/Tennessee_Titans_logo.svg.png",
      "WAS": "/team_logos/Washington_football_team_wlogo.svg.png",
    }
    
    return teamLogoMap[teamAbbrev.toUpperCase()] || null
  }
  
  const logoPath = getTeamLogoPath(player.team)
  const injury = player.injury_status || 
    (player.sleeper_id && sleeperPlayers?.[player.sleeper_id]?.injury_status)
  
  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      'QB': 'QB',
      'RB': 'RB',
      'WR': 'WR',
      'TE': 'TE',
      'K': 'K',
      'DEF': 'DEF'
    }
    return colors[position] || ''
  }
  
  return (
    <div className="player-card fade-in">
      {logoPath && (
        <div className="player-logo-container">
          <Image
            src={logoPath}
            alt={player.team}
            width={32}
            height={32}
            className="player-logo"
          />
        </div>
      )}
      <div className="player-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', flexWrap: 'wrap', flex: 1 }}>
          {index !== undefined && <span className="num-badge">{index}</span>}
          <span style={{ fontWeight: 600, fontSize: '0.9375rem' }}>{player.name}</span>
          {player.team && (
            <span style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '0.8125rem',
              fontWeight: 400
            }}>
              {player.team}
            </span>
          )}
          {player.position && (
            <span className={`position-tag ${getPositionColor(player.position)}`}>
              {player.position}
            </span>
          )}
          <span className="badge">#{player.overall_rank}</span>
          <span className="badge">{player.position}#{player.position_rank}</span>
          {player.tier && <span className="badge">T{player.tier}</span>}
          {player.bye_week > 0 && <span className="badge">Bye {player.bye_week}</span>}
        </div>
        {injury && (
          <span style={{ 
            fontSize: '0.75rem',
            color: 'var(--accent-error)',
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            ⚠️ {injury}
          </span>
        )}
      </div>
    </div>
  )
}
