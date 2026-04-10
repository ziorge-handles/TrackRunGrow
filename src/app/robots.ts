import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/dashboard/', '/portal/', '/admin/', '/settings/'],
      },
    ],
    sitemap: 'https://www.trackrungrow.com/sitemap.xml',
  }
}
