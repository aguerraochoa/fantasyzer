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
            
            if action == 'get_user_id':
                username = data.get('username')
                if not username:
                    raise ValueError("username is required")
                
                user_id = FantasyDraftTool.fetch_user_id_by_username(username)
                
                response = {
                    'success': True,
                    'user_id': user_id
                }
                
            elif action == 'get_leagues':
                user_id = data.get('user_id')
                season_year = data.get('season_year', FantasyDraftTool.get_current_season_year())
                
                if not user_id:
                    raise ValueError("user_id is required")
                
                leagues = FantasyDraftTool.fetch_user_leagues(user_id, season_year)
                
                response = {
                    'success': True,
                    'leagues': leagues,
                    'user_id': user_id  # Include user_id in response
                }
                
            elif action == 'get_drafts':
                league_id = data.get('league_id')
                if not league_id:
                    raise ValueError("league_id is required")
                
                drafts = FantasyDraftTool.fetch_league_drafts(league_id)
                
                response = {
                    'success': True,
                    'drafts': drafts
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

