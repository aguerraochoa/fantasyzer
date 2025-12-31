# Local Testing Guide

## The Issue

Your app has two parts:
1. **Frontend**: Next.js (React) - runs with `npm run dev`
2. **Backend**: Python serverless functions in `api/` folder - these are Vercel-specific

When you run `npm run dev`, only the frontend runs. The Python APIs won't work because they're designed for Vercel's serverless environment.

## Solution: Use Vercel CLI for Local Development

Vercel CLI can run both the Next.js frontend AND the Python serverless functions locally, exactly like they'll work on Vercel.

### Setup Steps

1. **Install Vercel CLI globally** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Run the app with Vercel CLI**:
   ```bash
   npm run dev:vercel
   # or directly:
   vercel dev
   ```

3. **First time setup**:
   - Vercel will ask you to log in (you can use GitHub)
   - It will link your project
   - It will start both Next.js and Python functions

4. **Access your app**:
   - Frontend: http://localhost:3000
   - Python APIs: Automatically available at http://localhost:3000/api/*

### What Vercel CLI Does

- Runs Next.js dev server (like `npm run dev`)
- **Also runs Python serverless functions** from `api/` folder
- Simulates the exact Vercel environment locally
- Hot reloading for both frontend and backend

### Alternative: Test Frontend Only

If you just want to test the UI without the backend:

```bash
npm run dev
```

The app will load, but API calls will fail. You can still:
- See the UI layout
- Navigate between pages
- Test styling and components
- See error messages (which is useful for debugging)

### Testing Full Functionality

For full functionality (including API calls), you **must** use:

```bash
vercel dev
```

This is the recommended way to test everything locally before deploying.

## Quick Comparison

| Command | Frontend | Python APIs | Use Case |
|---------|----------|-------------|----------|
| `npm run dev` | ✅ Works | ❌ Fails | UI testing only |
| `vercel dev` | ✅ Works | ✅ Works | Full testing |

## Troubleshooting

### "vercel: command not found"
Install Vercel CLI:
```bash
npm install -g vercel
```

### Python dependencies not found
Make sure you've installed Python dependencies:
```bash
pip install -r requirements.txt
```

### Port already in use
Vercel dev uses port 3000 by default. If it's taken:
- Stop other processes on port 3000
- Or Vercel will automatically use the next available port

## Summary

- **For UI testing**: `npm run dev` (quick, but APIs won't work)
- **For full testing**: `vercel dev` (slower startup, but everything works)

The `vercel dev` command is what you want for testing the complete app locally!

