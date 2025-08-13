const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();

  await page.goto('http://localhost:3000');
  
  // Add one player and try to create game
  await page.fill('input[placeholder="Enter player name"]', 'Alice');
  await page.click('button:has-text("Add Player")');
  await page.waitForTimeout(1000);
  
  await page.fill('input[placeholder="Enter player name"]', 'Bob');
  await page.click('button:has-text("Add Player")');
  await page.waitForTimeout(1000);
  
  await page.fill('input[placeholder="Enter player name"]', 'Charlie');
  await page.click('button:has-text("Add Player")');
  await page.waitForTimeout(1000);

  // Take screenshot to see current state
  await page.screenshot({ path: 'current-state.png', fullPage: true });
  console.log('Screenshot saved as current-state.png');
  
  // Check localStorage
  const storage = await page.evaluate(() => ({
    players: localStorage.getItem('players'),
    games: localStorage.getItem('games')
  }));
  console.log('Storage state:', storage);

  await browser.close();
})();