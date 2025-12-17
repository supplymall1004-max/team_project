import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 공개 경로 정의 (인증 불필요)
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  // 홈 화면 위젯(비로그인)에서 사용: 날씨 API는 공개
  "/api/weather(.*)",
  // 건강/응급: 의료시설 검색은 비로그인에서도 사용 가능 (모바일/배포 환경에서 API 리다이렉트로 인한 오류 방지)
  "/api/health/medical-facilities(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // 공개 경로는 인증 체크 건너뛰기
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
