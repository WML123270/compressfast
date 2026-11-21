# 极速压图 - 开发笔记

## 快速启动
```bash
cd C:/Users/Administrator/png-compressor
npm run dev
```

## 工具导航站提交

### 自动化脚本
```bash
# RustPoint 注册（等待验证码模式）
node scripts/register-wait.js
# 然后在另一个终端：echo "验证码" > test-results/code.txt

# 导航站自动提交（Playwright）
node scripts/submit.js [rustpoint|nav3|toolin|v2ex|all]
```

### 提交材料
- `docs/submission-guide.md` — 12站完整提交指南 + 文案
- `docs/v2ex-post.md` — V2EX 分享创造帖子草稿
- `docs/autofill-console.js` — 浏览器 Console 粘贴即自动填表
- `docs/submit.sh` — 打开提交页面并显示填写内容

### 提交结果
| 站点 | 状态 | URL |
|------|------|-----|
| nav3.cn | ✅ 已提交 | https://nav3.cn |
| RustPoint | ⚠️ 待设密码 | https://rustpoint.com/nav/submit |
| Toolin.ai | ⚠️ 飞书表单 | https://toolin.ai |
| V2EX | ❌ 需登录 | https://v2ex.com/go/create |

## 项目架构
```
app/          — Next.js 页面（page.tsx, layout.tsx, vs-tinypng/）
components/   — React 组件（compressor/, layout/, seo/, ui/）
lib/          — 工具库（compression/, store/, utils.ts）
scripts/      — 自动化脚本
docs/         — 提交指南和文案
public/       — 静态资源（sw.js, manifest.json, robots.txt 等）
```

## 注意事项
- RustPoint 账号：756971388@qq.com（验证码模式注册，下次继续）
- Playwright headless 需加 `--no-proxy-server` 和反 webdriver 检测
- nav3.cn 提交 API：`POST https://api.nav3.cn/api/save`
- **本地 `npm run build` 前先 `rm -rf .next`**：增量构建可能让 webpack runtime 里的 Worker chunk 哈希与磁盘文件不一致（runtime 指向旧 `7085.<hash>.js`），表现为所有压缩一直卡在「压缩中」。部署请直接用 `deploy/package.sh`（内部已清理）。
- **GIF 不能走 canvas 重编码**：canvas 只能编码 PNG/JPEG/WebP，会退化成首帧静态图。动画 GIF 压缩用 `gifsicle-wasm-browser`（主线程，结果透传 Worker），GIF→WebP 用 `@btheegg-kimth/gif2webp`（Worker 内 wasm，保留动画）。
