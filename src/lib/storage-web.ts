// Web-compatible localStorage fallback for testing
import { Player, Game, AppSettings } from '@/types/storage'
import { generateId } from '@/lib/uuid'

class WebStorageService {
  private isClient: boolean

  constructor() {
    this.isClient = typeof window !== 'undefined'
  }

  async initialize(): Promise<void> {
    // No initialization needed for localStorage
  }

  // Settings methods
  async getSettings(): Promise<AppSettings> {
    if (!this.isClient) return { version: '1.0.0' }

    const stored = localStorage.getItem('app-settings')
    return stored ? JSON.parse(stored) : { version: '1.0.0' }
  }

  async updateSettings(settings: Partial<AppSettings>) {
    if (!this.isClient) return

    const current = await this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem('app-settings', JSON.stringify(updated))
  }

  // Player methods
  async getPlayers(): Promise<Player[]> {
    if (!this.isClient) return []

    const stored = localStorage.getItem('players')
    const players = stored ? JSON.parse(stored) : []
    return players.sort((a: Player, b: Player) => a.name.localeCompare(b.name))
  }

  async addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    if (!this.isClient) throw new Error('Not running in browser')

    const player: Player = {
      id: generateId(),
      ...playerData,
    }

    const players = await this.getPlayers()
    players.push(player)
    localStorage.setItem('players', JSON.stringify(players))

    return player
  }

  // Game methods
  async saveGame(game: Game): Promise<Game> {
    if (!this.isClient) throw new Error('Not running in browser')

    const games = await this.getGames()
    const existingIndex = games.findIndex(g => g.id === game.id)

    if (existingIndex >= 0) {
      games[existingIndex] = game
    } else {
      games.push(game)
    }

    localStorage.setItem('games', JSON.stringify(games))
    return game
  }

  async getGames(): Promise<Game[]> {
    if (!this.isClient) return []

    const stored = localStorage.getItem('games')
    const games = stored ? JSON.parse(stored) : []
    return games.sort(
      (a: Game, b: Game) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }

  async getGame(id: string): Promise<Game | null> {
    if (!this.isClient) return null

    const games = await this.getGames()
    return games.find(g => g.id === id) || null
  }

  async deleteGame(id: string): Promise<void> {
    if (!this.isClient) return

    const games = await this.getGames()
    const filtered = games.filter(g => g.id !== id)
    localStorage.setItem('games', JSON.stringify(filtered))
  }
}

// Create singleton instance
export const webStorageService = new WebStorageService()
