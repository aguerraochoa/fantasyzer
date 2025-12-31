#!/usr/bin/env python3
import os
import re
from typing import List, Dict, Optional
import io

import streamlit as st

from fantasy_draft_tool import FantasyDraftTool, Player
from league_manager import LeagueManager


st.set_page_config(page_title="Fantasy Draft Tool", layout="wide")


def initialize_session_state() -> None:
    if "draft_tool" not in st.session_state:
        st.session_state.draft_tool = None


def extract_draft_id_from_url(url: str) -> str:
    """Extract draft ID from Sleeper URL"""
    if not url:
        return ""
    
    # Remove any whitespace
    url = url.strip()
    
    # Handle different URL formats
    patterns = [
        r'https?://sleeper\.com/draft/nfl/(\d+)',  # New format: sleeper.com/draft/nfl/ID
        r'https?://sleeper\.app/draft/(\d+)',      # Old format: sleeper.app/draft/ID
        r'sleeper\.com/draft/nfl/(\d+)',           # Without protocol
        r'sleeper\.app/draft/(\d+)',               # Without protocol
        r'/draft/nfl/(\d+)',                       # Just path with nfl
        r'/draft/(\d+)',                           # Just path
        r'(\d+)'                                   # Just the number if that's all they paste
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return ""

def inject_css() -> None:
    """Inject minimal CSS for readable vertical player cards."""
    st.markdown(
        """
        <style>
        /* App background and sidebar (white) */
        [data-testid="stAppViewContainer"] { background: #ffffff; color: #1f2937; }
        [data-testid="stHeader"] { background: transparent; }
        [data-testid="stSidebar"] { background: #f9fafb; }
        /* Global text set to dark for readability on white */
        body, .stApp, .stMarkdown, .stText, .stCaption, p, span, label,
        [data-testid="stWidgetLabel"], [data-baseweb="toggle"] label,
        [data-baseweb="select"] label, [data-testid="stSidebar"] * {
            color: #1f2937 !important;
        }
        /* Inputs on white background */
        .stTextInput input, .stTextArea textarea, .stTextInput > div > div > input {
            background: #ffffff !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
        }
        /* Number input (Season year) */
        .stNumberInput input, [data-testid="stNumberInput"] input, input[type="number"] {
            background: #ffffff !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
        }
        .stTextInput input::placeholder, .stTextArea textarea::placeholder {
            color: #6b7280 !important;
            opacity: 0.8;
        }
        /* Buttons: light theme */
        .stButton > button {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            transition: background 120ms ease, border-color 120ms ease, transform 60ms ease;
        }
        .stButton > button:hover {
            background: #e5e7eb !important;
            border-color: #9ca3af !important;
        }
        .stButton > button:active {
            transform: translateY(1px);
        }
        /* Ensure sidebar buttons match */
        [data-testid="stSidebar"] .stButton > button {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
        }
        /* Form submit buttons - light theme */
        .stFormSubmitButton > button {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
        }
        .stFormSubmitButton > button:hover {
            background: #e5e7eb !important;
            border-color: #9ca3af !important;
        }
        /* Download buttons - light theme */
        .stDownloadButton > button {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
        }
        .stDownloadButton > button:hover {
            background: #e5e7eb !important;
            border-color: #9ca3af !important;
        }
        /* Selectbox styling - light theme */
        .stSelectbox > div > div {
            background: #ffffff !important;
            border: 1px solid #d1d5db !important;
            color: #1f2937 !important;
        }
        .stSelectbox > div > div:hover {
            border-color: #9ca3af !important;
        }
        .stSelectbox > div > div > div {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        /* Fix selectbox text color */
        .stSelectbox > div > div > div > div {
            color: #1f2937 !important;
            background: #ffffff !important;
        }
        /* Fix selectbox placeholder and selected text */
        .stSelectbox input, .stSelectbox select {
            color: #1f2937 !important;
            background: #ffffff !important;
        }
        /* Ensure dropdown options are visible */
        .stSelectbox [role="listbox"] {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        .stSelectbox [role="option"] {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        .stSelectbox [role="option"]:hover {
            background: #f3f4f6 !important;
        }
        /* Target all selectbox elements */
        .stSelectbox * {
            background: #ffffff !important;
        }
        /* Main selector text */
        .stSelectbox > div > div > div > div {
            color: #1f2937 !important;
        }
        /* Specific targeting for the selected option display */
        .stSelectbox > div > div > div > div > div {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        /* Target the dropdown list container specifically */
        .stSelectbox [data-baseweb="popover"] {
            background: #ffffff !important;
        }
        .stSelectbox [data-baseweb="popover"] * {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        /* Target any popover or dropdown containers */
        .stSelectbox [role="listbox"], .stSelectbox [role="menu"] {
            background: #ffffff !important;
        }
        .stSelectbox [role="listbox"] *, .stSelectbox [role="menu"] * {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        /* Override any Streamlit-specific dropdown styling */
        .stSelectbox [data-testid="stSelectbox"] {
            background: #ffffff !important;
        }
        .stSelectbox [data-testid="stSelectbox"] * {
            background: #ffffff !important;
        }
        /* Fix expander header text color for readability */
        .streamlit-expanderHeader {
            color: #1f2937 !important;
            background: #f9fafb !important;
        }
        .streamlit-expanderHeader:hover {
            color: #111827 !important;
            background: #f3f4f6 !important;
        }
        /* Ensure expander content text is readable */
        .streamlit-expanderContent {
            color: #1f2937 !important;
        }
        /* Fix text in expanders */
        .streamlit-expanderHeader * {
            color: #1f2937 !important;
        }
        /* Force override expander header background */
        .streamlit-expanderHeader {
            background-color: #f9fafb !important;
        }
        /* Target the expander header container */
        [data-testid="stExpander"] {
            background: #ffffff !important;
        }
        [data-testid="stExpander"] * {
            background: #ffffff !important;
        }
        /* Override backgrounds in expanders */
        .streamlit-expanderHeader[style*="background"] {
            background: #f9fafb !important;
        }
        .streamlit-expanderHeader div[style*="background"] {
            background: #f9fafb !important;
        }
        /* Ensure buttons are properly aligned */
        .stButton > button {
            margin-top: 0 !important;
            margin-bottom: 0 !important;
        }
        /* Streamlit popover/menu (Deploy/3-dot menu) */
        [data-baseweb="popover"] {
            background: #ffffff !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        [data-baseweb="popover"] * { color: #1f2937 !important; }
        [data-baseweb="menu"], [role="menu"] {
            background: #ffffff !important;
            color: #1f2937 !important;
        }
        [data-baseweb="menu"] *, [role="menu"] * { color: #1f2937 !important; }
        /* Ensure menu item rows */
        [data-baseweb="menu"] li,
        [data-baseweb="menu"] [role="menuitem"],
        [data-baseweb="menu"] [aria-disabled="true"],
        [role="menu"] [aria-disabled="true"],
        [data-baseweb="menu"] [disabled] {
            background: #ffffff !important;
            color: #1f2937 !important;
            opacity: 1 !important;
        }
        /* Hover/active states */
        [data-baseweb="menu"] li:hover,
        [data-baseweb="menu"] [role="menuitem"]:hover {
            background: #f3f4f6 !important;
        }
        [data-baseweb="menu"] hr { border-color: #e5e7eb !important; }
        /* Headings */
        .app-title { font-weight: 800; font-size: 2.2rem; margin-bottom: 0.25rem; color: #1f2937; }
        .app-caption { color: #4b5563; margin-bottom: 1.25rem; }
        .section-title { font-weight: 800; font-size: 1.4rem; margin: 0.5rem 0 0.75rem; color: #1f2937; }
        .pos-header { font-weight: 800; font-size: 1.1rem; margin-bottom: 0.5rem; color: #1f2937; }
        /* Player cards */
        .player-card {
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 12px;
            background: #f9fafb;
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .player-logo-container {
            flex-shrink: 0;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .player-logo {
            max-width: 40px;
            max-height: 40px;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        .player-content {
            flex: 1;
        }
        .player-name { font-weight: 800; font-size: 1.05rem; margin-bottom: 4px; color: #1f2937; }
        .player-team { color: #6b7280; font-weight: 700; margin-left: 6px; }
        .player-meta { color: #4b5563; font-size: 0.92rem; margin-top: 2px; }
        .player-injury { color: #dc2626; font-size: 0.9rem; margin-top: 6px; font-weight: 700; }
        .badge { display:inline-block; padding: 2px 8px; background:#e5e7eb; border:1px solid #d1d5db; color:#374151; border-radius:999px; font-size:12px; margin-right:6px; }
        .num-badge { display:inline-block; min-width: 24px; padding: 2px 6px; margin-right: 8px; text-align:center; background:#f3f4f6; border:1px solid #d1d5db; color:#1f2937; border-radius:8px; font-weight:800; }
        
        /* File uploader styling for light theme */
        .stFileUploader {
            background: #f9fafb !important;
            border: 2px dashed #d1d5db !important;
            border-radius: 12px !important;
            padding: 20px !important;
        }
        .stFileUploader > div {
            background: #f9fafb !important;
            border: none !important;
        }
        .stFileUploader [data-testid="stFileUploader"] {
            background: #f9fafb !important;
            border: 2px dashed #d1d5db !important;
            border-radius: 12px !important;
        }
        .stFileUploader [data-testid="stFileUploader"] > div {
            background: #f9fafb !important;
            border: none !important;
        }
        /* File uploader text and button */
        .stFileUploader p, .stFileUploader span, .stFileUploader label {
            color: #1f2937 !important;
        }
        .stFileUploader button {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 8px !important;
        }
        .stFileUploader button:hover {
            background: #e5e7eb !important;
            border-color: #9ca3af !important;
        }
        /* Override backgrounds in file uploader */
        [data-testid="stFileUploader"] * {
            background: #f9fafb !important;
        }
        [data-testid="stFileUploader"] div[style*="background"] {
            background: #f9fafb !important;
        }
        
        /* Code blocks and inline code styling for light theme */
        code, pre, .stMarkdown code {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
        }
        pre {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 8px !important;
            padding: 12px !important;
        }
        /* Inline code styling */
        .stMarkdown p code {
            background: #f3f4f6 !important;
            color: #1f2937 !important;
            border: 1px solid #e5e7eb !important;
            border-radius: 4px !important;
            padding: 2px 6px !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def get_team_logo_path(team_abbrev: str) -> Optional[str]:
    """Get the path to a team logo file based on team abbreviation."""
    if not team_abbrev:
        return None
    
    # Map team abbreviations to logo file names
    team_logo_map = {
        "ARI": "Arizona_Cardinals_logo.svg.png",
        "ATL": "Atlanta_Falcons_logo.svg.png",
        "BAL": "Baltimore_Ravens_logo.svg.png",
        "BUF": "Buffalo_Bills_logo.svg.png",
        "CAR": "Carolina_Panthers_logo.svg.png",
        "CHI": "Chicago_Bears_logo.svg.png",
        "CIN": "Cincinnati_Bengals_logo.svg.png",
        "CLE": "Cleveland_Browns_logo.svg.png",
        "DAL": "Dallas_Cowboys.svg.png",
        "DEN": "Denver_Broncos_logo.svg.png",
        "DET": "Detroit_Lions_logo.svg.png",
        "GB": "Green_Bay_Packers_logo.svg.png",
        "HOU": "Houston_Texans_logo.svg.png",
        "IND": "Indianapolis_Colts_logo.svg.png",
        "JAX": "Jacksonville_Jaguars_logo.svg.png",
        "KC": "Kansas_City_Chiefs_logo.svg.png",
        "LV": "Las_Vegas_Raiders_logo.svg.png",
        "LAR": "Los_Angeles_Rams_logo.svg.png",
        "LAC": "NFL_Chargers_logo.svg.png",
        "MIA": "Miami_Dolphins_logo.svg.png",
        "MIN": "Minnesota_Vikings_logo.svg.png",
        "NE": "New_England_Patriots_logo.svg.png",
        "NO": "New_Orleans_Saints_logo.svg.png",
        "NYG": "New_York_Giants_logo.svg.png",
        "NYJ": "New_York_Jets_logo.svg.png",
        "PHI": "Philadelphia_Eagles_logo.svg.png",
        "PIT": "Pittsburgh_Steelers_logo.svg.png",
        "SF": "San_Francisco_49ers_logo.svg.png",
        "SEA": "Seattle_Seahawks_logo.svg.png",
        "TB": "Tampa_Bay_Buccaneers_logo.svg.png",
        "TEN": "Tennessee_Titans_logo.svg.png",
        "WAS": "Washington_football_team_wlogo.svg.png",
        # Handle old team abbreviations
        "OAK": "Las_Vegas_Raiders_logo.svg.png",  # Raiders old location
        "SD": "NFL_Chargers_logo.svg.png",  # Chargers old location
        "STL": "Los_Angeles_Rams_logo.svg.png",  # Rams old location
    }
    
    logo_filename = team_logo_map.get(team_abbrev.upper())
    if not logo_filename:
        return None
    
    logo_path = f"Team Logos/{logo_filename}"
    
    # Check if file exists
    if os.path.exists(logo_path):
        return logo_path
    return None


def format_player_rows(players: List[Player], sleeper_players: Dict[str, dict]) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    for player in players:
        row: Dict[str, object] = {
            "Name": player.name,
            "Team": player.team,
            "Ovr": player.overall_rank,
            "Pos#": player.position_rank,
            "Tier": player.tier,
            "Bye": player.bye_week,
            "SOS": player.sos_season,
            "ECR vs ADP": player.ecr_vs_adp,
        }
        if player.sleeper_id and player.sleeper_id in sleeper_players:
            sp = sleeper_players[player.sleeper_id]
            if sp.get("injury_status"):
                row["Injury"] = sp.get("injury_status")
        rows.append(row)
    return rows


def render_sidebar() -> None:
    with st.sidebar:
        st.header("Setup")
        
        # FantasyPros Rankings Section
        st.subheader("🎯 FantasyPros Rankings")
        st.markdown("Choose your scoring format:")
        
        # All three buttons vertically stacked
        if st.button("📊 Standard", use_container_width=True):
            try:
                with st.spinner("Loading Standard rankings..."):
                    from fantasy_rankings_scraper import scrape
                    scraper = scrape('fantasypros.com')
                    standard_players = scraper.data[1]
                    draft_tool = FantasyDraftTool("")
                    draft_tool.load_scraped_data(standard_players, "Standard")
                    draft_tool.fetch_sleeper_data()
                    draft_tool.match_players()
                    st.session_state.draft_tool = draft_tool
                    st.success(f"✅ Loaded {len(draft_tool.players)} Standard players successfully!")
            except Exception as ex:
                st.error(f"❌ Error loading Standard rankings: {ex}")
        
        if st.button("📈 Half-PPR", use_container_width=True):
            try:
                with st.spinner("Loading Half-PPR rankings..."):
                    from fantasy_rankings_scraper import scrape
                    scraper = scrape('fantasypros.com')
                    half_ppr_players = scraper.data[2]
                    draft_tool = FantasyDraftTool("")
                    draft_tool.load_scraped_data(half_ppr_players, "Half-PPR")
                    draft_tool.fetch_sleeper_data()
                    draft_tool.match_players()
                    st.session_state.draft_tool = draft_tool
                    st.success(f"✅ Loaded {len(draft_tool.players)} Half-PPR players successfully!")
            except Exception as ex:
                st.error(f"❌ Error loading Half-PPR rankings: {ex}")
        
        if st.button("🏈 PPR", use_container_width=True):
            try:
                with st.spinner("Loading PPR rankings..."):
                    from fantasy_rankings_scraper import scrape
                    scraper = scrape('fantasypros.com')
                    ppr_players = scraper.data[3]
                    draft_tool = FantasyDraftTool("")
                    draft_tool.load_scraped_data(ppr_players, "PPR")
                    draft_tool.fetch_sleeper_data()
                    draft_tool.match_players()
                    st.session_state.draft_tool = draft_tool
                    st.success(f"✅ Loaded {len(draft_tool.players)} PPR players successfully!")
            except Exception as ex:
                st.error(f"❌ Error loading PPR rankings: {ex}")

        st.divider()

        # New: Username-based discovery for leagues and drafts
        st.subheader("🏈 Sleeper: Discover Leagues & Drafts")
        username = st.text_input("Sleeper username", placeholder="your_username")
        # Get current season year with fallback
        try:
            season_year = FantasyDraftTool.get_current_season_year()
        except AttributeError:
            from datetime import datetime
            season_year = datetime.utcnow().year
        st.caption(f"Using current season: {season_year}")
        
        if st.button("🔎 Find my leagues", use_container_width=True, disabled=not bool(username.strip())):
            with st.spinner("Fetching leagues and drafts..."):
                user_id = FantasyDraftTool.fetch_user_id_by_username(username.strip())
                if not user_id:
                    st.error("❌ Could not resolve user_id from username.")
                else:
                    leagues = FantasyDraftTool.fetch_user_leagues(user_id, int(season_year))
                    if not leagues:
                        st.warning("No leagues found for this season.")
                    else:
                        league_options = []
                        league_id_to_drafts: Dict[str, List[dict]] = {}
                        for lg in leagues:
                            league_id = lg.get("league_id")
                            league_name = lg.get("name") or f"League {league_id}"
                            league_options.append((league_name, league_id))
                            drafts = FantasyDraftTool.fetch_league_drafts(league_id)
                            league_id_to_drafts[league_id] = drafts
                        # Persist to session for subsequent interactions
                        st.session_state.username = username.strip()
                        st.session_state.user_id = user_id
                        st.session_state.discovered_leagues = league_options
                        st.session_state.discovered_drafts = league_id_to_drafts
                        st.success(f"✅ Found {len(league_options)} leagues.")

        # Show discovered leagues and drafts as connect buttons
        if "discovered_leagues" in st.session_state and st.session_state.discovered_leagues:
            st.markdown("**Your Leagues (click a draft to connect):**")
            for league_name, league_id in st.session_state.discovered_leagues:
                drafts = (st.session_state.discovered_drafts or {}).get(league_id, [])
                if not drafts:
                    st.caption("No drafts found for this league.")
                else:
                    for d in drafts:
                        draft_id = d.get("draft_id") or d.get("draft_id".upper())
                        if st.button(f"🏈 {league_name}", key=f"connect_{draft_id}", use_container_width=True):
                            if st.session_state.draft_tool:
                                st.session_state.draft_tool.set_sleeper_draft_id(str(draft_id))
                                st.success(f"✅ Connected to {league_name}")
                                st.rerun()
                            else:
                                st.warning("⚠️ Load rankings first.")


def render_search(draft_tool: FantasyDraftTool) -> None:
    search_name = st.text_input("Search player by name")
    if not search_name:
        return

    player = draft_tool.search_player(search_name)
    if not player:
        st.warning("No player found.")
        return

    # Display player name with logo
    logo_path = get_team_logo_path(player.team)
    col_logo, col_name = st.columns([0.1, 0.9])
    with col_logo:
        if logo_path and os.path.exists(logo_path):
            try:
                st.image(logo_path, width=50)
            except Exception:
                st.write("")
        else:
            st.write("")
    with col_name:
        st.subheader(player.name)
    
    col1, col2 = st.columns(2)
    with col1:
        st.write(f"Team: {player.team}")
        st.write(f"Position: {player.position} (Rank #{player.position_rank})")
        st.write(f"Overall Rank: #{player.overall_rank}")
        st.write(f"Tier: {player.tier}")
    with col2:
        st.write(f"Bye Week: {player.bye_week}")
        st.write(f"Strength of Schedule: {player.sos_season}")
        st.write(f"ECR vs ADP: {player.ecr_vs_adp:+d}")
        st.write(f"Drafted: {'Yes' if player.drafted else 'No'}")

    if player.sleeper_id and player.sleeper_id in draft_tool.sleeper_players:
        sp = draft_tool.sleeper_players[player.sleeper_id]
        st.write("Sleeper Status:", sp.get("status", "Unknown"))
        if sp.get("injury_status"):
            st.write("Injury Status:", sp.get("injury_status"))
        if sp.get("injury_notes"):
            st.write("Injury Notes:", sp.get("injury_notes"))


def render_player_with_logo(player_name: str, team: str, position_display: str, rank: int, 
                            roster_slot: str = None, waiver_indicator: str = "", 
                            free_agent: bool = False, upgrade_info: str = None) -> None:
    """Render a player line with team logo for weekly rankings page."""
    logo_path = get_team_logo_path(team)
    
    # Create the player text
    slot_text = f"**{roster_slot}** " if roster_slot else ""
    free_agent_text = " ✨ FREE AGENT" if free_agent else ""
    player_text = f"{slot_text}**{player_name}** ({position_display}) - {team} - **Rank #{rank}**{waiver_indicator}{free_agent_text}"
    
    # Use columns to display logo and text
    col1, col2 = st.columns([0.08, 0.92])
    with col1:
        if logo_path and os.path.exists(logo_path):
            try:
                st.image(logo_path, width=30)
            except Exception:
                st.write("")
        else:
            st.write("")
    with col2:
        st.markdown(player_text)
        if upgrade_info:
            st.caption(upgrade_info)


def render_player_card(player: Player, sleeper_players: Dict[str, dict], index: int = None) -> None:
    injury = None
    if player.sleeper_id and player.sleeper_id in sleeper_players:
        sp = sleeper_players[player.sleeper_id]
        injury = sp.get("injury_status")

    num_html = f"<span class='num-badge'>{index}.</span>" if index is not None else ""
    injury_html = f"<div class='player-injury'>Injury: {injury}</div>" if injury else ""
    
    # Get team logo path
    logo_path = get_team_logo_path(player.team)
    
    # Create logo HTML if logo exists
    logo_html = ""
    if logo_path and os.path.exists(logo_path):
        try:
            import base64
            with open(logo_path, "rb") as img_file:
                img_data = base64.b64encode(img_file.read()).decode()
                logo_html = f'<div class="player-logo-container"><img src="data:image/png;base64,{img_data}" class="player-logo" alt="{player.team}" /></div>'
        except Exception:
            logo_html = ""
    
    # Display player card with logo
    st.markdown(
        f"""
        <div class="player-card">
          {logo_html}
          <div class="player-content">
            <div class="player-name">{num_html}{player.name}<span class="player-team">({player.team})</span></div>
            <div class="player-meta">
              <span class="badge">Overall #{player.overall_rank}</span>
              <span class="badge">{player.position} #{player.position_rank}</span>
              <span class="badge">Tier {player.tier}</span>
              <span class="badge">Bye {player.bye_week}</span>
              <span class="badge">SOS {player.sos_season}</span>
              <span class="badge">ECR vs ADP {player.ecr_vs_adp:+d}</span>
            </div>
            {injury_html}
          </div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_top_by_position(draft_tool: FantasyDraftTool) -> None:
    st.markdown("### Top 3 By Position (Available)")
    positions = ["RB", "WR", "QB", "TE"]

    # Arrange positions in two columns for readability
    for i in range(0, len(positions), 2):
        row_positions = positions[i : i + 2]
        cols = st.columns(len(row_positions))
        for col_idx, pos in enumerate(row_positions):
            with cols[col_idx]:
                st.markdown(f"<div class='pos-header'>{pos}</div>", unsafe_allow_html=True)
                top_players = draft_tool.get_top_players_by_position(pos, 3)
                if not top_players:
                    st.write("No players available.")
                    continue
                for idx, p in enumerate(top_players, start=1):
                    render_player_card(p, draft_tool.sleeper_players, idx)


def render_top_overall(draft_tool: FantasyDraftTool) -> None:
    cols = st.columns([0.7, 0.3])
    with cols[0]:
        st.markdown('<div class="section-title">Top Available Overall</div>', unsafe_allow_html=True)
    with cols[1]:
        show_10 = st.toggle("Show top 10 (otherwise top 5)", value=False)
    limit = 10 if show_10 else 5
    players = draft_tool.get_top_overall_available(limit)
    for idx, p in enumerate(players, start=1):
        render_player_card(p, draft_tool.sleeper_players, idx)


def render_navigation() -> None:
    """Render navigation menu at the top"""
    col1, col2, col3 = st.columns([1, 2, 1])
    
    with col1:
        if st.button("📊 Weekly Rankings", use_container_width=True):
            st.query_params.page = "weekly-rankings"
            st.rerun()
    
    with col3:
        if st.button("🏈 Draft Assistant", use_container_width=True):
            st.query_params.page = "draft-assistant"
            st.rerun()
    
    with col2:
        st.markdown('<div style="text-align: center; padding: 10px; color: #9ca3af;">Fantasy Football Tool</div>', unsafe_allow_html=True)


def render_weekly_rankings_sidebar() -> None:
    """Render the sidebar for Weekly Rankings page"""
    with st.sidebar:
        st.header("Setup")
        
        # League Discovery Section
        st.subheader("🏈 Discover Your Leagues")
        username = st.text_input("Sleeper username", placeholder="your_username", key="weekly_username")
        # Get current season year with fallback
        try:
            season_year = FantasyDraftTool.get_current_season_year()
        except AttributeError:
            from datetime import datetime
            season_year = datetime.utcnow().year
        st.caption(f"Using current season: {season_year}")
        
        if st.button("🔎 Find my leagues", use_container_width=True, disabled=not bool(username.strip()), key="weekly_find_leagues"):
            with st.spinner("Fetching leagues..."):
                user_id = FantasyDraftTool.fetch_user_id_by_username(username.strip())
                if not user_id:
                    st.error("❌ Could not resolve user_id from username.")
                else:
                    leagues = FantasyDraftTool.fetch_user_leagues(user_id, int(season_year))
                    if not leagues:
                        st.warning("No leagues found for this season.")
                    else:
                        league_options = []
                        for lg in leagues:
                            league_id = lg.get("league_id")
                            league_name = lg.get("name") or f"League {league_id}"
                            league_options.append((league_name, league_id))
                        
                        st.session_state.weekly_user_id = user_id
                        st.session_state.weekly_discovered_leagues = league_options
                        st.success(f"✅ Found {len(league_options)} leagues.")
        
        # Show discovered leagues
        if "weekly_discovered_leagues" in st.session_state and st.session_state.weekly_discovered_leagues:
            st.markdown("**Your Leagues (click to analyze):**")
            for league_name, league_id in st.session_state.weekly_discovered_leagues:
                if st.button(f"🏈 {league_name}", key=f"weekly_league_{league_id}", use_container_width=True):
                    st.session_state.selected_weekly_league = (league_name, league_id)
                    st.rerun()


def render_weekly_rankings_content() -> None:
    """Render the main content for Weekly Rankings page"""
    st.markdown('<div class="app-title">Weekly Rankings</div>', unsafe_allow_html=True)
    st.markdown('<div class="app-caption">Get start/sit recommendations and waiver wire suggestions for your leagues.</div>', unsafe_allow_html=True)
    
    # Show analysis for selected league
    if "selected_weekly_league" in st.session_state:
        league_name, league_id = st.session_state.selected_weekly_league
        st.markdown(f"### Analyzing: {league_name}")
        
        # Load weekly rankings
        with st.spinner("Loading weekly rankings..."):
            weekly_rankings = FantasyDraftTool.load_weekly_rankings()
        
        if not weekly_rankings:
            st.error("❌ No weekly rankings files found in weekly_rankings folder.")
            st.info("Please add your weekly rankings CSV files to the weekly_rankings folder.")
            return
        
        
        # Load league data
        with st.spinner("Loading league data..."):
            try:
                rosters = FantasyDraftTool.fetch_league_rosters(league_id)
                users = FantasyDraftTool.fetch_league_users(league_id)
                
                # Additional validation for chopped leagues
                if not isinstance(rosters, list):
                    st.error("❌ Invalid roster data format for this league type.")
                    return
                if not isinstance(users, list):
                    st.error("❌ Invalid user data format for this league type.")
                    return
                    
            except Exception as e:
                st.error(f"❌ Error loading league data: {str(e)}")
                return
            
        # Get Sleeper players data (always fetch fresh to avoid caching issues)
        with st.spinner("Loading fresh player data..."):
            draft_tool = FantasyDraftTool("")
            draft_tool.fetch_sleeper_data()
            sleeper_players = draft_tool.sleeper_players
        
        if not rosters or not users:
            st.error("❌ Could not load league data.")
            return
        
        # Find user's roster
        user_id = st.session_state.weekly_user_id
        user_roster = None
        for roster in rosters:
            # Handle different roster structures (normal vs chopped leagues)
            if not isinstance(roster, dict):
                continue
            if roster.get('owner_id') == user_id:
                user_roster = roster
                break
        
        if not user_roster:
            st.error("❌ Could not find your roster in this league.")
            return
        
        # Get user's players
        user_player_ids = user_roster.get('players', [])
        # Handle case where players might not be a list
        if not isinstance(user_player_ids, list):
            st.error("❌ Invalid roster structure for this league type.")
            return
        if not user_player_ids:
            st.warning("⚠️ Your roster appears to be empty.")
            return
        
        
        # Get league roster settings
        with st.spinner("Loading league settings..."):
            roster_settings = FantasyDraftTool.get_league_roster_settings(league_id)
        
        # Get all league rosters to check availability
        with st.spinner("Loading all league rosters..."):
            all_rosters = FantasyDraftTool.fetch_league_rosters(league_id)
            all_league_players = []
            for roster in all_rosters:
                # Handle different roster structures (normal vs chopped leagues)
                if not isinstance(roster, dict):
                    continue
                
                players = roster.get('players', [])
                # Handle case where players might not be a list
                if not isinstance(players, list):
                    continue
                    
                for player_id in players:
                    if player_id:  # Skip None/empty player IDs
                        all_league_players.append({'player_id': player_id})
        
        # Analyze weekly rankings
        with st.spinner("Analyzing weekly rankings..."):
            user_players_list = [{'player_id': pid} for pid in user_player_ids]
            analysis = FantasyDraftTool.analyze_weekly_rankings(weekly_rankings, user_players_list, sleeper_players, roster_settings, all_league_players)
        
        # Show league settings
        if roster_settings:
            st.markdown("#### League Settings")
            settings_text = ", ".join([f"{pos}: {count}" for pos, count in roster_settings.items()])
            st.info(f"**Roster Requirements:** {settings_text}")
        
        # Show Start/Sit Recommendations
        st.markdown("#### 🎯 Start/Sit Recommendations")
        
        # Create horizontal split layout
        col1, col2 = st.columns([2, 1])  # Left column wider than right
        
        with col1:
            # Starting Lineup
            if analysis['starters']:
                st.markdown("**✅ RECOMMENDED STARTING LINEUP:**")
                for player in analysis['starters']:
                    position_display = player.get('position_with_rank', player['position'])
                    waiver_indicator = " (Free Agent)" if player.get('is_waiver_wire', False) else ""
                    
                    # Determine the roster slot label
                    roster_slot = player.get('flex_slot', player['position'])
                    if roster_slot in ['SUPER_FLEX', 'FLEX', 'WRRBTE_FLEX', 'WRRB_FLEX']:
                        roster_slot = 'FLEX'
                    
                    render_player_with_logo(
                        player['name'], 
                        player['team'], 
                        position_display, 
                        player['rank'],
                        roster_slot=roster_slot,
                        waiver_indicator=waiver_indicator
                    )
            else:
                st.warning("No starting lineup recommendations available.")
            
            # Bench Players
            if analysis['bench']:
                st.markdown("**🪑 BENCH PLAYERS:**")
                for player in analysis['bench']:
                    position_display = player.get('position_with_rank', player['position'])
                    render_player_with_logo(
                        player['name'],
                        player['team'],
                        position_display,
                        player['rank'],
                        roster_slot='BN'
                    )
            else:
                st.info("No bench players.")
            
            # Check if defenses and kickers are required in this league
            dst_required = roster_settings.get('DEF', 0) > 0
            k_required = roster_settings.get('K', 0) > 0
            
            # Defenses (if not in starting lineup and position is required)
            if dst_required and analysis['defenses'] and len(analysis['defenses']) > 1:
                st.markdown("**🛡️ OTHER DEFENSES ON ROSTER:**")
                for i, defense in enumerate(analysis['defenses'][1:], 1):  # Skip first one (already in lineup)
                    render_player_with_logo(
                        defense['name'],
                        defense.get('team', ''),
                        'DEF',
                        defense['rank']
                    )
            
            # Kickers (if not in starting lineup and position is required)
            if k_required and analysis['kickers'] and len(analysis['kickers']) > 1:
                st.markdown("**🦵 OTHER KICKERS ON ROSTER:**")
                for i, kicker in enumerate(analysis['kickers'][1:], 1):  # Skip first one (already in lineup)
                    render_player_with_logo(
                        kicker['name'],
                        kicker['team'],
                        'K',
                        kicker['rank']
                    )
        
        with col2:
            # Waiver Wire Suggestions - only show if the positions are required in the league
            dst_required = roster_settings.get('DEF', 0) > 0
            k_required = roster_settings.get('K', 0) > 0
            
            if dst_required or k_required:
                st.markdown("**💡 Waiver Wire Suggestions**")
                
                # Defense suggestions - only if required
                if dst_required:
                    if analysis['waiver_suggestions']['defenses']:
                        st.markdown("**Top 5 Defenses:**")
                        for i, defense in enumerate(analysis['waiver_suggestions']['defenses'][:5], 1):
                            status = "On Your Roster" if defense.get('is_on_roster', False) else "Free Agent"
                            render_player_with_logo(
                                defense['name'],
                                defense.get('team', ''),
                                'DEF',
                                defense['rank'],
                                waiver_indicator=f" ({status})"
                            )
                    else:
                        st.info("No defense suggestions available.")
                
                # Kicker suggestions - only if required
                if k_required:
                    if analysis['waiver_suggestions']['kickers']:
                        st.markdown("**Top 5 Kickers:**")
                        for i, kicker in enumerate(analysis['waiver_suggestions']['kickers'][:5], 1):
                            status = "On Your Roster" if kicker.get('is_on_roster', False) else "Free Agent"
                            render_player_with_logo(
                                kicker['name'],
                                kicker['team'],
                                'K',
                                kicker['rank'],
                                waiver_indicator=f" ({status})"
                            )
                    else:
                        st.info("No kicker suggestions available.")
        
        # Optimal Starting Lineup with Free Agent Analysis Section
        st.markdown("---")  # Separator line
        st.markdown("#### ⭐ Optimal Starting Lineup with Free Agent Analysis")
        
        # Load and analyze weekly rankings for free agent comparisons
        with st.spinner("Analyzing optimal lineup with free agents..."):
            weekly_rankings = FantasyDraftTool.load_weekly_rankings()
        
        if weekly_rankings:
            # Create optimal lineup analysis that compares roster players vs free agents
            optimal_analysis = FantasyDraftTool.analyze_optimal_lineup_with_free_agents(
                weekly_rankings, user_players_list, sleeper_players, roster_settings, all_league_players
            )
            
            if optimal_analysis['optimal_starters']:
                st.markdown("**🎯 OPTIMAL STARTING LINEUP (Including Best Available Free Agents):**")
                
                for player in optimal_analysis['optimal_starters']:
                    position_display = player.get('position_with_rank', player['position'])
                    
                    # Determine the roster slot label
                    roster_slot = player.get('flex_slot', player['position'])
                    if roster_slot in ['SUPER_FLEX', 'FLEX', 'WRRBTE_FLEX', 'WRRB_FLEX']:
                        roster_slot = 'FLEX'
                    
                    # Check if this is a free agent recommendation
                    if player.get('is_free_agent', False):
                        current_player = player.get('replaces_player')
                        upgrade_info = None
                        if current_player:
                            upgrade_info = f"   ↳ Upgrade from: {current_player['name']} (Rank #{current_player['rank']}) - Improvement: +{current_player['rank'] - player['rank']} ranks"
                            render_player_with_logo(
                                f"🔄 {player['name']}",
                                player['team'],
                                position_display,
                                player['rank'],
                                roster_slot=roster_slot,
                                free_agent=True,
                                upgrade_info=upgrade_info
                            )
                        else:
                            render_player_with_logo(
                                player['name'],
                                player['team'],
                                position_display,
                                player['rank'],
                                roster_slot=roster_slot,
                                free_agent=True
                            )
                    else:
                        render_player_with_logo(
                            player['name'],
                            player['team'],
                            position_display,
                            player['rank'],
                            roster_slot=roster_slot
                        )
                
                # Show summary of potential improvements
                if optimal_analysis['free_agent_upgrades']:
                    st.markdown("**📈 Free Agent Upgrade Summary:**")
                    total_improvement = sum(upgrade['improvement'] for upgrade in optimal_analysis['free_agent_upgrades'])
                    st.success(f"🚀 **{len(optimal_analysis['free_agent_upgrades'])} potential upgrade(s)** with **+{total_improvement} total rank improvement**")
                    
                    for upgrade in optimal_analysis['free_agent_upgrades']:
                        # Display upgrade with logos
                        col1, col2 = st.columns([0.08, 0.92])
                        with col1:
                            # Show logo for the add player
                            add_logo = get_team_logo_path(upgrade['add'].get('team', ''))
                            if add_logo and os.path.exists(add_logo):
                                try:
                                    st.image(add_logo, width=25)
                                except Exception:
                                    st.write("")
                            else:
                                st.write("")
                        with col2:
                            st.write(f"• **{upgrade['position']}**: {upgrade['add']['name']} (#{upgrade['add']['rank']}) replaces {upgrade['drop']['name']} (#{upgrade['drop']['rank']}) - **+{upgrade['improvement']} ranks**")
                else:
                    st.info("✅ Your current starting lineup is already optimal - no better free agents available!")
            else:
                st.warning("No optimal lineup analysis available.")
        else:
            st.info("📁 No weekly rankings files found for free agent analysis.")
        
        # ROS Upgrade Recommendations Section
        st.markdown("---")  # Separator line
        st.markdown("#### 🔄 ROS Upgrade Recommendations")
        
        # Load and analyze ROS rankings
        with st.spinner("Analyzing ROS upgrade opportunities..."):
            ros_rankings = FantasyDraftTool.load_ros_rankings()
        
        if ros_rankings:
            ros_analysis = FantasyDraftTool.analyze_ros_recommendations(
                user_players_list, sleeper_players, all_league_players, ros_rankings
            )
            
            # Create horizontal split for ROS recommendations
            ros_col1, ros_col2 = st.columns([1, 1])  # Equal width columns
            
            with ros_col1:
                st.markdown("**📍 Position-Specific Upgrades**")
                
                positions = ['QB', 'RB', 'WR', 'TE']
                position_emojis = {'QB': '🎯', 'RB': '🏈', 'WR': '⚡', 'TE': '🎪'}
                
                for position in positions:
                    recommendations = ros_analysis['position_recommendations'].get(position, [])
                    
                    st.markdown(f"**{position_emojis.get(position, '🏈')} {position}S**")
                    
                    if recommendations:
                        for rec in recommendations:
                            drop_player = rec['drop']
                            add_player = rec['add']
                            improvement = rec['improvement']
                            
                            st.markdown("**Drop:**")
                            render_player_with_logo(
                                drop_player['name'],
                                drop_player.get('team', ''),
                                drop_player['position_with_rank'],
                                drop_player['rank']
                            )
                            st.markdown("**Add:**")
                            render_player_with_logo(
                                add_player['name'],
                                add_player.get('team', ''),
                                add_player['position_with_rank'],
                                add_player['rank']
                            )
                            st.success(f"⬆️ Improvement: +{improvement} ranks")
                            st.write("")  # Spacing
                    else:
                        st.info("No upgrades available")
                        st.write("")  # Spacing
            
            with ros_col2:
                st.markdown("**📈 Best Available Players**")
                
                # Worst drops section first
                st.markdown("**➖ DROP (Worst on Roster)**")
                if ros_analysis['worst_drops']:
                    # Sort by rank (best ranks first)
                    sorted_drops = sorted(ros_analysis['worst_drops'], key=lambda x: x['rank'])
                    for player in sorted_drops[:8]:  # Top 8
                        # Format: **{position}** Rank #{rank} - {name} ({team})
                        col1, col2 = st.columns([0.08, 0.92])
                        with col1:
                            logo_path = get_team_logo_path(player['team'])
                            if logo_path and os.path.exists(logo_path):
                                try:
                                    st.image(logo_path, width=30)
                                except Exception:
                                    st.write("")
                            else:
                                st.write("")
                        with col2:
                            st.markdown(f"**{player['position']}** Rank #{player['rank']} - {player['name']} ({player['team']})")
                else:
                    st.info("No players to drop")
                
                st.write("")  # Spacing
                
                # Best adds section
                st.markdown("**➕ ADD (Best Available)**")
                if ros_analysis['best_adds']:
                    # Sort by rank (best ranks first)
                    sorted_adds = sorted(ros_analysis['best_adds'], key=lambda x: x['rank'])
                    for player in sorted_adds[:8]:  # Top 8
                        # Format: **{position}** Rank #{rank} - {name} ({team})
                        col1, col2 = st.columns([0.08, 0.92])
                        with col1:
                            logo_path = get_team_logo_path(player['team'])
                            if logo_path and os.path.exists(logo_path):
                                try:
                                    st.image(logo_path, width=30)
                                except Exception:
                                    st.write("")
                            else:
                                st.write("")
                        with col2:
                            st.markdown(f"**{player['position']}** Rank #{player['rank']} - {player['name']} ({player['team']})")
                else:
                    st.info("No free agents found")
        else:
            st.info("📁 No ROS rankings file found. Add FantasyPros_*_Ros_ALL_Rankings.csv to the weekly_rankings folder.")
    
    else:
        st.info("👈 Use the sidebar to discover your leagues and select one to analyze.")


def render_draft_assistant_page() -> None:
    """Render the Draft Assistant page"""
    render_sidebar()

    if not st.session_state.draft_tool:
        st.info("👈 Use the sidebar to load FantasyPros rankings")
        st.markdown("""
        ### Quick Start Options:
        
        **🎯 FantasyPros Rankings (Recommended):**
        - Click one of the scoring format buttons (Standard, Half-PPR, or PPR)
        - Rankings are automatically loaded from FantasyPros
        - No file download needed!
        """)
        return

    draft_tool: FantasyDraftTool = st.session_state.draft_tool

    # Add refresh button on the right side of the main content
    if draft_tool.sleeper_draft_id:
        col_title, col_refresh = st.columns([0.7, 0.3])
        with col_title:
            st.markdown('<div class="app-title">Fantasy Draft Tool</div>', unsafe_allow_html=True)
            st.markdown('<div class="app-caption">Load FantasyPros rankings and manage multiple fantasy leagues with Sleeper integration.</div>', unsafe_allow_html=True)
        with col_refresh:
            if st.button("🔄 Refresh Draft Picks", use_container_width=True):
                with st.spinner("Refreshing draft picks..."):
                    draft_tool.fetch_sleeper_draft_picks()
                st.success("✅ Draft picks refreshed!")
                st.rerun()
    else:
        st.markdown('<div class="app-title">Fantasy Draft Tool</div>', unsafe_allow_html=True)
        st.markdown('<div class="app-caption">Load FantasyPros rankings and manage multiple fantasy leagues with Sleeper integration.</div>', unsafe_allow_html=True)

    render_top_overall(draft_tool)
    st.divider()
    render_search(draft_tool)
    st.divider()
    render_top_by_position(draft_tool)
    st.divider()

    # Drafted players list at bottom
    drafted = draft_tool.get_drafted_players()
    st.markdown("### Drafted Players")
    if not drafted:
        st.write("No drafted players detected yet.")
    else:
        # Display drafted players with logos
        for i, p in enumerate(drafted, start=1):
            logo_path = get_team_logo_path(p.team)
            col1, col2 = st.columns([0.08, 0.92])
            with col1:
                if logo_path and os.path.exists(logo_path):
                    try:
                        st.image(logo_path, width=30)
                    except Exception:
                        st.write("")
                else:
                    st.write("")
            with col2:
                st.markdown(f"{i}. **{p.name}** ({p.team}) — {p.position} #{p.position_rank}")

    # Optional debug: show unmatched drafted players from Sleeper (to diagnose missing mappings)
    with st.expander("Debug: Unmatched drafted players (from Sleeper)"):
        unmatched = draft_tool.get_unmatched_drafted_from_sleeper()
        if not unmatched:
            st.write("None")
        else:
            for player_info in unmatched:
                team = player_info.get('team', '')
                logo_path = get_team_logo_path(team)
                col1, col2 = st.columns([0.08, 0.92])
                with col1:
                    if logo_path and os.path.exists(logo_path):
                        try:
                            st.image(logo_path, width=25)
                        except Exception:
                            st.write("")
                    else:
                        st.write("")
                with col2:
                    st.write(f"**{player_info.get('full_name', 'Unknown')}** - {player_info.get('position', '')} - {team}")


def render_weekly_rankings_page() -> None:
    """Render the Weekly Rankings page"""
    render_weekly_rankings_sidebar()
    render_weekly_rankings_content()


def main() -> None:
    initialize_session_state()
    inject_css()

    # Get current page from URL parameters
    current_page = st.query_params.get("page", "weekly-rankings")
    
    # Render navigation
    render_navigation()
    st.divider()
    
    # Render appropriate page based on URL
    if current_page == "draft-assistant":
        render_draft_assistant_page()
    else:  # default to weekly-rankings
        render_weekly_rankings_page()


if __name__ == "__main__":
    main()


