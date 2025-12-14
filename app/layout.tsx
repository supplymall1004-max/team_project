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
import { Geist, Geist_Mono } from "next/font/google";

import Navbar from "@/components/Navbar";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { DietNotificationProvider } from "@/components/providers/diet-notification-provider";
import { KcdcAlertsProvider } from "@/components/providers/kcdc-alerts-provider";
import { PopupProvider } from "@/components/providers/popup-provider";
import { ToastProvider } from "@/components/providers/toast-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { Footer } from "@/components/footer";
import { IntroVideo } from "@/components/intro-video";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { ErrorBoundary } from "@/components/error-boundary";
import { ErrorFallback } from "@/components/error-fallback";
import { SeasonBackground } from "@/components/season-background";
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

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || 
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
    'http://localhost:3000'
  ),
  title: "맛카 | Flavor Archive, Flavor Eureka!",
  description:
    "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
  keywords: ["맛카", "레시피", "요리", "전통 음식", "건강 맞춤 식단", "레시피 북", "요리 아카이브", "Flavor Archive"],
  authors: [{ name: "맛카" }],
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icons/maca2.JPG", sizes: "512x512", type: "image/jpeg" },
      { url: "/icons/maca2.JPG", sizes: "192x192", type: "image/jpeg" },
    ],
    apple: [
      { url: "/icons/maca2.JPG", sizes: "512x512", type: "image/jpeg" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "맛카",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "맛카 | Flavor Archive, Flavor Eureka!",
    description:
      "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "맛카",
    images: [
      {
        url: "/icons/maca2.JPG",
        width: 1200,
        height: 630,
        alt: "맛카 로고 - Flavor Archive, Flavor Eureka!",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "맛카 | Flavor Archive, Flavor Eureka!",
    description:
      "잊혀진 손맛을 연결하는 디지털 식탁. 전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
    images: ["/icons/maca2.JPG"],
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
  // 환경 변수 검증 (개발 환경에서만)
  if (process.env.NODE_ENV === "development") {
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const secretKey = process.env.CLERK_SECRET_KEY;

    if (!publishableKey || !secretKey) {
      console.error("❌ [Layout] Clerk 환경 변수가 설정되지 않았습니다.");
      console.error("   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:", publishableKey ? "✅" : "❌");
      console.error("   CLERK_SECRET_KEY:", secretKey ? "✅" : "❌");
    } else {
      console.log("✅ [Layout] Clerk 환경 변수 확인 완료");
    }
  }

  let publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  // Clerk 키가 없으면 기본값 설정 (빌드 타임에서만 사용)
  if (!publishableKey) {
    console.warn("⚠️ [Layout] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY가 설정되지 않았습니다. 기본값으로 대체합니다.");
    // 빌드 타임에서는 임시 키로 설정하여 빌드가 실패하지 않도록 함
    publishableKey = "pk_test_placeholder";
  }

  return (
    <ErrorBoundary
      fallback={
        <div className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased`}>
          <ErrorFallback />
        </div>
      }
    >
      <ClerkProvider
        localization={koKR}
        publishableKey={publishableKey}
      >
        <html lang="ko" className="h-full">
          <body
            className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased w-full overflow-x-hidden relative`}
            suppressHydrationWarning={true}
          >
            {/* 계절별 배경 이미지 */}
            <SeasonBackground opacity={0.4} />
            
            <SyncUserProvider>
            <DietNotificationProvider>
              <KcdcAlertsProvider>
                <PopupProvider>
                  <QueryProvider>
                    <ToastProvider />
                    <IntroVideo>
                    <div className="flex flex-col h-screen w-full max-w-full overflow-hidden">
                      {/* Navbar (최상단 고정) */}
                      <Navbar />

                      {/* 메인 콘텐츠 영역 (스크롤 가능) */}
                      <main
                        className="flex-1 bg-gradient-to-b from-white to-orange-50/40 w-full max-w-full overflow-y-auto"
                        style={{
                          marginTop: '64px', // Navbar 높이(64px)
                          paddingTop: '0.5rem',
                          paddingBottom: '80px', // 하단 네비게이션 공간 확보 (모바일)
                        }}
                      >
                        {children}
                        
                        {/* Footer (회사소개) - 메인 콘텐츠 맨 아래에 위치, 고정하지 않음 */}
                        <Footer />
                      </main>

                      {/* 하단 네비게이션 (고정, 맨 아래, 모바일에서만 표시) */}
                      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
                        <BottomNavigation />
                      </div>
                    </div>
                    </IntroVideo>
                  </QueryProvider>
                </PopupProvider>
              </KcdcAlertsProvider>
            </DietNotificationProvider>
            </SyncUserProvider>
          </body>
        </html>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
