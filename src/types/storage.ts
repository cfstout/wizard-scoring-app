// Simplified data models for offline storage

export interface Player {
  id: string
  name: string
  createdAt: string
}

export interface GamePlayer {
  playerId: string
  seatPosition?: number
  totalScore: number
  position?: number
}

export interface Round {
  id: string
  roundNumber: number
  cardsPerPlayer: number
  trumpSuit: string
  bids: Bid[]
}

export interface Bid {
  playerId: string
  bidAmount: number
  tricksTaken: number
  score: number
}

export interface Game {
  id: string
  createdAt: string
  status: 'setup' | 'seat_arrangement' | 'in_progress' | 'completed'
  playerCount: number
  totalRounds: number
  currentRound: number
  players: GamePlayer[]
  rounds: Round[]
}

export interface AppSettings {
  version: string
  theme?: 'light' | 'dark'
}
