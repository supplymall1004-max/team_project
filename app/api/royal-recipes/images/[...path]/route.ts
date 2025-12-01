/**
 * @file app/api/royal-recipes/images/[...path]/route.ts
 * @description 궁중 레시피 이미지 제공 API 라우트
 * 
 * Next.js는 public 폴더만 직접 접근 가능하므로,
 * docs 폴더의 이미지를 제공하기 위한 API 라우트입니다.
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
    const imagePath = pathSegments.join("/");
    
    // 보안: 경로 탐색 공격 방지
    if (imagePath.includes("..")) {
      return new NextResponse("Invalid path", { status: 400 });
    }
    
    // 루트 파일인지 폴더 내 파일인지 확인
    const fullPath = path.join(
      process.cwd(),
      "docs",
      "royalrecipe",
      imagePath
    );
    
    // 파일 존재 확인
    if (!fs.existsSync(fullPath)) {
      return new NextResponse("Image not found", { status: 404 });
    }
    
    // 이미지 파일만 허용
    const ext = path.extname(fullPath).toLowerCase();
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      return new NextResponse("Invalid file type", { status: 400 });
    }
    
    // 파일 읽기
    const fileBuffer = fs.readFileSync(fullPath);
    const contentType = ext === ".png" ? "image/png" : "image/jpeg";
    
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[royal-recipes/images] 이미지 제공 실패:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}

