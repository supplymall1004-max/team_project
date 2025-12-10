# 건강 상태 시각화 기능 구현 계획

## 📋 문서 개요

이 문서는 건강 맞춤 식단 서비스에 **현재 건강 상태 시각화**와 **식단 섭취 후 건강 개선 예측** 기능을 추가하는 구현 계획입니다.

---

## 🎯 요구사항 분석

### 현재 건강 상태 시각화
- **BMI, 체지방률, 근육량 등** 현재 건강 지표를 시각적으로 표시
- **영양소 균형도**: 탄수화물, 단백질, 지방, 비타민 등의 현재 섭취 상태
- **건강 위험도**: 질병별 건강 위험도 표시 (심혈관, 당뇨, 신장 등)
- **활동량 지표**: 일일 걸음 수, 운동 강도 등

### 식단 섭취 후 건강 개선 예측
- **식사 전/후 비교**: 특정 식사를 섭취했을 때 건강 지표가 어떻게 변하는지 예측
- **누적 효과**: 하루 식사 누적 효과, 일주일 건강 변화 추이
- **목표 달성도**: 건강 목표 대비 현재 진행 상황 (%)
- **개인화된 인사이트**: "이 식사를 먹으면 칼로리 목표의 30%를 달성합니다"

---

## 🏗️ 아키텍처 설계

### 1. 데이터 모델

```typescript
// 건강 상태 데이터 구조
interface HealthMetrics {
  // 기본 건강 지표
  bmi: number;
  bodyFat: number;
  muscleMass: number;
  basalMetabolicRate: number;

  // 영양 상태
  nutritionBalance: NutritionBalance;
  vitaminLevels: VitaminLevels;
  mineralLevels: MineralLevels;

  // 건강 위험도
  diseaseRiskScores: DiseaseRiskScores;

  // 활동량
  dailyActivity: DailyActivity;
}

// 영양 균형 데이터
interface NutritionBalance {
  carbohydrates: number; // %
  protein: number;       // %
  fat: number;           // %
  fiber: number;         // g
  sugar: number;         // g
  sodium: number;        // mg
}

// 식단 효과 예측 데이터
interface MealImpactPrediction {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  beforeMetrics: HealthMetrics;
  afterMetrics: HealthMetrics;
  improvements: HealthImprovement[];
  goalProgress: GoalProgress;
}

// 건강 개선 항목
interface HealthImprovement {
  metric: string;
  beforeValue: number;
  afterValue: number;
  improvement: number; // %
  description: string;
}
```

### 2. 컴포넌트 구조

```
components/health/visualization/
├── HealthDashboard.tsx              # 메인 건강 대시보드
├── HealthMetricsCard.tsx            # 건강 지표 카드
├── NutritionBalanceChart.tsx        # 영양 균형 차트
├── DiseaseRiskGauge.tsx             # 질병 위험도 게이지
├── MealImpactPredictor.tsx          # 식단 효과 예측기
├── HealthProgressRing.tsx           # 진행률 링 차트
├── MetricComparisonChart.tsx        # 전/후 비교 차트
├── HealthInsightsCard.tsx           # 건강 인사이트 카드
└── ActivityTracker.tsx              # 활동량 트래커
```

---

## 🎨 UI/UX 디자인 (GDWEB 패턴 기반)

### 디자인 원칙
1. **직관성**: 건강 데이터를 한눈에 이해할 수 있는 시각화
2. **색상 코딩**: 녹색(좋음) → 노랑(주의) → 빨강(위험)
3. **애니메이션**: 데이터 변경 시 부드러운 전환 효과
4. **반응형**: 모바일과 데스크톱 모두 최적화

### 색상 팔레트 (docs/02.md 기반)
```css
:root {
  --health-excellent: #27ae60;    /* 완벽 */
  --health-good: #2ecc71;         /* 좋음 */
  --health-fair: #f39c12;         /* 보통 */
  --health-poor: #e74c3c;         /* 나쁨 */
  --health-critical: #c0392b;     /* 위험 */

  --nutrition-carb: #3498db;      /* 탄수화물 */
  --nutrition-protein: #e74c3c;   /* 단백질 */
  --nutrition-fat: #f39c12;       /* 지방 */
  --nutrition-fiber: #27ae60;     /* 섬유질 */
}
```

---

## 📱 기능별 구현 계획

### Phase 1: 건강 대시보드 (2주)

