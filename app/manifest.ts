import type { MetadataRoute } from 'next';

/**
 * PWA Manifest 설정
 * Next.js 15에서는 app/manifest.ts를 사용하는 것이 권장됩니다.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Django Care',
    short_name: 'Django Care',
    description: '잊혀진 손맛을 연결하는 디지털 식탁',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f97316',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/refrigerator-logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/refrigerator-logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    categories: ['food', 'lifestyle', 'health'],
    lang: 'ko',
    dir: 'ltr',
    scope: '/',
    prefer_related_applications: false,
  };
}

