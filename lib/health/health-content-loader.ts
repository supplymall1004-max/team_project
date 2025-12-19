/**
 * @file health-content-loader.ts
 * @description 건강 정보 문서를 파싱하여 HealthTabContent 형식으로 변환
 *
 * 주요 기능:
 * 1. 각 건강 정보 문서의 내용을 구조화된 데이터로 변환
 * 2. 칼로리 계산 공식, 주의사항, 영양소 가이드라인 추출
 */

import type { HealthTabType, HealthTabContent } from '@/types/health-tabs';

/**
 * 건강 정보 탭별 콘텐츠 데이터
 * 문서에서 추출한 정보를 구조화하여 저장
 */
const HEALTH_TAB_CONTENTS: Record<HealthTabType, HealthTabContent> = {
  diabetes: {
    calorieCalculation: {
      formula: '일일 필요 칼로리 = 표준 체중 (kg) × 활동도별 칼로리 계수',
      explanation: '당뇨 환자는 표준 체중을 기준으로 계산하며, 활동량에 따라 20~35 kcal/kg 범위로 설정합니다.',
      steps: [
        {
          step: 1,
          description: '표준 체중 계산: 신장(m) × 신장(m) × 22',
          calculation: '예: 1.70m × 1.70m × 22 = 63.58kg',
        },
        {
          step: 2,
          description: '활동량별 칼로리 계수 적용',
          calculation: '보통 활동: 25~30 kcal/kg',
        },
      ],
      example: '신장 1.70m, 보통 활동 환자: 63.58kg × 25~30 = 1,589~1,907 kcal/일',
    },
    precautions: [
      {
        title: '혈당 급상승 방지',
        description: '단순당과 정제된 탄수화물을 피하고, 복합 탄수화물 위주로 섭취해야 합니다.',
        severity: 'high',
      },
      {
        title: '규칙적인 식사',
        description: '매 끼니 일정한 양의 탄수화물을 섭취하여 혈당을 안정적으로 유지해야 합니다.',
        severity: 'high',
      },
      {
        title: '전문가 상담 필수',
        description: '정확한 칼로리 목표와 식사 계획은 반드시 의사 또는 영양사와 상담 후 결정해야 합니다.',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 45,
          max: 60,
          unit: '%',
          description: '복합 탄수화물 위주로 섭취 (현미, 잡곡, 통곡물)',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
          description: '저지방 단백질 선택 (닭 가슴살, 생선, 두부)',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
          description: '불포화지방 위주로 섭취 (올리브 오일, 견과류)',
        },
      },
      micronutrients: {
        sodium: {
          max: 2000,
          unit: 'mg',
          description: '고혈압 위험이 높으므로 나트륨 섭취 제한',
        },
      },
    },
    excludedFoods: [
      {
        name: '단순당',
        reason: '혈당을 급격히 올림',
        category: '당류',
      },
      {
        name: '정제된 곡물',
        reason: '혈당 지수가 높음',
        category: '곡물',
      },
      {
        name: '가당 음료',
        reason: '혈당 급상승 및 칼로리 과다',
        category: '음료',
      },
    ],
    recommendedFoods: [
      {
        name: '복합 탄수화물',
        benefit: '혈당을 천천히 올리고 식이섬유 공급',
        category: '곡물',
      },
      {
        name: '저지방 단백질',
        benefit: '포만감 유지 및 근육 건강',
        category: '단백질',
      },
      {
        name: '비전분성 채소',
        benefit: '식이섬유 풍부, 혈당 안정화',
        category: '채소',
      },
    ],
    mealPlanningTips: [
      {
        tip: '접시 나누기 방법',
        description: '접시의 1/2는 채소, 1/4는 단백질, 1/4는 탄수화물로 구성',
      },
      {
        tip: '식사 순서',
        description: '채소 → 단백질 → 탄수화물 순서로 섭취하면 혈당 상승 완화',
      },
      {
        tip: '규칙적인 식사 시간',
        description: '매일 일정한 시간에 식사하여 혈당 안정화',
      },
    ],
    references: [
      'American Diabetes Association (ADA)',
      '대한당뇨병학회',
    ],
  },
  cardiovascular: {
    calorieCalculation: {
      formula: 'TEE (kcal) = BMR × 활동 계수',
      explanation: '심혈관 질환 환자는 체중 관리가 중요하므로, BMR 계산 후 활동 계수를 곱하여 목표 칼로리를 설정합니다.',
      steps: [
        {
          step: 1,
          description: 'BMR 계산 (Mifflin-St Jeor 공식)',
          calculation: '남성: (10 × 체중) + (6.25 × 키) - (5 × 나이) + 5\n여성: (10 × 체중) + (6.25 × 키) - (5 × 나이) - 161',
        },
        {
          step: 2,
          description: '활동 계수 적용',
          calculation: '앉아서 생활: 1.2, 약간 활동적: 1.375, 보통 활동적: 1.55',
        },
        {
          step: 3,
          description: '체중 감량 필요 시 조정',
          calculation: '과체중/비만: TEE - 500~1000 kcal',
        },
      ],
    },
    precautions: [
      {
        title: '나트륨 엄격 제한',
        description: '하루 1,500mg 이하로 제한하여 혈압 조절',
        severity: 'high',
      },
      {
        title: '포화지방/트랜스지방 제한',
        description: 'LDL 콜레스테롤 수치를 낮추기 위해 나쁜 지방 섭취 최소화',
        severity: 'high',
      },
      {
        title: '규칙적인 운동',
        description: '주 3~5회, 30분 이상의 중강도 유산소 운동 권장',
        severity: 'medium',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 45,
          max: 55,
          unit: '%',
          description: '복합 탄수화물 위주 (통곡물, 채소)',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
          description: '저지방 단백질 (생선, 닭 가슴살, 콩류)',
        },
        fat: {
          min: 25,
          max: 35,
          unit: '%',
          description: '불포화지방 위주 (올리브 오일, 견과류, 등 푸른 생선)',
        },
      },
      micronutrients: {
        sodium: {
          max: 1500,
          unit: 'mg',
          description: '고혈압 환자는 1,500mg 이하 권장',
        },
      },
    },
    excludedFoods: [
      {
        name: '가공식품',
        reason: '나트륨과 포화지방 함량이 높음',
        category: '가공식품',
      },
      {
        name: '튀긴 음식',
        reason: '트랜스지방 및 포화지방 과다',
        category: '조리법',
      },
      {
        name: '국물 요리',
        reason: '나트륨 함량이 매우 높음',
        category: '조리법',
      },
    ],
    recommendedFoods: [
      {
        name: '등 푸른 생선',
        benefit: '오메가-3 지방산으로 중성지방 감소',
        category: '단백질',
      },
      {
        name: '통곡물',
        benefit: '식이섬유로 콜레스테롤 흡수 방지',
        category: '곡물',
      },
      {
        name: '올리브 오일',
        benefit: '단일 불포화지방으로 LDL 콜레스테롤 감소',
        category: '지방',
      },
    ],
    mealPlanningTips: [
      {
        tip: '지중해식 식단 원칙',
        description: '통곡물, 채소, 과일, 콩류 중심, 올리브 오일 사용',
      },
      {
        tip: '저염 조리법',
        description: '소금 대신 마늘, 생강, 허브 등 천연 양념 활용',
      },
      {
        tip: '국물 최소화',
        description: '국물 요리는 건더기 위주로 섭취하고 국물은 피하기',
      },
    ],
    references: [
      'American Heart Association (AHA)',
      'National Cholesterol Education Program (NCEP)',
    ],
  },
  ckd: {
    calorieCalculation: {
      formula: '하루 총 칼로리 = 30 ~ 35 kcal/kg × 표준 체중 (kg)',
      explanation: 'CKD 환자는 단백질 제한으로 인한 영양실조를 방지하기 위해 충분한 칼로리를 공급해야 합니다.',
      steps: [
        {
          step: 1,
          description: '표준 체중 계산',
          calculation: '남성: 50kg + [0.91 × (키(cm) - 152.4)]\n여성: 45.5kg + [0.91 × (키(cm) - 152.4)]',
        },
        {
          step: 2,
          description: '칼로리 계수 적용',
          calculation: '60세 이상/비활동적: 30 kcal/kg\n60세 미만/활동적: 35 kcal/kg',
        },
      ],
    },
    precautions: [
      {
        title: '단백질 엄격 제한',
        description: 'CKD 3~5기: 0.6~0.8g/kg, 투석 중: 1.2g/kg 이상',
        severity: 'high',
      },
      {
        title: '칼륨 제한',
        description: '하루 2,000~3,000mg 이하로 제한 (심장 안전)',
        severity: 'high',
      },
      {
        title: '인 제한',
        description: '하루 800~1,000mg 이하로 제한 (뼈 건강 및 혈관 보호)',
        severity: 'high',
      },
      {
        title: '수분 제한',
        description: '투석 환자는 주치의가 정한 수분 제한량 준수',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 40,
          max: 55,
          unit: '%',
          description: '단백질 부족분을 탄수화물로 보충',
        },
        protein: {
          min: 0.6,
          max: 0.8,
          unit: 'g/kg',
          description: 'CKD 3~5기 기준 (투석 중은 1.2g/kg 이상)',
        },
        fat: {
          min: 25,
          max: 35,
          unit: '%',
          description: '충분한 에너지 공급을 위해 지방 섭취',
        },
      },
      micronutrients: {
        sodium: {
          max: 2000,
          unit: 'mg',
          description: '혈압 및 부종 관리',
        },
        potassium: {
          max: 3000,
          unit: 'mg',
          description: '심장 안전을 위한 제한',
        },
        phosphorus: {
          max: 1000,
          unit: 'mg',
          description: '뼈 건강 및 혈관 석회화 방지',
        },
      },
    },
    excludedFoods: [
      {
        name: '고칼륨 식품',
        reason: '부정맥 및 심장 마비 위험',
        category: '미네랄',
      },
      {
        name: '고인 식품',
        reason: '혈관 석회화 및 뼈 약화',
        category: '미네랄',
      },
      {
        name: '유제품',
        reason: '인 함량이 매우 높음',
        category: '단백질',
      },
    ],
    recommendedFoods: [
      {
        name: '흰쌀밥',
        benefit: '칼륨과 인 함량이 낮아 안전한 주식',
        category: '곡물',
      },
      {
        name: '달걀 흰자',
        benefit: '고단백 저지방, 인/칼륨 부담 적음',
        category: '단백질',
      },
      {
        name: '저칼륨 채소',
        benefit: '데치기로 칼륨 제거 후 섭취',
        category: '채소',
      },
    ],
    mealPlanningTips: [
      {
        tip: '칼륨 제거 조리법',
        description: '채소를 작게 썰어 찬물에 2시간 이상 담가두고, 끓는 물에 데친 후 물 버리기',
      },
      {
        tip: '인 결합제 복용',
        description: '의사 처방에 따라 식사 직후 인 결합제 복용',
      },
      {
        tip: '수분 관리',
        description: '하루 마시는 모든 액체를 측정하여 기록',
      },
    ],
    references: [
      'National Kidney Foundation (NKF)',
      'KDOQI 가이드라인',
    ],
  },
  gout: {
    calorieCalculation: {
      formula: 'TEE (kcal) = BMR × 활동 계수',
      explanation: '통풍 환자는 체중 관리가 중요하므로 일반적인 칼로리 계산법을 따르되, 급격한 체중 감량은 피해야 합니다.',
      steps: [
        {
          step: 1,
          description: 'BMR 계산 (Mifflin-St Jeor 공식)',
        },
        {
          step: 2,
          description: '활동 계수 적용',
        },
        {
          step: 3,
          description: '체중 감량 필요 시 조정',
          calculation: '과체중/비만: TEE - 500 kcal (주당 0.5kg 감량 목표)',
        },
      ],
    },
    precautions: [
      {
        title: '급격한 체중 감량 금지',
        description: '케톤체 생성으로 요산 수치 급상승, 통풍 발작 유발',
        severity: 'high',
      },
      {
        title: '퓨린 함량 높은 식품 제한',
        description: '내장육, 특정 어패류, 맥주 등 고퓨린 식품 엄격 제한',
        severity: 'high',
      },
      {
        title: '충분한 수분 섭취',
        description: '하루 2~3L 물 섭취로 요산 배출 촉진',
        severity: 'medium',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 40,
          max: 55,
          unit: '%',
          description: '복합 탄수화물 위주',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
          description: '저퓨린 단백질 선택 (닭 가슴살, 달걀 흰자)',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
          description: '건강한 불포화지방 위주',
        },
      },
    },
    excludedFoods: [
      {
        name: '내장육',
        reason: '퓨린 함량이 매우 높음',
        category: '육류',
      },
      {
        name: '맥주',
        reason: '퓨린 함량 높고 요산 배출 방해',
        category: '음료',
      },
      {
        name: '과당 음료',
        reason: '퓨린 대사 촉진으로 요산 수치 상승',
        category: '음료',
      },
    ],
    recommendedFoods: [
      {
        name: '저지방 유제품',
        benefit: '요산 배출 촉진 및 요산 수치 감소',
        category: '단백질',
      },
      {
        name: '체리',
        benefit: '요산 수치 감소 및 통풍 발작 위험 감소',
        category: '과일',
      },
      {
        name: '물',
        benefit: '요산 희석 및 소변을 통한 배출 촉진',
        category: '음료',
      },
    ],
    mealPlanningTips: [
      {
        tip: '서서히 체중 감량',
        description: '주당 0.5kg 이내로 서서히 감량하여 요산 수치 급상승 방지',
      },
      {
        tip: '퓨린 함량 확인',
        description: '식품의 퓨린 함량을 확인하고 고퓨린 식품은 주 1~2회로 제한',
      },
      {
        tip: '수분 충분히 섭취',
        description: '하루 종일 조금씩 나누어 물을 마셔 요산 배출 효과 지속',
      },
    ],
    references: [
      'American College of Rheumatology (ACR)',
      '대한류마티스학회',
    ],
  },
  gastrointestinal: {
    calorieCalculation: {
      formula: 'TEE (kcal) = BMR × 활동 계수',
      explanation: '위장 질환 환자는 일반적인 칼로리 계산법을 따르되, 무엇을 어떻게 먹는지가 더 중요합니다.',
    },
    precautions: [
      {
        title: '자극적인 음식 피하기',
        description: '매운 음식, 산성 음식, 고지방 음식은 위장을 자극',
        severity: 'high',
      },
      {
        title: '규칙적인 소식',
        description: '과식을 피하고 조금씩 자주 먹어 위 부담 감소',
        severity: 'medium',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 45,
          max: 55,
          unit: '%',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
        },
      },
    },
    excludedFoods: [
      {
        name: '튀긴 음식',
        reason: '고지방으로 위산 분비 촉진',
        category: '조리법',
      },
      {
        name: '매운 음식',
        reason: '위 점막 자극',
        category: '양념',
      },
    ],
    recommendedFoods: [
      {
        name: '부드러운 음식',
        benefit: '소화가 잘되고 위 부담이 적음',
        category: '조리법',
      },
    ],
    mealPlanningTips: [
      {
        tip: '식후 자세',
        description: '식사 후 최소 3시간 동안 눕지 않기',
      },
    ],
    references: [],
  },
  maternity: {
    calorieCalculation: {
      formula: '일일 권장 칼로리 = 임신 전 권장 칼로리 + 주차별 추가 필요 칼로리',
      explanation: '임신 초기에는 추가 칼로리가 필요 없고, 중기부터 추가 칼로리가 필요합니다.',
      steps: [
        {
          step: 1,
          description: '임신 전 권장 칼로리 계산 (BMR + 활동 계수)',
        },
        {
          step: 2,
          description: '주차별 추가 칼로리 적용',
          calculation: '임신 초기(1~13주): 0 kcal\n임신 중기(14~27주): +340 kcal\n임신 후기(28~40주): +450 kcal',
        },
      ],
    },
    precautions: [
      {
        title: '생선 섭취 주의',
        description: '수은 함량이 높은 생선은 제한',
        severity: 'high',
      },
      {
        title: '날 음식 금지',
        description: '회, 스시 등 날 음식은 리스테리아 위험',
        severity: 'high',
      },
      {
        title: '알코올 금지',
        description: '태아 기형 및 발달 장애 위험',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 40,
          max: 45,
          unit: '%',
          description: '임신성 당뇨병 환자 기준',
        },
        protein: {
          min: 20,
          max: 20,
          unit: '%',
        },
        fat: {
          min: 35,
          max: 40,
          unit: '%',
        },
      },
      micronutrients: {
        sodium: {
          max: 2000,
          unit: 'mg',
          description: '임신중독증 예방',
        },
      },
    },
    excludedFoods: [
      {
        name: '생선 (수은 높은 종류)',
        reason: '태아 신경계 발달에 악영향',
        category: '단백질',
      },
      {
        name: '날 음식',
        reason: '리스테리아 감염 위험',
        category: '조리법',
      },
    ],
    recommendedFoods: [
      {
        name: '엽산 함유 식품',
        benefit: '신경관 결손 예방',
        category: '비타민',
      },
      {
        name: '철분 함유 식품',
        benefit: '빈혈 예방',
        category: '미네랄',
      },
    ],
    mealPlanningTips: [
      {
        tip: '체중 증가 관리',
        description: '임신 전 BMI에 맞는 적절한 체중 증가 범위 유지',
      },
    ],
    references: [],
  },
  allergy: {
    calorieCalculation: {
      formula: '일반적인 칼로리 계산법 적용',
      explanation: '알레르기는 칼로리 계산에 직접적인 영향을 주지 않지만, 제외 음식으로 인해 식단 구성이 제한될 수 있습니다.',
    },
    precautions: [
      {
        title: '알레르기 유발 식품 완전 회피',
        description: '알레르기 반응은 생명을 위협할 수 있으므로 원인 식품을 철저히 피해야 합니다.',
        severity: 'high',
      },
      {
        title: '파생 재료 확인',
        description: '알레르기 유발 식품이 다른 형태로 포함된 음식도 피해야 합니다.',
        severity: 'high',
      },
      {
        title: '응급 대처 계획',
        description: '에피네프린 자가 주사기 사용법 숙지 및 응급 대처 계획 수립',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 45,
          max: 55,
          unit: '%',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
        },
      },
    },
    excludedFoods: [
      {
        name: '8대 주요 알레르기 식품',
        reason: '우유, 달걀, 땅콩, 견과류, 밀, 콩, 갑각류, 생선',
        category: '알레르기',
      },
    ],
    recommendedFoods: [
      {
        name: '안전한 대체 식품',
        benefit: '알레르기 유발 식품을 대체할 수 있는 영양가 있는 식품',
        category: '대체식품',
      },
    ],
    mealPlanningTips: [
      {
        tip: '식품 라벨 확인',
        description: '구매 전 영양 성분표에서 알레르기 유발 식품 확인',
      },
    ],
    references: [],
  },
  diet_male: {
    calorieCalculation: {
      formula: '다이어트 목표 칼로리 = TDEE - 500 kcal',
      explanation: '주당 0.5kg 감량을 목표로 하루 500kcal 부족분을 만듭니다.',
      steps: [
        {
          step: 1,
          description: 'BMR 계산 (Harris-Benedict 수정 공식)',
          calculation: '88.362 + (13.397 × 체중) + (4.799 × 키) - (5.677 × 나이)',
        },
        {
          step: 2,
          description: 'TDEE 계산 (BMR × 활동 계수)',
        },
        {
          step: 3,
          description: '다이어트 목표 칼로리 설정',
          calculation: 'TDEE - 500 kcal (최소 1,500 kcal 이상 유지)',
        },
      ],
    },
    precautions: [
      {
        title: '최소 칼로리 준수',
        description: '성인 남성은 최소 1,500 kcal 이상 섭취하여 영양 불균형 방지',
        severity: 'high',
      },
      {
        title: '근육량 유지',
        description: '단백질 충분히 섭취하고 근력 운동 병행',
        severity: 'medium',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 40,
          max: 55,
          unit: '%',
        },
        protein: {
          min: 25,
          max: 35,
          unit: '%',
          description: '근육 유지 및 포만감 증가',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
        },
      },
    },
    excludedFoods: [
      {
        name: '정제된 탄수화물',
        reason: '혈당 급상승 및 지방 저장 촉진',
        category: '곡물',
      },
    ],
    recommendedFoods: [
      {
        name: '복합 탄수화물',
        benefit: '혈당 안정화 및 식이섬유 공급',
        category: '곡물',
      },
    ],
    mealPlanningTips: [
      {
        tip: '근력 운동 병행',
        description: '주 3회 이상 근력 운동으로 근육량 유지',
      },
    ],
    references: [],
  },
  diet_female: {
    calorieCalculation: {
      formula: '다이어트 목표 칼로리 = TDEE - 500 kcal',
      explanation: '주당 0.5kg 감량을 목표로 하루 500kcal 부족분을 만듭니다.',
      steps: [
        {
          step: 1,
          description: 'BMR 계산 (Harris-Benedict 수정 공식)',
          calculation: '447.593 + (9.247 × 체중) + (3.098 × 키) - (4.330 × 나이)',
        },
        {
          step: 2,
          description: 'TDEE 계산 (BMR × 활동 계수)',
        },
        {
          step: 3,
          description: '다이어트 목표 칼로리 설정',
          calculation: 'TDEE - 500 kcal (최소 1,200 kcal 이상 유지)',
        },
      ],
    },
    precautions: [
      {
        title: '최소 칼로리 준수',
        description: '성인 여성은 최소 1,200 kcal 이상 섭취하여 영양 불균형 방지',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 40,
          max: 55,
          unit: '%',
        },
        protein: {
          min: 25,
          max: 35,
          unit: '%',
        },
        fat: {
          min: 20,
          max: 30,
          unit: '%',
        },
      },
    },
    excludedFoods: [],
    recommendedFoods: [],
    mealPlanningTips: [],
    references: [],
  },
  growing_children: {
    calorieCalculation: {
      formula: 'EER (추정 에너지 필요량) 공식 사용',
      explanation: '성장기 어린이는 성장에 필요한 추가 에너지가 포함된 EER 공식을 사용합니다.',
    },
    precautions: [
      {
        title: '충분한 영양소 공급',
        description: '성장에 필요한 단백질, 칼슘, 비타민을 충분히 섭취',
        severity: 'high',
      },
    ],
    nutritionGuidelines: {
      macronutrients: {
        carbs: {
          min: 45,
          max: 55,
          unit: '%',
        },
        protein: {
          min: 15,
          max: 20,
          unit: '%',
        },
        fat: {
          min: 25,
          max: 35,
          unit: '%',
        },
      },
    },
    excludedFoods: [],
    recommendedFoods: [],
    mealPlanningTips: [],
    references: [],
  },
};

/**
 * 건강 정보 탭 타입에 해당하는 콘텐츠를 반환
 */
export function getHealthTabContent(tabType: HealthTabType): HealthTabContent {
  return HEALTH_TAB_CONTENTS[tabType] || HEALTH_TAB_CONTENTS.diabetes;
}

/**
 * 모든 건강 정보 탭 콘텐츠 반환
 */
export function getAllHealthTabContents(): Record<HealthTabType, HealthTabContent> {
  return HEALTH_TAB_CONTENTS;
}
