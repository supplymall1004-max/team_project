/**
 * @file health-data-analyzer.ts
 * @description 건강 데이터 분석 유틸리티
 *
 * 각 건강 지표를 분석하여 정상 범위 여부, 건강 상태, 개선 권장사항을 제공합니다.
 */

/**
 * 건강 상태 레벨
 */
export type HealthStatus = 'normal' | 'attention' | 'warning' | 'danger';

/**
 * 분석 결과
 */
export interface HealthAnalysisResult {
  status: HealthStatus;
  statusLabel: string;
  value: number;
  normalRange: string;
  description: string;
  recommendations: string[];
  color: string;
}

/**
 * 심박수 분석
 */
export function analyzeHeartRate(heartRate: number): HealthAnalysisResult {
  let status: HealthStatus = 'normal';
  let statusLabel = '정상';
  let description = '';
  const recommendations: string[] = [];

  if (heartRate < 60) {
    status = 'attention';
    statusLabel = '서맥';
    description = '심박수가 정상보다 낮습니다. 운동선수가 아닌 경우 의사와 상의하시기 바랍니다.';
    recommendations.push('의사와 상담하여 원인을 확인하세요');
    recommendations.push('약물 복용 여부를 확인하세요');
  } else if (heartRate > 100) {
    status = 'warning';
    statusLabel = '빈맥';
    description = '심박수가 정상보다 높습니다. 스트레스, 카페인, 운동 후일 수 있습니다.';
    recommendations.push('휴식을 취하고 심호흡을 해보세요');
    recommendations.push('카페인 섭취를 줄여보세요');
    recommendations.push('지속되면 의사와 상담하세요');
  } else {
    description = '정상 범위의 심박수입니다. 건강한 심혈관 상태를 유지하고 있습니다.';
    recommendations.push('규칙적인 운동으로 심혈관 건강을 유지하세요');
    recommendations.push('충분한 수면과 휴식을 취하세요');
  }

  return {
    status,
    statusLabel,
    value: heartRate,
    normalRange: '60-100 bpm',
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'attention' ? 'blue' : status === 'warning' ? 'yellow' : 'red',
  };
}

/**
 * 혈압 분석
 */
export function analyzeBloodPressure(systolic: number, diastolic: number): HealthAnalysisResult {
  let status: HealthStatus = 'normal';
  let statusLabel = '정상';
  let description = '';
  const recommendations: string[] = [];

  if (systolic < 120 && diastolic < 80) {
    description = '정상 혈압입니다. 건강한 혈압을 유지하고 있습니다.';
    recommendations.push('규칙적인 운동과 건강한 식습관을 유지하세요');
    recommendations.push('정기적으로 혈압을 측정하세요');
  } else if (systolic < 130 && diastolic < 85) {
    status = 'attention';
    statusLabel = '고혈압 전단계';
    description = '혈압이 정상보다 약간 높습니다. 생활습관 개선이 필요합니다.';
    recommendations.push('나트륨 섭취를 줄이고 신선한 채소를 많이 드세요');
    recommendations.push('규칙적인 유산소 운동을 하세요');
    recommendations.push('스트레스 관리를 하세요');
  } else if (systolic < 140 && diastolic < 90) {
    status = 'warning';
    statusLabel = '1단계 고혈압';
    description = '경도 고혈압입니다. 의사와 상담하여 관리가 필요합니다.';
    recommendations.push('의사와 상담하여 혈압 관리 계획을 수립하세요');
    recommendations.push('식이요법과 운동을 시작하세요');
    recommendations.push('금연과 금주를 권장합니다');
  } else {
    status = 'danger';
    statusLabel = '2단계 고혈압';
    description = '중등도 이상의 고혈압입니다. 즉시 의사와 상담하시기 바랍니다.';
    recommendations.push('즉시 의사와 상담하세요');
    recommendations.push('약물 치료가 필요할 수 있습니다');
    recommendations.push('생활습관 개선과 함께 치료를 받으세요');
  }

  return {
    status,
    statusLabel,
    value: systolic, // 수축기 혈압을 대표값으로
    normalRange: '< 120/80 mmHg',
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'attention' ? 'blue' : status === 'warning' ? 'yellow' : 'red',
  };
}

