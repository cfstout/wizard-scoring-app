# Wizard Card Game Scoring App

A complete web application for scoring the Wizard card game, built with Next.js, PostgreSQL, and Prisma.

## Features

- ✅ Create and manage player profiles
- ✅ Set up games with 3-6 players
- ✅ Track bids and remaining tricks in real-time
- ✅ Record tricks taken and auto-calculate scores
- ✅ Complete score history and round-by-round breakdown
- ✅ Player statistics and win histories
- ✅ Responsive design for desktop and mobile
- ✅ Local development with Docker
- ✅ Easy deployment to Railway

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Backend**: Next.js API routes
- **Database**: PostgreSQL with Prisma ORM
- **Deployment**: Railway (or any platform supporting Node.js)

## Quick Start

### Prerequisites

- Node.js 18+ 
- Docker and Docker Compose
- Git

### Installation

1. **Clone and setup:**
   ```bash
   git clone <your-repo-url>
   cd wizard-scoring-app
   npm install
   ```

2. **Environment setup:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your settings
   ```

3. **Start database:**
   ```bash
   npm run docker:up
   ```

4. **Setup database schema:**
   ```bash
   npm run db:push
   npm run db:seed  # Optional: adds sample players
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open application:**
   - App: http://localhost:3000
   - Database Studio: `npm run db:studio` → http://localhost:5555

## Game Rules

The Wizard card game scoring follows these rules:

- **Game Length**: 3 players = 20 rounds, 4 players = 15 rounds, 5 players = 12 rounds, 6 players = 10 rounds
- **Scoring**: 
  - Correct bid: 20 points + 10 points per trick taken
  - Incorrect bid: -10 points per trick over/under the bid
- **Rounds**: Each round, players get one more card than the previous round

## Database Schema

- **Players**: Store player profiles
- **Games**: Track game sessions and status
- **GamePlayers**: Link players to games with scores and positions
- **Rounds**: Individual rounds within games
- **Bids**: Player bids and tricks taken per round

## API Endpoints

- `GET/POST /api/players` - Player management
- `GET/POST /api/games` - Game creation and listing
- `GET/PATCH /api/games/[id]` - Individual game management
- `POST/PATCH /api/rounds` - Round management
- `POST /api/bids` - Bid management
- `GET /api/players/stats` - Player statistics

## Deployment

### Railway Deployment

1. **Connect to Railway:**
   - Link your GitHub repository to Railway
   - Railway will auto-detect Next.js

2. **Environment Variables:**
   ```
   DATABASE_URL=<railway-provided-postgres-url>
   NEXTAUTH_SECRET=<generate-random-string>
   NEXTAUTH_URL=<your-railway-app-url>
   ```

3. **Deploy:**
   - Railway automatically builds and deploys
   - Database migrations run automatically via `postinstall` script

### Manual Deployment

For other platforms:

```bash
npm run build
npm start
```

Ensure `DATABASE_URL` points to your production PostgreSQL instance.

## Development

### Useful Commands

```bash
# Database
npm run db:studio          # Open Prisma Studio
npm run db:migrate         # Create new migration
npm run db:push            # Push schema changes
npm run db:seed            # Seed sample data

# Docker
npm run docker:up          # Start PostgreSQL
npm run docker:down        # Stop PostgreSQL
npm run docker:logs        # View logs

# Development
npm run dev                # Start dev server
npm run build              # Build for production
npm run lint               # Run linting
```

### Project Structure

```
src/
├── app/
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── lib/              # Utilities and database
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Database seeding
└── docker-compose.yml    # Local PostgreSQL
```

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running: `docker ps`
2. Check container logs: `npm run docker:logs`
3. Verify connection string in `.env.local`

### Build Issues

1. Clear Next.js cache: `rm -rf .next`
2. Regenerate Prisma client: `npm run db:generate`
3. Reinstall dependencies: `rm -rf node_modules && npm install`

### Common Errors

- **Prisma client not generated**: Run `npm run db:generate`
- **Migration conflicts**: Reset with `npm run db:push --reset`
- **Port conflicts**: Change ports in `docker-compose.yml`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push and create a Pull Request

## License

MIT License - feel free to use this for your game nights!