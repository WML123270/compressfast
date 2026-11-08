# AI 图片放大（本地超分辨率）落地技术方案

> 目标：给 Pro 加第二个「本地 AI」功能 —— 图片无损放大 4x。
> 核心理念与 AI 抠图完全一致：图片 100% 浏览器本地推理，不上传服务器，模型自托管。是「压缩免费导流 → AI 图像处理收费」变现路径的第二块拼图。

---

## 一、为什么做这个（一句话）

模糊图、小图、老图放大是刚需（电商素材、证件照、截图放大打印）。传统插值（PS/Lanczos）放大会糊，AI 超分（Real-ESRGAN）能「脑补」细节。和抠图一样，佐糖/稿定等靠它收费，我们用「本地 + 隐私」免费/低价包装成 Pro 卖点。

---

## 二、技术选型

### 推理引擎
**onnxruntime-web**（WebGPU 优先，WASM 单线程兜底）——与抠图共用同一套 `/ort/` 运行时，零新增依赖、零新部署负担。

### 模型选型（⚠️ 许可证仍是硬约束）

| 模型 | 大小(ONNX) | 质量 | 许可证 | 商用 | 备注 |
|---|---|---|---|---|---|
| **realesr-general-x4v3** | **~5MB**（fp32）/1.25MB(w8a8) | 高（通用） | **BSD-3-Clause** | ✅ | 照片/插画/截图通用，最稳默认选 |
| realesr-animevideov3 | ~5MB | 高（动漫） | BSD-3-Clause | ✅ | 二次元/动漫专用，P1 可选 |
| realesrgan-x4plus (RRDB) | ~64MB | 更高 | BSD-3-Clause | ✅ | 更重更慢，浏览器体验差，暂不做 |
| SwinIR / HAT | 250MB+ | 顶级 | Apache-2.0 | ✅ | 太大，浏览器跑不动，不做 |
| GFPGAN / CodeFormer（人像修复） | ~90MB | 人脸修复 | ⚠️ 权重限制多（CodeFormer 非商用） | ❌/⚠️ | 先不做，许可证需单独核实 |

**决策：MVP 用 `realesr-general-x4v3`（BSD-3，可商用，~5MB，浏览器友好）。**

> ⚠️ 落地前核实所下载**具体分发版**的 LICENSE：官方 pth 是 BSD-3，但第三方转的 .onnx 可能有自己的 deployment license（见抠图方案同款坑）。优先从官方 pth 自转 ONNX，或选标注 BSD-3 的 HF 仓库（如 Heliosoph/realesrgan-onnx）。

### 输入输出规格（务必按此写预处理）
- **输入**：`[1, 3, H, W]` float32，RGB 顺序，`x/255`（**无 mean/std 减法**，和 isnet 的 `(x/255)-0.5` 不同）
- **输出**：`[1, 3, 4H, 4W]`，值域 `[0,1]`，再 `*255` 还原
- 动态 shape，任意长宽可进

---

## 三、架构设计

### 独立 Worker，不污染抠图/压缩 Worker
```
lib/ai/upscale-worker.ts     ← 新增放大 Worker（复用 /ort/ 运行时，只加载 5MB 模型）
lib/ai/upscale.ts            ← 主线程封装（postMessage + Promise 化）
lib/ai/tile.ts               ← 分块 + 重叠缝合逻辑（纯函数，可单测）
```

### 消息协议（对齐抠图 remove-bg.ts 风格）
```ts
interface UpscaleMsg { id: string; imageBuffer: ArrayBuffer; scale: 2 | 4 }
interface UpscaleRes { id: string; type: 'done' | 'error'; resultBlob?: Blob; error?: string }
```

### 分块（Tiling）—— 本功能的核心工程难点
Real-ESRGAN 内存随输入平方增长，浏览器必须分块：
1. 把输入切成**有重叠的 tile**（如 tile_size=256/512，tile_pad=32，重叠 32px 消除边界接缝）
2. 每个 tile 单独过模型 → 输出 4x tile
3. 按重叠区**加权融合缝合**（中心权重高、边缘权重低），避免拼缝线
4. 参考原版 `RealESRGANer` 的 tile_mode；重叠权重矩阵在 worker 里预生成一次缓存

