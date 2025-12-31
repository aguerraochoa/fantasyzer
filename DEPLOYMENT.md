# Deployment Guide

## ✅ Deployment to Vercel is AUTOMATIC and SMOOTH

When you deploy to Vercel, everything works automatically:

1. **Push to GitHub** (or connect your repo)
2. **Vercel detects**:
   - Next.js frontend → builds automatically
   - Python files in `api/` → runs as serverless functions automatically
3. **Done!** Your app is live

**No special configuration needed!** Vercel handles everything.

## Why Two Different Approaches?

### For Deployment (Vercel)
- ✅ Python functions in `api/` work automatically
- ✅ No setup needed
- ✅ Just push and deploy

### For Local Testing
- ❌ `npm run dev` only runs Next.js (frontend)
- ❌ Python functions in `api/` don't run with `npm run dev`
- ✅ `vercel dev` runs both (frontend + Python APIs)

## The Architecture

```
Your App Structure:
├── app/              → Next.js frontend (works with npm run dev)
├── api/              → Python serverless functions (Vercel-specific)
│   ├── rankings.py
│   ├── leagues.py
│   └── ...
└── fantasy_draft_tool.py  → Python logic (used by api/ functions)
```

**On Vercel**: Both `app/` and `api/` work automatically
**Locally with `npm run dev`**: Only `app/` works
**Locally with `vercel dev`**: Both `app/` and `api/` work

## Options for Local Development

### Option 1: Use Vercel CLI (Recommended)
```bash
vercel dev
```
- Runs everything locally
- Matches production environment exactly
- First time: login and link project

### Option 2: Test Frontend Only
```bash
npm run dev
```
- Only UI works
- API calls will fail
- Good for UI/styling testing

### Option 3: Deploy First, Test on Vercel
- Deploy to Vercel (automatic)
- Test on the live/staging URL
- No local setup needed

## Summary

- **Deployment**: Automatic, no setup needed ✅
- **Local Testing**: Use `vercel dev` for full functionality
- **UI Testing**: Use `npm run dev` for quick checks

The Python serverless functions are designed for Vercel's environment. They work automatically when deployed, but need `vercel dev` to run locally.

