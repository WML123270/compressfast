# AI 抠图（本地去背景）落地技术方案

> 目标：给 Pro 加一个「本地 AI 抠图」功能，让 ¥9.9 真正有东西可卖。
> 核心理念：图片 100% 在浏览器本地推理，不上传服务器 —— 与极速压图「纯本地处理」的定位和合规论据完全一致，也是佐糖（上传服务器）做不到的差异化。

---

## 一、为什么做这个（一句话）

压缩是免费品（Squoosh/docsmall 已把价格打到 ¥0），抠图是刚需且佐糖靠它收 38元/月。你做「本地 AI 抠图」，等于把佐糖的核心付费功能，用「隐私本地」的方式免费包装成自己的 Pro 卖点。

---

## 二、技术选型

### 推理引擎
**onnxruntime-web**（WebGPU 优先，WASM 兜底）。`next.config.mjs` 已开 `asyncWebAssembly: true`，无需改。

### 模型选型（⚠️ 许可证是硬约束）

| 模型 | 大小 | 质量 | 许可证 | 可否商用 |
|---|---|---|---|---|
| RMBG-1.4 (BRIA) | 42MB | 最高（发丝级）| **CC-BY-NC-4.0** | ❌ 非商用 |
| RMBG-2.0 (BRIA) | 234-490MB | 最高 | **CC-BY-NC-4.0** | ❌ 非商用 |
| **isnet-general-use** | ~44MB | 高 | MIT/CC | ✅ |
| **modnet** | 25MB | 中高（人像）| Apache-2.0 | ✅ |
| **u2net / u2netp** | 4.5-178MB | 中 | Apache-2.0 | ✅ |

**决策：MVP 用 `isnet-general-use`（MIT，可商用，质量高）。** 若追求极致发丝效果，再单独跟 BRIA 谈商用授权（RMBG-1.4），不要默认拿来商用。

### 现成库（优先，避免重复造轮子）
- `@bunnio/rembg-web`：后端 WebNN > WebGPU > WebGL > CPU，支持 u2net/u2netp/modnet/isnet，模型缓存 IndexedDB。
- `@pixir/background-remover`：RMBG-1.4 封装（注意模型是非商用许可）。
- 备选：自己用 `onnxruntime-web` + 下载 ONNX，最可控但代码量最大。

**决策：优先 `@bunnio/rembg-web`（可商用模型 + 多后端兜底 + 已处理缓存），实现时先 grep 它有没有顶层 `window` 引用（见 bug 教训 #1）。**

---

## 三、架构设计

### 独立 Worker，不污染压缩 Worker
```
lib/compression/worker.ts      ← 现有压缩 Worker（保持不动）
lib/ai/remove-bg-worker.ts     ← 新增抠图 Worker（独立加载 42MB 模型）
lib/ai/remove-bg.ts            ← 主线程封装（postMessage + Promise 化）
```

**理由**：压缩 Worker 是轻量的，抠图 Worker 要加载 onnxruntime-web + 42MB 模型。混在一起会让每个压缩任务都背上模型加载成本。独立 Worker 只在用户点「抠图」时才懒加载。

### 消息协议（对齐现有 WMsg/WRes 风格）
```ts
// 主线程 → Worker
interface AiRemoveBgMsg {
  id: string
  imageBuffer: ArrayBuffer   // 原图
  imageType: string          // image/png / image/jpeg ...
}

// Worker → 主线程
interface AiRemoveBgRes {
  id: string
  type: 'done' | 'error'
  resultBuffer?: ArrayBuffer  // 透明背景 PNG
  error?: string
}
```

### 模型托管与缓存
1. 模型文件放 `public/models/`（ONNX + wasm 运行时），随部署包发到 ECS / Vercel，同源加载，**避开跨域和 COEP 问题**。
2. 首次下载后用 IndexedDB 缓存（带版本号 key），二次打开秒加载。
3. `requestIdleCallback` 预加载，2G 网络跳过。

### 大文件下载（已 gitignore，需手动准备）
```bash
# isnet 量化模型（44MB）→ public/models/isnet-general-use.onnx
curl -sL -o public/models/isnet-general-use.onnx \
  "https://hf-mirror.com/Ko033/isnet-general-use-onnx/resolve/main/onnx/model_quantized.onnx"

# onnxruntime-web WASM 运行时（npm install onnxruntime-web 后）
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm public/ort/
cp node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs public/ort/
cp node_modules/onnxruntime-web/dist/ort.min.mjs public/ort/
```
> `.onnx` / `.wasm` 已加 .gitignore，不随 git 分发；但 `package.sh` 会整体复制 `public/`，所以部署包仍会带上它们。