### 输出尺寸上限（防内存/手机爆掉）
4x 是「像素平方 ×16」的放大：
- **输入长边 ≤ 1024px**（→ 输出 ≤ 4096px，约 16M 像素，WebGPU 可扛）
- 移动端（无 WebGPU、单线程 WASM）再降一档：**输入长边 ≤ 512px**
- 超限则先等比缩到上限再放大（提示用户）

### 放大倍数
- **4x**：模型原生输出，MVP 主推
- **2x**：对 4x 结果做高质量降采样（或 P1 引入独立 2x 模型）；MVP 可先只上 4x

### 模型托管与缓存
- 模型 `public/models/realesr-general-x4v3.onnx`（~5MB），同源加载，随部署包发 ECS/Vercel
- IndexedDB 缓存（带版本号），二次秒开
- `.onnx` 加 gitignore（同抠图）

---

## 四、Pro 门控与收费（复用抠图同款）

非 Pro 用户点「放大」→ 锁 + 升级弹窗（复用 AVIF/抠图的 `!isPro → Lock` 模板）。收费不动：国内 ¥9.9 / 海外 $24.99，激活码复用，**同一份 Pro 解锁抠图 + 放大**（增加 Pro 的价值感）。

---

## 五、关键工程坑（按严重程度）

### 🚨 1. 分块缝合质量（最大坑）
不做好重叠加权融合，放大图会出现明显「马赛克拼缝」。必须：tile 重叠 ≥32px + 中心加权融合。这块是主要工作量。

### 🚨 2. 内存爆炸
4x 输出是 16 倍像素。必须强制输入长边上限 + 分块处理，否则手机 Safari/低内存安卓直接崩。移动端 WASM 单线程要更保守。

### ⚠️ 3. 许可证（重演抠图教训）
确认所下载 .onnx 分发版的 license 是 BSD-3，别误用带「non-commercial」的第三方转制包。

### ⚠️ 4. 预处理别写错
本模型是 `x/255`（无 mean/std），和抠图 isnet 的 `(x/255)-0.5` 不同。照抄抠图预处理会出颜色错。

### ⚠️ 5. 别加 COOP/COEP
继续沿用「WebGPU 优先 + numThreads=1 单线程 WASM 兜底」，全程不碰跨源隔离头（bug 教训 #4）。

### ⚠️ 6. Worker 禁止 browser-only API
复用抠图的 `webpackIgnore` 加载 `/ort/ort.min.mjs` 方案，不在 worker 里顶层引 window/document（bug 教训 #1）。

---

## 六、部署影响

- **国内 ECS（890MB）**：模型 5MB 静态文件，服务器只发文件、不跑推理，零算力压力。部署包只多 ~5MB（比抠图 45MB 小得多）。
- **海外 Vercel**：`public/` 静态托管即可。
- **运行时**：复用已部署的 `/ort/`（ort.min.mjs + wasm），无需新依赖。

---

## 七、分阶段落地

| 阶段 | 内容 | 验收标准 |
|---|---|---|
| **P0 MVP** | 放大 Worker + realesr-general-x4v3 + 分块缝合 + 4x | 拖图 → 4x 放大 → 下载，1024px 输入 WebGPU <15s |
| **P1 增强** | 2x 模式、动漫模型切换、2x/4x 对比预览 | 更贴合实际使用 |
| **P2 扩展** | 老照片修复（GFPGAN，需核实许可证）、批量放大 | 形成「AI 工具箱」 |

---

## 八、成本与收益预估

- **开发成本**：MVP 约 1-2 天（推理引擎/运行时/门控都复用抠图的，新工作量主要是分块缝合 + 一个页面）。
- **运行成本**：≈0（模型 5MB 静态托管，推理在浏览器）。
- **收益**：Pro 多一个真实付费理由（抠图 + 放大打包卖 ¥9.9/¥24.99），放大本身是高频刚需，比抠图更能拉转化。

---

## 九、决策点（待用户确认）

1. **模型选型**：✅ realesr-general-x4v3（BSD-3，~5MB，4x）
2. **入口位置**：✅ 独立工具页 `/tools/upscale`（SEO：AI image upscaler / 图片无损放大）
3. **放大倍数**：MVP 只上 4x 原生？还是 4x + 2x（降采样）一起？
4. **输出上限**：输入长边 ≤1024px（WebGPU）/ ≤512px（移动端）—— 是否接受这个上限？
5. **是否与抠图同一个 Pro 卖点**：抠图 + 放大共用一份 Pro 解锁（推荐），还是拆开？
