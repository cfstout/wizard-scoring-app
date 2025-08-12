# Wizard Scoring App: Mobile Migration Guide

This guide documents the complete migration from a PostgreSQL/Prisma web app to an offline-first Android mobile app using Capacitor.

## Table of Contents
1. [Git Branching Strategy](#git-branching-strategy)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Simplified Offline Architecture](#simplified-offline-architecture)
4. [Local Storage Strategy](#local-storage-strategy)
5. [Migration Implementation Plan](#migration-implementation-plan)
6. [Capacitor Integration](#capacitor-integration)
7. [Mobile Optimizations](#mobile-optimizations)
8. [Testing & Deployment](#testing--deployment)

## Git Branching Strategy

To keep the current web app functional while building the mobile version, we'll use a structured branching approach:

### Branch Structure

```
main (current web app - stays functional)
├── mobile (base branch for all mobile work)
    ├── mobile/phase1-storage (storage infrastructure)
    ├── mobile/phase2-api-replacement (replace API calls)
    ├── mobile/phase3-db-removal (remove database dependencies)
    ├── mobile/phase4-static-export (configure static build)
    ├── mobile/phase5-capacitor (add Capacitor integration)
    ├── mobile/phase6-mobile-ui (mobile optimizations)
    ├── mobile/phase7-testing (testing & optimization)
    └── mobile/phase8-deployment (build & store prep)
```

### Workflow Process

#### Initial Setup
```bash
# Create and switch to mobile base branch
git checkout -b mobile

# Push mobile branch to remote
git push -u origin mobile
```

#### For Each Phase
```bash
# Create feature branch from mobile base
git checkout mobile
git pull origin mobile
git checkout -b mobile/phase1-storage

# Work on phase implementation
# ... make changes ...

# Commit and push feature branch
git add .
git commit -m "Phase 1: Add storage infrastructure

- Install Capacitor storage dependencies
- Create storage service layer  
- Add React hooks for data access
- Test basic storage operations"

git push -u origin mobile/phase1-storage

# Merge back to mobile base when phase is complete
git checkout mobile
git merge mobile/phase1-storage
git push origin mobile

# Delete feature branch (optional)
git branch -d mobile/phase1-storage
git push origin --delete mobile/phase1-storage
```

#### Phase-Specific Branch Commands

**Phase 1: Storage Infrastructure**
```bash
git checkout -b mobile/phase1-storage
# Implementation work...
git commit -m "Phase 1: Add storage infrastructure"
```

**Phase 2: API Replacement**  
```bash
git checkout mobile
git checkout -b mobile/phase2-api-replacement
# Implementation work...
git commit -m "Phase 2: Replace API calls with local storage"
```

**Phase 3: Database Removal**
```bash
git checkout mobile
git checkout -b mobile/phase3-db-removal
# Implementation work...
git commit -m "Phase 3: Remove Prisma and PostgreSQL dependencies"
```

**Phase 4: Static Export**
```bash
git checkout mobile
git checkout -b mobile/phase4-static-export  
# Implementation work...
git commit -m "Phase 4: Configure Next.js for static export"
```

**Phase 5: Capacitor Integration**
```bash
git checkout mobile
git checkout -b mobile/phase5-capacitor
# Implementation work...
git commit -m "Phase 5: Add Capacitor and Android platform"
```

**Phase 6: Mobile UI**
```bash
git checkout mobile
git checkout -b mobile/phase6-mobile-ui
# Implementation work...
git commit -m "Phase 6: Mobile-first UI optimizations"
```

**Phase 7: Testing**
```bash
git checkout mobile
git checkout -b mobile/phase7-testing
# Implementation work...
git commit -m "Phase 7: Testing and performance optimization"
```

**Phase 8: Deployment**
```bash
git checkout mobile
git checkout -b mobile/phase8-deployment
# Implementation work...
git commit -m "Phase 8: Build and store preparation"
```

### Testing Strategy

**During Development:**
- Each phase branch can be tested independently
- Mobile branch contains cumulative progress
- Main branch remains untouched and functional

**Integration Testing:**
```bash
# Test mobile branch end-to-end
git checkout mobile
npm run export
npx cap sync android
npx cap open android
# Test in Android Studio/emulator
```

**Final Deployment:**
```bash
# When mobile version is complete and tested
git checkout main
git merge mobile
git push origin main

# Tag the release
git tag -a v2.0.0-mobile -m "Mobile app release"
git push origin v2.0.0-mobile
```

### Benefits of This Approach

1. **Safety**: Main branch stays functional throughout migration
2. **Rollback**: Can easily revert any phase if issues arise  
3. **Parallel Work**: Could work on multiple phases simultaneously if needed
4. **Testing**: Each phase can be individually tested and validated
5. **Documentation**: Clear commit history shows progression
6. **Deployment**: Mobile branch serves as staging environment

### Branch Management Tips

**Keep mobile branch up to date:**
```bash
# Regularly sync mobile with any critical fixes from main
git checkout main
git pull origin main
git checkout mobile  
git merge main  # Only if critical fixes needed
git push origin mobile
```

**Emergency fixes to main:**
```bash
# If critical bug found in production web app
git checkout main
# Fix bug...
git commit -m "Fix critical bug in web app"  
git push origin main

# Later, merge fix into mobile if relevant
git checkout mobile
git merge main
```

This strategy ensures the current web app remains stable and usable while we systematically build out the mobile version.

## Current Architecture Analysis

### Current Database Schema
The app currently uses PostgreSQL with Prisma ORM and the following models:

- **Player**: Stores player profiles (id, name, createdAt)
- **Game**: Game sessions with metadata (id, status, playerCount, totalRounds, currentRound)
- **GamePlayer**: Many-to-many relationship between games and players with scores
- **Round**: Individual rounds within games (id, roundNumber, cardsPerPlayer, trumpSuit, status)
- **Bid**: Player bids and results per round (id, bidAmount, tricksTaken, score)

### API Endpoints Currently Used
- `GET/POST /api/players` - Player management
- `GET/POST /api/games` - Game creation and listing
- `GET/PATCH /api/games/[id]` - Individual game management  
- `POST/PATCH /api/rounds` - Round management
- `POST /api/bids` - Bid management
- `GET /api/players/stats` - Player statistics

### Current Data Flow
1. React components fetch data via API calls to Next.js API routes
2. API routes use Prisma client to interact with PostgreSQL
3. Complex relational queries with joins and foreign keys
4. Real-time updates require refetching from server

### Complexity Analysis
**Overcomplicated features for offline mobile use:**
- Complex relational database with foreign keys and cascading deletes
- Server-side API routes requiring network connectivity
- Prisma ORM overhead for simple data operations
- Database migrations and schema versioning
- Separate GamePlayer junction table (can be embedded in game data)
- Multiple separate endpoints for related data

## Simplified Offline Architecture

### Core Data Models (Simplified)
```typescript
// Simplified Player model
interface Player {
  id: string
  name: string
  createdAt: string
  // Remove unused fields: gameParticipations, bids relations
}

// Simplified Game model (flattened)
interface Game {
  id: string
  createdAt: string
  startedAt?: string
  endedAt?: string
  status: 'setup' | 'seat_arrangement' | 'in_progress' | 'completed'
  playerCount: number
  totalRounds: number
  currentRound: number
  
  // Embedded players (no separate table needed)
  players: GamePlayer[]
  
  // Embedded rounds (no separate table needed)  
  rounds: Round[]
}

interface GamePlayer {
  playerId: string
  playerName: string // Denormalized for offline performance
  totalScore: number
  position?: number
  seatPosition?: number
}

interface Round {
  roundNumber: number
  cardsPerPlayer: number
  trumpSuit?: string
  status: 'bidding' | 'playing' | 'completed'
  
  // Embedded bids (no separate table needed)
  bids: Bid[]
}

interface Bid {
  playerId: string
  playerName: string // Denormalized for offline performance
  bidAmount: number
  tricksTaken?: number
  score?: number
}

// App Settings/Preferences
interface AppSettings {
  version: string
  lastSyncDate?: string
  // Future: backup preferences, display settings, etc.
}
```

### Benefits of Simplified Architecture
- **Single JSON documents**: No complex joins or relationships
- **Denormalized data**: Player names stored directly in games/bids for offline performance
- **Embedded arrays**: Rounds and bids stored within game objects
- **Flat structure**: Easy to serialize/deserialize to local storage
- **No foreign keys**: No referential integrity constraints to manage
- **Atomic operations**: Games can be saved/loaded as complete units

## Local Storage Strategy

### Storage Method Selection

Based on research and app requirements:

**Capacitor Preferences** (Recommended for settings)
- Use for: App settings, user preferences
- Storage: Small key-value pairs (< 1MB)
- Platform: Uses UserDefaults (iOS) / SharedPreferences (Android)

**Capacitor SQLite Plugin** (Recommended for game data)
- Use for: Players, Games, Game History
- Storage: Structured data with basic queries
- Platform: SQLite database on device
- Features: Encryption support, larger storage capacity

**Why NOT IndexedDB for mobile:**
- Browser storage limitations in mobile WebView
- Data can be cleared by OS when storage is low
- SQLite is more reliable for persistent mobile data

### Storage Architecture Plan

```typescript
// Storage Services Architecture
interface StorageService {
  // Settings (Capacitor Preferences)
  getSettings(): Promise<AppSettings>
  updateSettings(settings: Partial<AppSettings>): Promise<void>
  
  // Players (SQLite)
  getPlayers(): Promise<Player[]>
  addPlayer(player: Omit<Player, 'id'>): Promise<Player>
  updatePlayer(id: string, updates: Partial<Player>): Promise<Player>
  deletePlayer(id: string): Promise<void>
  
  // Games (SQLite)  
  getGames(): Promise<Game[]>
  getGame(id: string): Promise<Game | null>
  saveGame(game: Game): Promise<Game>
  deleteGame(id: string): Promise<void>
  
  // Stats/Analytics
  getPlayerStats(): Promise<PlayerStats[]>
}
```

### Data Size Estimates
- **Player**: ~50 bytes each (id + name + date)
- **Game**: ~2-5KB each (including all rounds/bids for 4-player, 15-round game)
- **Total for heavy users**: < 10MB (100 players + 500 games)

**Conclusion**: SQLite is perfect for this use case - handles the data volume easily while providing structured querying capabilities.

## Migration Implementation Plan

### Phase 1: Setup Local Storage Infrastructure

#### 1.1 Install Capacitor Storage Dependencies
```bash
npm install @capacitor/preferences @capacitor-community/sqlite
npx cap sync
```

#### 1.2 Create Storage Service Layer
Create `src/lib/storage.ts`:

```typescript
import { Preferences } from '@capacitor/preferences'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'

export class WizardStorageService {
  private sqlite: SQLiteConnection
  private db: SQLiteDBConnection | null = null
  
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
  }
  
  async initialize() {
    // Initialize SQLite database
    await this.sqlite.createConnection({
      database: 'wizard-scores',
      version: 1,
      encrypted: false,
      mode: 'no-encryption'
    })
    
    this.db = await this.sqlite.retrieveConnection('wizard-scores')
    await this.createTables()
  }
  
  private async createTables() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT NOT NULL
      )`
    ]
    
    for (const query of queries) {
      await this.db?.execute(query)
    }
  }
  
  // Preferences methods
  async getSettings(): Promise<AppSettings> {
    const { value } = await Preferences.get({ key: 'app-settings' })
    return value ? JSON.parse(value) : { version: '1.0.0' }
  }
  
  async updateSettings(settings: Partial<AppSettings>) {
    const current = await this.getSettings()
    const updated = { ...current, ...settings }
    await Preferences.set({
      key: 'app-settings',
      value: JSON.stringify(updated)
    })
  }
  
  // Player methods
  async getPlayers(): Promise<Player[]> {
    const result = await this.db?.query('SELECT * FROM players ORDER BY name ASC')
    return result?.values?.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at
    })) || []
  }
  
  async addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    const player: Player = {
      id: crypto.randomUUID(),
      ...playerData
    }
    
    await this.db?.execute(
      'INSERT INTO players (id, name, created_at) VALUES (?, ?, ?)',
      [player.id, player.name, player.createdAt]
    )
    
    return player
  }
  
  // Game methods (store as JSON for simplicity)
  async saveGame(game: Game): Promise<Game> {
    await this.db?.execute(
      'INSERT OR REPLACE INTO games (id, data, created_at, status) VALUES (?, ?, ?, ?)',
      [game.id, JSON.stringify(game), game.createdAt, game.status]
    )
    return game
  }
  
  async getGames(): Promise<Game[]> {
    const result = await this.db?.query('SELECT data FROM games ORDER BY created_at DESC')
    return result?.values?.map(row => JSON.parse(row.data)) || []
  }
  
  async getGame(id: string): Promise<Game | null> {
    const result = await this.db?.query('SELECT data FROM games WHERE id = ?', [id])
    return result?.values?.[0] ? JSON.parse(result.values[0].data) : null
  }
}