---

## 四、Pro 门控与收费（复用 AVIF 现有模式）

`components/compressor/FormatSelector.tsx` 里 AVIF 的锁法就是模板：

```tsx
const { isPro } = useCompressionStore()
const bgLocked = !isPro
// bgLocked 时：显示 Lock 图标 + 「Pro 专属」 + 升级弹窗跳 Pro 页
```

新增一个「AI 抠图」入口（建议放在图片操作区，跟「尺寸调整 / 水印」并列），非 Pro 用户点击 → 走 AVIF 那套升级引导。收费不动：国内 ¥9.9 / 海外 $24.99，激活码复用。

---

## 五、关键工程坑（按严重程度）

### 🚨 1. 不要加 COOP/COEP（最大坑）
- WASM **多线程**需要 `SharedArrayBuffer` → 需要 `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp`。
- **你以前加过，把 Vercel 生产 Worker 搞崩了**（bug 教训 #4）。COEP `require-corp` 会阻断百度统计 / Vercel Analytics 等跨域第三方脚本。
- **方案**：默认走 **WebGPU（不需要 COOP/COEP）**；无 WebGPU 设备降级 **单线程 WASM（也不需要 COOP/COEP，只是慢几倍）**。全程不碰跨源隔离头。
- 如果以后非要 WASM 多线程提速，再单独、小心地试 COOP/COEP，且必须双站（ECS + Vercel）都实测。

### ⚠️ 2. 模型许可证
RMBG 系列非商用。MVP 用 isnet/u2net/modnet（Apache/MIT）。上线前确认所选模型的 license 文件。

### ⚠️ 3. 首次加载 42MB
需进度条 + IndexedDB 缓存 + 预加载，否则用户第一次点抠图要等几十秒会以为卡死。

### ⚠️ 4. 移动端性能
手机浏览器多数无 WebGPU → 单线程 WASM → 一张图可能 10-30 秒。移动端要：
- 缩小输入分辨率（抠图前先 scale 到 ≤1024px）
- 明确「处理中」进度反馈
- 大图分块（tiling）处理

### ⚠️ 5. Worker 里禁止 browser-only API
`@bunnio/rembg-web` 等库若顶层引用 `window/document`，Worker 会崩（bug 教训 #1）。实现时先 grep，必要时主线程 import + 动态 `await import()`。

---

## 六、部署影响

- **国内 ECS（890MB）**：模型是静态文件，服务器只负责「把 ONNX 文件发给浏览器」，**推理在浏览器跑，不占服务器算力**。890MB 完全够，唯一影响是部署包会多 ~45MB（模型 + 运行时），`package.sh` 打包体积变大但可接受。
- **海外 Vercel**：模型放 `public/`，Vercel 静态托管即可，无额外成本。
- 无需新增任何服务器 API 或后端改动。

---

## 七、分阶段落地

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| **P0 MVP** | 独立抠图 Worker + isnet 模型 + 一个「AI 抠图」按钮（仅 Pro）| 拖图 → 抠图 → 下载透明 PNG，WebGPU 下 <5s |
| **P1 增强** | 发丝级细化、边缘羽化、背景替换（纯色/图片背景）| 佐糖同等观感 |
| **P2 扩展** | 批量抠图、超分辨率（realesr-general-x4v3 4.9MB）| 形成「AI 工具箱」 |

---

## 八、成本与收益预估

- **开发成本**：MVP 约 1-2 天（库是现成的，主要是 Worker 集成 + 门控 + 缓存 + 移动端降级）。
- **运行成本**：≈0（模型静态托管，推理在浏览器）。
- **收益**：给 Pro 一个真实付费理由。若抠图转化率按佐糖口径（压缩免费导流、抠图付费），哪怕当前 40 PV/天也能测出「有没有人愿意为 AI 功能付费」这个关键信号。

---

## 九、决策点（已确认 2026-11-06）

1. **模型选型**：✅ isnet-general-use（MIT 可商用），先不做 RMBG
2. **入口位置**：✅ 独立工具页 `/tools/remove-bg`（利于 SEO 获客）
3. **背景替换**：✅ MVP 先不做，P1 再加

→ 已具备开工条件，P0 MVP 可直接开始。
