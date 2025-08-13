const { chromium } = require('playwright')

;(async () => {
  console.log('🎭 Starting Playwright test to debug the issue...\n')

  const browser = await chromium.launch({ headless: false, slowMo: 1000 })
  const page = await browser.newPage()

  // Enable console logging
  page.on('console', msg => console.log('🖥️  CONSOLE:', msg.text()))
  page.on('pageerror', err => console.log('❌ PAGE ERROR:', err.message))

  try {
    // Navigate to the app
    console.log('📍 Navigating to http://localhost:3000')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // Check initial state
    console.log('🔍 Checking initial localStorage state...')
    const initialPlayers = await page.evaluate(() => localStorage.getItem('players'))
    console.log('Initial players in localStorage:', initialPlayers)

    // Add some players
    console.log('\n👥 Adding players...')
    await page.fill('input[placeholder="Enter player name"]', 'Alice')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="Enter player name"]', 'Bob')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder="Enter player name"]', 'Charlie')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(500)

    // Check localStorage after adding players
    const playersAfterAdd = await page.evaluate(() => localStorage.getItem('players'))
    console.log('Players after adding:', playersAfterAdd)

    // Select players for game
    console.log('\n🎮 Selecting players for game...')
    await page.check('input[type="checkbox"]:near(:text("Alice"))')
    await page.check('input[type="checkbox"]:near(:text("Bob"))')
    await page.check('input[type="checkbox"]:near(:text("Charlie"))')

    // Check which players are selected
    const selectedCount = await page.locator('input[type="checkbox"]:checked').count()
    console.log('Number of selected players:', selectedCount)

    // Try to continue to seat arrangement
    console.log('\n🪑 Attempting to continue to seat arrangement...')
    await page.click('button:has-text("Continue to Seat Arrangement")')
    await page.waitForTimeout(2000)

    // Check current URL and page state
    const currentUrl = page.url()
    console.log('Current URL after clicking continue:', currentUrl)

    // Check localStorage for games
    const games = await page.evaluate(() => localStorage.getItem('games'))
    console.log('Games in localStorage:', games)

    // Check if we're on the seat arrangement page
    const seatArrangementVisible = await page.locator('text=Seat Arrangement').isVisible()
    console.log('Seat arrangement page visible:', seatArrangementVisible)

    if (seatArrangementVisible) {
      // Check if players are visible on seat arrangement page
      const playerElements = await page
        .locator('[data-testid="player"], .player, text=Alice, text=Bob, text=Charlie')
        .count()
      console.log('Player elements found on seat arrangement page:', playerElements)

      // Take a screenshot to see what's happening
      await page.screenshot({ path: 'seat-arrangement-debug.png', fullPage: true })
      console.log('📸 Screenshot saved as seat-arrangement-debug.png')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    await page.screenshot({ path: 'error-debug.png', fullPage: true })
  }

  await browser.close()
  console.log('\n✅ Test completed')
})()
