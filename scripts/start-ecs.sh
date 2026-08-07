#!/bin/bash
# 极速压图 — ECS 安全启动脚本
# 每次启动前强制释放端口 3000，避免僵尸进程占用
set -e

APP_DIR="/home/admin/png-compressor"
PORT=3000

echo "[start.sh] $(date) — 开始启动"

# 1. 强制释放端口
echo "[start.sh] 检查端口 $PORT..."
PID=$(lsof -ti:$PORT 2>/dev/null || true)
if [ -n "$PID" ]; then
  echo "[start.sh] 端口被占用 (PID: $PID)，强制释放..."
  kill -9 $PID 2>/dev/null || true
  sleep 2
  # 二次确认
  PID2=$(lsof -ti:$PORT 2>/dev/null || true)
  if [ -n "$PID2" ]; then
    echo "[start.sh] 释放失败，尝试 fuser..."
    fuser -k ${PORT}/tcp 2>/dev/null || true
    sleep 2
  fi
  echo "[start.sh] 端口已释放"
else
  echo "[start.sh] 端口空闲"
fi

# 2. 加载 nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# 3. 安装依赖（如有更新）
cd "$APP_DIR"
npm install --omit=dev --registry=https://registry.npmmirror.com 2>&1 | tail -1

# 4. 启动服务
echo "[start.sh] 启动 Next.js..."
export NODE_ENV=production
nohup npx next start -p $PORT > /home/admin/png-compressor.log 2>&1 &
NEXT_PID=$!
echo "[start.sh] Next.js PID: $NEXT_PID"

# 5. 等待启动
sleep 4

# 6. 健康检查
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/zh 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "[start.sh] ✅ 启动成功 (HTTP $HTTP_CODE)"
  exit 0
else
  echo "[start.sh] ❌ 启动失败 (HTTP $HTTP_CODE)"
  exit 1
fi
