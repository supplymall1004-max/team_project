/**
 * @file lib/health/vaccination-analyzer.ts
 * @description 예방접종 데이터 분석 유틸리티
 * 
 * 질병청 API에서 받아온 예방접종 데이터를 분석하여
 * 주기별로 정리하고 docs/defence.md 형식으로 문서화합니다.
 */

import { fetchKcdcData } from "@/lib/kcdc/kcdc-parser";
import type { KcdcApiResponse } from "@/types/kcdc";

export interface VaccinationAnalysis {
  byAge: {
    infant: VaccinationItem[];
    adolescent: VaccinationItem[];
    adult: VaccinationItem[];
    elderly: VaccinationItem[];
  };
  bySituation: {
    std: VaccinationItem[];
    travel: VaccinationItem[];
    seasonal: VaccinationItem[];
  };
  bySeason: {
    spring: VaccinationItem[];
    summer: VaccinationItem[];
    autumn: VaccinationItem[];
    winter: VaccinationItem[];
  };
  all: VaccinationItem[];
  stats: {
    total: number;
    byAge: Record<string, number>;
    bySituation: Record<string, number>;
    bySeason: Record<string, number>;
  };
}

export interface VaccinationItem {
  name: string;
  targetAgeGroup?: string;
  recommendedDate?: string;
  description: string;
  publishedAt: string;
  category?: string[];
}

/**
 * 예방접종 데이터 분석
 */
export async function analyzeVaccinations(): Promise<VaccinationAnalysis> {
  console.group("[VaccinationAnalyzer] 예방접종 데이터 분석 시작");

  try {
    // 1. 질병청 API에서 데이터 가져오기
    const kcdcData = await fetchKcdcData();
    const vaccinations = kcdcData.vaccinations || [];

    console.log(`📊 질병청 API에서 ${vaccinations.length}건의 예방접종 데이터 수신`);

    // 2. 초기화
    const analysis: VaccinationAnalysis = {
      byAge: {
        infant: [],
        adolescent: [],
        adult: [],
        elderly: [],
      },
      bySituation: {
        std: [],
        travel: [],
        seasonal: [],
      },
      bySeason: {
        spring: [],
        summer: [],
        autumn: [],
        winter: [],
      },
      all: [],
      stats: {
        total: 0,
        byAge: {},
        bySituation: {},
        bySeason: {},
      },
    };

    // 3. 각 예방접종 분석
    for (const vaccine of vaccinations) {
      const item: VaccinationItem = {
        name: vaccine.name,
        targetAgeGroup: vaccine.targetAgeGroup,
        recommendedDate: vaccine.recommendedDate,
        description: vaccine.description,
        publishedAt: vaccine.publishedAt,
        category: [],
      };

      // 생애주기별 분류
      const ageCategory = categorizeByAge(vaccine.name, vaccine.targetAgeGroup);
      if (ageCategory) {
        analysis.byAge[ageCategory].push(item);
        item.category?.push(ageCategory);
        analysis.stats.byAge[ageCategory] = (analysis.stats.byAge[ageCategory] || 0) + 1;
      }

      // 상황별 분류
      const situationCategory = categorizeBySituation(vaccine.name);
      if (situationCategory) {
        analysis.bySituation[situationCategory].push(item);
        item.category?.push(situationCategory);
        analysis.stats.bySituation[situationCategory] = (analysis.stats.bySituation[situationCategory] || 0) + 1;
      }

      // 계절별 분류
      const seasonCategory = categorizeBySeason(vaccine.name);
      if (seasonCategory) {
        analysis.bySeason[seasonCategory].push(item);
        item.category?.push(seasonCategory);
        analysis.stats.bySeason[seasonCategory] = (analysis.stats.bySeason[seasonCategory] || 0) + 1;
      }

      // 전체 목록에 추가
      analysis.all.push(item);
    }

    // 4. 통계 계산
    analysis.stats.total = vaccinations.length;

    console.log("✅ 예방접종 데이터 분석 완료:", analysis.stats);
    console.groupEnd();

    return analysis;
  } catch (error) {
    console.error("❌ 예방접종 데이터 분석 실패:", error);
    console.groupEnd();
    throw error;
  }
}

/**
 * 생애주기별 분류
 */
function categorizeByAge(
  vaccineName: string,
  targetAgeGroup?: string
): 'infant' | 'adolescent' | 'adult' | 'elderly' | null {
  const name = vaccineName.toLowerCase();
  const age = targetAgeGroup?.toLowerCase() || '';

  // 영유아기 (0-6세)
  if (
    name.includes('bcg') ||
    name.includes('dtap') ||
    name.includes('mmr') ||
    name.includes('수두') ||
    name.includes('로타') ||
    name.includes('폐렴구균') ||
    (name.includes('일본뇌염') && !age.includes('성인')) ||
    age.includes('영유아') ||
    age.includes('소아')
  ) {
    return 'infant';
  }

  // 청소년기 (11-18세)
  if (
    name.includes('hpv') ||
    (name.includes('tdap') && age.includes('청소년')) ||
    (name.includes('수막구균') && age.includes('청소년')) ||
    age.includes('청소년')
  ) {
    return 'adolescent';
  }

  // 노년기 (65세 이상)
  if (
    (name.includes('폐렴구균') && age.includes('노인')) ||
    name.includes('대상포진') ||
    age.includes('노인') ||
    age.includes('어르신')
  ) {
    return 'elderly';
  }

  // 성인기 (19-64세) - 기본값
  if (age.includes('성인') || age.includes('전체') || !age) {
    return 'adult';
  }

  return null;
}

/**
 * 상황별 분류
 */
