/**
 * @file legacy-content.ts
 * @description 레거시 아카이브 더미 데이터 및 헬퍼.
 *
 * 실제 Supabase 테이블 연동 전까지 화면 구성을 위한 임시 데이터를 제공합니다.
 * 영상/문서/대체재료 정보를 한곳에서 관리하여 스토리북·테스트에서 재사용 가능합니다.
 */

import {
  LegacyDocument,
  LegacyIngredient,
  LegacyPerson,
  LegacyTool,
  LegacyVideo,
  ReplacementGuide,
} from "@/types/legacy";

const masters: Record<string, LegacyPerson> = {
  jang: {
    name: "김연자 명인",
    region: "경북 안동",
    title: "안동 전통 장 명인",
  },
  hanjeongsik: {
    name: "박정희 장인",
    region: "전남 담양",
    title: "한정식 셰프",
  },
};

export const legacyVideos: LegacyVideo[] = [
  {
    id: "vid-001",
    slug: "traditional-soybean-paste",
    title: "전통 장 담그기",
    description:
      "100년 간 이어온 장독대 비법과 대체 재료 활용 팁을 소개합니다.",
    durationMinutes: 32,
    region: "경북 안동",
    era: "조선 후기",
    ingredients: ["된장", "천일염", "메주"],
    thumbnail: "/legacy/jang-thumbnail.jpg",
    videoUrl: "https://example.com/videos/jang.mp4",
    premiumOnly: true,
    master: masters.jang,
    tags: ["발효", "장류", "명인"],
  },
  {
    id: "vid-002",
    slug: "jeolla-hanjeongsik",
    title: "전라도 한정식 상차림",
    description:
      "산지 직송 식재료로 담아낸 전라도 한정식 코스 10가지를 소개합니다.",
    durationMinutes: 27,
    region: "전남 담양",
    era: "근현대",
    ingredients: ["표고버섯", "들기름", "대파"],
    thumbnail: "/legacy/hanjeongsik-thumbnail.jpg",
    videoUrl: "https://example.com/videos/hanjeongsik.mp4",
    premiumOnly: false,
    master: masters.hanjeongsik,
    tags: ["한정식", "코스요리"],
  },
];

const jangIngredients: LegacyIngredient[] = [
  {
    name: "안동 메주",
    description: "안동산 콩으로 띄운 메주, 발효 향이 깊다.",
    authenticityNotes: "동절기에 띄운 메주만 사용.",
  },
  {
    name: "천일염",
    description: "3년 이상 간수를 뺀 천일염",
    authenticityNotes: "염도가 낮아 발효가 안정적.",
  },
];

const jangTools: LegacyTool[] = [
  {
    name: "옹기 장독",
    usage: "장 숙성/보관",
    modernAlternatives: ["스테인리스 발효통"],
  },
  {
    name: "죽부인 체",
    usage: "콩 거르기",
    modernAlternatives: ["스테인리스 체"],
  },
];

export const legacyDocuments: LegacyDocument[] = [
  {
    id: "doc-001",
    title: "안동 전통 된장 제조 기록",
    summary:
      "메주 띄우기부터 장독 숙성까지 4계절에 걸친 장 담그기 프로세스를 문서화.",
    region: "경북 안동",
    era: "조선 후기",
    ingredients: jangIngredients,
    tools: jangTools,
    source: {
      author: "맛의 아카이브 리서치팀",
      publishedAt: "2025-10-01",
      reference: "경북문화재단-001",
    },
    steps: [
      {
        order: 1,
        content: "국내산 콩을 12시간 불린 뒤 삶아 으깬다.",
      },
      {
        order: 2,
        content: "짚으로 감싸 20일간 발효시켜 메주를 완성한다.",
      },
      {
        order: 3,
        content: "메주를 천일염 물에 담가서 발효시키고 장독에 옮긴다.",
      },
    ],
  },
];

export const replacementGuides: ReplacementGuide[] = [
  {
    traditional: {
      name: "안동 메주",
      description: "안동산 콩 + 전통 온돌방 숙성",
    },
    modern: {
      name: "국산 메주 블록",
      availability: "전통 시장 / 온라인",
    },
    tips: [
      "전통 메주보다 향이 약하므로 소금량을 5% 줄여 조절",
      "실내온도가 5℃ 낮으면 숙성 기간을 1.2배 늘린다",
    ],
  },
];

export const legacyFilters = {
  regions: ["경북 안동", "전남 담양", "제주", "서울"],
  eras: ["조선 후기", "근현대", "1960s"],
  ingredients: ["된장", "천일염", "메주", "표고버섯", "들기름"],
};

