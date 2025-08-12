// Simplified data models for offline-first mobile app

export interface Player {
  id: string
  name: string
  createdAt: string
}

export interface GamePlayer {
  playerId: string
  playerName: string // Denormalized for offline performance
  totalScore: number
  position?: number
  seatPosition?: number
}

export interface Bid {
  playerId: string
  playerName: string // Denormalized for offline performance
  bidAmount: number
  tricksTaken?: number
  score?: number
}

export interface Round {
  roundNumber: number
  cardsPerPlayer: number
  trumpSuit?: string
  status: 'bidding' | 'playing' | 'completed'
  bids: Bid[]
}

export interface Game {
  id: string
  createdAt: string
  startedAt?: string
  endedAt?: string
  status: 'setup' | 'seat_arrangement' | 'in_progress' | 'completed'
  playerCount: number
  totalRounds: number
  currentRound: number
  players: GamePlayer[]
  rounds: Round[]
}

export interface AppSettings {
  version: string
  lastSyncDate?: string
}

export interface PlayerStats {
  playerId: string
  playerName: string
  gamesPlayed: number
  gamesWon: number
  totalScore: number
  averageScore: number
  winRate: number
}