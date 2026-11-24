/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, isServer, nextRuntime }) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }

    // 修复：webpack runtime chunk（名字形如 webpack-<hash>.js）的 chunkhash 不会随
    // worker 子编译产物变化，导致不同构建生成「同名不同内容」的 runtime。
    // Cloudflare 以 immutable/1年 缓存它，部署后仍返回旧 runtime，旧的 worker chunk
    // 哈希已不存在 → 压缩 Worker 404、海外站压缩失效（2026-11-24 实锤）。
    // 给 runtime 文件名注入 buildId，使每次构建 URL 唯一，彻底绕开 CDN 旧缓存。
    if (!dev && !isServer && !nextRuntime && typeof config.output.filename === 'string') {
      const buildTag = String(buildId || 'build').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12)
      config.output.filename = (pathData) => {
        const name = pathData.chunk?.name || 'chunk'
        const base = name === 'webpack' ? `webpack-${buildTag}` : name
        return `static/chunks/${base}-[contenthash].js`
      }
    }

    return config
  },

  async rewrites() {
    return [
      { source: '/BingSiteAuth.xml', destination: '/api/bing-verify' },
    ]
  },

  async headers() {
    return [
      {
        // pdf.js 资源目录带版本号，可长期强缓存
        source: '/pdfjs/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // AI 模型（5MB / 88MB）：默认 max-age=0 会导致每次进页面都回源校验，
        // 长缓存后首次下载一次即可。模型文件更新时请改文件名。
        source: '/models/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000, stale-while-revalidate=86400' },
        ],
      },
      {
        // onnxruntime-web 运行时（带 ?v= 版本号）
        source: '/ort/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=2592000' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
