import type { NextConfig } from "next";

/**
 * Next 이미지 최적화 설정을 동적으로 확장하기 위한 헬퍼.
 * Supabase 스토리지 호스트를 자동으로 허용 목록에 추가하여
 * 현대 레시피 북/건강 맞춤 식단 섹션 이미지가 차단되지 않도록 한다.
 */
const buildRemotePatterns = () => {
  const remotePatterns = [
    { hostname: "img.clerk.com" },
    // 로컬 이미지 호스트 (public 폴더 이미지)
    { hostname: "localhost" },
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
      "[next.config] NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다. 기본 이미지 호스트만 사용합니다."
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
  // ESLint 설정: 빌드 시 ESLint 경고로 인한 빌드 실패 방지
  eslint: {
    // 빌드 시 ESLint 경고를 무시 (개발 중에는 여전히 ESLint 실행)
    ignoreDuringBuilds: true,
  },
  // 실험적 기능: 성능 향상
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Webpack 설정: 서버 전용 모듈 클라이언트 번들에서 제외
  webpack: (config, { isServer, dev }) => {
    // Windows에서 Watchpack이 드라이브 보호 폴더(System Volume Information 등)를 스캔하며
    // EINVAL/UNKNOWN 오류를 내고, 그 여파로 dev 서버가 간헐적으로 500/manifest read 오류를 만들 수 있음.
    // polling + ignored를 설정해 파일 감시를 안정화한다.
    if (dev) {
      config.watchOptions = {
        ...(config.watchOptions ?? {}),
        poll: 1000,
        ignored: [
          "**/.git/**",
          "**/.next/**",
          "**/node_modules/**",
          "**/System Volume Information/**",
          "**/$RECYCLE.BIN/**",
        ],
      };
    }

    if (!isServer) {
      // 클라이언트 번들에서 Node.js 전용 모듈 제외
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },
  // 헤더 설정 제거: 폰트는 CSS @font-face로 로드되므로 Link preload 헤더가 불필요하고 경고를 발생시킵니다
  // async headers() {
  //   return [
  //     {
  //       source: "/:path*",
  //       headers: [
  //         {
  //           key: "Link",
  //           value: '<https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_four@1.2/JalnanOTF00.woff>; rel=preload; as=font; type=font/woff; crossorigin=anonymous',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

export default nextConfig;
