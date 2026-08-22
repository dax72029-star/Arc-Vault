# ARCVAULT

A personal cinema journey, crafted by DAX SANANDIYA.

## Overview

ARCVAULT is a personal movie and series tracker built with React and TypeScript. It uses the TMDB API to fetch titles, posters, ratings, and metadata, while keeping all your watch data local in your browser via LocalStorage.

## Features

- Movie tracking with status management
- Series tracking with full episode progress
- Season-by-season episode watching toggles
- Watch-time tracking and statistics
- Personal ratings (1-10 scale)
- Favorites system
- Watchlist management
- Watch history with activity log
- Trending, popular, and top-rated title discovery
- TMDB-powered search
- Local data persistence (LocalStorage)
- Data export and import (JSON)
- Responsive design with dark theme

## Tech Stack

- React 18 + TypeScript 5.6
- Vite 6
- Tailwind CSS 3
- React Router DOM 7
- Lucide React icons
- TMDB API v3

## Local Development

### Prerequisites

- Node.js 18+
- A free TMDB API key ([Get one here](https://www.themoviedb.org/settings/api))

### Setup

```bash
# Clone the repository
git clone https://github.com/dax72029-star/Arc-Vault.git
cd Arc-Vault

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
```

Edit `.env` and add your TMDB API key:

```
VITE_TMDB_API_KEY=your_tmdb_api_key_here
```

### Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TMDB_API_KEY` | Your TMDB API v3 key | Yes |

See `.env.example` for reference. Never commit your `.env` file.

## Production Build

```bash
npm run build
```

Output is written to `dist/`. Deploy the contents of `dist/` to any static hosting provider.

## Security

- `.env` files containing real API keys are gitignored and must never be committed
- `.env.example` contains only placeholder values
- All user data is stored locally in the browser — nothing is sent to external servers except TMDB API requests
- Never share or commit your TMDB API key

## Credits

This product uses the TMDB API but is not endorsed or certified by TMDB.

## Creator

**ARCVAULT**

A personal cinema journey, crafted by DAX SANANDIYA

© 2026 DAX SANANDIYA · v1.0.0