/**
 * 혈당 분석 (공복)
 */
export function analyzeFastingGlucose(glucose: number): HealthAnalysisResult {
  let status: HealthStatus = 'normal';
  let statusLabel = '정상';
  let description = '';
  const recommendations: string[] = [];

  if (glucose < 100) {
    description = '정상 공복 혈당입니다. 건강한 혈당 수치를 유지하고 있습니다.';
    recommendations.push('균형 잡힌 식단을 유지하세요');
    recommendations.push('정기적으로 혈당을 측정하세요');
  } else if (glucose < 126) {
    status = 'warning';
    statusLabel = '당뇨 전단계';
    description = '공복 혈당이 정상보다 높습니다. 당뇨 전단계일 수 있습니다.';
    recommendations.push('의사와 상담하여 정확한 진단을 받으세요');
    recommendations.push('탄수화물 섭취를 줄이고 식이섬유를 늘리세요');
    recommendations.push('규칙적인 운동을 시작하세요');
    recommendations.push('체중 관리를 하세요');
  } else {
    status = 'danger';
    statusLabel = '당뇨 가능성';
    description = '공복 혈당이 당뇨 기준에 해당합니다. 즉시 의사와 상담하시기 바랍니다.';
    recommendations.push('즉시 의사와 상담하여 정확한 진단을 받으세요');
    recommendations.push('당뇨 관리 계획을 수립하세요');
    recommendations.push('식이요법과 운동을 시작하세요');
  }

  return {
    status,
    statusLabel,
    value: glucose,
    normalRange: '70-100 mg/dL',
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'warning' ? 'yellow' : 'red',
  };
}

/**
 * 혈당 분석 (식후)
 */
export function analyzePostprandialGlucose(glucose: number): HealthAnalysisResult {
  let status: HealthStatus = 'normal';
  let statusLabel = '정상';
  let description = '';
  const recommendations: string[] = [];

  if (glucose < 140) {
    description = '정상 식후 혈당입니다. 건강한 혈당 반응을 보이고 있습니다.';
    recommendations.push('균형 잡힌 식단을 유지하세요');
  } else if (glucose < 200) {
    status = 'warning';
    statusLabel = '당뇨 전단계';
    description = '식후 혈당이 정상보다 높습니다. 당뇨 전단계일 수 있습니다.';
    recommendations.push('의사와 상담하여 정확한 진단을 받으세요');
    recommendations.push('식사 후 가벼운 운동을 하세요');
    recommendations.push('탄수화물 섭취를 줄이세요');
  } else {
    status = 'danger';
    statusLabel = '당뇨 가능성';
    description = '식후 혈당이 당뇨 기준에 해당합니다. 즉시 의사와 상담하시기 바랍니다.';
    recommendations.push('즉시 의사와 상담하여 정확한 진단을 받으세요');
    recommendations.push('당뇨 관리 계획을 수립하세요');
  }

  return {
    status,
    statusLabel,
    value: glucose,
    normalRange: '< 140 mg/dL',
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'warning' ? 'yellow' : 'red',
  };
}

/**
 * 체중 및 BMI 분석
 */
