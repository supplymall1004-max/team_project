import type { NextConfig } from "next";

/**
 * Next 이미지 최적화 설정을 동적으로 확장하기 위한 헬퍼.
 * Supabase 스토리지 호스트를 자동으로 허용 목록에 추가하여
 * 현대 레시피 북/AI 식단 섹션 이미지가 차단되지 않도록 한다.
 */
const buildRemotePatterns = () => {
  const remotePatterns = [
    { hostname: "img.clerk.com" },
    // 외부 이미지 서비스 호스트 (foodjpg.md 및 이미지 검색에서 사용)
    { hostname: "images.unsplash.com" },
    { hostname: "lh3.googleusercontent.com" },
    { hostname: "cdn.pixabay.com" },
    { hostname: "buly.kr" },
    // 유튜브 썸네일 이미지 호스트 (음식 동화 동영상용)
    { hostname: "img.youtube.com" },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.warn(
      "[next.config] NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. Supabase Storage 이미지를 최적화할 수 없습니다."
    );
    return remotePatterns;
  }

  try {
    const supabaseHost = new URL(supabaseUrl).hostname;
    remotePatterns.push({
      hostname: supabaseHost,
    });
    console.info("[next.config] Supabase 이미지 호스트 허용:", supabaseHost);
  } catch (error) {
    console.error("[next.config] Supabase URL 파싱 실패:", error);
  }

  return remotePatterns;
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: buildRemotePatterns(),
    // 성능 최적화: 이미지 최적화 활성화
    formats: ["image/avif", "image/webp"],
  },
  // 성능 최적화: 컴파일 최적화
  compiler: {
    // 프로덕션에서 console.log 제거
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ["error", "warn"],
    } : false,
  },
  // 실험적 기능: 성능 향상
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // 헤더 설정: 폰트 preload
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Link",
            value: '<https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.2/JalnanOTF00.woff>; rel=preload; as=font; type=font/woff; crossorigin=anonymous',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
