const { chromium } = require('playwright')

;(async () => {
  console.log('🧪 Quick test: Player creation → Game setup → Seat arrangement\n')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ JS ERROR:', msg.text())
    }
  })

  try {
    await page.goto('http://localhost:3000')

    // Add players
    console.log('➕ Adding players...')
    await page.fill('input[placeholder="Enter player name"]', 'Alice')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(300)

    await page.fill('input[placeholder="Enter player name"]', 'Bob')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(300)

    await page.fill('input[placeholder="Enter player name"]', 'Charlie')
    await page.click('button:has-text("Add Player")')
    await page.waitForTimeout(300)

    // Select players
    console.log('☑️ Selecting players...')
    await page.check('input[type="checkbox"]')
    await page.check('input[type="checkbox"]:nth-of-type(2)')
    await page.check('input[type="checkbox"]:nth-of-type(3)')

    // Continue to seat arrangement
    console.log('🪑 Continuing to seat arrangement...')
    await page.click('button:has-text("Continue to Seat Arrangement")')
    await page.waitForTimeout(2000)

    // Check if we're on seat arrangement page
    const isOnSeatPage = await page.locator('text=Seat').isVisible()
    console.log('On seat arrangement page:', isOnSeatPage)

    if (isOnSeatPage) {
      console.log('✅ SUCCESS: Made it to seat arrangement page!')

      // Try to see available players
      const playerText = await page.textContent('body')
      const hasPlayers =
        playerText.includes('Alice') || playerText.includes('Bob') || playerText.includes('Charlie')
      console.log('Players visible on page:', hasPlayers)

      await page.screenshot({ path: 'seat-arrangement-success.png' })
    } else {
      console.log('❌ FAILED: Did not reach seat arrangement page')
      await page.screenshot({ path: 'seat-arrangement-failed.png' })
    }
  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  await browser.close()
})()
