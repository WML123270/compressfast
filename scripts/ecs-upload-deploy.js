/**
 * ECS 部署 — 打包 + SFTP上传 + 远程执行 server-update.sh
 * Requires: npm run build already completed
 * Usage: node scripts/ecs-upload-deploy.js
 */
const { Client } = require('ssh2')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.resolve(__dirname, '..')
// Use forward-slash paths for bash compatibility
const ROOT_BASH = '/' + ROOT.replace(/\\/g, '/').replace(/^([A-Z]):/i, '$1').replace(/^\/c\//i, '/c/')
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 15)
const PACKAGE_NAME = `deploy-package-${TIMESTAMP}.tar.gz`
const PACKAGE_PATH = path.join(ROOT, PACKAGE_NAME)
const PACKAGE_PATH_BASH = `${ROOT_BASH}/${PACKAGE_NAME}`
const TMP_DIR_BASH = `${ROOT_BASH}/deploy-tmp`

const ECS = {
  host: '8.138.212.213',
  port: 22,
  username: 'root',
  password: 'Wml1995211.',
  readyTimeout: 30000,
}

function step(msg) { console.log(`\n${'='.repeat(60)}\n  ${msg}\n${'='.repeat(60)}`) }

async function runCommand(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${label}...`)
    conn.exec(cmd, (err, stream) => {
      if (err) { reject(err); return }
      let out = ''
      stream.on('data', (d) => { out += d.toString(); process.stdout.write(d) })
      stream.stderr.on('data', (d) => { out += d.toString(); process.stderr.write(d) })
      stream.on('close', (code) => {
        console.log(`[${label}] exit ${code}`)
        resolve({ stdout: out, code })
      })
    })
  })
}

async function uploadFile(conn, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) { reject(err); return }
      const total = fs.statSync(localPath).size
      let uploaded = 0
      const readStream = fs.createReadStream(localPath)
      const writeStream = sftp.createWriteStream(remotePath)

      writeStream.on('close', () => {
        console.log(`✅ Uploaded ${(total / 1024 / 1024).toFixed(1)} MB → ${remotePath}`)
        resolve()
      })
      writeStream.on('error', reject)

      readStream.on('data', (chunk) => {
        uploaded += chunk.length
        if (uploaded % (5 * 1024 * 1024) < chunk.length || uploaded === total) {
          process.stdout.write(`\r  Uploading... ${(uploaded / total * 100).toFixed(0)}%`)
        }
      })

      readStream.pipe(writeStream)
    })
  })
}

async function main() {
  // Step 1: Check .next exists
  step('1/4: Verifying build')
  if (!fs.existsSync(path.join(ROOT, '.next'))) {
    console.log('❌ .next not found. Run npm run build first.')
    process.exit(1)
  }
  console.log('✅ .next exists')

  // Step 2: Create deploy package
  step('2/4: Creating deploy package')
  const tmpDir = path.join(ROOT, 'deploy-tmp')
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true })
  fs.mkdirSync(tmpDir, { recursive: true })

  // Use Node.js fs.cpSync for cross-platform copy
  fs.cpSync(path.join(ROOT, '.next'), path.join(tmpDir, '.next'), { recursive: true })
  fs.cpSync(path.join(ROOT, 'public'), path.join(tmpDir, 'public'), { recursive: true })
  for (const f of ['package.json', 'package-lock.json', 'next.config.mjs']) {
    fs.copyFileSync(path.join(ROOT, f), path.join(tmpDir, f))
  }
  // Copy server-update.sh
  fs.mkdirSync(path.join(tmpDir, 'deploy'), { recursive: true })
  fs.copyFileSync(path.join(ROOT, 'deploy', 'server-update.sh'), path.join(tmpDir, 'deploy', 'server-update.sh'))

  console.log(`Creating ${PACKAGE_NAME}...`)
  // Use bash for tar (more reliable on Windows Git Bash)
  execSync(`bash -c "cd '${TMP_DIR_BASH}' && tar czf '${PACKAGE_PATH_BASH}' ."`, { stdio: 'inherit' })

  const sizeMB = (fs.statSync(PACKAGE_PATH).size / 1024 / 1024).toFixed(1)
  console.log(`✅ Package: ${PACKAGE_NAME} (${sizeMB} MB)`)

  // Cleanup tmp
  fs.rmSync(tmpDir, { recursive: true })

  // Step 3: Upload via SFTP
  step('3/4: Uploading to ECS')
  const conn = new Client()

  await new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('🔗 SSH connected')
      try {
        await uploadFile(conn, PACKAGE_PATH, `/home/admin/${PACKAGE_NAME}`)
        resolve()
      } catch (e) {
        reject(e)
      }
    })
    conn.on('error', reject)
    conn.connect(ECS)
  })

  // Step 4: Upload server-update.sh separately (needed before extraction)
  step('4/5: Uploading server-update.sh')
  const localUpdateScript = path.join(ROOT, 'deploy', 'server-update.sh')
  await uploadFile(conn, localUpdateScript, '/home/admin/deploy-server-update.sh')

  // Step 5: Run server-update.sh on ECS
  step('5/5: Running server-update.sh')
  await new Promise((resolve, reject) => {
    conn.exec(`bash /home/admin/deploy-server-update.sh /home/admin/${PACKAGE_NAME}`, (err, stream) => {
      if (err) { reject(err); return }
      stream.on('data', (d) => process.stdout.write(d.toString()))
      stream.stderr.on('data', (d) => process.stderr.write(d.toString()))
      stream.on('close', (code) => {
        console.log(`\nServer update exit: ${code}`)
        conn.end()
        resolve()
      })
    })
  })

  // Cleanup local package
  fs.unlinkSync(PACKAGE_PATH)
  console.log(`\n🗑️  Local package ${PACKAGE_NAME} cleaned up`)
  console.log('\n🎉 Deploy complete! Visit: https://jisuyatu.com')
}

main().catch((err) => {
  console.error('❌ Deploy failed:', err.message || err)
  process.exit(1)
})
