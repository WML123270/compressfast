#!/bin/bash
# ================================================================
# 极速压图 — 服务器初始化 (首次部署时执行一次)
# 用法: ssh root@8.138.212.213 'bash -s' < deploy/server-init.sh
# ================================================================
set -e

echo "========================================"
echo "  极速压图 — 服务器初始化"
echo "========================================"

# ─── 1. 创建 Swap (2GB) ──────────────
echo ""
echo ">>> [1/4] 检查 Swap..."

if swapon --show 2>/dev/null | grep -q .; then
  echo "✅ Swap 已存在:"
  swapon --show
else
  echo ">>> 创建 2GB Swap 文件..."
  fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "✅ Swap 创建完成 (2GB)"
fi

# ─── 2. 创建目录结构 ──────────────────
echo ""
echo ">>> [2/4] 创建目录..."

mkdir -p /home/admin/png-compressor
mkdir -p /home/admin/png-compressor/deploy
mkdir -p /home/admin/backups

echo "✅ 目录创建完成"

# ─── 3. 检查 Node.js ──────────────────
echo ""
echo ">>> [3/4] 检查 Node.js..."

if command -v node &>/dev/null; then
  echo "✅ Node.js $(node -v)"
else
  echo "❌ 请先安装 Node.js 18+"
  echo "  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -"
  echo "  apt-get install -y nodejs"
  exit 1
fi

# ─── 4. 检查 PM2 ─────────────────────
echo ""
echo ">>> [4/4] 检查 PM2..."

if command -v pm2 &>/dev/null; then
  echo "✅ PM2 $(pm2 -v)"
else
  echo ">>> 安装 PM2..."
  npm install -g pm2 --registry=https://registry.npmmirror.com
  echo "✅ PM2 安装完成"
fi

echo ""
echo "========================================"
echo "  ✅ 服务器初始化完成"
echo ""
echo "  内存:"
free -h
echo ""
echo "  Swap:"
swapon --show
echo ""
echo "  下一步: 上传部署包并执行 server-update.sh"
echo "========================================"
