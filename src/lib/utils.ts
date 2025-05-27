export function calculateGameRounds(playerCount: number): number {
    // Based on Wizard rules: total cards (60) divided by players
    switch (playerCount) {
      case 3: return 20
      case 4: return 15
      case 5: return 12
      case 6: return 10
      default: return 15
    }
  }
  
  export function calculateScore(bid: number, tricksTaken: number): number {
    if (bid === tricksTaken) {
      // Correct bid: 20 points + 10 per trick
      return 20 + (10 * tricksTaken)
    } else {
      // Incorrect bid: -10 per trick difference
      return -10 * Math.abs(bid - tricksTaken)
    }
  }
  
  export function calculateRemainingTricks(
    totalTricks: number,
    currentBids: number[]
  ): number {
    const totalBid = currentBids.reduce((sum, bid) => sum + bid, 0)
    return totalTricks - totalBid
  }