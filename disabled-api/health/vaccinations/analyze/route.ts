/**
 * @file app/api/health/vaccinations/analyze/route.ts
 * @description 질병청 API 예방접종 데이터 분석 및 주기별 정리
 * 
 * 질병청 API에서 받아온 예방접종 데이터를 분석하여
 * 생애주기별, 상황별, 계절별로 정리합니다.
 */

import { NextRequest, NextResponse } from "next/server";
import { fetchKcdcData } from "@/lib/kcdc/kcdc-parser";

/**
 * 예방접종 데이터를 주기별로 분류
 */
interface VaccinationByPeriod {
  lifecycle: {
    infant: Array<{ name: string; age: string; description: string }>;
    adolescent: Array<{ name: string; age: string; description: string }>;
    adult: Array<{ name: string; age: string; description: string }>;
    elderly: Array<{ name: string; age: string; description: string }>;
  };
  situation: {
    std: Array<{ name: string; description: string }>;
    travel: Array<{ name: string; region: string; description: string }>;
    seasonal: Array<{ name: string; season: string; description: string }>;
  };
  all: Array<{
    name: string;
    targetAgeGroup: string;
    recommendedDate?: string;
    description: string;
    publishedAt: string;
  }>;
}

/**
 * 백신명에서 생애주기 추출
 */
function categorizeByLifecycle(vaccineName: string, targetAgeGroup?: string): 'infant' | 'adolescent' | 'adult' | 'elderly' | null {
  const name = vaccineName.toLowerCase();
  const age = targetAgeGroup?.toLowerCase() || '';

  // 영유아기 (0-6세)
  if (name.includes('bcg') || name.includes('dtap') || name.includes('mmr') || 
      name.includes('수두') || name.includes('로타') || name.includes('폐렴구균') ||
      name.includes('일본뇌염') || age.includes('영유아') || age.includes('소아')) {
    return 'infant';
  }

  // 청소년기 (11-18세)
  if (name.includes('hpv') || name.includes('tdap') || name.includes('수막구균') ||
      age.includes('청소년')) {
    return 'adolescent';
  }

  // 노년기 (65세 이상)
  if (name.includes('폐렴구균') && age.includes('노인') || 
      name.includes('대상포진') || age.includes('노인') || age.includes('어르신')) {
    return 'elderly';
  }

  // 성인기 (19-64세)
  if (age.includes('성인') || age.includes('전체')) {
    return 'adult';
  }

  return null;
}

/**
 * 백신명에서 상황 추출
 */
function categorizeBySituation(vaccineName: string): 'std' | 'travel' | 'seasonal' | null {
  const name = vaccineName.toLowerCase();

  // 성병 예방
  if (name.includes('hpv') || name.includes('b형 간염')) {
    return 'std';
  }

  // 해외여행
  if (name.includes('황열') || name.includes('콜레라') || name.includes('장티푸스') ||
      name.includes('공수병') || name.includes('광견병') || name.includes('수막구균')) {
    return 'travel';
  }

  // 계절 백신
  if (name.includes('독감') || name.includes('인플루엔자') || name.includes('코로나')) {
    return 'seasonal';
  }

  return null;
}

/**
 * 백신명에서 계절 추출
 */
function extractSeason(vaccineName: string): string | null {
  const name = vaccineName.toLowerCase();

  if (name.includes('독감') || name.includes('인플루엔자') || name.includes('코로나')) {
    return '가을/겨울';
  }
  if (name.includes('일본뇌염') || name.includes('a형 간염') || name.includes('장티푸스')) {
    return '여름';
  }
  if (name.includes('mmr') || name.includes('수두') || name.includes('유행성 출혈열')) {
    return '봄';
  }

  return null;
}

/**
 * GET /api/health/vaccinations/analyze
 * 질병청 API 예방접종 데이터 분석
 */
export async function GET(request: NextRequest) {
  try {
    console.group("[API] GET /api/health/vaccinations/analyze");

    // 1. 질병청 API에서 데이터 가져오기
    const kcdcData = await fetchKcdcData();
    const vaccinations = kcdcData.vaccinations || [];

    console.log(`📊 질병청 API에서 ${vaccinations.length}건의 예방접종 데이터 수신`);

    // 2. 주기별로 분류
    const categorized: VaccinationByPeriod = {
      lifecycle: {
        infant: [],
        adolescent: [],
        adult: [],
        elderly: [],
      },
      situation: {
        std: [],
        travel: [],
        seasonal: [],
      },
      all: [],
    };

    for (const vaccine of vaccinations) {
      // 전체 목록에 추가
      categorized.all.push({
        name: vaccine.name,
        targetAgeGroup: vaccine.targetAgeGroup || '전체',
        recommendedDate: vaccine.recommendedDate,
        description: vaccine.description,
        publishedAt: vaccine.publishedAt,
      });

      // 생애주기별 분류
      const lifecycle = categorizeByLifecycle(vaccine.name, vaccine.targetAgeGroup);
      if (lifecycle) {
        const ageInfo = vaccine.recommendedDate 
          ? `${vaccine.targetAgeGroup || '전체'} (권장일: ${vaccine.recommendedDate})`
          : vaccine.targetAgeGroup || '전체';
        
        categorized.lifecycle[lifecycle].push({
          name: vaccine.name,
          age: ageInfo,
          description: vaccine.description,
        });
      }

      // 상황별 분류
      const situation = categorizeBySituation(vaccine.name);
      if (situation === 'std') {
        categorized.situation.std.push({
          name: vaccine.name,
          description: vaccine.description,
        });
      } else if (situation === 'travel') {
        // 지역 정보는 백신명에서 추출 (간단한 매핑)
        let region = '전체';
        if (vaccine.name.includes('황열')) region = '아프리카, 중남미';
        if (vaccine.name.includes('장티푸스')) region = '동남아시아';
        if (vaccine.name.includes('콜레라')) region = '남아시아';

        categorized.situation.travel.push({
          name: vaccine.name,
          region,
          description: vaccine.description,
        });
      } else if (situation === 'seasonal') {
        const season = extractSeason(vaccine.name) || '연중';
        categorized.situation.seasonal.push({
          name: vaccine.name,
          season,
          description: vaccine.description,
        });
      }
    }

    // 3. 통계 정보
    const stats = {
      total: vaccinations.length,
      byLifecycle: {
        infant: categorized.lifecycle.infant.length,
        adolescent: categorized.lifecycle.adolescent.length,
        adult: categorized.lifecycle.adult.length,
        elderly: categorized.lifecycle.elderly.length,
      },
      bySituation: {
        std: categorized.situation.std.length,
        travel: categorized.situation.travel.length,
        seasonal: categorized.situation.seasonal.length,
      },
    };

    console.log("✅ 예방접종 데이터 분석 완료:", stats);
    console.groupEnd();

    return NextResponse.json({
      success: true,
      data: categorized,
      stats,
      source: 'kcdc',
      analyzedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 예방접종 데이터 분석 실패:", error);
    console.groupEnd();

    return NextResponse.json(
      {
        error: "Failed to analyze vaccination data",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}

