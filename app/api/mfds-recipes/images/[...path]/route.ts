/**
 * @file app/api/mfds-recipes/images/[...path]/route.ts
 * @description 식약처 레시피 이미지 제공 API 라우트
 *
 * Next.js는 public 폴더만 직접 접근 가능하므로,
 * docs/mfds-recipes/images 폴더의 이미지를 제공하기 위한 API 라우트입니다.
 */

import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;

    // URL 디코딩 처리 (한글 파일명 지원)
    const decodedSegments = pathSegments.map((segment) =>
      decodeURIComponent(segment)
    );
    const imagePath = decodedSegments.join("/");

    console.log(`[mfds-recipes/images] 요청 경로: ${imagePath}`);

    // 보안: 경로 탐색 공격 방지
    if (imagePath.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }

    // 전체 경로 구성
    const fullPath = path.join(
      process.cwd(),
      "docs",
      "mfds-recipes",
      "images",
      imagePath
    );

    console.log(`[mfds-recipes/images] 전체 경로: ${fullPath}`);

    // 파일 존재 확인
    if (!fs.existsSync(fullPath)) {
      console.warn(
        `[mfds-recipes/images] 파일을 찾을 수 없습니다: ${fullPath}`
      );
      return new NextResponse("Image not found", { status: 404 });
    }

    // 이미지 파일만 허용
    const ext = path.extname(fullPath).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      return new NextResponse("Invalid file type", { status: 400 });
    }

    // 파일 읽기
    const fileBuffer = fs.readFileSync(fullPath);
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : "image/jpeg";

    console.log(`[mfds-recipes/images] 이미지 제공 성공: ${imagePath}`);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[mfds-recipes/images] 이미지 제공 실패:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

