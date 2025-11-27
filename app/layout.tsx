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
import { Footer } from "@/components/footer";
import { IntroVideo } from "@/components/intro-video";
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
  title: "Flavor Archive | 잊혀진 손맛을 연결하는 디지털 식탁",
  description:
    "전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, AI 식단 추천을 한 곳에서 확인하세요.",
  keywords: ["레시피", "요리", "전통 음식", "AI 식단", "레시피 북", "요리 아카이브"],
  authors: [{ name: "Flavor Archive" }],
  openGraph: {
    title: "Flavor Archive | 잊혀진 손맛을 연결하는 디지털 식탁",
    description:
      "전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, AI 식단 추천을 한 곳에서 확인하세요.",
    type: "website",
    locale: "ko_KR",
    siteName: "Flavor Archive",
  },
  twitter: {
    card: "summary_large_image",
    title: "Flavor Archive | 잊혀진 손맛을 연결하는 디지털 식탁",
    description:
      "전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, AI 식단 추천을 한 곳에서 확인하세요.",
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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.5,
  maximumScale: 3,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko" className="h-full">
        <body
          className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground antialiased w-full overflow-x-hidden`}
        >
          <SyncUserProvider>
            <DietNotificationProvider>
              <IntroVideo>
                <div className="flex min-h-screen flex-col w-full max-w-full">
                  <Navbar />
                  <main className="flex-1 bg-gradient-to-b from-white to-orange-50/40 w-full max-w-full">
                    {children}
                  </main>
                  <Footer />
                </div>
              </IntroVideo>
            </DietNotificationProvider>
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
