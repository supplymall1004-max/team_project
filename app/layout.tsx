/**
 * @file layout.tsx
 * @description 앱 전체 레이아웃 및 전역 Provider 설정.
 *
 * 주요 기능:
 * 1. ClerkProvider 및 SyncUserProvider로 인증 컨텍스트 구성
 * 2. Navbar/Footer를 포함한 공통 레이아웃 래핑
 */

import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { koKR } from "@clerk/localizations";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";

import Navbar from "@/components/layout/navbar";
import { AppProviders } from "@/components/providers/app-providers";
import { Footer } from "@/components/layout/footer";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { SeasonBackground } from "@/components/season-background";
import { PageTransitionWrapper } from "@/components/motion/page-transition-wrapper";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

const notoSansSc = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000",
  ),
  title: "Django Care | 냉씨가문 집사장고",
  description:
    "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
  keywords: [
    "Django Care",
    "냉씨가문 집사장고",
    "레시피",
    "요리",
    "전통 음식",
    "건강 맞춤 식단",
    "레시피 북",
    "요리 아카이브",
    "Flavor Archive",
  ],
  authors: [{ name: "Django Care" }],
  // manifest는 app/manifest.ts에서 자동으로 처리됩니다
  icons: {
    icon: [
      { url: "/refrigerator-logo.png", sizes: "512x512", type: "image/png" },
      { url: "/refrigerator-logo.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/refrigerator-logo.png", sizes: "512x512", type: "image/png" }],
    shortcut: [{ url: "/refrigerator-logo.png", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Django Care",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Django Care | 냉씨가문 집사장고",
    description:
      "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "Django Care",
    images: [
      {
        url: "/refrigerator-logo.png",
        width: 1200,
        height: 630,
        alt: "Django Care 로고 - 냉씨가문 집사장고",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Django Care | 냉씨가문 집사장고",
    description:
      "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
    images: ["/refrigerator-logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 3,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 환경 변수 검증
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (process.env.NODE_ENV === "development") {
    if (!publishableKey || !secretKey) {
      console.error("❌ [Layout] Clerk 환경 변수가 설정되지 않았습니다.");
      console.error(
        "   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:",
        publishableKey ? "✅" : "❌",
      );
      console.error("   CLERK_SECRET_KEY:", secretKey ? "✅" : "❌");
    } else {
      console.log("✅ [Layout] Clerk 환경 변수 확인 완료");
    }
  }

  // 프로덕션에서는 환경변수가 필수 (없으면 명확한 에러 표시)
  let finalPublishableKey = publishableKey;
  
  if (!publishableKey) {
    if (process.env.NODE_ENV === "production") {
      // 프로덕션에서는 환경변수 없이 진행하면 안 됨
      console.error("❌ [Layout] 프로덕션 환경에서 NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다.");
      console.error("   Vercel Dashboard → Settings → Environment Variables에서 설정해주세요.");
      // 프로덕션에서는 빈 문자열을 사용하여 ClerkProvider가 명확한 에러를 표시하도록 함
      // (ClerkProvider는 빈 문자열을 받으면 클라이언트에서 명확한 에러를 표시함)
      finalPublishableKey = "";
    } else {
      // 개발 환경에서는 빌드가 실패하지 않도록 placeholder 사용 (하지만 실제 인증은 실패함)
      console.warn(
        "⚠️ [Layout] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다. 기본값으로 대체합니다.",
      );
      finalPublishableKey = "pk_test_placeholder";
    }
  } else if (process.env.NODE_ENV === "production" && publishableKey.startsWith("pk_test_")) {
    // 프로덕션에서 개발 키를 사용하는 경우 경고
    console.warn("⚠️ [Layout] 프로덕션 환경에서 개발 키(pk_test_)를 사용하고 있습니다.");
    console.warn("   프로덕션에서는 프로덕션 키(pk_live_)를 사용해야 합니다.");
    console.warn("   Clerk Dashboard → Settings → API Keys → Production 키를 복사하여");
    console.warn("   Vercel Dashboard → Settings → Environment Variables에서 업데이트해주세요.");
  }

  return (
    <ErrorBoundary
      fallback={
        <div
          className={`${geistSans.variable} ${geistMono.variable} ${notoSansSc.variable} min-h-screen bg-background text-foreground antialiased`}
        >
          <ErrorFallback />
        </div>
      }
    >
      <ClerkProvider localization={koKR} publishableKey={finalPublishableKey || ""}>
        <html lang="ko" className="h-full">
          <body
            className={`${geistSans.variable} ${geistMono.variable} ${notoSansSc.variable} min-h-screen bg-background text-foreground antialiased w-full overflow-x-hidden relative`}
            suppressHydrationWarning={true}
          >
            {/* 계절별 배경 이미지 */}
            <SeasonBackground opacity={0.4} />

            <AppProviders>
              <div className="flex flex-col h-screen w-full max-w-full overflow-hidden">
                {/* Navbar (최상단 고정) */}
                <Navbar />

                {/* 메인 콘텐츠 영역 (스크롤 가능) */}
                <main
                  className="flex-1 bg-gradient-to-b from-white to-orange-50/40 dark:bg-black dark:from-black dark:to-black w-full max-w-full overflow-y-auto relative"
                  style={{
                    marginTop: "64px", // Navbar 높이(64px)
                    paddingTop: "0.5rem",
                    paddingBottom: "80px", // 하단 네비게이션 공간 확보 (모바일)
                  }}
                >
                  <PageTransitionWrapper>
                    {children}
                  </PageTransitionWrapper>

                  {/* Footer (회사소개) - 메인 콘텐츠 맨 아래에 위치, 고정하지 않음 */}
                  <Footer />
                </main>

                {/* 하단 네비게이션 (고정, 맨 아래, 모바일에서만 표시) */}
                <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                  <BottomNavigation />
                </div>
              </div>
            </AppProviders>
          </body>
        </html>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