// Create singleton instance
export const storageService = new WizardStorageService()
```

#### 1.3 Create React Hooks for Data Access
Create `src/hooks/useLocalStorage.ts`:

```typescript
import { useState, useEffect } from 'react'
import { storageService } from '@/lib/storage'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  
  const fetchPlayers = async () => {
    setLoading(true)
    try {
      const data = await storageService.getPlayers()
      setPlayers(data)
    } catch (error) {
      console.error('Failed to fetch players:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const addPlayer = async (playerData: Omit<Player, 'id'>) => {
    try {
      const newPlayer = await storageService.addPlayer(playerData)
      setPlayers(prev => [...prev, newPlayer].sort((a, b) => a.name.localeCompare(b.name)))
      return newPlayer
    } catch (error) {
      console.error('Failed to add player:', error)
      throw error
    }
  }
  
  useEffect(() => {
    fetchPlayers()
  }, [])
  
  return {
    players,
    loading,
    addPlayer,
    refetch: fetchPlayers
  }
}

export function useGames() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  
  const fetchGames = async () => {
    setLoading(true)
    try {
      const data = await storageService.getGames()
      setGames(data)
    } catch (error) {
      console.error('Failed to fetch games:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const saveGame = async (game: Game) => {
    try {
      const savedGame = await storageService.saveGame(game)
      setGames(prev => {
        const index = prev.findIndex(g => g.id === game.id)
        if (index >= 0) {
          const updated = [...prev]
          updated[index] = savedGame
          return updated
        }
        return [savedGame, ...prev]
      })
      return savedGame
    } catch (error) {
      console.error('Failed to save game:', error)
      throw error
    }
  }
  
  useEffect(() => {
    fetchGames()
  }, [])
  
  return {
    games,
    loading,
    saveGame,
    refetch: fetchGames
  }
}
```

### Phase 2: Replace API Calls with Local Storage

#### 2.1 Update PlayerForm Component
Replace API calls with local storage:

```typescript
// Before: API call
const response = await fetch('/api/players', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: name.trim() })
})

