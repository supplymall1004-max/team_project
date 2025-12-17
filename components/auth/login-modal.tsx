/**
 * @file login-modal.tsx
 * @description Clerk SignIn 컴포넌트를 감싼 커스텀 로그인 모달.
 *
 * 주요 기능:
 * 1. 헤더 등 어디서든 재사용 가능한 로그인 모달 버튼 제공
 * 2. 모달 열림/닫힘 시 콘솔 로그로 상태 추적
 *
 * @dependencies
 * - @clerk/nextjs: SignIn 컴포넌트
 * - @/components/ui/dialog: Shadcn Dialog
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { SignIn } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoginModalProps {
  /**
   * 로그인 모달을 열 때, 주변 UI(예: 모바일 햄버거 메뉴)를 닫기 위해 사용합니다.
   */
  onOpen?: () => void;
}

export function LoginModal({ onOpen }: LoginModalProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 모달이 열린 상태에서 /sign-in 같은 인증 페이지로 이동하면
    // "SignIn이 겹쳐 보이는" UX가 생길 수 있어 자동으로 닫습니다.
    if (!open) return;
    if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed("[LoginModal] 인증 라우트 진입으로 모달 닫기");
        console.log("pathname:", pathname);
        console.groupEnd();
      }
      setOpen(false);
    }
  }, [open, pathname]);

  const handleToggle = useCallback(
    (next: boolean) => {
      console.groupCollapsed("[LoginModal] 상태 변경");
      console.log("open:", next);
      console.groupEnd();
      setOpen(next);
    },
    [setOpen],
  );

  return (
    <Dialog open={open} onOpenChange={handleToggle}>
      <Button
        variant="default"
        onClick={() => {
          onOpen?.();
          handleToggle(true);
        }}
      >
        로그인
      </Button>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto overscroll-contain">
        <DialogHeader>
          <DialogTitle>Flavor Archive 로그인</DialogTitle>
        </DialogHeader>
        <SignIn
          appearance={{ elements: { formButtonPrimary: "bg-primary" } }}
        />
      </DialogContent>
    </Dialog>
  );
}
