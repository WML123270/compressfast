#!/bin/bash
set -e
echo ">>> 更新极速压图..."

cd /home/admin
curl -o deploy.tar.gz -H "Authorization: Bearer vercel_blob_rw_nKWTI6H2mW0lW8qs_9xxuC1iCNA7UF4yUWmpyBWw5KYo6Mb" "https://nkwti6h2mw0lw8qs.private.blob.vercel-storage.com/deploy.tar.gz"

rm -rf png-compressor/.next png-compressor/public
tar xzf deploy.tar.gz -C png-compressor
cd png-compressor
npm install --production --registry=https://registry.npmmirror.com

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
pm2 restart png-compressor 2>/dev/null || pm2 start node_modules/.bin/next --name png-compressor -- start -p 3000
pm2 save

sleep 2
curl -s -o /dev/null -w "HTTP: %{http_code}\n" http://localhost:3000
echo ">>> 更新完成"
