import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID
const BAIDU_ID = process.env.NEXT_PUBLIC_BAIDU_ID

export function Analytics() {
  return (
    <>
      {/* Google Analytics */}
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}')`}
          </Script>
        </>
      )}

      {/* 百度统计 */}
      {BAIDU_ID && (
        <Script id="baidu-tongji" strategy="afterInteractive">
          {`var _hmt=_hmt||[];(function(){var hm=document.createElement("script");hm.src="https://hm.baidu.com/hm.js?${BAIDU_ID}";var s=document.getElementsByTagName("script")[0];s.parentNode.insertBefore(hm,s)})()`}
        </Script>
      )}
    </>
  )
}
