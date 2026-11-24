/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    }
    // 注意：不要在这里改 output.filename 给 webpack runtime chunk 加 buildId。
    // Vercel 构建管线会因此漏掉压缩 Worker 的 chunk（2026-11-24 实测）。
    // runtime 文件名由 postbuild 脚本 lib/build/version-runtime-chunk.mjs 处理。
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
