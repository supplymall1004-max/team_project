/**
 * @file components/providers/popup-provider.tsx
 * @description 전역 팝업 Provider
 *
 * 주요 기능:
 * 1. 페이지 로드 시 활성 팝업 조회
 * 2. PopupDisplay 컴포넌트에 데이터 전달
 */

"use client";

import { useEffect, useState } from "react";
import { PopupDisplay } from "@/components/popups/popup-display";
import { getActivePopups } from "@/actions/popups/get-active-popups";
import type { ActivePopup } from "@/actions/popups/get-active-popups";

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [popups, setPopups] = useState<ActivePopup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadPopups() {
      console.group("[PopupProvider]");
      console.log("event", "load_popups");

      try {
        const result = await getActivePopups();

        if (result.success) {
          console.log("popups_loaded", result.data.length);
          setPopups(result.data);
        } else {
          const errorMessage = "error" in result ? result.error : "알 수 없는 오류가 발생했습니다";
          console.error("load_error", errorMessage);
        }
      } catch (error) {
        console.error("unexpected_error", error);
      } finally {
        setIsLoading(false);
        console.groupEnd();
      }
    }

    loadPopups();
  }, []);

  return (
    <>
      {children}
      {!isLoading && popups.length > 0 && <PopupDisplay popups={popups} />}
    </>
  );
}

