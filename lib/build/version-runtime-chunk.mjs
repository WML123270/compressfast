// Postbuild：给 webpack runtime chunk 文件名加上 buildId，并同步所有引用。
//
// 原因：Cloudflare 对 /_next/static/chunks/webpack-<hash>.js 按 immutable 缓存一年，
// 而该文件名不随 worker 子编译产物变化。部署后 CDN 仍返回旧 runtime，指向已删除的
// 旧 worker chunk → 压缩 Worker 404。
//
// 不能用 next.config 的 output.filename 函数改名：Vercel 的构建管线会因此漏掉
// worker chunk（2026-11-24 实测）。这里在 next build 之后直接改磁盘文件，构建
// 仍走标准管线，worker 正常打包。
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const nextDir = path.join(root, '.next')
const chunksDir = path.join(nextDir, 'static/chunks')

if (!fs.existsSync(chunksDir)) {
  console.log('[version-runtime] 未找到 .next/static/chunks，跳过')
  process.exit(0)
}

const runtimeFiles = fs
  .readdirSync(chunksDir)
  .filter((f) => /^webpack-[a-f0-9]+\.js$/.test(f))

if (runtimeFiles.length === 0) {
  console.log('[version-runtime] 未找到 webpack runtime chunk，跳过')
  process.exit(0)
}
if (runtimeFiles.length > 1) {
  console.warn(`[version-runtime] 找到多个 runtime chunk：${runtimeFiles.join(', ')}，只改第一个`)
}

const oldName = runtimeFiles[0]
const buildId = (fs.existsSync(path.join(nextDir, 'BUILD_ID'))
  ? fs.readFileSync(path.join(nextDir, 'BUILD_ID'), 'utf8')
  : String(Date.now())
)
  .trim()
  .replace(/[^a-zA-Z0-9_-]/g, '')
  .slice(0, 12) || 'build'

const hash = oldName.replace(/^webpack-/, '').replace(/\.js$/, '')
const newName = `webpack-${buildId}-${hash}.js`

// 1. 重命名 runtime 文件（含 source map，如存在）
fs.renameSync(path.join(chunksDir, oldName), path.join(chunksDir, newName))
const oldMap = oldName + '.map'
if (fs.existsSync(path.join(chunksDir, oldMap))) {
  fs.renameSync(path.join(chunksDir, oldMap), path.join(chunksDir, newName + '.map'))
}

// 2. 替换所有可服务/运行时读取文件里的引用（跳过 webpack 缓存与 trace）
const TEXT_EXT = new Set(['.json', '.js', '.html', '.rsc', '.txt', '.map'])
let patched = 0

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    const rel = path.relative(nextDir, full).split(path.sep).join('/')
    if (rel === 'cache' || rel.startsWith('cache/') || rel === 'trace') continue
    if (entry.isDirectory()) {
      walk(full)
      continue
    }
    if (!TEXT_EXT.has(path.extname(entry.name))) continue
    let text
    try {
      text = fs.readFileSync(full, 'utf8')
    } catch {
      continue
    }
    if (!text.includes(oldName)) continue
    fs.writeFileSync(full, text.split(oldName).join(newName))
    patched++
  }
}

walk(nextDir)

console.log(`[version-runtime] ${oldName} → ${newName}（引用文件 ${patched} 个）`)
