# 极速压图 — 国内版部署

## 服务器信息
- **IP**: 8.138.212.213 (阿里云轻量应用服务器 广州)
- **系统**: Ubuntu 22.04 · 内存 890MB
- **域名**: jisuyatu.com (ICP 备案已通过 ✅)
- **应用端口**: localhost:3000
- **进程管理**: PM2
- **反向代理**: Nginx

## ⚡ 快速部署（日常更新）

服务器**不构建、不 npm install**，本地预编译好直接上传。

### 第一步：本地打包
```bash
cd C:/Users/Administrator/png-compressor
bash deploy/package.sh
```
生成 `deploy-package-20260714-HHMMSS.tar.gz`

### 第二步：上传 + 更新
```bash
# 一行命令完成
scp deploy-package-*.tar.gz root@8.138.212.213:/home/admin/ && \
  ssh root@8.138.212.213 'cd /home/admin && bash deploy/server-update.sh'
```

服务器上做的事：
1. 备份当前版本 → `/home/admin/backups/`
2. 停止 PM2 → 替换文件 → 启动 PM2
3. 健康检查（15 秒内 200 即成功）
4. 失败自动回滚到备份

---

## 🔧 首次部署

### 1. 服务器初始化（仅一次）
```bash
scp deploy/server-init.sh root@8.138.212.213:/home/admin/
ssh root@8.138.212.213 'bash /home/admin/server-init.sh'
```
这会自动：创建 2GB Swap、安装 Node.js/PM2、创建目录结构

### 2. 配置环境变量
```bash
ssh root@8.138.212.213
cd /home/admin/png-compressor
cp deploy/.env.production .env.local
# 确认配置正确
cat .env.local
```

### 3. 第一次部署
```bash
# 本地打包
bash deploy/package.sh

# 上传 + 部署
scp deploy-package-*.tar.gz root@8.138.212.213:/home/admin/
ssh root@8.138.212.213 'cd /home/admin && tar xzf deploy-package-*.tar.gz -C /tmp/t && mkdir -p png-compressor && cd /tmp/t && cp -r .next public node_modules package.json next.config.mjs /home/admin/png-compressor/ && cd /home/admin/png-compressor && cp deploy/.env.production .env.local && pm2 start node_modules/.bin/next --name png-compressor -- start -p 3000 && pm2 save'
```

---

## 📦 文件索引

| 文件 | 用途 |
|------|------|
| `package.sh` | **本地打包** — 构建 + 打包 tar.gz |
| `server-update.sh` | **服务器更新** — 备份→解压→重启→健康检查+回滚 |
| `server-init.sh` | **服务器初始化** — Swap + Node.js + PM2 (仅首次) |
| `.env.production` | 生产环境变量模板 |
| `nginx-ssl.conf` | Nginx HTTPS 配置 |
| `deploy.sh` | (旧) 服务器端构建部署 — **不再使用** |

---

## 🩺 故障排查

```bash
# 查看服务状态
ssh root@8.138.212.213 'pm2 status && free -h'

# 查看日志
ssh root@8.138.212.213 'pm2 logs png-compressor --lines 50 --nostream'

# 手动回滚
ssh root@8.138.212.213
cd /home/admin
tar xzf backups/backup-20260714-*.tar.gz -C png-compressor/
pm2 restart png-compressor

# 重启 Nginx
ssh root@8.138.212.213 'nginx -t && systemctl reload nginx'
```

## ⚙️ 为什么之前部署会卡

服务器只有 890MB 内存，旧的 `deploy.sh` 在服务器上跑 `npm install` + `next build`：
- `next build` 需要 ~700MB+ 内存
- `npm install` 需要 ~300MB
- 两者加起来超过 890MB → 系统 OOM kill → 服务器假死

**新方案**：所有重活（build、npm install）都在本地完成，服务器只需解压和启动。