// After: Local storage
const { addPlayer } = usePlayers()
await addPlayer({
  name: name.trim(),
  createdAt: new Date().toISOString()
})
```

#### 2.2 Update GameSetup Component
```typescript
// Before: Fetch from API
const fetchPlayers = async () => {
  const response = await fetch('/api/players')
  const data = await response.json()
  setPlayers(data)
}

// After: Use hook
const { players, loading } = usePlayers()
```

#### 2.3 Update GameBoard Component
Replace complex API calls with simple local storage operations:

```typescript
// Before: Multiple API calls for game state
const fetchGame = async () => {
  const response = await fetch(`/api/games/${gameId}`)
  const gameData = await response.json()
  setGame(gameData)
}

// After: Single local storage call
const { games } = useGames()
const currentGame = games.find(g => g.id === gameId)
```

### Phase 3: Remove Database Dependencies

#### 3.1 Remove Prisma and PostgreSQL Dependencies
```bash
npm uninstall prisma @prisma/client
rm -rf prisma/
rm -f docker-compose.yml
```

#### 3.2 Remove API Routes
```bash
rm -rf src/app/api/
```

#### 3.3 Remove Database Configuration
```bash
rm -f src/lib/db.ts
```

#### 3.4 Update Package.json Scripts
Remove database-related scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "export": "next build && next export"
  }
}
```

