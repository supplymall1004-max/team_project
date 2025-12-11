"use client";

/**
 * @file app/sign-up/page.tsx
 * @description Clerk 회원가입 페이지 래퍼. UX 일관성을 위해 맞춤 레이아웃 적용.
 */

import { useEffect } from "react";
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  useEffect(() => {
    console.groupCollapsed("[Auth] SignUp 페이지 진입");
    console.log("timestamp:", new Date().toISOString());
    console.groupEnd();
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-white/90 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-emerald-600">
            Flavor Archive
          </p>
          <h1 className="mt-2 text-3xl font-bold">회원가입</h1>
          <p className="text-sm text-muted-foreground">
            전통과 현대 레시피를 저장하고 건강 맞춤 식단을 받아보세요.
          </p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          fallbackRedirectUrl="/"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}




















