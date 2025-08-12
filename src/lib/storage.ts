import { Preferences } from '@capacitor/preferences'
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite'
import { Player, Game, AppSettings, PlayerStats } from '@/types/storage'

export class WizardStorageService {
  private sqlite: SQLiteConnection
  private db: SQLiteDBConnection | null = null
  private isInitialized = false
  
  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite)
  }
  
  async initialize(): Promise<void> {
    if (this.isInitialized) return
    
    try {
      // Check if SQLite plugin is available
      const ret = await CapacitorSQLite.checkConnectionsConsistency({
        dbNames: [],
      })
      
      // Create database connection
      await this.sqlite.createConnection({
        database: 'wizard-scores',
        version: 1,
        encrypted: false,
        mode: 'no-encryption'
      })
      
      this.db = await this.sqlite.retrieveConnection('wizard-scores', false)
      await this.db.open()
      await this.createTables()
      
      this.isInitialized = true
      console.log('Storage service initialized successfully')
    } catch (error) {
      console.error('Failed to initialize storage service:', error)
      throw error
    }
  }
  
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
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
        status TEXT NOT NULL,
        player_count INTEGER NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_games_created_at ON games(created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_games_status ON games(status)`
    ]
    
    for (const query of queries) {
      await this.db.execute(query)
    }
  }
  
  // Settings methods (using Capacitor Preferences)
  async getSettings(): Promise<AppSettings> {
    try {
      const { value } = await Preferences.get({ key: 'app-settings' })
      return value ? JSON.parse(value) : { version: '1.0.0' }
    } catch (error) {
      console.error('Failed to get settings:', error)
      return { version: '1.0.0' }
    }
  }
  
  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    try {
      const current = await this.getSettings()
      const updated = { ...current, ...settings }
      await Preferences.set({
        key: 'app-settings',
        value: JSON.stringify(updated)
      })
    } catch (error) {
      console.error('Failed to update settings:', error)
      throw error
    }
  }
  
  // Player methods
  async getPlayers(): Promise<Player[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const result = await this.db.query('SELECT * FROM players ORDER BY name ASC')
      return result?.values?.map(row => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at
      })) || []
    } catch (error) {
      console.error('Failed to get players:', error)
      return []
    }
  }
  
  async addPlayer(playerData: Omit<Player, 'id'>): Promise<Player> {
    if (!this.db) throw new Error('Database not initialized')
    
    const player: Player = {
      id: crypto.randomUUID(),
      ...playerData
    }
    
    try {
      await this.db.execute(
        'INSERT INTO players (id, name, created_at) VALUES (?, ?, ?)',
        [player.id, player.name, player.createdAt]
      )
      return player
    } catch (error) {
      console.error('Failed to add player:', error)
      throw error
    }
  }
  
  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      if (updates.name) {
        await this.db.execute(
          'UPDATE players SET name = ? WHERE id = ?',
          [updates.name, id]
        )
      }
      
      const result = await this.db.query('SELECT * FROM players WHERE id = ?', [id])
      if (!result?.values?.[0]) throw new Error('Player not found')
      
      const row = result.values[0]
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at
      }
    } catch (error) {
      console.error('Failed to update player:', error)
      throw error
    }
  }
  
  async deletePlayer(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      await this.db.execute('DELETE FROM players WHERE id = ?', [id])
    } catch (error) {
      console.error('Failed to delete player:', error)
      throw error
    }
  }
  
  // Game methods (stored as JSON for simplicity)
  async saveGame(game: Game): Promise<Game> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      await this.db.execute(
        'INSERT OR REPLACE INTO games (id, data, created_at, status, player_count) VALUES (?, ?, ?, ?, ?)',
        [game.id, JSON.stringify(game), game.createdAt, game.status, game.playerCount]
      )
      return game
    } catch (error) {
      console.error('Failed to save game:', error)
      throw error
    }
  }
  
  async getGames(): Promise<Game[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const result = await this.db.query('SELECT data FROM games ORDER BY created_at DESC')
      return result?.values?.map(row => JSON.parse(row.data)) || []
    } catch (error) {
      console.error('Failed to get games:', error)
      return []
    }
  }
  
  async getGame(id: string): Promise<Game | null> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const result = await this.db.query('SELECT data FROM games WHERE id = ?', [id])
      return result?.values?.[0] ? JSON.parse(result.values[0].data) : null
    } catch (error) {
      console.error('Failed to get game:', error)
      return null
    }
  }
  
  async deleteGame(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      await this.db.execute('DELETE FROM games WHERE id = ?', [id])
    } catch (error) {
      console.error('Failed to delete game:', error)
      throw error
    }
  }
  
  // Stats methods
  async getPlayerStats(): Promise<PlayerStats[]> {
    if (!this.db) throw new Error('Database not initialized')
    
    try {
      const games = await this.getGames()
      const completedGames = games.filter(game => game.status === 'completed')
      
      const playerStatsMap = new Map<string, PlayerStats>()
      
      completedGames.forEach(game => {
        game.players.forEach(gamePlayer => {
          const existing = playerStatsMap.get(gamePlayer.playerId) || {
            playerId: gamePlayer.playerId,
            playerName: gamePlayer.playerName,
            gamesPlayed: 0,
            gamesWon: 0,
            totalScore: 0,
            averageScore: 0,
            winRate: 0
          }
          
          existing.gamesPlayed += 1
          existing.totalScore += gamePlayer.totalScore
          
          // Check if this player won (assuming position 1 is winner)
          if (gamePlayer.position === 1) {
            existing.gamesWon += 1
          }
          
          playerStatsMap.set(gamePlayer.playerId, existing)
        })
      })
      
      // Calculate averages and win rates
      return Array.from(playerStatsMap.values()).map(stats => ({
        ...stats,
        averageScore: stats.gamesPlayed > 0 ? stats.totalScore / stats.gamesPlayed : 0,
        winRate: stats.gamesPlayed > 0 ? stats.gamesWon / stats.gamesPlayed : 0
      }))
    } catch (error) {
      console.error('Failed to get player stats:', error)
      return []
    }
  }
  
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
      this.isInitialized = false
    }
  }
}

// Create singleton instance
export const storageService = new WizardStorageService()