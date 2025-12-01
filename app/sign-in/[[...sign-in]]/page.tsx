"use client";

/**
 * @file app/sign-in/page.tsx
 * @description Clerk 기본 로그인 페이지를 Flavor Archive 스타일로 감싼 컴포넌트.
 */

import { useEffect } from "react";
import { SignIn, useSignIn } from "@clerk/nextjs";

export default function SignInPage() {
  useEffect(() => {
    console.groupCollapsed("[Auth] SignIn 페이지 진입");
    console.log("timestamp:", new Date().toISOString());
    console.log("window.location.origin:", window.location.origin);
    console.log("expected callback URL:", `${window.location.origin}/sign-in/oauth_callback`);
    console.groupEnd();
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-border/60 bg-white/90 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <p className="text-sm font-semibold text-orange-600">Flavor Archive</p>
          <h1 className="mt-2 text-3xl font-bold">로그인</h1>
          <p className="text-sm text-muted-foreground">
            계정이 없다면 아래에서 쉽게 가입할 수 있어요.
          </p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          fallbackRedirectUrl="/"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}




















