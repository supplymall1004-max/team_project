/**
 * @file season.ts
 * @description 계절 판단 유틸리티 함수
 * 
 * 계절 기간 정의:
 * - 봄: 3월 1일 ~ 5월 31일
 * - 여름: 6월 1일 ~ 8월 31일
 * - 가을: 9월 1일 ~ 11월 30일
 * - 겨울: 12월 1일 ~ 2월 28일(29일)
 */

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/**
 * 현재 날짜를 기준으로 계절을 반환합니다.
 * @param date - 판단할 날짜 (기본값: 현재 날짜)
 * @returns 현재 계절 ('spring' | 'summer' | 'autumn' | 'winter')
 */
export function getCurrentSeason(date: Date = new Date()): Season {
  const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 +1

  if (month >= 3 && month <= 5) {
    return 'spring';
  } else if (month >= 6 && month <= 8) {
    return 'summer';
  } else if (month >= 9 && month <= 11) {
    return 'autumn';
  } else {
    return 'winter';
  }
}

/**
 * 계절 이름을 한국어로 변환합니다.
 * @param season - 계절 ('spring' | 'summer' | 'autumn' | 'winter')
 * @returns 한국어 계절 이름
 */
export function getSeasonName(season: Season): string {
  const seasonNames: Record<Season, string> = {
    spring: '봄',
    summer: '여름',
    autumn: '가을',
    winter: '겨울',
  };
  return seasonNames[season];
}

/**
 * 계절에 해당하는 이미지 경로를 반환합니다.
 * @param season - 계절 ('spring' | 'summer' | 'autumn' | 'winter')
 * @returns 이미지 경로
 */
export function getSeasonImagePath(season: Season): string {
  const imagePaths: Record<Season, string> = {
    spring: '/봄.jpg',
    summer: '/여름.jpg',
    autumn: '/가을.jpg',
    winter: '/겨울.jpg',
  };
  return imagePaths[season];
}

/**
 * 날짜를 기준으로 계절 내에서 패널 인덱스를 반환합니다 (0~3).
 * 각 계절 이미지는 4개의 패널로 구성되어 있으며, 계절 기간을 4등분하여 각 패널을 표시합니다.
 * @param date - 판단할 날짜 (기본값: 현재 날짜)
 * @returns 패널 인덱스 (0, 1, 2, 3)
 */
export function getSeasonPanelIndex(date: Date = new Date()): number {
  const season = getCurrentSeason(date);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 각 계절의 시작일과 종료일 정의
  let totalDays = 0;
  let daysFromStart = 0;
  
  switch (season) {
    case 'spring': // 3월 1일 ~ 5월 31일
      if (month === 3) {
        daysFromStart = day - 1; // 3월 1일부터의 일수
        totalDays = 31 + 30 + 31; // 3월(31일) + 4월(30일) + 5월(31일) = 92일
      } else if (month === 4) {
        daysFromStart = 31 + (day - 1); // 3월 전체 + 4월 일수
        totalDays = 92;
      } else { // 5월
        daysFromStart = 31 + 30 + (day - 1); // 3월 + 4월 + 5월 일수
        totalDays = 92;
      }
      break;
    case 'summer': // 6월 1일 ~ 8월 31일
      if (month === 6) {
        daysFromStart = day - 1;
        totalDays = 30 + 31 + 31; // 6월(30일) + 7월(31일) + 8월(31일) = 92일
      } else if (month === 7) {
        daysFromStart = 30 + (day - 1);
        totalDays = 92;
      } else { // 8월
        daysFromStart = 30 + 31 + (day - 1);
        totalDays = 92;
      }
      break;
    case 'autumn': // 9월 1일 ~ 11월 30일
      if (month === 9) {
        daysFromStart = day - 1;
        totalDays = 30 + 31 + 30; // 9월(30일) + 10월(31일) + 11월(30일) = 91일
      } else if (month === 10) {
        daysFromStart = 30 + (day - 1);
        totalDays = 91;
      } else { // 11월
        daysFromStart = 30 + 31 + (day - 1);
        totalDays = 91;
      }
      break;
    case 'winter': // 12월 1일 ~ 2월 28일(29일)
      const isLeapYear = (date.getFullYear() % 4 === 0 && date.getFullYear() % 100 !== 0) || 
                         (date.getFullYear() % 400 === 0);
      const febDays = isLeapYear ? 29 : 28;
      
      if (month === 12) {
        daysFromStart = day - 1;
        totalDays = 31 + 31 + febDays; // 12월(31일) + 1월(31일) + 2월(28/29일)
      } else if (month === 1) {
        daysFromStart = 31 + (day - 1);
        totalDays = 31 + 31 + febDays;
      } else { // 2월
        daysFromStart = 31 + 31 + (day - 1);
        totalDays = 31 + 31 + febDays;
      }
      break;
  }
  
  // 계절 기간을 4등분하여 패널 인덱스 계산
  const panelIndex = Math.floor((daysFromStart / totalDays) * 4);
  
  // 0~3 범위로 제한
  return Math.min(Math.max(panelIndex, 0), 3);
}

