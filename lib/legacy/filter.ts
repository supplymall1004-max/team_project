/**
 * @file filter.ts
 * @description 레거시 아카이브 콘텐츠 필터링/검색 유틸.
 *
 * TODO: 테스트 기반으로 실제 로직 구현.
 */

import { LegacyFilterState, LegacyVideo } from "@/types/legacy";

const normalize = (value: string) => value.trim().toLowerCase();

export function filterLegacyVideos(
  videos: LegacyVideo[],
  filters: LegacyFilterState,
): LegacyVideo[] {
  // 성능 최적화: 프로덕션에서는 로그 최소화
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed("[LegacyFilter] 필터 적용");
    console.log("filters", filters);
  }
  const searchKeyword = normalize(filters.searchTerm);
  const result = videos.filter((video) => {
    const matchesRegion =
      filters.region.length === 0 || filters.region.includes(video.region);
    const matchesEra =
      filters.era.length === 0 || filters.era.includes(video.era);
    const matchesIngredients =
      filters.ingredients.length === 0 ||
      filters.ingredients.every((ingredient) =>
        video.ingredients.includes(ingredient),
      );
    const matchesSearch =
      searchKeyword.length === 0 ||
      [video.title, video.description, video.master.name, video.region]
        .map(normalize)
        .some((field) => field.includes(searchKeyword));

    return matchesRegion && matchesEra && matchesIngredients && matchesSearch;
  });
  if (process.env.NODE_ENV === "development") {
    console.log("resultCount", result.length);
    console.groupEnd();
  }
  return result;
}

export interface LegacyFilterOptions {
  regions: string[];
  eras: string[];
  ingredients: string[];
}

const sortKorean = (values: string[]) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b, "ko"));

export function extractLegacyFilterOptions(
  videos: LegacyVideo[],
): LegacyFilterOptions {
  // 성능 최적화: 프로덕션에서는 로그 최소화
  if (process.env.NODE_ENV === "development") {
    console.groupCollapsed("[LegacyFilter] 필터 옵션 생성");
    console.log("videoCount", videos.length);
  }

  const regions = sortKorean(videos.map((video) => video.region));
  const eras = sortKorean(videos.map((video) => video.era));
  const ingredients = sortKorean(
    videos.flatMap((video) => video.ingredients),
  );

  const options = { regions, eras, ingredients };
  if (process.env.NODE_ENV === "development") {
    console.log("options", options);
    console.groupEnd();
  }
  return options;
}

