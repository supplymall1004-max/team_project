/**
 * @file footer.tsx
 * @description Flavor Archive 공통 푸터 컴포넌트.
 *
 * 주요 기능:
 * 1. 법적 고지, 저작권, 문의 링크 등 하단 정보를 표시
 * 2. 모바일/데스크톱 모두에서 읽기 쉬운 레이아웃 제공
 * 3. 데이터베이스에서 콘텐츠 조회
 *
 * @dependencies
 * - next/link: 외부/내부 링크 구성
 * - lib/admin/copy-reader: 콘텐츠 조회 유틸리티
 */

import Link from "next/link";
import { getMultipleCopyContent } from "@/lib/admin/copy-reader";

export async function Footer() {
  // Footer 관련 콘텐츠 조회
  const footerContent = await getMultipleCopyContent([
    "footer-company-menu",
    "footer-disclaimer",
    "footer-copyright",
  ]);

  // 기본값 설정
  const footerLinks =
    footerContent["footer-company-menu"]?.content.links || [
      { label: "회사소개", href: "/about" },
      { label: "이용약관", href: "/terms" },
      { label: "개인정보처리방침", href: "/privacy" },
      { label: "문의하기", href: "mailto:hello@flavor-archive.com" },
    ];

  const disclaimerText =
    footerContent["footer-disclaimer"]?.content.text ||
    "의료 면책 조항: 본 서비스는 건강 관리 보조 수단이며 전문적인 진료를 대체하지 않습니다. 자세한 내용은 전문의와 상담해 주세요.";

  const copyrightText =
    footerContent["footer-copyright"]?.content.text || "맛의 아카이브 (Flavor Archive)";

  return (
    <footer className="border-t border-border/60 bg-white/60 backdrop-blur-sm mt-auto">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 md:pb-10 pb-20">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {footerLinks.map((link: { label: string; href: string }) => (
            <Link
              key={link.label}
              href={link.href}
              className="transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{disclaimerText}</p>
        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {copyrightText}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}




















