# 我花两个月做了一个纯本地图片压缩工具，不上传不收费，顺便赚了点钱

## 先说结论

**[极速压图 / CompressFast](https://compressfast.site)** — 浏览器本地压缩图片，文件不上传服务器。免费版 30 张/次，Pro $24.99 买断。

技术栈：Next.js 14 + React 18 + TailwindCSS + Zustand + Web Worker + WASM

## 为什么又做一个压缩工具？

市面上压缩工具有两类：

**云端的（TinyPNG、iLoveIMG）** — 文件要上传，隐私没保障，量大还要付费订阅。

**本地的（Squoosh）** — Google 出品，功能强，但不支持批量处理，一次只能压一张。

我就想要一个：**批量 + 本地 + 免费够用**。没找到，自己写。

## 架构设计

整个工具的核心是一条 **Web Worker 管线**：

```
用户拖入 30 张图
    │
    ▼
主线程读取文件 ArrayBuffer
    │
    ▼ postMessage
Worker 线程:
    1. createImageBitmap 解码（浏览器原生，什么格式都支持）
    2. 尺寸调整（等比缩放，不放大小图）
    3. 旋转/翻转/水印（Canvas transform matrix）
    4. 压缩（Canvas API 编码，或 WASM 编码器）
    5. 回注 EXIF（可选，JPEG only）
    │
    ▼ postMessage
主线程：
    创建 Blob → 触发下载
```

全程没有网络请求。打开 DevTools 的 Network 面板，压缩过程中干干净净。

## 几个踩坑

### 1. HEIC 解码 — Worker 里不能用 window

iPhone 照片是 HEIC 格式。解码库 `heic2any` 依赖 `window` 对象，在 Worker 里直接崩。解决方案：主线程解码 → 传 PNG buffer 给 Worker。

这个问题花了我两小时排查，最后 5 行代码解决。经典的 Worker 教训。

### 2. AVIF 编码 — Canvas API 不支持

`canvas.convertToBlob({ type: 'image/avif' })` 不存在。得用 `@jsquash/avif`，一个从 C 编译到 WASM 的 libavif 编码器。

代价是编码速度：JPEG 10ms，AVIF 200-500ms。但压缩率是真的猛——同样画质下比 JPEG 小 50%。

我把 AVIF 做成了 Pro 功能，因为它确实值这个钱。

### 3. 目标 KB 模式 — 本质是搜索问题

用户说"我要这张图压到 200KB"，你得在画质和缩放之间找到一个组合使得输出接近目标大小。

```
解法：对每个 speed 档位预定义 try-list
快速模式：[70, 20] 两档画质，不缩放
均衡模式：[90, 60, 30, 10] 四档画质，1x + 0.5x 缩放
最佳模式：[95, 90, 80, 70, 50, 30, 15, 5] 八档画质，四档缩放

遍历所有组合，取最接近目标的那个。
误差 10% 以内就停止 -> 返回结果
```

### 4. iOS Safari 的 OffscreenCanvas 限制

iOS 15 以下不支持 OffscreenCanvas。好在这个版本的占有率已经很低了，就直接 feature-detect 降级。

## 盈利模式

不靠广告、不卖数据、不做订阅。

```
Pro $24.99 一次性买断
├── 激活码模式（不注册不登录）
├── 最多 5 台设备
├── 存储：Upstash Redis（免费层够用）
└── 收款：Creem（支持银联/Visa/MC）
```

成本：$0/月（Vercel 免费层 + Upstash 免费层）
利润：第一单就回本

## 做了哪些推广

| 渠道 | 状态 |
|------|:--:|
| Product Hunt | ✅ |
| Hacker News (Show HN) | ✅ |
| Reddit r/webdev | ✅ |
| Dev.to 技术文章 × 3 | ✅ |
| IndieHackers | ✅ |
| nav3.cn / 新趣集 / Toolin.ai 等 7 导航站 | ✅ |
| 掘金 | ✅ 本文 |

## 两个月的感悟

**好的隐私工具本身就是营销。** "不上传"三个字是用户分享的第一理由。人们关心隐私，只是大部分产品不给这个选项。

**WASM 让浏览器几乎能做任何事。** AVIF 编码、PNG 无损压缩、HEIC 解码——这些以前只能靠服务端做的事，现在都可以在浏览器完成。

**买断制比订阅更难卖，但更健康。** 用户抵触订阅，但愿意为"一次付费永久使用"买单。你的定价只要覆盖获取成本就行。

---

**试用：** [compressfast.site](https://compressfast.site)（海外） / jisuyatu.com（国内，备案中）

**代码：** 核心逻辑在文中已展示，感兴趣可以评论区交流。

---

*标签：前端 架构 Next.js 图片压缩 独立开发*
