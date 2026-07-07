export function JsonLd() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://compressfast.vercel.app'

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CompressFast',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Any',
    description:
      'Free online image compression tool. 100% browser-side processing — files never leave your device. Batch compression, one-time Pro purchase, no subscription.',
    url: siteUrl,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      bestRating: '5',
      ratingCount: '1',
    },
    browserRequirements: 'Requires a modern browser with WebAssembly and Canvas support',
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
