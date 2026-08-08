# Product Hunt 上线 — 补充材料

---

## 🎨 5张海报文案（1270×760）

> 用 `scripts/html-to-png.js` 或 Canva 生成，截图贴在产品页

| # | 标题 | 副标题 | 画面 |
|---|------|--------|------|
| 1 | **100% Local Processing** | Your images never leave your browser. Zero upload. | DropZone + 锁图标 + "Files processed on your device" |
| 2 | **AVIF, WebP, JPEG & More** | 7 formats in, 5 out. Latest codecs supported. | 格式图标阵列 + 转换箭头 |
| 3 | **Batch 30 Free · 500 Pro** | Compress dozens of images in one drag-and-drop. | 满屏缩略图 + 进度条 |
| 4 | **$24.99 Lifetime** | No subscription. Buy once, own forever. | Pro 页面截图 + 价格大字体 |
| 5 | **Before vs After** | Same quality, 70-90% smaller. See the difference. | 对比滑块（slider comparison） |

---

## 🎬 GIF 演示

**内容**: 拖入 5 张照片 → 自动压缩 → 下载 → 全程 Network 面板显示零上传

**生成方法**:
```bash
# 1. 先截图关键帧到 test-results/gif-frames/
# 2. 运行 GIF 生成
node scripts/make-gif.mjs
```

---

## 🐦 Twitter PH 预告（发布前一天发）

> 🚀 We're launching on @ProductHunt tomorrow!

After 2 months of building, 18 tools, and 4,000+ compressions processed:

CompressFast is going live on PH.

- 100% browser-based (zero upload)
- 7 input formats, AVIF output
- $24.99 lifetime (no subscription)

See you there 👋
#buildinpublic #ProductHunt

---

## 👤 Maker 简介

**Name**: WM Lim
**Role**: Solo Founder & Developer
**Location**: China
**Product**: CompressFast — Privacy-first image compression
**Why I built this**: Tired of uploading client files to cloud tools. Your images shouldn't leave your device to be compressed.

---

## 📋 发布前检查清单

- [ ] 生成 5 张海报截图
- [ ] 生成缩略图 (640×320)
- [ ] 生成 GIF 演示
- [ ] 在 PH 创建产品草稿
- [ ] 确认发布时间（周三 PST 00:01 = 北京 15:01）
- [ ] 准备 Reddit r/webdev 帖子
- [ ] 准备 Hacker News Show HN 帖子
- [ ] 发 Twitter 预告（提前 24h）
- [ ] 准备 Maker 简介
- [ ] 首条评论已就绪 ✅

---

## 📢 发布日操作流程

```
PST 00:01 (北京 15:01)
├─ 1. 发布 PH 帖子
├─ 2. 粘贴 First Comment
├─ 3. Twitter 发推 @ProductHunt
├─ 4. Reddit r/webdev + r/SideProject 发帖
├─ 5. HN Show HN 发帖
├─ 6. Indie Hackers 更新
│
├─ 前 2 小时 — 回复每一条 PH 评论（投票权重最高时段）
├─ 前 4 小时 — 持续回复评论
└─ 24 小时后 — 看排名，发总结推
```
