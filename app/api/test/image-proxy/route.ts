/**
 * @file app/api/test/image-proxy/route.ts
 * @description 이미지 프록시 API (CORS 우회용)
 * 
 * 식약처 API의 이미지 URL을 직접 가져올 때 CORS 문제를 해결하기 위한 프록시입니다.
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return new NextResponse("URL 파라미터가 필요합니다", { status: 400 });
    }

    console.log(`[ImageProxy] 이미지 프록시 요청: ${imageUrl}`);

    // URL 검증
    try {
      new URL(imageUrl);
    } catch {
      return new NextResponse("유효하지 않은 URL입니다", { status: 400 });
    }

    // 식약처 도메인만 허용 (보안)
    const allowedDomains = [
      "foodsafetykorea.go.kr",
      "www.foodsafetykorea.go.kr",
    ];
    const urlObj = new URL(imageUrl);
    if (!allowedDomains.some((domain) => urlObj.hostname.includes(domain))) {
      return new NextResponse("허용되지 않은 도메인입니다", { status: 403 });
    }

    // 이미지 가져오기
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "http://www.foodsafetykorea.go.kr/",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(
        `[ImageProxy] 이미지 가져오기 실패: ${response.status} ${response.statusText}`
      );
      return new NextResponse(
        `이미지 가져오기 실패: ${response.status}`,
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Content-Type 확인
    const contentType =
      response.headers.get("content-type") || "image/jpeg";

    console.log(`[ImageProxy] 이미지 프록시 성공: ${imageUrl}`);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[ImageProxy] 이미지 프록시 오류:", error);
    return new NextResponse(
      `이미지 프록시 오류: ${error instanceof Error ? error.message : String(error)}`,
      { status: 500 }
    );
  }
}

