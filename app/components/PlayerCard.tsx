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
      "ARI": "/Team Logos/Arizona_Cardinals_logo.svg.png",
      "ATL": "/Team Logos/Atlanta_Falcons_logo.svg.png",
      "BAL": "/Team Logos/Baltimore_Ravens_logo.svg.png",
      "BUF": "/Team Logos/Buffalo_Bills_logo.svg.png",
      "CAR": "/Team Logos/Carolina_Panthers_logo.svg.png",
      "CHI": "/Team Logos/Chicago_Bears_logo.svg.png",
      "CIN": "/Team Logos/Cincinnati_Bengals_logo.svg.png",
      "CLE": "/Team Logos/Cleveland_Browns_logo.svg.png",
      "DAL": "/Team Logos/Dallas_Cowboys.svg.png",
      "DEN": "/Team Logos/Denver_Broncos_logo.svg.png",
      "DET": "/Team Logos/Detroit_Lions_logo.svg.png",
      "GB": "/Team Logos/Green_Bay_Packers_logo.svg.png",
      "HOU": "/Team Logos/Houston_Texans_logo.svg.png",
      "IND": "/Team Logos/Indianapolis_Colts_logo.svg.png",
      "JAX": "/Team Logos/Jacksonville_Jaguars_logo.svg.png",
      "KC": "/Team Logos/Kansas_City_Chiefs_logo.svg.png",
      "LV": "/Team Logos/Las_Vegas_Raiders_logo.svg.png",
      "LAR": "/Team Logos/Los_Angeles_Rams_logo.svg.png",
      "LAC": "/Team Logos/NFL_Chargers_logo.svg.png",
      "MIA": "/Team Logos/Miami_Dolphins_logo.svg.png",
      "MIN": "/Team Logos/Minnesota_Vikings_logo.svg.png",
      "NE": "/Team Logos/New_England_Patriots_logo.svg.png",
      "NO": "/Team Logos/New_Orleans_Saints_logo.svg.png",
      "NYG": "/Team Logos/New_York_Giants_logo.svg.png",
      "NYJ": "/Team Logos/New_York_Jets_logo.svg.png",
      "PHI": "/Team Logos/Philadelphia_Eagles_logo.svg.png",
      "PIT": "/Team Logos/Pittsburgh_Steelers_logo.svg.png",
      "SF": "/Team Logos/San_Francisco_49ers_logo.svg.png",
      "SEA": "/Team Logos/Seattle_Seahawks_logo.svg.png",
      "TB": "/Team Logos/Tampa_Bay_Buccaneers_logo.svg.png",
      "TEN": "/Team Logos/Tennessee_Titans_logo.svg.png",
      "WAS": "/Team Logos/Washington_football_team_wlogo.svg.png",
    }
    
    return teamLogoMap[teamAbbrev.toUpperCase()] || null
  }
  
  const logoPath = getTeamLogoPath(player.team)
  const injury = player.injury_status || 
    (player.sleeper_id && sleeperPlayers?.[player.sleeper_id]?.injury_status)
  
  return (
    <div className="player-card">
      {logoPath && (
        <div className="player-logo-container">
          <Image
            src={logoPath}
            alt={player.team}
            width={40}
            height={40}
            className="player-logo"
          />
        </div>
      )}
      <div className="player-content">
        <div className="player-name">
          {index !== undefined && <span className="num-badge">{index}.</span>}
          {player.name}
          <span className="player-team">({player.team})</span>
        </div>
        <div className="player-meta">
          <span className="badge">Overall #{player.overall_rank}</span>
          <span className="badge">{player.position} #{player.position_rank}</span>
          <span className="badge">Tier {player.tier}</span>
          <span className="badge">Bye {player.bye_week}</span>
          <span className="badge">SOS {player.sos_season}</span>
          <span className="badge">ECR vs ADP {player.ecr_vs_adp > 0 ? '+' : ''}{player.ecr_vs_adp}</span>
        </div>
        {injury && (
          <div className="player-injury">Injury: {injury}</div>
        )}
      </div>
    </div>
  )
}

