/**
 * Convert tweet HTML card to PNG screenshot
 * Usage: node scripts/html-to-png.js <input.html> <output.png>
 */
const { chromium } = require('playwright')
const path = require('path')

async function main() {
  const inputFile = process.argv[2]
  const outputFile = process.argv[3]

  if (!inputFile || !outputFile) {
    console.log('Usage: node scripts/html-to-png.js <input.html> <output.png>')
    process.exit(1)
  }

  const inputPath = path.resolve(inputFile)
  const outputPath = path.resolve(outputFile)
  // Convert Windows path to file URL: C:\foo\bar.html → file:///C:/foo/bar.html
  const fileUrl = 'file:///' + inputPath.replace(/\\/g, '/').replace(/^([A-Z]):/i, '$1:')

  console.log(`Opening: ${fileUrl}`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1200, height: 675 })

  await page.goto(fileUrl, { waitUntil: 'networkidle' })

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 675 },
  })

  await browser.close()
  console.log(`✅ Saved: ${outputPath}`)
}

main().catch((err) => {
  console.error('❌ Failed:', err.message)
  process.exit(1)
})
