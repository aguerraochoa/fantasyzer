from http.server import BaseHTTPRequestHandler
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fantasy_draft_tool import FantasyDraftTool

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action')
            
            if action == 'analyze':
                league_id = data.get('league_id')
                user_id = data.get('user_id')
                
                if not league_id or not user_id:
                    raise ValueError("league_id and user_id are required")
                
                # Load weekly rankings
                weekly_rankings = FantasyDraftTool.load_weekly_rankings()
                
                # Get league data
                rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                users = FantasyDraftTool.fetch_league_users(league_id)
                
                # Get Sleeper players
                draft_tool = FantasyDraftTool("")
                draft_tool.fetch_sleeper_data()
                sleeper_players = draft_tool.sleeper_players
                
                # Find user's roster
                user_roster = None
                for roster in rosters:
                    if isinstance(roster, dict) and roster.get('owner_id') == user_id:
                        user_roster = roster
                        break
                
                if not user_roster:
                    raise ValueError("Could not find user roster")
                
                user_player_ids = user_roster.get('players', [])
                user_players_list = [{'player_id': pid} for pid in user_player_ids]
                
                # Get roster settings
                roster_settings = FantasyDraftTool.get_league_roster_settings(league_id)
                
                # Get all league players
                all_rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                all_league_players = []
                for roster in all_rosters:
                    if isinstance(roster, dict):
                        players = roster.get('players', [])
                        if isinstance(players, list):
                            for player_id in players:
                                if player_id:
                                    all_league_players.append({'player_id': player_id})
                
                # Analyze
                analysis = FantasyDraftTool.analyze_weekly_rankings(
                    weekly_rankings, user_players_list, sleeper_players, 
                    roster_settings, all_league_players
                )
                
                # Convert to JSON-serializable
                def serialize_analysis(analysis):
                    return {
                        'starters': analysis.get('starters', []),
                        'bench': analysis.get('bench', []),
                        'defenses': analysis.get('defenses', []),
                        'kickers': analysis.get('kickers', []),
                        'waiver_suggestions': {
                            'defenses': analysis.get('waiver_suggestions', {}).get('defenses', []),
                            'kickers': analysis.get('waiver_suggestions', {}).get('kickers', [])
                        }
                    }
                
                response = {
                    'success': True,
                    'analysis': serialize_analysis(analysis),
                    'roster_settings': roster_settings
                }
                
            elif action == 'optimal_lineup':
                league_id = data.get('league_id')
                user_id = data.get('user_id')
                
                if not league_id or not user_id:
                    raise ValueError("league_id and user_id are required")
                
                # Similar setup as above
                weekly_rankings = FantasyDraftTool.load_weekly_rankings()
                rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                
                draft_tool = FantasyDraftTool("")
                draft_tool.fetch_sleeper_data()
                sleeper_players = draft_tool.sleeper_players
                
                user_roster = None
                for roster in rosters:
                    if isinstance(roster, dict) and roster.get('owner_id') == user_id:
                        user_roster = roster
                        break
                
                if not user_roster:
                    raise ValueError("Could not find user roster")
                
                user_player_ids = user_roster.get('players', [])
                user_players_list = [{'player_id': pid} for pid in user_player_ids]
                
                roster_settings = FantasyDraftTool.get_league_roster_settings(league_id)
                
                all_rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                all_league_players = []
                for roster in all_rosters:
                    if isinstance(roster, dict):
                        players = roster.get('players', [])
                        if isinstance(players, list):
                            for player_id in players:
                                if player_id:
                                    all_league_players.append({'player_id': player_id})
                
                optimal_analysis = FantasyDraftTool.analyze_optimal_lineup_with_free_agents(
                    weekly_rankings, user_players_list, sleeper_players,
                    roster_settings, all_league_players
                )
                
                response = {
                    'success': True,
                    'optimal_starters': optimal_analysis.get('optimal_starters', []),
                    'free_agent_upgrades': optimal_analysis.get('free_agent_upgrades', []),
                    'available_free_agents': optimal_analysis.get('available_free_agents', [])
                }
                
            elif action == 'ros_recommendations':
                league_id = data.get('league_id')
                user_id = data.get('user_id')
                
                if not league_id or not user_id:
                    raise ValueError("league_id and user_id are required")
                
                rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                
                draft_tool = FantasyDraftTool("")
                draft_tool.fetch_sleeper_data()
                sleeper_players = draft_tool.sleeper_players
                
                user_roster = None
                for roster in rosters:
                    if isinstance(roster, dict) and roster.get('owner_id') == user_id:
                        user_roster = roster
                        break
                
                if not user_roster:
                    raise ValueError("Could not find user roster")
                
                user_player_ids = user_roster.get('players', [])
                user_players_list = [{'player_id': pid} for pid in user_player_ids]
                
                all_rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                all_league_players = []
                for roster in all_rosters:
                    if isinstance(roster, dict):
                        players = roster.get('players', [])
                        if isinstance(players, list):
                            for player_id in players:
                                if player_id:
                                    all_league_players.append({'player_id': player_id})
                
                ros_rankings = FantasyDraftTool.load_ros_rankings()
                ros_analysis = FantasyDraftTool.analyze_ros_recommendations(
                    user_players_list, sleeper_players, all_league_players, ros_rankings
                )
                
                response = {
                    'success': True,
                    'user_players': ros_analysis.get('user_players', []),
                    'free_agents': ros_analysis.get('free_agents', []),
                    'position_recommendations': ros_analysis.get('position_recommendations', {}),
                    'best_adds': ros_analysis.get('best_adds', []),
                    'worst_drops': ros_analysis.get('worst_drops', [])
                }
                
            else:
                raise ValueError(f"Unknown action: {action}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e)
            }
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode('utf-8'))

