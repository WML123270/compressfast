/**
 * 把 pdfjs-dist 运行时资源复制到 public/pdfjs/v<版本>/。
 *
 * 为什么提交到 public/：
 * - Vercel 从 git 构建，只有提交的文件才会被部署；
 * - 国内 ECS 的 package.sh 直接打包 public/，无需在服务器安装 pdfjs-dist；
 * - 运行时用 webpackIgnore 按 URL 加载，不进入 webpack 打包。
 *
 * 用法：
 *   node scripts/copy-pdfjs.mjs           # 复制/更新
 *   node scripts/copy-pdfjs.mjs --check   # 只校验，不一致时退出码 1
 */

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EXPECTED_VERSION = '4.10.38'
const SRC = path.join(ROOT, 'node_modules', 'pdfjs-dist')
const DEST = path.join(ROOT, 'public', 'pdfjs', `v${EXPECTED_VERSION}`)
const checkOnly = process.argv.includes('--check')

const POLYFILL = `if (!Promise.withResolvers) {
  Object.defineProperty(Promise, 'withResolvers', {
    configurable: true,
    writable: true,
    value: function withResolvers() {
      let resolve, reject
      const promise = new Promise((res, rej) => {
        resolve = res
        reject = rej
      })
      return { promise, resolve, reject }
    },
  })
}
`

const WORKER_ENTRY = `// 先装 polyfill，再执行 pdf.js worker（静态 import 按源码顺序求值）
import './promise-with-resolvers.mjs'
import './pdf.worker.min.mjs'
`

function fail(message) {
  console.error(`✗ ${message}`)
  process.exit(1)
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(SRC, 'package.json'), 'utf8'))
  if (pkg.version !== EXPECTED_VERSION) {
    fail(
      `pdfjs-dist 版本是 ${pkg.version}，脚本期望 ${EXPECTED_VERSION}。` +
        '升级时请同步修改 lib/pdf/pdfjs.ts 的 PDFJS_VERSION。',
    )
  }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')
}

function listFiles(dir, base = dir) {
  const out = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFiles(full, base))
    else out.push(path.relative(base, full))
  }
  return out
}

function copyChecked(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function verify() {
  const checks = []

  const pairs = [
    ['build/pdf.min.mjs', 'pdf.min.mjs'],
    ['build/pdf.worker.min.mjs', 'pdf.worker.min.mjs'],
  ]
  for (const [from, to] of pairs) {
    const src = path.join(SRC, from)
    const dest = path.join(DEST, to)
    checks.push({ name: to, ok: fs.existsSync(dest) && sha256(src) === sha256(dest) })
  }

  for (const dir of ['cmaps', 'standard_fonts']) {
    const files = listFiles(path.join(SRC, dir))
    for (const rel of files) {
      const src = path.join(SRC, dir, rel)
      const dest = path.join(DEST, dir, rel)
      checks.push({
        name: `${dir}/${rel}`,
        ok: fs.existsSync(dest) && sha256(src) === sha256(dest),
      })
    }
  }

  checks.push({ name: 'pdf.worker.entry.mjs', ok: fs.existsSync(path.join(DEST, 'pdf.worker.entry.mjs')) })
  checks.push({ name: 'promise-with-resolvers.mjs', ok: fs.existsSync(path.join(DEST, 'promise-with-resolvers.mjs')) })
  checks.push({ name: 'LICENSE', ok: fs.existsSync(path.join(DEST, 'LICENSE')) })

  const failed = checks.filter(c => !c.ok)
  if (failed.length) {
    console.error(`✗ pdf.js 资源不一致（${failed.length} 项）：`)
    for (const item of failed.slice(0, 20)) console.error(`  - ${item.name}`)
    if (failed.length > 20) console.error(`  … 还有 ${failed.length - 20} 项`)
    console.error('运行 `npm run sync:pdfjs` 修复，并提交 public/pdfjs。')
    process.exit(1)
  }

  console.log(`✓ pdf.js 资源完整且与 pdfjs-dist@${EXPECTED_VERSION} 一致（${checks.length} 项）`)
}

function sync() {
  fs.rmSync(DEST, { recursive: true, force: true })
  fs.mkdirSync(DEST, { recursive: true })

  copyChecked(path.join(SRC, 'build', 'pdf.min.mjs'), path.join(DEST, 'pdf.min.mjs'))
  copyChecked(path.join(SRC, 'build', 'pdf.worker.min.mjs'), path.join(DEST, 'pdf.worker.min.mjs'))
  copyChecked(path.join(SRC, 'LICENSE'), path.join(DEST, 'LICENSE'))
  fs.cpSync(path.join(SRC, 'cmaps'), path.join(DEST, 'cmaps'), { recursive: true })
  fs.cpSync(path.join(SRC, 'standard_fonts'), path.join(DEST, 'standard_fonts'), { recursive: true })

  fs.writeFileSync(path.join(DEST, 'promise-with-resolvers.mjs'), POLYFILL)
  fs.writeFileSync(path.join(DEST, 'pdf.worker.entry.mjs'), WORKER_ENTRY)

  const bytes = listFiles(DEST).reduce((sum, rel) => sum + fs.statSync(path.join(DEST, rel)).size, 0)
  console.log(`✓ 已同步 pdf.js v${EXPECTED_VERSION} → public/pdfjs/v${EXPECTED_VERSION}`)
  console.log(`  文件 ${listFiles(DEST).length} 个，共 ${(bytes / 1024 / 1024).toFixed(2)} MB`)
  console.log('  请提交 public/pdfjs（Vercel 从 git 读取）；国内 package.sh 会自动打包 public/。')
}

readVersion()
if (checkOnly) verify()
else sync()
