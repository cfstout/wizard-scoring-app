# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
npm run dev                 # Start Next.js development server on localhost:3000
npm run build              # Build production bundle (includes prisma generate)
npm run start              # Start production server
npm run lint               # Run ESLint
```

### Database Management
```bash
npm run db:generate        # Generate Prisma client
npm run db:push            # Push schema changes to database (no migration files)
npm run db:migrate         # Create and apply migration
npm run db:studio          # Open Prisma Studio on localhost:5555
npm run db:seed            # Seed database with sample players
```

### Docker (Local Development)
```bash
npm run docker:up          # Start PostgreSQL container
npm run docker:down        # Stop PostgreSQL container
npm run docker:logs        # View PostgreSQL container logs
```

## Architecture Overview

This is a Next.js 14 application for scoring the Wizard card game with the following architecture:

### Tech Stack
- **Frontend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Development**: Docker Compose for local PostgreSQL

### Application Flow
The app follows a state-based navigation pattern controlled in `src/app/page.tsx`:
1. **Setup** → Player creation and game configuration
2. **Seat Arrangement** → Physical seating order around table 
3. **Game** → Round-by-round bidding and scoring
4. **Completed** → Final results modal
5. **Scores** → Detailed score history

### Key Components
- `GameBoard.tsx` - Main game interface with bidding/scoring logic
- `SeatArrangement.tsx` - Handles physical seating positions (important for game flow)
- `GameSetup.tsx` - Game creation with player selection
- `ScoreBoard.tsx` - Historical score display
- `PlayerForm.tsx` - Player registration

### Database Schema
Core entities with relationships:
- `Player` → `GamePlayer` (many-to-many via games)
- `Game` → `Round` → `Bid` (hierarchical game structure)
- Seat positions are tracked in `GamePlayer.seatPosition` for proper game flow
- Scoring follows Wizard rules: 20 + 10×tricks for correct bids, -10×difference for incorrect

### API Structure
RESTful endpoints under `/api/`:
- `/players` - Player CRUD and statistics
- `/games` - Game management and retrieval  
- `/games/[id]/seats` - Seat arrangement endpoint
- `/rounds` - Round management
- `/bids` - Bid submission and scoring

### Game Logic
- Round count varies by player count (3p=20r, 4p=15r, 5p=12r, 6p=10r)
- Dealer rotation and first bidder calculation in `lib/utils.ts`
- Real-time trick counting and remaining tricks display
- Automatic score calculation based on Wizard card game rules

### Development Notes
- Database schema changes require `npm run db:push` or `npm run db:migrate`
- Prisma client regeneration happens automatically via postinstall hook
- Local development uses Docker PostgreSQL (port 5432)
- No test framework currently configured
- Environment variables needed: `DATABASE_URL`