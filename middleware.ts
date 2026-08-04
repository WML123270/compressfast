import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const SUPPORTED_LOCALES = ['en', 'zh'] as const
const DEFAULT_LOCALE = 'zh'

/** Shared with lib/utils.ts — duplicated here to avoid cross-bundle dependency in Edge Runtime */
function isCnDeploy(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env?.NEXT_PUBLIC_DEPLOY_TARGET === 'cn'
  )
}

// Paths that should NOT be redirected
const SKIP_PATHS = [
  '/.well-known/',
  '/api/',
  '/admin',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/BingSiteAuth.xml',
  '/sw.js',
  '/manifest.json',
  '/file.svg',
  '/globe.svg',
  '/icon-',
  '/next.svg',
  '/vercel.svg',
  '/window.svg',
  '/bdunion.txt',
  '/baidu_verify',
  '/verify-file.txt',
  '/google',
  '/demo-photo',
  '.html',
  '.png',
  '.jpg',
  '.webp',
  '.gif',
  '.svg',
  '.xml',
]

function shouldSkip(pathname: string): boolean {
  return SKIP_PATHS.some(p => pathname.startsWith(p) || pathname.includes(p))
}

function getLocaleFromPath(pathname: string): string | null {
  for (const locale of SUPPORTED_LOCALES) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return locale
    }
  }
  return null
}

function getLocaleFromRequest(request: NextRequest): string {
  const hostname = request.nextUrl.hostname

  // 0. Build-time deploy target — highest priority
  if (isCnDeploy()) return 'zh'

  // 1. Cookie (user's explicit choice) — always respect
  const cookieLocale = request.cookies.get('lang')?.value
  if (cookieLocale && SUPPORTED_LOCALES.includes(cookieLocale as typeof SUPPORTED_LOCALES[number])) {
    return cookieLocale
  }

  // 2. Overseas domain → always default to English
  const isOverseas = hostname === 'compressfast.site'
    || hostname.endsWith('.vercel.app')
  if (isOverseas) return 'en'

  // 3. Domestic domain → default to zh (with Accept-Language as helper)
  if (hostname === 'jisuyatu.com' || hostname.endsWith('.cn')) return 'zh'

  // 4. Localhost / unknown → check Accept-Language
  const acceptLang = request.headers.get('accept-language') || ''
  if (acceptLang.includes('zh')) return 'zh'

  // 5. Fallback to English
  return 'en'
}

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  // ─── Affiliate Referral Tracking ──────────────────
  // Read ?ref=CODE, set 30-day cookie for conversion attribution
  const refCode = request.nextUrl.searchParams.get('ref')
  const hasRefCookie = request.cookies.get('aff_ref')?.value

  // Skip static files, API routes, and admin (always accessible from any domain)
  if (shouldSkip(pathname)) {
    // Still set ref cookie on static file requests if ref param present
    if (refCode && !hasRefCookie) {
      const resp = NextResponse.next()
      resp.cookies.set('aff_ref', refCode.toUpperCase(), {
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      })
      return resp
    }
    return NextResponse.next()
  }

  // Geo-block: compressfast.site blocks Chinese IPs (overseas paid version)
  if (hostname === 'compressfast.site' || hostname.startsWith('png-compressor-')) {
    const country = request.headers.get('x-vercel-ip-country') || ''
    if (country === 'CN') {
      // Return a friendly blocked page in Chinese
      const html = `<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>访问受限</title><style>body{font-family:system-ui,sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f8fafc;color:#1e293b;text-align:center;padding:24px}.card{max-width:480px;background:#fff;border-radius:12px;padding:40px;box-shadow:0 1px 3px rgba(0,0,0,.1)}h1{font-size:24px;margin:0 0 12px}p{font-size:15px;line-height:1.6;color:#64748b;margin:0}a{color:#2563eb;text-decoration:none}</style></head><body><div class="card"><h1>🚫 访问受限</h1><p>CompressFast 海外版暂不对中国大陆开放。<br>请访问国内版：<a href="https://jisuyatu.com">jisuyatu.com</a></p></div></body></html>`
      return new NextResponse(html, {
        status: 403,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      })
    }
  }

  // Already has locale prefix
  const pathLocale = getLocaleFromPath(pathname)
  if (pathLocale) {
    const response = NextResponse.next()
    response.cookies.set('lang', pathLocale, { maxAge: 365 * 24 * 60 * 60 })
    // Affiliate ref cookie
    if (refCode && !hasRefCookie) {
      response.cookies.set('aff_ref', refCode.toUpperCase(), { maxAge: 30 * 24 * 60 * 60, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    }
    return response
  }

  // Rewrite to detected locale (no redirect — preserves HTML for crawlers)
  // For CN deployment or root path: always rewrite to avoid redirects
  // For non-CN, non-root paths without locale: redirect as before
  const locale = getLocaleFromRequest(request)
  const newUrl = new URL(`/${locale}${pathname}`, request.url)
  newUrl.search = request.nextUrl.search

  const isCn = isCnDeploy()

  if (pathname === '/' || isCn) {
    // Internal rewrite: serves the locale page content at the original URL
    // CN deployment uses rewrite for all paths — avoids 307 redirects that
    // could confuse Baidu's crawler during Union review
    const response = NextResponse.rewrite(newUrl)
    response.cookies.set('lang', locale, { maxAge: 365 * 24 * 60 * 60 })
    if (refCode && !hasRefCookie) {
      response.cookies.set('aff_ref', refCode.toUpperCase(), { maxAge: 30 * 24 * 60 * 60, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
    }
    return response
  }

  const response = NextResponse.redirect(newUrl)
  response.cookies.set('lang', locale, { maxAge: 365 * 24 * 60 * 60 })
  if (refCode && !hasRefCookie) {
    response.cookies.set('aff_ref', refCode.toUpperCase(), { maxAge: 30 * 24 * 60 * 60, path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production' })
  }
  return response
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|BingSiteAuth).*)'],
}