export function analyzeWeight(weightKg: number, heightCm?: number): HealthAnalysisResult {
  let status: HealthStatus = 'normal';
  let statusLabel = '정상';
  let description = '';
  const recommendations: string[] = [];

  if (!heightCm) {
    // 키 정보가 없으면 BMI 계산 불가
    description = `체중: ${weightKg}kg. BMI 계산을 위해 키 정보가 필요합니다.`;
    recommendations.push('건강 프로필에 키 정보를 입력하세요');
    return {
      status: 'attention',
      statusLabel: '키 정보 필요',
      value: weightKg,
      normalRange: 'BMI 18.5-24.9',
      description,
      recommendations,
      color: 'blue',
    };
  }

  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  if (bmi < 18.5) {
    status = 'attention';
    statusLabel = '저체중';
    description = `BMI가 ${bmi.toFixed(1)}로 저체중 범위입니다. 영양 상태를 확인하시기 바랍니다.`;
    recommendations.push('의사와 상담하여 건강한 체중 증가 방법을 상의하세요');
    recommendations.push('균형 잡힌 식단으로 영양을 충분히 섭취하세요');
  } else if (bmi < 25) {
    description = `BMI가 ${bmi.toFixed(1)}로 정상 범위입니다. 건강한 체중을 유지하고 있습니다.`;
    recommendations.push('현재 체중을 유지하기 위해 규칙적인 운동을 하세요');
    recommendations.push('균형 잡힌 식단을 유지하세요');
  } else if (bmi < 30) {
    status = 'warning';
    statusLabel = '과체중';
    description = `BMI가 ${bmi.toFixed(1)}로 과체중 범위입니다. 체중 관리가 필요합니다.`;
    recommendations.push('의사와 상담하여 건강한 체중 감량 계획을 수립하세요');
    recommendations.push('규칙적인 운동과 식이조절을 시작하세요');
    recommendations.push('서서히 체중을 감량하세요 (주당 0.5-1kg)');
  } else {
    status = 'danger';
    statusLabel = '비만';
    description = `BMI가 ${bmi.toFixed(1)}로 비만 범위입니다. 건강 관리가 필요합니다.`;
    recommendations.push('즉시 의사와 상담하여 체중 관리 계획을 수립하세요');
    recommendations.push('전문가의 지도 하에 체중 감량을 시작하세요');
    recommendations.push('생활습관 전반을 개선하세요');
  }

  return {
    status,
    statusLabel,
    value: bmi,
    normalRange: '18.5-24.9',
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'attention' ? 'blue' : status === 'warning' ? 'yellow' : 'red',
  };
}

/**
 * 활동량 분석
 */
export function analyzeActivity(steps: number, targetSteps: number = 10000): HealthAnalysisResult {
  const percentage = (steps / targetSteps) * 100;
  let status: HealthStatus = 'normal';
  let statusLabel = '목표 달성';
  let description = '';
  const recommendations: string[] = [];

  if (percentage >= 100) {
    description = `목표 걸음 수(${targetSteps.toLocaleString()}보)를 달성했습니다! 훌륭합니다!`;
    recommendations.push('현재 활동량을 유지하세요');
    recommendations.push('다양한 운동을 추가해보세요');
  } else if (percentage >= 70) {
    status = 'attention';
    statusLabel = '목표 근접';
    description = `목표의 ${Math.round(percentage)}%를 달성했습니다. 조금만 더 걸으면 목표에 도달할 수 있습니다.`;
    recommendations.push('조금 더 걸어서 목표를 달성하세요');
    recommendations.push('계단을 이용하거나 짧은 산책을 추가하세요');
  } else if (percentage >= 50) {
    status = 'warning';
    statusLabel = '부족';
    description = `목표의 ${Math.round(percentage)}%만 달성했습니다. 더 많은 활동이 필요합니다.`;
    recommendations.push('하루 중 활동량을 늘리세요');
    recommendations.push('30분 이상의 유산소 운동을 추가하세요');
    recommendations.push('걷기, 자전거 타기 등 일상 활동을 늘리세요');
  } else {
    status = 'danger';
    statusLabel = '매우 부족';
    description = `목표의 ${Math.round(percentage)}%만 달성했습니다. 활동량을 크게 늘려야 합니다.`;
    recommendations.push('의사와 상담하여 적절한 운동 계획을 수립하세요');
    recommendations.push('매일 30분 이상 걷기를 목표로 하세요');
    recommendations.push('점진적으로 활동량을 늘리세요');
  }

  return {
    status,
    statusLabel,
    value: steps,
    normalRange: `${targetSteps.toLocaleString()}보 이상`,
    description,
    recommendations,
    color: status === 'normal' ? 'green' : status === 'attention' ? 'blue' : status === 'warning' ? 'yellow' : 'red',
  };
}
