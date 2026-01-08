/**
 * @file actions/admin/copy/slots.ts
 * @description 홈페이지 텍스트 슬롯 마스터 데이터
 *
 * 주요 기능:
 * 1. 홈페이지의 모든 텍스트 위치 정의
 * 2. 각 슬롯의 기본값 및 설명 제공
 * 3. 새 블록 생성 시 슬롯 선택 UI에서 사용
 */

export interface TextSlot {
  slug: string;
  section: string;
  label: string;
  description: string;
  defaultContent: Record<string, any>;
  location: string; // 실제 파일 경로 또는 컴포넌트 위치
  isExisting?: boolean; // 이미 생성된 블록인지 여부
}

/**
 * 홈페이지 텍스트 슬롯 정의
 */
export const TEXT_SLOTS: TextSlot[] = [
  // Hero 섹션
  {
    slug: "hero-badge",
    section: "Hero 섹션",
    label: "상단 배지",
    description: "히어로 섹션 상단의 베타 배지 텍스트",
    defaultContent: {
      text: "Flavor Archive Beta",
    },
    location: "components/home/hero-section.tsx:105",
  },
  {
    slug: "hero-title",
    section: "Hero 섹션",
    label: "메인 타이틀",
    description: "홈페이지 메인 타이틀 (최상단 큰 제목)",
    defaultContent: {
      title: "잊혀진 손맛을 연결하는 디지털 식탁",
      subtitle: "전통과 현대를 잇는 레시피 아카이브",
    },
    location: "components/home/hero-section.tsx:110-113",
    isExisting: true, // 이미 생성된 블록
  },
  {
    slug: "hero-description",
    section: "Hero 섹션",
    label: "서브타이틀 / 설명",
    description: "메인 타이틀 아래의 설명 문구",
    defaultContent: {
      text: "명인의 전통 레시피부터 건강 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요.",
    },
    location: "components/home/hero-section.tsx:117-120",
    isExisting: true, // 이미 생성된 블록
  },
  {
    slug: "hero-search-placeholder",
    section: "Hero 섹션",
    label: "검색창 Placeholder",
    description: "메인 검색창의 placeholder 텍스트",
    defaultContent: {
      text: "레시피, 명인, 재료를 검색해보세요",
    },
    location: "components/home/hero-section.tsx:129",
  },
  {
    slug: "hero-search-button",
    section: "Hero 섹션",
    label: "검색 버튼",
    description: "검색 버튼 텍스트",
    defaultContent: {
      text: "검색",
    },
    location: "components/home/hero-section.tsx:140-142",
  },
  
  // Quick Start 섹션
  {
    slug: "quick-start-recipe",
    section: "빠른 시작",
    label: "현대 레시피 아카이브 카드",
    description: "빠른 시작 - 현대 레시피 아카이브 섹션",
    defaultContent: {
      title: "📚 현대 레시피 아카이브",
      description: "별점과 난이도로 정리된 최신 레시피를 확인해요.",
      href: "/recipes",
    },
    location: "components/home/hero-section.tsx:30-34",
  },
  {
    slug: "quick-start-royal",
    section: "빠른 시작",
    label: "궁중 레시피 아카이브 카드",
    description: "빠른 시작 - 궁중 레시피 아카이브 섹션",
    defaultContent: {
      title: "👑 궁중 레시피 아카이브",
      description: "삼국시대부터 조선시대까지 전통 궁중 음식 레시피를 만나보세요.",
      href: "/royal-recipes",
    },
    location: "components/home/hero-section.tsx:36-40",
  },
  {
    slug: "quick-start-diet",
    section: "빠른 시작",
    label: "건강 맞춤 식단 카드",
    description: "빠른 시작 - 건강 맞춤 식단 섹션",
    defaultContent: {
      title: "🤖 건강 맞춤 식단",
      description: "건강 정보를 기반으로 개인 맞춤 식단을 추천받아요.",
      href: "/diet",
    },
    location: "components/home/hero-section.tsx:36-40",
  },
  {
    slug: "quick-start-weekly",
    section: "빠른 시작",
    label: "주간 식단 카드",
    description: "빠른 시작 - 주간 식단 섹션",
    defaultContent: {
      title: "📅 주간 식단",
      description: "7일간의 식단을 한눈에 확인하고 장보기 리스트를 관리하세요.",
      href: "/diet/weekly",
    },
    location: "components/home/hero-section.tsx:42-47",
  },
  {
    slug: "quick-start-storybook",
    section: "빠른 시작",
    label: "장고의 음식 동화 카드",
    description: "빠른 시작 - 장고의 음식 동화 섹션",
    defaultContent: {
      title: "📖 장고의 음식 동화",
      description: "전통 음식의 탄생과 역사를 동화처럼 들려주는 이야기입니다.",
      href: "/storybook",
    },
    location: "components/home/hero-section.tsx",
  },
  {
    slug: "hero-background-image",
    section: "Hero 섹션",
    label: "배경 이미지 URL",
    description: "히어로 섹션 배경 이미지 URL",
    defaultContent: {
      imageUrl: null,
    },
    location: "components/home/hero-section.tsx:82-101",
  },

  // Footer 섹션
  {
    slug: "footer-about",
    section: "Footer",
    label: "회사 소개",
    description: "Footer의 회사 소개 텍스트",
    defaultContent: {
      text: "맛의 아카이브는 전통 요리 문화의 보존과 현대인의 건강한 식생활을 위한 플랫폼입니다.",
    },
    location: "components/footer.tsx",
    isExisting: true, // 이미 생성된 블록
  },
  {
    slug: "footer-company-menu",
    section: "Footer",
    label: "회사 메뉴",
    description: "Footer의 회사 관련 메뉴 링크",
    defaultContent: {
      links: [
        { label: "회사소개", href: "/about" },
        { label: "이용약관", href: "/terms" },
        { label: "개인정보처리방침", href: "/privacy" },
        { label: "문의하기", href: "mailto:hello@flavor-archive.com" },
      ],
    },
    location: "components/footer.tsx:15-20",
  },
  {
    slug: "footer-disclaimer",
    section: "Footer",
    label: "의료 면책 조항",
    description: "Footer의 의료 면책 조항 텍스트",
    defaultContent: {
      text: "의료 면책 조항: 본 서비스는 건강 관리 보조 수단이며 전문적인 진료를 대체하지 않습니다. 자세한 내용은 전문의와 상담해 주세요.",
    },
    location: "components/footer.tsx",
  },
  {
    slug: "footer-copyright",
    section: "Footer",
    label: "저작권 텍스트",
    description: "Footer의 저작권 텍스트",
    defaultContent: {
      text: "맛의 아카이브 (Flavor Archive)",
    },
    location: "components/footer.tsx:42-43",
  },

  // Recipe Section
  {
    slug: "recipe-section-title",
    section: "Recipe Section",
    label: "레시피 섹션 제목",
    description: "홈페이지 레시피 섹션 제목",
    defaultContent: {
      title: "🍴 현대 레시피 아카이브",
    },
    location: "components/recipes/recipe-section.tsx:40",
  },
  {
    slug: "recipe-section-description",
    section: "Recipe Section",
    label: "레시피 섹션 설명",
    description: "홈페이지 레시피 섹션 설명",
    defaultContent: {
      description: "별점과 난이도로 정리된 최신 레시피를 확인해보세요",
    },
    location: "components/recipes/recipe-section.tsx:40",
  },
  {
    slug: "recipe-section-button",
    section: "Recipe Section",
    label: "레시피 섹션 버튼 텍스트",
    description: "레시피 섹션 '전체 보기' 버튼 텍스트",
    defaultContent: {
      text: "레시피 아카이브 전체 보기",
    },
    location: "components/recipes/recipe-section.tsx:51",
  },

  // Diet Section
  {
    slug: "diet-section-title",
    section: "Diet Section",
    label: "식단 섹션 제목",
    description: "홈페이지 건강 맞춤 식단 섹션 제목",
    defaultContent: {
      title: "🧠 건강 맞춤 식단 큐레이션",
    },
    location: "components/health/diet-section.tsx:20",
  },
  {
    slug: "diet-section-description",
    section: "Diet Section",
    label: "식단 섹션 설명",
    description: "홈페이지 건강 맞춤 식단 섹션 설명",
    defaultContent: {
      description: "건강 정보를 기반으로 개인 맞춤 식단을 추천해드립니다",
    },
    location: "components/health/diet-section.tsx:21",
  },


  // 메타데이터
  {
    slug: "meta-title",
    section: "메타데이터",
    label: "페이지 제목",
    description: "브라우저 탭에 표시되는 페이지 제목",
    defaultContent: {
      text: "Flavor Archive | 잊혀진 손맛을 연결하는 디지털 식탁",
    },
    location: "app/layout.tsx:39",
  },
  {
    slug: "meta-description",
    section: "메타데이터",
    label: "페이지 설명",
    description: "검색 엔진에 표시되는 페이지 설명",
    defaultContent: {
      text: "전통과 현대를 잇는 레시피 아카이브. 명인 인터뷰, 현대 레시피, 건강 맞춤 식단 추천을 한 곳에서 확인하세요.",
    },
    location: "app/layout.tsx:40-41",
  },
];

/**
 * 슬롯 섹션별 그룹화
 */
export function getSlotsBySection(): Record<string, TextSlot[]> {
  const grouped: Record<string, TextSlot[]> = {};
  
  TEXT_SLOTS.forEach((slot) => {
    if (!grouped[slot.section]) {
      grouped[slot.section] = [];
    }
    grouped[slot.section].push(slot);
  });
  
  return grouped;
}

/**
 * slug로 슬롯 찾기
 */
export function getSlotBySlug(slug: string): TextSlot | undefined {
  return TEXT_SLOTS.find((slot) => slot.slug === slug);
}

/**
 * 사용 가능한 슬롯만 필터링 (이미 생성되지 않은 것)
 */
export function getAvailableSlots(existingSlugs: string[]): TextSlot[] {
  return TEXT_SLOTS.filter((slot) => !existingSlugs.includes(slot.slug));
}