#### 1.1 현재 건강 상태 시각화
```typescript
// HealthDashboard 컴포넌트
function HealthDashboard() {
  const [currentHealth, setCurrentHealth] = useState<HealthMetrics | null>(null);

  return (
    <div className="health-dashboard">
      {/* BMI 및 체성분 카드 */}
      <HealthMetricsCard metrics={currentHealth} />

      {/* 영양 균형 도넛 차트 */}
      <NutritionBalanceChart balance={currentHealth?.nutritionBalance} />

      {/* 질병 위험도 게이지 */}
      <DiseaseRiskGauge risks={currentHealth?.diseaseRiskScores} />
    </div>
  );
}
```

**사용할 UI 패턴**:
- **카드 레이아웃**: docs/02.md의 카드 디자인 패턴
- **도넛 차트**: docs/04.md의 차트 구현 예시 활용
- **게이지 바**: 교육 사이트의 프로그레스 바 패턴 적용

### Phase 2: 식단 효과 예측 (2주)

#### 2.1 식사별 건강 영향 예측
```typescript
// MealImpactPredictor 컴포넌트
function MealImpactPredictor({ mealType, mealData }) {
  const [prediction, setPrediction] = useState<MealImpactPrediction | null>(null);

  useEffect(() => {
    calculateMealImpact(mealType, mealData).then(setPrediction);
  }, [mealType, mealData]);

  return (
    <div className="meal-impact-predictor">
      {/* 전/후 비교 차트 */}
      <MetricComparisonChart
        before={prediction?.beforeMetrics}
        after={prediction?.afterMetrics}
      />

      {/* 개선 포인트 목록 */}
      <HealthInsightsCard improvements={prediction?.improvements} />

      {/* 목표 달성도 링 */}
      <HealthProgressRing progress={prediction?.goalProgress} />
    </div>
  );
}
```

**시각화 요소**:
- **비포/애프터 차트**: 막대 그래프 또는 라인 차트
- **개선 인사이트**: "칼로리 섭취 25% 개선", "단백질 균형 최적화"
- **프로그레스 링**: docs/04.md의 진행률 표시 패턴

### Phase 3: 식단 상세 페이지 통합 (1주)

#### 3.1 아침/점심/저녁 페이지에 시각화 추가
```
app/diet/
├── breakfast/[date]/page.tsx    # 아침 상세 페이지
├── lunch/[date]/page.tsx        # 점심 상세 페이지
└── dinner/[date]/page.tsx       # 저녁 상세 페이지
```

각 페이지에 추가할 컴포넌트:
```tsx
// diet/[mealType]/[date]/page.tsx
export default function MealDetailPage({ params }) {
  return (
    <div className="meal-detail-page">
      {/* 기존 식단 정보 */}
      <MealInfoCard meal={mealData} />

      {/* 새로 추가: 건강 시각화 */}
      <HealthVisualizationSection
        mealType={params.mealType}
        mealData={mealData}
        userHealth={userHealth}
      />

      {/* 식단 효과 예측 */}
      <MealImpactPredictor
        mealType={params.mealType}
        mealData={mealData}
        currentHealth={currentHealth}
      />
    </div>
  );
}
```

---

## 🔧 기술 구현 상세

### API 엔드포인트

```typescript
// 건강 데이터 조회 API
GET /api/health/metrics
// 응답: HealthMetrics

// 식단 효과 예측 API
POST /api/health/meal-impact
// 요청: { mealType, mealData, currentHealth }
// 응답: MealImpactPrediction

// 건강 목표 설정 API
PUT /api/health/goals
// 요청: HealthGoals
```

### 데이터 계산 로직

```typescript
// lib/health/health-calculator.ts
export class HealthCalculator {
  // BMI 계산
  static calculateBMI(weight: number, height: number): number {
    return weight / Math.pow(height / 100, 2);
  }

  // 영양 균형 계산
  static calculateNutritionBalance(dailyIntake: NutritionInfo): NutritionBalance {
    // 현재 섭취량을 기준치와 비교하여 백분율 계산
  }

  // 식단 효과 예측
  static predictMealImpact(
    currentHealth: HealthMetrics,
    mealNutrition: NutritionInfo
  ): MealImpactPrediction {
    // 현재 건강 상태 + 식단 영양 정보를 기반으로 예측 계산
  }
}
```

### 시각화 라이브러리

```json
// package.json에 추가할 의존성
{
  "dependencies": {
    "recharts": "^2.7.0",           // 차트 라이브러리
    "framer-motion": "^10.16.0",    // 애니메이션
    "@react-spring/web": "^9.7.3"   // 스프링 애니메이션
  }
}
```

