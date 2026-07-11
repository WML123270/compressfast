#!/bin/bash
# 极速压图 — 快速部署/更新脚本
# 用法: cd /home/admin/png-compressor && bash deploy/deploy.sh
set -e

echo ">>> 极速压图部署..."

# ─── 配置 ──────────────────────────────
APP_DIR="/home/admin/png-compressor"
PORT=3000

cd "$APP_DIR"

# ─── 加载 NVM (如有) ────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# ─── 安装依赖 ───────────────────────────
echo ">>> 安装依赖..."
npm install --registry=https://registry.npmmirror.com

# ─── 检查 .env.local ─────────────────────
if [ ! -f .env.local ]; then
  echo "⚠️ 未找到 .env.local，请从 deploy/.env.production 复制并填写"
  echo "  cp deploy/.env.production .env.local && nano .env.local"
  exit 1
fi

# ─── 构建项目 ───────────────────────────
echo ">>> 构建中..."
npm run build

# ─── 启动/重启 ──────────────────────────
# 构建完成后清理 dev 依赖，减小 node_modules 体积
npm prune --production

echo ">>> 启动应用..."
export NODE_ENV=production

if pm2 list | grep -q png-compressor; then
  pm2 restart png-compressor
else
  pm2 start node_modules/.bin/next --name png-compressor -- start -p $PORT
fi

pm2 save

# ─── 健康检查 ───────────────────────────
echo ">>> 等待服务启动..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" || echo "000")

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
  echo "✅ 服务正常 (HTTP $HTTP_CODE)"
else
  echo "⚠️ 服务返回 HTTP $HTTP_CODE，检查日志:"
  pm2 logs png-compressor --lines 20 --nostream
fi

pm2 status

echo ""
echo ">>> PM2 常用命令:"
echo "  pm2 status          查看状态"
echo "  pm2 logs png-compressor  查看日志"
echo "  pm2 restart png-compressor  重启"
echo "  pm2 monit           实时监控"
echo ""
echo ">>> 部署完成！"
echo "  国内: http://$DOMAIN (备案通过后)"
echo "  服务器: http://localhost:$PORT"
