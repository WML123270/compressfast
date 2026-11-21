// AI 模型下载器 —— 带下载进度 + Cache Storage 持久缓存
//
// 为什么自己下载：onnxruntime-web 的 InferenceSession.create(url) 内部自己拉模型，
// 拿不到任何下载进度。几十 MB 的抠图模型首次下载时手机用户只看到「加载中」转圈，
// 容易以为卡死直接离开。这里先流式 fetch（上报已下载字节），再从内存创建 session。
//
// 缓存策略：
//   - 优先读 Cache Storage（ai-models-v1），命中则跳过网络（cached: true）
//   - 未命中用 fetch + ReadableStream 边下边报进度，完成后写入 Cache Storage
//   - fetch 用 no-store，避免同一份大模型在 HTTP 缓存和 Cache Storage 存两遍
//   - 缓存读写失败（配额不足/隐私模式/非安全上下文）不影响本次使用，下次重新下载
//
// 模型文件更新时请改文件名（缓存 key 是 URL），否则旧缓存会一直命中。
//
// ⚠️ 海外 Vercel/Cloudflare 对大文件返回 `Transfer-Encoding: chunked`，没有
// Content-Length（HEAD 也不给）。所以调用方可以传 fallbackTotal（仓库里模型的
// 实际字节数），否则海外站只能显示不确定进度条、没有百分比。

export interface ModelLoadProgress {
  /** 已下载字节数 */
  loaded: number
  /** 总字节数（服务端没给 Content-Length 时为 0） */
  total: number
  /** true = 命中本地缓存，无需网络 */
  cached: boolean
}

type Listener = (p: ModelLoadProgress) => void

const CACHE_NAME = 'ai-models-v1'

// 每个模型的最近一次进度：晚注册的监听者（如 warmup 已开始下载后才启动的任务）
// 能立刻拿到快照，而不是从 0 开始显示。
const latest = new Map<string, ModelLoadProgress>()
const listeners = new Map<string, Set<Listener>>()

function emit(url: string, p: ModelLoadProgress): void {
  latest.set(url, p)
  const set = listeners.get(url)
  if (set) {
    set.forEach((fn) => {
      try {
        fn(p)
      } catch {
        // 监听者异常不能影响下载
      }
    })
  }
}

/** 订阅某个模型的下载进度；注册时立即回放最近一次进度。返回取消订阅函数。 */
export function onModelProgress(url: string, fn: Listener): () => void {
  let set = listeners.get(url)
  if (!set) {
    set = new Set()
    listeners.set(url, set)
  }
  set.add(fn)
  const cur = latest.get(url)
  if (cur) {
    try {
      fn(cur)
    } catch {}
  }
  return () => {
    set!.delete(fn)
  }
}

async function readCache(url: string): Promise<Uint8Array | null> {
  try {
    if (typeof caches === 'undefined') return null
    const cache = await caches.open(CACHE_NAME)
    const hit = await cache.match(url)
    if (!hit) return null
    const buf = await hit.arrayBuffer()
    return buf.byteLength > 0 ? new Uint8Array(buf) : null
  } catch {
    return null
  }
}

async function writeCache(url: string, data: Uint8Array): Promise<void> {
  try {
    if (typeof caches === 'undefined') return
    const cache = await caches.open(CACHE_NAME)
    // Uint8Array 在运行时是合法的 BodyInit；TS 5.7 的泛型数组类型需要断言
    await cache.put(url, new Response(data as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': String(data.byteLength),
      },
    }))
  } catch {
    // 配额不足 / 隐私模式：本次照常使用，下次重新下载
  }
}

/**
 * 取得模型字节。命中缓存直接返回；否则流式下载并通过 onModelProgress 广播进度。
 * 失败（网络/HTTP 错误）会抛错，由 Worker 归类为 model_load。
 */
export async function loadModelData(url: string, fallbackTotal = 0): Promise<Uint8Array> {
  const cached = await readCache(url)
  if (cached) {
    emit(url, { loaded: cached.byteLength, total: cached.byteLength, cached: true })
    return cached
  }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Model download failed: HTTP ${res.status}`)

  // 服务端没给 Content-Length（Vercel chunked）时用调用方提供的文件大小
  const total = Number(res.headers.get('content-length') || 0) || fallbackTotal

  if (!res.body) {
    // 极老浏览器没有流式 body：一次性读取，进度只能 0 → 100
    const buf = new Uint8Array(await res.arrayBuffer())
    emit(url, { loaded: buf.byteLength, total: buf.byteLength, cached: false })
    await writeCache(url, buf)
    return buf
  }

  emit(url, { loaded: 0, total, cached: false })

  const reader = res.body.getReader()
  let data: Uint8Array | null = total > 0 ? new Uint8Array(total) : null
  const chunks: Uint8Array[] = []
  let loaded = 0
  let lastEmit = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    if (!value || value.byteLength === 0) continue

    if (data) {
      if (loaded + value.byteLength > data.byteLength) {
        // Content-Length 与实际不符：扩容
        const grown = new Uint8Array(loaded + value.byteLength)
        grown.set(data.subarray(0, loaded))
        data = grown
      }
      data.set(value, loaded)
    } else {
      chunks.push(value)
    }
    loaded += value.byteLength

    const now = Date.now()
    if (now - lastEmit >= 120) {
      lastEmit = now
      emit(url, { loaded, total, cached: false })
    }
  }

  let out: Uint8Array
  if (data) {
    out = loaded === data.byteLength ? data : data.subarray(0, loaded)
  } else {
    out = new Uint8Array(loaded)
    let offset = 0
    for (const c of chunks) {
      out.set(c, offset)
      offset += c.byteLength
    }
  }

  // 下载已完成：total 直接取实际字节数，保证一定到 100%（fallback 与实际不符时也能收尾）
  emit(url, { loaded, total: loaded, cached: false })
  await writeCache(url, out)
  return out
}
