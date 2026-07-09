# 极速压图 — 国内版部署

## 服务器信息
- **IP**: 8.138.212.213 (阿里云 ECS 广州)
- **系统**: Ubuntu 22.04
- **域名**: jisuyatu.com (ICP 备案审核中)
- **应用端口**: localhost:3000
- **进程管理**: PM2
- **反向代理**: Nginx

## 首次部署

### 1. 初始化服务器
```bash
# 上传项目到服务器
scp -r png-compressor/ admin@8.138.212.213:/home/admin/

# SSH 登录
ssh admin@8.138.212.213

# 运行初始化脚本
sudo bash /home/admin/png-compressor/deploy/ecs-setup.sh
```

### 2. 配置环境变量
```bash
cd /home/admin/png-compressor
cp deploy/.env.production .env.local
nano .env.local  # 填写实际值
```

### 3. 部署应用
```bash
bash deploy/deploy.sh
```

### 4. 获取 SSL 证书（备案通过后）
```bash
sudo certbot --nginx -d jisuyatu.com -d www.jisuyatu.com
# 编辑 nginx.conf，启用 443 段
sudo nano /etc/nginx/sites-available/png-compressor
sudo nginx -t && sudo systemctl reload nginx
```

### 5. 验证
```bash
curl -I https://jisuyatu.com
pm2 status
```

## 后续更新

### 通过 git pull 方式
```bash
ssh admin@8.138.212.213
cd /home/admin/png-compressor
git pull
bash deploy/deploy.sh
```

### 通过 scp 方式
```bash
# 本地打包（排除 node_modules）
cd png-compressor
tar czf deploy.tar.gz --exclude=node_modules --exclude=.next --exclude=.git .
scp deploy.tar.gz admin@8.138.212.213:/home/admin/png-compressor/
ssh admin@8.138.212.213 "cd /home/admin/png-compressor && tar xzf deploy.tar.gz && bash deploy/deploy.sh"
```

## 备案通过后待办
- [ ] certbot 获取 SSL 证书
- [ ] Nginx 启用 443 → HTTPS
- [ ] 网站底部添加备案号：`<a href="https://beian.miit.gov.cn/">粤ICP备XXXXXXXX号</a>`
- [ ] 公安联网备案
- [ ] 移除 FilingBanner 组件
- [ ] 百度统计代码接入
- [ ] jisuyatu.com DNS 解析恢复（指向阿里云 ECS）

## 文件索引
| 文件 | 用途 |
|------|------|
| `nginx.conf` | Nginx 站点配置（HTTP + HTTPS 模板） |
| `ecs-setup.sh` | 服务器初始化（Node.js + Nginx + PM2 + 防火墙） |
| `deploy.sh` | 应用部署（构建 + PM2 启动） |
| `.env.production` | 生产环境变量模板 |