### Phase 4: Configure for Static Export

#### 4.1 Update next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true
  },
  trailingSlash: true,
  distDir: 'out'
}

module.exports = nextConfig
```

#### 4.2 Update Package.json for Static Build
```json
{
  "scripts": {
    "build": "next build",
    "export": "npm run build"
  }
}
```

## Capacitor Integration

### Phase 5: Add Capacitor to Project

#### 5.1 Install Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init wizard-scorer com.yourname.wizardscorer
```

#### 5.2 Add Android Platform
```bash
npm run export  # Build static files first
npx cap add android
npx cap sync android
```

#### 5.3 Configure Capacitor Config
Create `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.yourname.wizardscorer',
  appName: 'Wizard Scorer',
  webDir: 'out',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#3b82f6',
      showSpinner: false
    }
  }
}

export default config
```

#### 5.4 Initialize Storage on App Start
Update `src/app/layout.tsx`:

```typescript
'use client'
import { useEffect } from 'react'
import { storageService } from '@/lib/storage'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const initStorage = async () => {
      try {
        await storageService.initialize()
        console.log('Storage initialized successfully')
      } catch (error) {
        console.error('Failed to initialize storage:', error)
      }
    }
    
    initStorage()
  }, [])

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

## Mobile Optimizations

### Phase 6: Mobile-First UI Improvements

#### 6.1 Add PWA Manifest
Create `public/manifest.json`:

```json
{
  "name": "Wizard Card Game Scorer",
  "short_name": "Wizard Scorer",
  "description": "Track scores for the Wizard card game",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icons/icon-512.png", 
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

#### 6.2 Add Mobile-Optimized Styles
Update components with mobile-first responsive design:

```tsx
// Mobile-optimized button styles
<button className="w-full px-6 py-4 text-lg bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 touch-manipulation">
  Start Game
</button>

// Mobile-friendly form inputs  
<input className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />

// Touch-friendly spacing
<div className="space-y-4 p-4">
```

#### 6.3 Add Splash Screen Assets
Create app icons and splash screens in required sizes:
- `public/icons/icon-192.png` (192x192)
- `public/icons/icon-512.png` (512x512)
- Various splash screen sizes for Android

### Phase 7: Testing & Optimization

#### 7.1 Test Offline Functionality
- Verify all features work without network
- Test data persistence across app restarts
- Validate storage limits and performance

#### 7.2 Performance Optimization
- Minimize bundle size
- Optimize images for mobile
- Test on various Android devices

## Testing & Deployment

### Phase 8: Build and Test Mobile App

#### 8.1 Build for Production
```bash
npm run export
npx cap copy android
npx cap sync android
```

#### 8.2 Open in Android Studio
```bash
npx cap open android
```

#### 8.3 Test on Device/Emulator
- Install on physical Android device
- Test all game flows
- Verify data persistence
- Check performance

### Phase 9: Prepare for Google Play Store

#### 9.1 Generate Signed APK
- Configure signing keys in Android Studio
- Build release APK/AAB

#### 9.2 Create Store Assets
- App screenshots (phone/tablet)
- Feature graphic (1024x500)
- App icon (512x512)
- Privacy policy
- App description

#### 9.3 Set Up Google Play Developer Account
- Register account ($25 fee)
- Complete developer profile
- Upload and publish app

## Migration Checklist

### Phase 1: Storage Infrastructure
- [ ] Install Capacitor storage dependencies
- [ ] Create storage service layer
- [ ] Create React hooks for data access
- [ ] Test basic storage operations

### Phase 2: Replace API Calls  
- [ ] Update PlayerForm component
- [ ] Update GameSetup component
- [ ] Update GameBoard component
- [ ] Update all other components using API calls
- [ ] Test all functionality with local storage

### Phase 3: Remove Database Dependencies
- [ ] Remove Prisma/PostgreSQL dependencies
- [ ] Delete API routes
- [ ] Remove database configuration
- [ ] Update package.json scripts
- [ ] Test app still builds and runs

### Phase 4: Static Export Configuration
- [ ] Update next.config.js for static export
- [ ] Test static build works
- [ ] Verify all routes work in static mode

### Phase 5: Capacitor Integration
- [ ] Install Capacitor dependencies
- [ ] Add Android platform
- [ ] Configure Capacitor settings
- [ ] Initialize storage on app start
- [ ] Test in Android Studio

### Phase 6: Mobile Optimizations
- [ ] Add PWA manifest
- [ ] Create mobile-optimized styles
- [ ] Add splash screen assets
- [ ] Test mobile UI/UX

### Phase 7: Testing & Optimization
- [ ] Test offline functionality
- [ ] Performance testing
- [ ] Cross-device testing
- [ ] Data persistence testing

### Phase 8: Mobile App Build
- [ ] Build production version
- [ ] Test on physical device
- [ ] Verify all features work
- [ ] Performance validation

### Phase 9: Store Preparation
- [ ] Generate signed APK
- [ ] Create store assets
- [ ] Set up Google Play developer account
- [ ] Upload and publish app

## Estimated Timeline

- **Phase 1-3**: 2-3 days (Storage infrastructure + API removal)
- **Phase 4-5**: 1 day (Static export + Capacitor setup)  
- **Phase 6-7**: 2-3 days (Mobile optimization + testing)
- **Phase 8-9**: 1-2 days (Build + store preparation)

**Total: 6-9 days** for complete migration from web app to published Android app.

## Future Enhancements

After successful migration, consider:
- **Cloud backup**: Optional sync to cloud storage
- **Statistics**: Enhanced player statistics and game analytics
- **Themes**: Dark mode and custom color schemes
- **Tournaments**: Multi-game tournament tracking
- **Export**: Share game results via email/messaging
- **iOS version**: Expand to iPhone/iPad using same codebase