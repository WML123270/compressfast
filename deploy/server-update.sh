#!/bin/bash
# ================================================================
# 极速压图 — 服务器端更新脚本
# 用法: bash deploy/server-update.sh deploy-package-20260714.tar.gz
#
# 特点:
#   - 不构建 (内存安全)
#   - 不 npm install (预装好)
#   - 自动备份 + 失败回滚
#   - PM2 零停机 reload
# ================================================================
set -e

APP_DIR="/home/admin/png-compressor"
PORT=3000
BACKUP_DIR="/home/admin/backups"

# ─── 参数检查 ────────────────────────
PACKAGE_FILE="${1:-}"
if [ -z "$PACKAGE_FILE" ]; then
  # 尝试找最新的 deploy-package
  PACKAGE_FILE=$(ls -t /home/admin/deploy-package-*.tar.gz 2>/dev/null | head -1)
  if [ -z "$PACKAGE_FILE" ]; then
    echo "❌ 未找到部署包。请指定: bash deploy/server-update.sh <package.tar.gz>"
    echo "   或者把 deploy-package-*.tar.gz 放到 /home/admin/"
    exit 1
  fi
  echo ">>> 自动选择最新包: $PACKAGE_FILE"
fi

if [ ! -f "$PACKAGE_FILE" ]; then
  echo "❌ 文件不存在: $PACKAGE_FILE"
  exit 1
fi

PACKAGE_NAME=$(basename "$PACKAGE_FILE")
echo "========================================"
echo "  极速压图 — 服务器更新"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "  包:   $PACKAGE_NAME"
echo "========================================"

# ─── 加载 NVM ────────────────────────
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# ─── 1. 备份当前版本 ──────────────────
echo ""
echo ">>> [1/5] 备份当前版本..."

mkdir -p "$BACKUP_DIR"
BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S).tar.gz"

if [ -d "$APP_DIR/.next" ]; then
  cd "$APP_DIR"
  tar czf "$BACKUP_DIR/$BACKUP_NAME" .next public package.json package-lock.json next.config.mjs 2>/dev/null || true
  echo "✅ 已备份到: $BACKUP_DIR/$BACKUP_NAME"
else
  echo ">>> 首次部署，跳过备份"
fi

# 只保留最近 3 个备份
cd "$BACKUP_DIR"
ls -t backup-*.tar.gz 2>/dev/null | tail -n +4 | xargs rm -f 2>/dev/null || true
cd "$APP_DIR"

# ─── 2. 解压新包 ─────────────────────
echo ""
echo ">>> [2/5] 解压部署包..."

TMP_EXTRACT="/tmp/png-compressor-update-$$"
rm -rf "$TMP_EXTRACT"
mkdir -p "$TMP_EXTRACT"

tar xzf "$PACKAGE_FILE" -C "$TMP_EXTRACT"

if [ ! -d "$TMP_EXTRACT/.next" ]; then
  echo "❌ 部署包格式错误：缺少 .next 目录"
  rm -rf "$TMP_EXTRACT"
  exit 1
fi

echo "✅ 解压完成"

# ─── 3. 替换文件 ─────────────────────
echo ""
echo ">>> [3/6] 更新文件..."

# 停掉所有相关服务（包括旧名称 compressfast）再替换（避免文件锁定和端口冲突）
pm2 stop png-compressor 2>/dev/null || true
pm2 stop compressfast 2>/dev/null || true
# 确保端口释放
fuser -k 3000/tcp 2>/dev/null || true
sleep 1

# 删除旧文件
rm -rf "$APP_DIR/.next" "$APP_DIR/public"

# 移动新文件
mv "$TMP_EXTRACT/.next" "$APP_DIR/"
mv "$TMP_EXTRACT/public" "$APP_DIR/"

# 更新配置文件
[ -f "$TMP_EXTRACT/package.json" ] && cp "$TMP_EXTRACT/package.json" "$APP_DIR/"
[ -f "$TMP_EXTRACT/package-lock.json" ] && cp "$TMP_EXTRACT/package-lock.json" "$APP_DIR/"
[ -f "$TMP_EXTRACT/next.config.mjs" ] && cp "$TMP_EXTRACT/next.config.mjs" "$APP_DIR/"

# 更新部署脚本本身
[ -f "$TMP_EXTRACT/deploy/server-update.sh" ] && cp "$TMP_EXTRACT/deploy/server-update.sh" "$APP_DIR/deploy/"

rm -rf "$TMP_EXTRACT"

# ─── 4. 安装生产依赖 ──────────────────
echo ""
echo ">>> [4/6] 安装生产依赖 (服务端)..."

cd "$APP_DIR"

# 只安装生产依赖（134个包，有swap内存安全）
npm install --omit=dev --registry=https://registry.npmmirror.com

echo "✅ 依赖安装完成"

# ─── 5. 启动服务 ─────────────────────
echo ""
echo ">>> [5/6] 启动服务..."

cd "$APP_DIR"

export NODE_ENV=production

# 清理旧进程名，避免端口冲突
pm2 delete compressfast 2>/dev/null || true

if pm2 list 2>/dev/null | grep -q png-compressor; then
  pm2 start png-compressor 2>/dev/null || pm2 restart png-compressor
else
  pm2 start npx --name png-compressor -- next start -p $PORT
fi

pm2 save

echo "✅ 服务已启动"

# ─── 6. 健康检查 ─────────────────────
echo ""
echo ">>> [6/6] 健康检查..."

# 等待服务就绪（最多等 15 秒）
for i in $(seq 1 15); do
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "304" ]; then
    echo "✅ 服务正常 (HTTP $HTTP_CODE) — 耗时 ${i}s"
    break
  fi
  sleep 1
done

if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "304" ]; then
  echo "⚠️ 健康检查超时 (HTTP $HTTP_CODE)"

  # ─── 自动回滚 ─────────────────────
  if [ -f "$BACKUP_DIR/$BACKUP_NAME" ]; then
    echo ""
    echo ">>> 自动回滚到上一版本..."
    pm2 stop png-compressor

    cd "$APP_DIR"
    rm -rf .next public
    tar xzf "$BACKUP_DIR/$BACKUP_NAME"
    npm install --omit=dev --registry=https://registry.npmmirror.com

    pm2 start png-compressor 2>/dev/null || pm2 restart png-compressor

    sleep 3
    ROLLBACK_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null || echo "000")
    if [ "$ROLLBACK_CODE" = "200" ]; then
      echo "✅ 回滚成功 (HTTP $ROLLBACK_CODE)"
    else
      echo "❌ 回滚失败！请手动检查"
      pm2 logs png-compressor --lines 30 --nostream
    fi
  fi
else
  echo ""
  echo ">>> 清理旧部署包..."
  # 删除已用过的部署包（保留备份）
  rm -f "$PACKAGE_FILE"
fi

# ─── 显示状态 ────────────────────────
echo ""
echo "========================================"
echo "  部署状态"
echo "========================================"
pm2 status
echo ""
free -h | head -2
echo ""
echo "PM2 常用命令:"
echo "  pm2 logs png-compressor   查看日志"
echo "  pm2 monit                 实时监控"
echo "  pm2 restart png-compressor 重启"
echo ""
echo "备份目录: $BACKUP_DIR/"
ls -lh "$BACKUP_DIR/" 2>/dev/null || echo "  (无备份)"
echo "========================================"
