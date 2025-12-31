# Fantasyzer

A web-based fantasy football draft assistant that combines FantasyPros rankings with live Sleeper data.

## Features

- 📊 **FantasyPros Integration**: Load rankings directly (Standard, Half-PPR, PPR)
- 🏈 **Live Sleeper Data**: Real-time player injury status and availability
- 🎯 **Live Draft Tracking**: Connect to your Sleeper draft to track picks in real-time
- 📱 **Responsive Web Interface**: Works on any device with a browser
- 🔍 **Player Search**: Find specific players quickly
- 📈 **Position Rankings**: Top players by position (RB, WR, QB, TE)
- 📊 **Weekly Rankings**: Start/sit recommendations and waiver wire suggestions
- 🔄 **ROS Recommendations**: Rest of Season upgrade suggestions

## Tech Stack

- **Frontend**: Next.js 14 (React + TypeScript)
- **Backend**: Python serverless functions (Vercel)
- **Deployment**: Vercel

## Local Development

### Prerequisites
- Node.js 18+ and npm/yarn
- Python 3.9+

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/fantasyzer.git
   cd fantasyzer
   ```

2. **Install Node.js dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to link your project and deploy

### Option 2: Deploy via GitHub

1. **Push your code to GitHub**

2. **Go to [vercel.com](https://vercel.com)** and sign in

3. **Click "New Project"**

4. **Import your GitHub repository**

5. **Vercel will automatically detect Next.js** and configure the build settings

6. **Add environment variables** if needed (none required for basic setup)

7. **Click "Deploy"**

### Important Notes for Vercel Deployment

- The Python API functions in the `api/` folder will automatically be deployed as serverless functions
- Make sure your `vercel.json` is configured correctly
- Team logos in `Team Logos/` folder will be served as static assets
- Weekly rankings CSV files in `weekly_rankings/` will be available to the Python functions

## Project Structure

```
fantasyzer/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── lib/               # Utility functions and API client
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page (Weekly Rankings)
│   └── draft/              # Draft Assistant page
├── api/                    # Python serverless functions
│   ├── rankings.py         # Load FantasyPros rankings
│   ├── draft-picks.py      # Refresh draft picks
│   ├── leagues.py          # League discovery
│   └── weekly-rankings.py  # Weekly rankings analysis
├── fantasy_draft_tool.py   # Core Python logic
├── league_manager.py        # League management
├── requirements.txt        # Python dependencies
├── package.json            # Node.js dependencies
├── next.config.js          # Next.js configuration
├── vercel.json             # Vercel configuration
└── Team Logos/             # NFL team logos
```

## How to Use

### Draft Assistant

1. Go to the Draft Assistant page
2. Click one of the scoring format buttons (Standard, Half-PPR, or PPR)
3. Rankings will be automatically loaded from FantasyPros
4. Optionally connect to your Sleeper draft by entering your username and selecting a league
5. Use the search to find specific players
6. View top available players by position

### Weekly Rankings

1. Go to the Weekly Rankings page
2. Enter your Sleeper username
3. Click "Find my leagues"
4. Select a league to analyze
5. View start/sit recommendations, optimal lineup, and ROS upgrade suggestions

## Dependencies

### Node.js
- `next` - React framework
- `react` - UI library
- `typescript` - Type safety

### Python
- `requests` - API calls to Sleeper
- `fuzzywuzzy` - Player name matching
- `python-Levenshtein` - String similarity
- `fantasy-rankings-scraper` - FantasyPros data

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use this for your own drafts!
