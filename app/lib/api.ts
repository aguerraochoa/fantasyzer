const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '/api'

export interface Player {
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
  drafted_by?: string
}

export interface RankingsResponse {
  success: boolean
  players: Player[]
  sleeper_players: Record<string, any>
  count: number
  error?: string
}

export interface DraftPicksResponse {
  success: boolean
  players: Player[]
  drafted_count: number
  error?: string
}

export async function loadRankings(scoringFormat: 'Standard' | 'Half-PPR' | 'PPR'): Promise<RankingsResponse> {
  const response = await fetch(`${API_BASE}/rankings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ scoring_format: scoringFormat }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to load rankings: ${response.statusText}`)
  }
  
  return response.json()
}

export async function refreshDraftPicks(
  draftId: string,
  players: Player[],
  sleeperPlayers: Record<string, any>
): Promise<DraftPicksResponse> {
  const response = await fetch(`${API_BASE}/draft-picks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      draft_id: draftId,
      players,
      sleeper_players: sleeperPlayers,
    }),
  })
  
  if (!response.ok) {
    throw new Error(`Failed to refresh draft picks: ${response.statusText}`)
  }
  
  return response.json()
}

export async function getUserLeagues(username: string, seasonYear?: number): Promise<any> {
  // First get user ID
  const userIdResponse = await fetch(`${API_BASE}/leagues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get_user_id',
      username,
    }),
  })
  
  if (!userIdResponse.ok) {
    throw new Error('Failed to get user ID')
  }
  
  const userIdData = await userIdResponse.json()
  if (!userIdData.success || !userIdData.user_id) {
    throw new Error('User not found')
  }
  
  const userId = userIdData.user_id
  
  // Then get leagues
  const leaguesResponse = await fetch(`${API_BASE}/leagues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get_leagues',
      user_id: userId,
      season_year: seasonYear || new Date().getFullYear(),
    }),
  })
  
  if (!leaguesResponse.ok) {
    throw new Error('Failed to get leagues')
  }
  
  const leaguesData = await leaguesResponse.json()
  // Add user_id to the response
  return {
    ...leaguesData,
    user_id: userId
  }
}

export async function getLeagueDrafts(leagueId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/leagues`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'get_drafts',
      league_id: leagueId,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to get drafts')
  }
  
  return response.json()
}

export async function analyzeWeeklyRankings(leagueId: string, userId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/weekly-rankings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'analyze',
      league_id: leagueId,
      user_id: userId,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to analyze weekly rankings')
  }
  
  return response.json()
}

export async function getOptimalLineup(leagueId: string, userId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/weekly-rankings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'optimal_lineup',
      league_id: leagueId,
      user_id: userId,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to get optimal lineup')
  }
  
  return response.json()
}

export async function getROSRecommendations(leagueId: string, userId: string): Promise<any> {
  const response = await fetch(`${API_BASE}/weekly-rankings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'ros_recommendations',
      league_id: leagueId,
      user_id: userId,
    }),
  })
  
  if (!response.ok) {
    throw new Error('Failed to get ROS recommendations')
  }
  
  return response.json()
}

