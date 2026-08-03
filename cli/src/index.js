#!/usr/bin/env node
/**
 * CompressFast CLI — Image compression from the command line.
 *
 * Usage:
 *   compressfast input.jpg                         Compress single file
 *   compressfast *.jpg                             Compress all JPEGs
 *   compressfast ./images --quality 80             Batch compress with quality
 *   compressfast photo.png --format webp --resize 1920
 *   compressfast ./src --watch                     Watch mode
 */

const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

// ─── Argument parsing ──────────────────────────────────────────────────────
const args = process.argv.slice(2)

const options = {
  quality: 80,
  format: null,        // 'jpeg' | 'png' | 'webp' | 'avif'
  resize: null,         // width or WxH
  lossless: false,
  stripMetadata: true,
  output: null,         // output directory
  suffix: null,         // output file suffix
  watch: false,
  help: false,
  version: false,
  inputs: [],
}

for (let i = 0; i < args.length; i++) {
  const a = args[i]
  switch (a) {
    case '-q': case '--quality':
      options.quality = parseInt(args[++i], 10); break
    case '-f': case '--format':
      options.format = args[++i].toLowerCase(); break
    case '-r': case '--resize':
      options.resize = args[++i]; break
    case '--lossless':
      options.lossless = true; break
    case '--no-strip':
      options.stripMetadata = false; break
    case '-o': case '--output':
      options.output = args[++i]; break
    case '-s': case '--suffix':
      options.suffix = args[++i]; break
    case '-w': case '--watch':
      options.watch = true; break
    case '-h': case '--help':
      options.help = true; break
    case '-v': case '--version':
      options.version = true; break
    default:
      if (!a.startsWith('-')) options.inputs.push(a)
  }
}

// ─── Help / Version ────────────────────────────────────────────────────────
if (options.help) {
  console.log(`
  ⚡ CompressFast CLI v1.0.0
  ─────────────────────────────────────────
  Lightning-fast image compression.

  Usage:
    compressfast <files...> [options]

  Options:
    -q, --quality <1-100>   Quality (default: 80)
    -f, --format <fmt>      Convert to: jpeg, png, webp, avif
    -r, --resize <WxH|W>    Resize images (e.g. 1920x1080 or 1920)
    --lossless              Lossless compression (PNG only)
    --no-strip              Keep EXIF/metadata
    -o, --output <dir>      Output directory (default: same as input)
    -s, --suffix <str>      Output filename suffix (default: none)
    -w, --watch             Watch for new files

  Examples:
    compressfast photo.jpg
    compressfast *.png --quality 90
    compressfast src/*.jpg -f webp -r 1920 -o dist/
    compressfast ./uploads --watch

  compressfast.site · files never leave your machine
`)
  process.exit(0)
}

if (options.version) {
  console.log('1.0.0')
  process.exit(0)
}

