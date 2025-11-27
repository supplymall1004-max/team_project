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

import { useState, useCallback } from "react";
import { SignIn } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function LoginModal() {
  const [open, setOpen] = useState(false);

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
      <Button variant="default" onClick={() => handleToggle(true)}>
        로그인
      </Button>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Flavor Archive 로그인</DialogTitle>
        </DialogHeader>
        <SignIn appearance={{ elements: { formButtonPrimary: "bg-primary" } }} />
      </DialogContent>
    </Dialog>
  );
}




















