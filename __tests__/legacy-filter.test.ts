import { describe, expect, it } from "vitest";

import {
  extractLegacyFilterOptions,
  filterLegacyVideos,
} from "@/lib/legacy/filter";
import { LegacyFilterState, LegacyVideo } from "@/types/legacy";

const sampleVideos: LegacyVideo[] = [
  {
    id: "1",
    slug: "jeonju-bibimbap",
    title: "전주 비빔밥",
    description: "전주에서 먹는 바로 그 맛",
    durationMinutes: 18,
    region: "전북 전주",
    era: "근현대",
    ingredients: ["고사리", "콩나물", "고추장"],
    thumbnail: "",
    videoUrl: "",
    premiumOnly: false,
    master: { name: "홍길동", region: "전북 전주", title: "요리연구가" },
    tags: ["대표음식"],
  },
  {
    id: "2",
    slug: "andong-soy",
    title: "안동 간잽이 장",
    description: "안동 메주로 깊은 맛을 내는 장",
    durationMinutes: 35,
    region: "경북 안동",
    era: "조선 후기",
    ingredients: ["된장", "천일염", "메주"],
    thumbnail: "",
    videoUrl: "",
    premiumOnly: true,
    master: { name: "김연자", region: "경북 안동", title: "장인" },
    tags: ["발효"],
  },
  {
    id: "3",
    slug: "gongju-fermented-soy",
    title: "공주 전통 청국장",
    description: "짚 매트에서 띄운 청국장을 이용한 명품 반상",
    durationMinutes: 22,
    region: "충남 공주",
    era: "조선 후기",
    ingredients: ["국간장", "콩나물"],
    thumbnail: "",
    videoUrl: "",
    premiumOnly: false,
    master: { name: "유선희", region: "충남 공주", title: "청국장 명인" },
    tags: ["발효", "장류"],
  },
];

const defaultFilters: LegacyFilterState = {
  region: [],
  era: [],
  ingredients: [],
  searchTerm: "",
};

describe("filterLegacyVideos", () => {
  it("지역 필터가 비어있으면 모든 지역을 허용한다", () => {
    const result = filterLegacyVideos(sampleVideos, defaultFilters);
    expect(result.length).toBe(3);
  });

  it("여러 지역을 동시에 필터링한다", () => {
    const filters: LegacyFilterState = {
      ...defaultFilters,
      region: ["경북 안동"],
    };
    const result = filterLegacyVideos(sampleVideos, filters);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("andong-soy");
  });

  it("재료 필터와 검색어를 조합한다", () => {
    const filters: LegacyFilterState = {
      region: [],
      era: [],
      ingredients: ["된장", "천일염"],
      searchTerm: "안동",
    };
    const result = filterLegacyVideos(sampleVideos, filters);
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("andong-soy");
  });

  it("조건에 맞는 영상이 없으면 빈 배열을 반환한다", () => {
    const filters: LegacyFilterState = {
      region: ["서울"],
      era: [],
      ingredients: [],
      searchTerm: "",
    };
    expect(filterLegacyVideos(sampleVideos, filters)).toHaveLength(0);
  });
});

describe("extractLegacyFilterOptions", () => {
  it("영상 데이터에서 중복 없이 필터 옵션을 생성한다", () => {
    const options = extractLegacyFilterOptions(sampleVideos);
    expect(options.regions).toEqual(["경북 안동", "전북 전주", "충남 공주"]);
    expect(options.eras).toEqual(["근현대", "조선 후기"]);
    expect(options.ingredients).toEqual([
      "고사리",
      "고추장",
      "국간장",
      "된장",
      "메주",
      "천일염",
      "콩나물",
    ]);
  });
});