---

## 📊 시각화 컴포넌트 상세

### 1. 건강 메트릭스 카드
```tsx
function HealthMetricsCard({ metrics }: { metrics: HealthMetrics }) {
  return (
    <div className="metrics-grid">
      <MetricCard
        title="BMI"
        value={metrics.bmi}
        status={getBMIStatus(metrics.bmi)}
        unit=""
        range={[18.5, 25]}
      />
      <MetricCard
        title="체지방률"
        value={metrics.bodyFat}
        status={getBodyFatStatus(metrics.bodyFat, gender)}
        unit="%"
        range={[10, 20]}
      />
    </div>
  );
}
```

### 2. 영양 균형 차트 (도넛 차트)
```tsx
function NutritionBalanceChart({ balance }: { balance: NutritionBalance }) {
  const data = [
    { name: '탄수화물', value: balance.carbohydrates, color: 'var(--nutrition-carb)' },
    { name: '단백질', value: balance.protein, color: 'var(--nutrition-protein)' },
    { name: '지방', value: balance.fat, color: 'var(--nutrition-fat)' },
    { name: '섬유질', value: balance.fiber, color: 'var(--nutrition-fiber)' },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

### 3. 건강 개선 예측 차트
```tsx
function MetricComparisonChart({ before, after }: {
  before: HealthMetrics,
  after: HealthMetrics
}) {
  return (
    <div className="comparison-chart">
      <div className="metric-row">
        <span>칼로리 균형</span>
        <ProgressBar value={before.calorieBalance} color="gray" />
        <ProgressBar value={after.calorieBalance} color="green" animate />
      </div>
      <div className="metric-row">
        <span>단백질 섭취</span>
        <ProgressBar value={before.proteinIntake} color="gray" />
        <ProgressBar value={after.proteinIntake} color="green" animate />
      </div>
    </div>
  );
}
```

---

## 🎯 사용자 경험 개선

### 인터랙션 디자인
1. **호버 효과**: 차트 요소에 마우스 호버 시 상세 정보 표시
2. **클릭 상호작용**: 특정 메트릭 클릭 시 상세 설명 모달
3. **애니메이션**: 데이터 변경 시 부드러운 전환 (docs/01_UI_UX.md 애니메이션 패턴)
4. **로딩 상태**: 스켈레톤 UI로 로딩 경험 개선

### 모바일 최적화
- **터치 인터랙션**: 스와이프로 차트 전환
- **반응형 차트**: 화면 크기에 따른 차트 크기 자동 조정
- **심플한 UI**: 모바일에서는 핵심 메트릭만 우선 표시

### 접근성
- **ARIA 레이블**: 차트에 스크린 리더 지원
- **색각 이상 고려**: 색상 외에 패턴과 텍스트로 정보 전달
- **키보드 네비게이션**: Tab 키로 차트 요소 탐색 가능

---

## 📈 성공 지표

### 사용자 참여도
- **페이지뷰 증가**: 건강 시각화 페이지 40% 이상 증가
- **세션 시간**: 건강 관련 페이지 평균 체류 시간 2분 이상
- **재방문율**: 건강 시각화 기능 사용 후 25% 재방문 증가

### 건강 개선 효과
- **식단 준수율**: 건강 목표 달성도 표시로 30% 개선
- **사용자 만족도**: 건강 관리에 대한 사용자 만족도 설문조사 4.2/5.0 달성
- **건강 지표 개선**: 3개월 사용 후 실제 건강 지표 개선률 측정

---

## 🚀 구현 로드맵

### Week 1-2: 기반 구축
- [ ] 건강 메트릭스 데이터 모델 정의
- [ ] API 엔드포인트 구현
- [ ] 기본 시각화 컴포넌트 개발

### Week 3-4: 핵심 기능 개발
- [ ] 건강 대시보드 구현
- [ ] 식단 효과 예측 로직 개발
- [ ] 차트 및 게이지 컴포넌트 완성

### Week 5-6: 통합 및 테스트
- [ ] 식단 상세 페이지에 시각화 통합
- [ ] 반응형 디자인 및 애니메이션 적용
- [ ] 사용자 테스트 및 피드백 수집

### Week 7-8: 최적화 및 배포
- [ ] 성능 최적화
- [ ] 접근성 개선
- [ ] A/B 테스트 및 데이터 분석

---

*이 계획서는 지속적으로 업데이트되며, 실제 구현 과정에서 사용자 피드백과 기술적 제약사항을 반영하여 조정됩니다.*