function categorizeBySituation(vaccineName: string): 'std' | 'travel' | 'seasonal' | null {
  const name = vaccineName.toLowerCase();

  // 성병 예방
  if (name.includes('hpv') || name.includes('b형 간염')) {
    return 'std';
  }

  // 해외여행
  if (
    name.includes('황열') ||
    name.includes('콜레라') ||
    name.includes('장티푸스') ||
    name.includes('공수병') ||
    name.includes('광견병') ||
    (name.includes('수막구균') && name.includes('여행'))
  ) {
    return 'travel';
  }

  // 계절 백신
  if (name.includes('독감') || name.includes('인플루엔자') || name.includes('코로나')) {
    return 'seasonal';
  }

  return null;
}

/**
 * 계절별 분류
 */
function categorizeBySeason(vaccineName: string): 'spring' | 'summer' | 'autumn' | 'winter' | null {
  const name = vaccineName.toLowerCase();

  // 봄 (3-5월)
  if (name.includes('mmr') || name.includes('수두') || name.includes('유행성 출혈열')) {
    return 'spring';
  }

  // 여름 (6-8월)
  if (name.includes('일본뇌염') || name.includes('a형 간염') || name.includes('장티푸스')) {
    return 'summer';
  }

  // 가을/겨울 (10-2월)
  if (name.includes('독감') || name.includes('인플루엔자') || name.includes('코로나') || name.includes('폐렴구균')) {
    return 'autumn'; // 가을에 접종 시작
  }

  return null;
}

/**
 * 분석 결과를 마크다운 형식으로 변환
 */
export function formatAnalysisAsMarkdown(analysis: VaccinationAnalysis): string {
  let markdown = `# 질병청 API 예방접종 데이터 분석 결과\n\n`;
  markdown += `**분석 일시:** ${new Date().toLocaleString('ko-KR')}\n`;
  markdown += `**총 예방접종 수:** ${analysis.stats.total}건\n\n`;

  // 생애주기별
  markdown += `## 생애주기별 예방접종\n\n`;
  markdown += `### 영유아기 (출생 ~ 6세)\n`;
  markdown += `총 ${analysis.byAge.infant.length}건\n\n`;
  for (const item of analysis.byAge.infant) {
    markdown += `- **${item.name}**`;
    if (item.targetAgeGroup) markdown += ` (${item.targetAgeGroup})`;
    if (item.recommendedDate) markdown += ` - 권장일: ${item.recommendedDate}`;
    markdown += `\n`;
  }
  markdown += `\n`;

  markdown += `### 청소년기 (11세 ~ 18세)\n`;
  markdown += `총 ${analysis.byAge.adolescent.length}건\n\n`;
  for (const item of analysis.byAge.adolescent) {
    markdown += `- **${item.name}**`;
    if (item.targetAgeGroup) markdown += ` (${item.targetAgeGroup})`;
    if (item.recommendedDate) markdown += ` - 권장일: ${item.recommendedDate}`;
    markdown += `\n`;
  }
  markdown += `\n`;

  markdown += `### 성인기 (19세 ~ 64세)\n`;
  markdown += `총 ${analysis.byAge.adult.length}건\n\n`;
  for (const item of analysis.byAge.adult) {
    markdown += `- **${item.name}**`;
    if (item.targetAgeGroup) markdown += ` (${item.targetAgeGroup})`;
    if (item.recommendedDate) markdown += ` - 권장일: ${item.recommendedDate}`;
    markdown += `\n`;
  }
  markdown += `\n`;

  markdown += `### 노년기 (65세 이상)\n`;
  markdown += `총 ${analysis.byAge.elderly.length}건\n\n`;
  for (const item of analysis.byAge.elderly) {
    markdown += `- **${item.name}**`;
    if (item.targetAgeGroup) markdown += ` (${item.targetAgeGroup})`;
    if (item.recommendedDate) markdown += ` - 권장일: ${item.recommendedDate}`;
    markdown += `\n`;
  }
  markdown += `\n`;

  // 상황별
  markdown += `## 상황별 예방접종\n\n`;
  markdown += `### 성병 및 생식기 질환 예방\n`;
  markdown += `총 ${analysis.bySituation.std.length}건\n\n`;
  for (const item of analysis.bySituation.std) {
    markdown += `- **${item.name}**: ${item.description}\n`;
  }
  markdown += `\n`;

  markdown += `### 해외여행\n`;
  markdown += `총 ${analysis.bySituation.travel.length}건\n\n`;
  for (const item of analysis.bySituation.travel) {
    markdown += `- **${item.name}**: ${item.description}\n`;
  }
  markdown += `\n`;

  markdown += `### 계절 백신\n`;
  markdown += `총 ${analysis.bySituation.seasonal.length}건\n\n`;
  for (const item of analysis.bySituation.seasonal) {
    markdown += `- **${item.name}**: ${item.description}\n`;
  }
  markdown += `\n`;

  // 계절별
  markdown += `## 계절별 예방접종\n\n`;
  const seasons = [
    { key: 'spring', name: '봄 (3-5월)' },
    { key: 'summer', name: '여름 (6-8월)' },
    { key: 'autumn', name: '가을 (9-11월)' },
    { key: 'winter', name: '겨울 (12-2월)' },
  ];

  for (const season of seasons) {
    const items = analysis.bySeason[season.key as keyof typeof analysis.bySeason];
    markdown += `### ${season.name}\n`;
    markdown += `총 ${items.length}건\n\n`;
    for (const item of items) {
      markdown += `- **${item.name}**: ${item.description}\n`;
    }
    markdown += `\n`;
  }

  return markdown;
}

