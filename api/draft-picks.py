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
            
            draft_id = data.get('draft_id')
            players_data = data.get('players', [])
            sleeper_players_data = data.get('sleeper_players', {})
            
            if not draft_id:
                raise ValueError("draft_id is required")
            
            # Recreate draft tool from players data
            draft_tool = FantasyDraftTool("")
            
            # Recreate players
            from fantasy_draft_tool import Player
            for p_data in players_data:
                player = Player(
                    name=p_data['name'],
                    team=p_data['team'],
                    position=p_data['position'],
                    overall_rank=p_data['overall_rank'],
                    position_rank=p_data['position_rank'],
                    tier=p_data['tier'],
                    bye_week=p_data['bye_week'],
                    sos_season=p_data['sos_season'],
                    ecr_vs_adp=p_data['ecr_vs_adp'],
                    sleeper_id=p_data.get('sleeper_id'),
                    drafted=p_data.get('drafted', False),
                    drafted_by=p_data.get('drafted_by')
                )
                draft_tool.players.append(player)
            
            draft_tool.sleeper_players = sleeper_players_data
            draft_tool.set_sleeper_draft_id(draft_id)
            draft_tool.fetch_sleeper_draft_picks()
            
            # Update players with drafted status
            updated_players = []
            for player in draft_tool.players:
                updated_players.append({
                    'name': player.name,
                    'team': player.team,
                    'position': player.position,
                    'overall_rank': player.overall_rank,
                    'position_rank': player.position_rank,
                    'tier': player.tier,
                    'bye_week': player.bye_week,
                    'sos_season': player.sos_season,
                    'ecr_vs_adp': player.ecr_vs_adp,
                    'sleeper_id': player.sleeper_id,
                    'drafted': player.drafted,
                    'drafted_by': player.drafted_by
                })
            
            response = {
                'success': True,
                'players': updated_players,
                'drafted_count': len([p for p in updated_players if p['drafted']])
            }
            
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