if (options.inputs.length === 0) {
  console.error('Error: No input files specified. Use --help for usage.')
  process.exit(1)
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function resolveOutputPath(inputPath) {
  const dir = options.output || path.dirname(inputPath)
  const ext = path.extname(inputPath)
  const base = path.basename(inputPath, ext)

  let newExt = ext
  if (options.format) {
    const extMap = { jpeg: '.jpg', jpg: '.jpg', png: '.png', webp: '.webp', avif: '.avif' }
    newExt = extMap[options.format] || '.' + options.format
  }

  const suffix = options.suffix || ''
  return path.join(dir, base + suffix + newExt)
}

function parseResize(val) {
  if (!val) return null
  const parts = String(val).split('x')
  const w = parseInt(parts[0], 10) || null
  const h = parseInt(parts[1], 10) || null
  if (!w && !h) return null
  return { width: w, height: h, fit: w && h ? 'fill' : 'inside', withoutEnlargement: true }
}

// ─── File discovery ─────────────────────────────────────────────────────────
function expandInputs(inputs) {
  const files = []
  for (const input of inputs) {
    if (fs.existsSync(input)) {
      const stat = fs.statSync(input)
      if (stat.isDirectory()) {
        // Recursively find images in directory
        const walk = (dir) => {
          for (const entry of fs.readdirSync(dir)) {
            const full = path.join(dir, entry)
            const s = fs.statSync(full)
            if (s.isDirectory()) walk(full)
            else if (/\.(jpe?g|png|webp|avif|gif|tiff?)$/i.test(entry)) files.push(full)
          }
        }
        walk(input)
      } else {
        files.push(input)
      }
    }
  }
  return files
}

// ─── Compression engine ─────────────────────────────────────────────────────
async function compressFile(inputPath) {
  const outputPath = resolveOutputPath(inputPath)
  const originalSize = fs.statSync(inputPath).size

  // Ensure output directory exists
  const outDir = path.dirname(outputPath)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  let pipeline = sharp(inputPath)

  // Strip metadata
  if (options.stripMetadata) {
    pipeline = pipeline.withMetadata({})
  }

  // Resize
  const resize = parseResize(options.resize)
  if (resize) {
    pipeline = pipeline.resize(resize)
  }

  // Format & quality
  const format = options.format || path.extname(inputPath).replace('.', '')
  switch (format) {
    case 'jpeg': case 'jpg':
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true })
      break
    case 'png':
      pipeline = options.lossless
        ? pipeline.png({ compressionLevel: 9, palette: true })
        : pipeline.png({ quality: options.quality, palette: true })
      break
    case 'webp':
      pipeline = pipeline.webp({ quality: options.quality, lossless: options.lossless })
      break
    case 'avif':
      pipeline = pipeline.avif({ quality: options.quality, lossless: options.lossless })
      break
    default:
      pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true })
  }

  await pipeline.toFile(outputPath)

  const compressedSize = fs.statSync(outputPath).size
  const saved = originalSize - compressedSize
  const pct = ((saved / originalSize) * 100).toFixed(1)

  return { inputPath, outputPath, originalSize, compressedSize, saved, pct }
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  const files = expandInputs(options.inputs)

  if (files.length === 0) {
    console.error('Error: No image files found.')
    process.exit(1)
  }

  console.log(`\n⚡ CompressFast · ${files.length} file(s)\n`)

  let totalOriginal = 0
  let totalCompressed = 0
  const start = Date.now()

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const label = `${i + 1}/${files.length}`

    try {
      const result = await compressFile(file)
      totalOriginal += result.originalSize
      totalCompressed += result.compressedSize

      const icon = parseFloat(result.pct) > 5 ? '✅' : '☑️ '
      console.log(`  ${icon} ${label}  ${path.basename(file)}  ${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}  (-${result.pct}%)`)
    } catch (err) {
      console.error(`  ❌ ${label}  ${path.basename(file)}  ${err.message}`)
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1)
  const totalSaved = totalOriginal - totalCompressed
  const totalPct = totalOriginal > 0 ? ((totalSaved / totalOriginal) * 100).toFixed(1) : '0'

  console.log(`\n─────────────────────────────────────────`)
  console.log(`  Total: ${formatSize(totalOriginal)} → ${formatSize(totalCompressed)}`)
  console.log(`  Saved: ${formatSize(totalSaved)}  (-${totalPct}%)`)
  console.log(`  Time:  ${elapsed}s`)
  console.log(`\n🔒 All processing done locally. Files never uploaded.\n`)
}

main().catch(err => {
  console.error('Fatal error:', err.message)
  process.exit(1)
})

// ─── Watch mode ──────────────────────────────────────────────────────────────
if (options.watch) {
  const dirs = [...new Set(files.map(f => path.dirname(f)))]
  console.log(`\n👀 Watching ${dirs.length} director(ies) for new images...\n`)

  for (const dir of dirs) {
    fs.watch(dir, { recursive: true }, async (eventType, filename) => {
      if (!filename || eventType !== 'rename') return
      const fullPath = path.join(dir, filename)
      // Wait for file to finish writing
      await new Promise(r => setTimeout(r, 500))
      if (fs.existsSync(fullPath) && /\.(jpe?g|png|webp|avif)$/i.test(filename)) {
        try {
          const result = await compressFile(fullPath)
          console.log(`  ✅ ${filename}  ${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}  (-${result.pct}%)`)
        } catch (err) {
          console.error(`  ❌ ${filename}  ${err.message}`)
        }
      }
    })
  }
}
