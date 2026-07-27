/**
 * ECS 部署脚本 — 使用 ssh2 通过密码连接，git pull + build + pm2 restart
 * 用法: node scripts/ecs-deploy.js
 */
const { Client } = require('ssh2')
const path = require('path')

const ECS = {
  host: '8.138.212.213',
  port: 22,
  username: 'root',
  password: 'Wml1995211.',
  readyTimeout: 15000,
}

const APP_DIR = '/home/admin/png-compressor'

function runCommand(conn, cmd, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n>>> ${label}...`)
    conn.exec(cmd, (err, stream) => {
      if (err) { reject(err); return }
      let out = ''
      stream.on('data', (data) => { out += data.toString(); process.stdout.write(data) })
      stream.stderr.on('data', (data) => { out += data.toString(); process.stderr.write(data) })
      stream.on('close', (code) => {
        if (code === 0) { console.log(`✅ ${label} done`); resolve(out) }
        else { console.log(`⚠️ ${label} exit ${code}`); resolve(out) } // Don't fail on non-zero for some commands
      })
    })
  })
}

async function deploy() {
  const conn = new Client()

  return new Promise((resolve, reject) => {
    conn.on('ready', async () => {
      console.log('🔗 SSH connected to ECS')
      try {
        // 1. Check project exists
        const ls = await runCommand(conn, `ls ${APP_DIR}/package.json 2>&1`, 'Check project')
        if (ls.includes('No such file')) {
          console.log('❌ Project not found at', APP_DIR)
          conn.end()
          resolve()
          return
        }

        // 2. Git pull
        await runCommand(conn, `cd ${APP_DIR} && git pull origin master 2>&1`, 'Git pull')

        // 3. Install dependencies
        await runCommand(conn, `cd ${APP_DIR} && npm install --registry=https://registry.npmmirror.com 2>&1`, 'npm install')

        // 4. Build
        await runCommand(conn, `cd ${APP_DIR} && npx next build 2>&1`, 'Next.js build')

        // 5. Restart via PM2
        const pm2List = await runCommand(conn, 'pm2 list 2>&1', 'PM2 status')
        if (pm2List.includes('png-compressor')) {
          await runCommand(conn, 'pm2 restart png-compressor 2>&1', 'PM2 restart')
        } else {
          await runCommand(conn, `cd ${APP_DIR} && pm2 start npx --name png-compressor -- next start -p 3000 2>&1`, 'PM2 start')
        }
        await runCommand(conn, 'pm2 save 2>&1', 'PM2 save')

        // 6. Health check
        console.log('\n>>> Health check...')
        await new Promise((res) => setTimeout(res, 3000))
        const health = await runCommand(conn, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:3000', 'Health check')
        if (health.trim() === '200' || health.trim() === '304') {
          console.log(`✅ Service healthy (HTTP ${health.trim()})`)
        } else {
          console.log(`⚠️ Service returned HTTP ${health.trim()}`)
        }

        console.log('\n🎉 ECS deploy complete!')
      } catch (err) {
        console.error('❌ Deploy failed:', err.message)
      }
      conn.end()
      resolve()
    })

    conn.on('error', (err) => {
      console.error('❌ SSH connection failed:', err.message)
      reject(err)
    })

    conn.connect(ECS)
  })
}

deploy().catch(console.error)
