#!/bin/bash
# ================================================================
# 极速压图 — 本地打包脚本
# 在开发机上执行：bash deploy/package.sh
# 生成 deploy-package.tar.gz 用于上传到服务器
# ================================================================
set -e

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$APP_DIR"

PACKAGE_NAME="deploy-package-$(date +%Y%m%d-%H%M%S).tar.gz"
TMP_DIR="$APP_DIR/deploy-tmp"

echo "========================================"
echo "  极速压图 — 本地打包部署"
echo "  时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# ─── 1. 检查环境 ──────────────────────
echo ""
echo ">>> [1/5] 检查环境..."

if [ ! -f package.json ]; then
  echo "❌ 请在项目根目录执行此脚本"
  exit 1
fi

# 检查 node_modules 是否存在
if [ ! -d node_modules ]; then
  echo ">>> 安装依赖..."
  npm install --registry=https://registry.npmmirror.com
fi

# ─── 2. 构建项目 ──────────────────────
echo ""
echo ">>> [2/5] 构建项目 (next build)..."

# 清理旧的构建缓存
rm -rf .next

npm run build

if [ ! -d .next ]; then
  echo "❌ 构建失败：.next 目录不存在"
  exit 1
fi

echo "✅ 构建完成"

# ─── 3. 打包 ──────────────────────────
echo ""
echo ">>> [3/4] 打包部署文件..."

# 清理临时目录
rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

# 复制运行时需要的文件（不包含 node_modules — 跨平台不兼容）
echo ">>> 复制 .next..."
cp -r .next "$TMP_DIR/"

echo ">>> 复制 public..."
cp -r public "$TMP_DIR/"

echo ">>> 复制配置文件..."
cp package.json "$TMP_DIR/"
cp package-lock.json "$TMP_DIR/"
cp next.config.mjs "$TMP_DIR/"

# 复制服务器更新脚本
mkdir -p "$TMP_DIR/deploy"
cp deploy/server-update.sh "$TMP_DIR/deploy/"

# 打包
cd "$TMP_DIR"
tar czf "$APP_DIR/$PACKAGE_NAME" .

# 清理临时目录
cd "$APP_DIR"
rm -rf "$TMP_DIR"

PACKAGE_SIZE=$(du -h "$PACKAGE_NAME" | cut -f1)
echo "✅ 打包完成: $PACKAGE_NAME ($PACKAGE_SIZE)"

# ─── 完成 ────────────────────────────
echo ""
echo "========================================"
echo "  ✅ 打包完成！"
echo ""
echo "  文件: $PACKAGE_NAME"
echo "  大小: $PACKAGE_SIZE"
echo ""
echo "  上传到服务器："
echo "    scp $PACKAGE_NAME root@8.138.212.213:/home/admin/"
echo ""
echo "  服务器上执行："
echo "    ssh root@8.138.212.213"
echo "    cd /home/admin"
echo "    bash deploy/server-update.sh $PACKAGE_NAME"
echo ""
echo "  或者一行命令："
echo "    scp $PACKAGE_NAME root@8.138.212.213:/home/admin/ && ssh root@8.138.212.213 'cd /home/admin && bash deploy/server-update.sh $PACKAGE_NAME'"
echo "========================================"
