/**
 * 部署到国内 ECS — 用 ssh2 直接上传+执行
 */
const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVER = {
  host: '8.138.212.213',
  port: 22,
  username: 'root',
  password: 'Wml1995211.',
  tryKeyboard: true,
  readyTimeout: 10000,
  algorithms: {
    kex: ['diffie-hellman-group14-sha256', 'diffie-hellman-group14-sha1', 'ecdh-sha2-nistp256'],
    cipher: ['aes128-ctr', 'aes192-ctr', 'aes256-ctr'],
  },
};

const localFile = 'deploy-package-20260718-132919.tar.gz';
const remoteFile = '/home/admin/deploy-package-20260718-132919.tar.gz';

console.log('>>> 连接服务器...');
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ 已连接');

  // Step 1: Upload via SFTP
  console.log('>>> 上传文件...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const readStream = fs.createReadStream(localFile);
    const writeStream = sftp.createWriteStream(remoteFile);

    writeStream.on('close', () => {
      console.log('✅ 上传完成');

      // Step 2: Manual deploy steps
      const pkg = path.basename(remoteFile);
      const cmd = [
        `cd /home/admin`,
        `export NVM_DIR="$HOME/.nvm"`,
        `[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`,
        `mkdir -p /home/admin/backups`,
        // backup
        `cd /home/admin/png-compressor && tar czf /home/admin/backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz .next public package.json package-lock.json next.config.mjs 2>/dev/null || true`,
        // extract
        `rm -rf /tmp/png-update`,
        `mkdir -p /tmp/png-update`,
        `tar xzf /home/admin/${pkg} -C /tmp/png-update`,
        // stop
        `pm2 stop png-compressor 2>/dev/null || true`,
        // replace
        `rm -rf /home/admin/png-compressor/.next /home/admin/png-compressor/public`,
        `mv /tmp/png-update/.next /home/admin/png-compressor/`,
        `mv /tmp/png-update/public /home/admin/png-compressor/`,
        `[ -f /tmp/png-update/package.json ] && cp /tmp/png-update/package.json /home/admin/png-compressor/`,
        `[ -f /tmp/png-update/package-lock.json ] && cp /tmp/png-update/package-lock.json /home/admin/png-compressor/`,
        `[ -f /tmp/png-update/next.config.mjs ] && cp /tmp/png-update/next.config.mjs /home/admin/png-compressor/`,
        `[ -f /tmp/png-update/deploy/server-update.sh ] && mkdir -p /home/admin/png-compressor/deploy && cp /tmp/png-update/deploy/server-update.sh /home/admin/png-compressor/deploy/`,
        `rm -rf /tmp/png-update`,
        // install
        `cd /home/admin/png-compressor && npm install --omit=dev --registry=https://registry.npmmirror.com`,
        // start
        `cd /home/admin/png-compressor && export NODE_ENV=production && pm2 restart png-compressor 2>/dev/null || pm2 start npx --name png-compressor -- next start -p 3000`,
        `pm2 save`,
        `sleep 3`,
        `curl -s -o /dev/null -w "HTTP: %{http_code}" http://localhost:3000`,
      ].join(' && ');
      console.log('>>> 部署中...');
      conn.exec(`cd /home/admin && ${cmd}`,
        (err, stream) => {
          if (err) throw err;
          stream.on('data', (data) => { process.stdout.write(data.toString()); });
          stream.stderr.on('data', (data) => { process.stderr.write(data.toString()); });
          stream.on('close', (code, signal) => {
            console.log(`\n>>> 完成 (exit ${code})`);
            conn.end();
            process.exit(code || 0);
          });
        }
      );
    });

    // Show progress
    let uploaded = 0;
    const total = fs.statSync(localFile).size;
    readStream.on('data', (chunk) => {
      uploaded += chunk.length;
      const pct = ((uploaded / total) * 100).toFixed(1);
      process.stdout.write(`\r  上传中... ${pct}% (${(uploaded/1024/1024).toFixed(1)}MB/${(total/1024/1024).toFixed(1)}MB)`);
    });

    readStream.pipe(writeStream);
  });
});

conn.on('error', (err) => {
  console.error('❌ 连接失败:', err.message);
  process.exit(1);
});

conn.connect(SERVER);
