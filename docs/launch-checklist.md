# 🚀 发布操作清单

> **前提**：开 VPN。不开的话 Product Hunt 和 V2EX 都访问不了。

---

## 一、Product Hunt 发布（约 15 分钟）

### 准备工作
- VPN 连上
- 材料都在 `docs/` 目录下：
  - 文案：`docs/product-hunt-launch.md`
  - 截图：`docs/ph-screenshots/`（01-06 共 6 张 + thumbnail）

### 步骤

1. 打开 https://www.producthunt.com/posts/create

2. **Product Name**: `CompressFast`

3. **URL**: `https://compressfast.site`

4. **Tagline**（60字符限制）:
   ```
   Compress images 100% locally — batch processing, AVIF support, one-time purchase
   ```

5. **Description**（260字符限制）:
   ```
   Batch compress images in your browser. 100% local — files never leave your device. 30 free per batch. 7 formats in, 5 out including AVIF. Resize, rotate, strip EXIF. Pro $24.99 lifetime. No subscription, no account. Just fast, private compression.
   ```

6. **Topics**（选 5 个）:
   - `Privacy`
   - `Design Tools`
   - `Developer Tools`
   - `Productivity`
   - `Web App`

7. **Gallery**：上传 5 张截图
   - `01-hero.png` — 首页
   - `02-compression-avif.png` — AVIF 压缩界面
   - `03-before-after.png` — 对比
   - `04-pro-page.png` — Pro 购买页
   - `05-dark-mode.png` — 暗色模式
   
   **缩略图**：上传 `thumbnail.png`

8. **First Comment**（发布后立即粘贴）：
   ```
   Hi Product Hunt! 👋

   I built CompressFast because I was tired of uploading client design files to 
   cloud tools just to shrink them...

   [完整文案见 docs/product-hunt-launch.md 的 First Comment 部分]
   ```

9. 点 **"Launch"** 发布！

### 发布后
- 去 Reddit r/webdev 发帖：标题 `CompressFast — 100% local image compression with AVIF support`
- 去 Hacker News 发 Show HN：标题 `Show HN: CompressFast — local batch image compression with AVIF output`
- Twitter 发推 @ProductHunt

---

## 二、V2EX 发帖（约 3 分钟）

1. 打开 https://v2ex.com/go/create（选"分享创造"节点）

2. **标题**:
   ```
   [分享创造] 极速压图 — 纯本地图片压缩，支持 AVIF 输出，文件绝不上传
   ```

3. **正文**：直接粘贴 `docs/v2ex-post.md` 的全部内容

4. 点"发布主题"

---

## 三、知乎文章（可选，约 5 分钟）

1. 打开 https://zhuanlan.zhihu.com/write

2. **标题**: `TinyPNG vs 极速压图：图片压缩工具对比评测`

3. **正文**: 粘贴 `docs/zhihu-article.md`

4. 发布后在相关图片处理问题下用简短回答引流（不要硬推，自然提及即可）

---

## 四、Reddit / Hacker News 模板

### Reddit r/webdev
**Title**: I built a 100% local batch image compressor with AVIF support — would love feedback
**Body**: 从 PH First Comment 里浓缩

### Hacker News Show HN
**Title**: Show HN: CompressFast — Local batch image compression with AVIF output
**URL**: https://compressfast.site
