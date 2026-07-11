#!/bin/bash
# 极速压图 — 国内版一键部署（本地构建 + 上传 ECS）
# 用法: bash scripts/deploy-cn.sh
set -e

ECS_HOST="admin@8.138.212.213"
ECS_APP_DIR="/home/admin/png-compressor"
SSH_KEY="$HOME/.ssh/id_ed25519_ecs"

echo "========================================="
echo "  极速压图 国内版部署"
echo "  目标: jisuyatu.com"
echo "========================================="

# ─── 1. 本地构建（CN 环境）────────────────
echo ""
echo ">>> [1/4] 本地构建（国内版环境）..."

# 临时切换为国内版配置
if [ -f .env.local ]; then
  cp .env.local .env.local.bak
fi
cp deploy/.env.production .env.local

# 构建
npm run build

# 恢复原 .env.local
if [ -f .env.local.bak ]; then
  mv .env.local.bak .env.local
fi

# ─── 2. 打包 ─────────────────────────────
echo ""
echo ">>> [2/4] 打包构建产物..."

tar czf /tmp/cn-deploy.tar.gz \
  .next \
  public \
  package.json \
  package-lock.json \
  next.config.mjs \
  deploy \
  2>/dev/null

SIZE=$(du -h /tmp/cn-deploy.tar.gz | cut -f1)
echo "  包大小: $SIZE"

# ─── 3. 上传 ─────────────────────────────
echo ""
echo ">>> [3/4] 上传到 ECS..."

scp -i "$SSH_KEY" -o ConnectTimeout=30 /tmp/cn-deploy.tar.gz "$ECS_HOST:$ECS_APP_DIR/"

# ─── 4. 远程部署 ─────────────────────────
echo ""
echo ">>> [4/4] 远程解压 + 重启..."

ssh -i "$SSH_KEY" -o ConnectTimeout=30 "$ECS_HOST" << 'ENDSSH'
cd /home/admin/png-compressor

# 杀死可能残留的构建进程
pkill -9 node 2>/dev/null || true
sleep 2

# 解压（不含 node_modules，跨平台不兼容）
tar xzf cn-deploy.tar.gz

# 确保 .env.local 为国内版配置
if [ ! -f .env.local ]; then
  cp deploy/.env.production .env.local
fi

# 清理旧 node_modules 并重装 Linux 原生依赖
rm -rf node_modules
npm install --production --registry=https://registry.npmmirror.com

# 启动/重启
export NODE_ENV=production

if pm2 list 2>/dev/null | grep -q png-compressor; then
  pm2 restart png-compressor
else
  pm2 start node_modules/.bin/next --name png-compressor -- start -p 3000
fi

pm2 save

# 健康检查
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
  echo "✅ 部署成功 (HTTP $HTTP_CODE)"
else
  echo "⚠️ 服务返回 HTTP $HTTP_CODE"
  pm2 logs png-compressor --lines 10 --nostream
fi

pm2 status
ENDSSH

echo ""
echo "========================================="
echo "  ✅ 国内版部署完成!"
echo "  https://jisuyatu.com"
echo "========================================="
