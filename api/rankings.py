from http.server import BaseHTTPRequestHandler
import json
import sys
import os

# Add parent directory to path to import our modules
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
            
            scoring_format = data.get('scoring_format', 'Standard')
            
            # Import scraper
            from fantasy_rankings_scraper import scrape
            scraper = scrape('fantasypros.com')
            
            # Get the right data based on scoring format
            if scoring_format == 'Standard':
                players_data = scraper.data[1]
            elif scoring_format == 'Half-PPR':
                players_data = scraper.data[2]
            elif scoring_format == 'PPR':
                players_data = scraper.data[3]
            else:
                players_data = scraper.data[1]
            
            # Create draft tool and load data
            draft_tool = FantasyDraftTool("")
            draft_tool.load_scraped_data(players_data, scoring_format)
            draft_tool.fetch_sleeper_data()
            draft_tool.match_players()
            
            # Convert players to JSON-serializable format
            players_json = []
            for player in draft_tool.players:
                players_json.append({
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
            
            # Convert sleeper players to JSON
            sleeper_players_json = {}
            for player_id, sleeper_player in draft_tool.sleeper_players.items():
                sleeper_players_json[player_id] = sleeper_player
            
            response = {
                'success': True,
                'players': players_json,
                'sleeper_players': sleeper_players_json,
                'count': len(players_json)
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

