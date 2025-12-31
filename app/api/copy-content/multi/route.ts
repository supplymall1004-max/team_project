import { NextResponse } from "next/server";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

export async function POST(request: Request) {
  try {
    const { slugs, locale = "ko" } = await request.json();
    if (!Array.isArray(slugs)) {
      if (process.env.NODE_ENV === "development") {
        console.error("[API] /api/copy-content/multi: invalid slugs", slugs);
      }
      return NextResponse.json({ error: "invalid_slugs" }, { status: 400 });
    }

    const content = await getMultipleCopyContent(slugs, locale, true); // skipDB: true로 설정하여 기본값만 사용
    return NextResponse.json({ content });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[API] /api/copy-content/multi: internal error", error);
    }
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}


