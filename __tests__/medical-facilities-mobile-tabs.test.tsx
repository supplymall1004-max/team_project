import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

/**
 * 이 테스트는 "의료시설 찾기" 페이지의 모바일 탭(목록/지도)의
 * 글자 대비(가독성) 관련 클래스가 의도대로 유지되는지 확인합니다.
 *
 * - 페이지는 위치/지도/리스트 등 외부 의존성이 많아서, 테스트에서는 전부 mock 처리합니다.
 * - 핵심 요구사항: 비활성 탭도 글씨가 "잘 보이게" 충분히 진한 색/두께를 사용한다.
 */

vi.mock("@/components/health/medical-facilities/map-view", () => ({
  MapView: () => <div data-testid="mock-map-view" />,
}));

vi.mock("@/components/health/medical-facilities/facility-card-list", () => ({
  FacilityCardList: () => <div data-testid="mock-facility-card-list" />,
}));

vi.mock("@/components/health/medical-facilities/location-search", () => ({
  LocationSearch: () => <div data-testid="mock-location-search" />,
}));

vi.mock("@/components/health/medical-facilities/location-permission-guide", () => ({
  LocationPermissionGuide: () => <div data-testid="mock-location-permission" />,
}));

vi.mock("@/components/health/medical-facilities/naver-more-links-section", () => ({
  NaverMoreLinksSection: () => <div data-testid="mock-naver-more-links" />,
}));

vi.mock("@/components/loading-spinner", () => ({
  LoadingSpinner: () => <div data-testid="mock-loading-spinner" />,
}));

vi.mock("@/lib/health/medical-facilities/location-utils", () => ({
  // 초기 useEffect에서 호출되는 위치 조회를 null로 반환 -> 기본 위치로 진행
  getUserLocation: vi.fn(async () => null),
  // 기본 위치는 아무 값이나 고정
  getDefaultLocation: vi.fn(() => ({ lat: 37.5665, lon: 126.978 })),
  calculateDistance: vi.fn(() => 0),
}));

// 페이지 내부 fetch가 실행되더라도 테스트가 깨지지 않도록 방어
// (실제 UI 테스트 목적이 아니므로 최소한의 mock)
const fetchMock = vi.fn(async () => ({
  ok: true,
  json: async () => ({ success: true, data: { facilities: [] } }),
  text: async () => "",
}));
// @ts-expect-error - test double for global fetch
globalThis.fetch = fetchMock;

// 페이지가 "결과 없음" 에러를 로그로 찍는 것을 테스트 출력에서 숨김(의도된 흐름)
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

import MedicalFacilitiesPage from "@/app/(dashboard)/health/emergency/medical-facilities/page";

describe("MedicalFacilitiesPage - 모바일 탭(목록/지도) 가독성", () => {
  it("비활성 탭도 진한 글자색/두께 클래스를 가진다", async () => {
    render(<MedicalFacilitiesPage />);

    // 초기 useEffect(위치 초기화/검색)로 인해 상태 업데이트가 발생하므로
    // 버튼이 안정적으로 렌더링될 때까지 대기하여 act 경고를 방지합니다.
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /목록/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /지도/i })).toBeInTheDocument();
    });

    const listButton = screen.getByRole("button", { name: /목록/i });
    const mapButton = screen.getByRole("button", { name: /지도/i });

    // 기본 viewMode는 "list" -> 지도 탭이 비활성
    expect(listButton.className).toContain("bg-primary-blue");
    expect(listButton.className).toContain("text-white");

    // 비활성 탭도 충분히 진한 색/두께를 사용해야 한다
    expect(mapButton.className).toContain("font-semibold");
    expect(mapButton.className).toContain("text-gray-800");
    expect(mapButton.className).toContain("dark:text-gray-100");
  });
});

