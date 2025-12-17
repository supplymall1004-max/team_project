import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { geocodeAddress } from "@/lib/naver/geocoding-api";

/**
 * @description
 * 행정구역 단위(예: "인천광역시 미추홀구")는 네이버 지오코딩에서
 * 결과가 비거나(주소 없음) 매칭이 약한 경우가 있어, 보정 쿼리로 재시도합니다.
 *
 * 이 테스트는:
 * - 1차 요청 결과가 비어있으면
 * - 2차 요청에서 "구청"을 붙인 쿼리로 재시도하는지
 * 를 검증합니다.
 */

describe("geocodeAddress", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.NAVER_CLIENT_ID = "test-id";
    process.env.NAVER_CLIENT_SECRET = "test-secret";
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("행정구역 검색 결과가 비면 '구청'을 붙여 재시도한다", async () => {
    const fetchMock = vi
      .fn()
      // 1차: OK지만 addresses 비어있음
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({ status: "OK", addresses: [] }),
      })
      // 2차: 정상 응답
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "application/json" },
        json: async () => ({
          status: "OK",
          addresses: [
            {
              roadAddress: "인천광역시 미추홀구 독정로 123",
              jibunAddress: "인천광역시 미추홀구",
              x: "126.67",
              y: "37.46",
            },
          ],
        }),
      });

    // @ts-expect-error - test double for global fetch
    globalThis.fetch = fetchMock;

    const result = await geocodeAddress("인천광역시 미추홀구");

    expect(result).not.toBeNull();
    expect(result?.lat).toBeCloseTo(37.46, 5);
    expect(result?.lon).toBeCloseTo(126.67, 5);

    // 2번 호출되었고, 두 번째 쿼리에 "구청"이 포함되어야 한다
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const secondUrl = String(fetchMock.mock.calls[1]?.[0] ?? "");
    expect(secondUrl).toContain(encodeURIComponent("미추홀구청"));
    expect(secondUrl).not.toContain(encodeURIComponent("미추홀구구청"));
  });
});

