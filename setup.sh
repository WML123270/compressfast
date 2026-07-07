#!/bin/bash
set -e
echo "=== 极速压图部署脚本 ==="

# 1. 写入 Nginx 配置
echo ">>> 配置 Nginx..."
cat > /tmp/nginx-png-compressor << 'NGX'
server {
    listen 80;
    server_name jisuyatu.com www.jisuyatu.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
NGX
sudo cp /tmp/nginx-png-compressor /etc/nginx/sites-available/png-compressor
sudo ln -sf /etc/nginx/sites-available/png-compressor /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
echo ">>> Nginx 配置完成"

# 2. 启动应用
echo ">>> 启动应用..."
cd /home/admin/png-compressor
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
pm2 delete png-compressor 2>/dev/null || true
pm2 start node_modules/.bin/next --name png-compressor -- start -p 3000
pm2 save
pm2 startup systemd -u admin --hp /home/admin 2>/dev/null || true
echo ">>> PM2 启动完成"

# 3. 检查
echo ">>> 检查状态..."
sleep 2
pm2 status
curl -s -o /dev/null -w "HTTP状态: %{http_code}\n" http://localhost:3000 || echo "等待应用启动..."
echo "=== 部署完成 ==="
