/**
 * @file customization-button.tsx
 * @description 홈페이지 커스터마이징 빠른 접근 버튼
 *
 * 주요 기능:
 * 1. 선택된 섹션 근처에 위치하는 버튼
 * 2. 섹션이 선택되지 않으면 우측 하단에 고정
 * 3. 클릭 시 설정 페이지로 이동
 * 4. 부드러운 애니메이션
 */

"use client";

import { useRouter } from "next/navigation";
import { Palette } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState, useRef } from "react";

/**
 * 홈페이지 커스터마이징 빠른 접근 버튼
 * 선택된 섹션 근처에 위치하며, 섹션이 선택되지 않으면 우측 하단에 고정됩니다.
 */
export function CustomizationButton() {
  const router = useRouter();
  const [selectedSection, setSelectedSection] = useState<{
    id: string;
    top: number;
    right: number;
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 섹션 클릭 이벤트 감지
  useEffect(() => {
    const handleSectionClick = (event: MouseEvent) => {
      // 클릭된 요소에서 data-section-id 찾기
      const target = event.target as HTMLElement;
      const sectionElement = target.closest('[data-section-id]') as HTMLElement;
      
      if (sectionElement) {
        const sectionId = sectionElement.getAttribute('data-section-id');
        if (sectionId) {
          const rect = sectionElement.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;
          
          // 섹션의 우측 상단 위치 계산 (버튼 크기 고려)
          const top = rect.top + scrollY + 16; // 섹션 상단에서 16px 아래
          const right = window.innerWidth - rect.right + scrollX - 16; // 섹션 우측에서 16px 왼쪽
          
          setSelectedSection({
            id: sectionId,
            top,
            right,
          });
          
          console.log('[CustomizationButton] 섹션 선택됨:', {
            sectionId,
            top,
            right,
            rect: {
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              left: rect.left,
            },
          });
        }
      } else {
        // 섹션이 아닌 곳을 클릭하면 선택 해제
        setSelectedSection(null);
      }
    };

    // 전역 클릭 이벤트 리스너 추가
    document.addEventListener('click', handleSectionClick);
    
    return () => {
      document.removeEventListener('click', handleSectionClick);
    };
  }, []);

  // 스크롤 시 선택된 섹션의 위치 업데이트
  useEffect(() => {
    if (!selectedSection) return;

    const handleScroll = () => {
      const sectionElement = document.querySelector(
        `[data-section-id="${selectedSection.id}"]`
      ) as HTMLElement;
      
      if (sectionElement) {
        const rect = sectionElement.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        
        const top = rect.top + scrollY + 16;
        const right = window.innerWidth - rect.right + scrollX - 16;
        
        setSelectedSection({
          id: selectedSection.id,
          top,
          right,
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [selectedSection]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 섹션 클릭 이벤트 전파 방지
    router.push("/settings/customization");
  };

  // 기본 위치 (우측 하단)
  const defaultPosition = {
    bottom: 80, // 하단 네비게이션 위
    right: 16,
  };

  return (
    <AnimatePresence mode="wait">
      <motion.button
        ref={buttonRef}
        onClick={handleClick}
        className="fixed z-40 p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl transition-shadow"
        initial={{ scale: 0, opacity: 0 }}
        animate={{
          scale: 1,
          opacity: 1,
          ...(selectedSection
            ? {
                top: selectedSection.top,
                right: selectedSection.right,
              }
            : {
                bottom: defaultPosition.bottom,
                right: defaultPosition.right,
              }),
        }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 20,
          delay: selectedSection ? 0 : 1,
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="홈페이지 커스터마이징"
        aria-label="홈페이지 커스터마이징 설정"
      >
        <Palette className="w-6 h-6" />
      </motion.button>
    </AnimatePresence>
  );
}

