#!/bin/bash
# 极速压图 — 阿里云 ECS 一键初始化脚本
# 适用: Ubuntu 22.04 LTS
# 用法: chmod +x ecs-setup.sh && sudo ./ecs-setup.sh

set -e
echo "========================================="
echo "  极速压图 ECS 环境初始化"
echo "  目标: jisuyatu.com (备案通过后)"
echo "========================================="

# ─── 0. 基础信息 ─────────────────────────────
APP_DIR="/home/admin/png-compressor"
DOMAIN="jisuyatu.com"
NODE_VERSION="20"

# ─── 1. 系统更新 & 基础软件 ──────────────────
echo ">>> [1/7] 系统更新..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git build-essential nginx certbot python3-certbot-nginx ufw

# ─── 2. 安装 Node.js (via NodeSource) ─────────
echo ">>> [2/7] 安装 Node.js ${NODE_VERSION}..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js $(node -v) / npm $(npm -v)"

# ─── 3. 配置 npm 国内镜像 ────────────────────
echo ">>> [3/7] 配置 npm 淘宝镜像..."
npm config set registry https://registry.npmmirror.com

# ─── 4. 安装 PM2 ─────────────────────────────
echo ">>> [4/7] 安装 PM2..."
npm install -g pm2

# ─── 5. 创建应用目录 & 用户 ──────────────────
echo ">>> [5/7] 创建应用目录..."
if ! id -u admin &>/dev/null; then
  useradd -m -s /bin/bash admin
fi
mkdir -p "$APP_DIR"
chown -R admin:admin "$APP_DIR"

# ─── 6. 配置 Nginx ───────────────────────────
echo ">>> [6/7] 配置 Nginx..."
cp /home/admin/png-compressor/deploy/nginx.conf /etc/nginx/sites-available/png-compressor
ln -sf /etc/nginx/sites-available/png-compressor /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# ─── 7. 防火墙 ───────────────────────────────
echo ">>> [7/7] 配置防火墙..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ─── 8. 配置 PM2 开机自启 ────────────────────
echo ">>> 配置 PM2 开机自启..."
pm2 startup systemd -u admin --hp /home/admin
pm2 save

# ─── 完成 ────────────────────────────────────
echo ""
echo "========================================="
echo "  基础环境初始化完成！"
echo ""
echo "  下一步:"
echo "  1. 上传代码: scp -r png-compressor/ admin@8.138.212.213:/home/admin/"
echo "  2. 设置环境变量: cp deploy/.env.production .env.local"
echo "  3. 运行部署: cd $APP_DIR && bash deploy/deploy.sh"
echo "  4. 获取 SSL: sudo certbot --nginx -d jisuyatu.com -d www.jisuyatu.com"
echo "  5. 启用 443 段: 编辑 nginx.conf 去掉注释"
echo "========================================="
