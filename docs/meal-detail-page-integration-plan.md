# 식단 상세 페이지 시각화 통합 계획

## 📋 문서 개요

이 문서는 아침/점심/저녁 식단 상세 페이지에 건강 시각화 기능을 통합하는 구현 계획입니다.

---

## 🎯 요구사항 분석

### 현재 상태
- `diet-card.tsx`에서 `/diet/{mealType}/{date}` 경로로 상세 페이지 이동
- 현재 해당 페이지들이 구현되지 않음
- 식단 정보와 기본 레시피 정보만 표시

### 목표 상태
- 각 식사별 상세 페이지 구현
- 현재 건강 상태 시각화
- 식사 섭취 후 건강 개선 예측 시각화
- 개인화된 건강 인사이트 제공

---

## 🏗️ 페이지 구조 설계

### 1. 라우팅 구조
```
app/diet/
├── breakfast/
│   └── [date]/
│       └── page.tsx          # 아침 식단 상세 페이지
├── lunch/
│   └── [date]/
│       └── page.tsx          # 점심 식단 상세 페이지
└── dinner/
    └── [date]/
        └── page.tsx          # 저녁 식단 상세 페이지
```

### 2. 공통 레이아웃 컴포넌트

```typescript
// components/diet/meal-detail-layout.tsx
interface MealDetailLayoutProps {
  mealType: 'breakfast' | 'lunch' | 'dinner';
  date: string;
  children: React.ReactNode;
}

function MealDetailLayout({ mealType, date, children }: MealDetailLayoutProps) {
  return (
    <div className="meal-detail-page">
      {/* 헤더: 식사 유형, 날짜, 네비게이션 */}
      <MealDetailHeader mealType={mealType} date={date} />

      {/* 메인 콘텐츠 */}
      <div className="meal-content-grid">
        {children}
      </div>

      {/* 푸터: 다음 식사 미리보기 */}
      <MealNavigationFooter mealType={mealType} date={date} />
    </div>
  );
}
```

---

## 📱 페이지별 구현 세부사항

### 아침 식단 상세 페이지 (`app/diet/breakfast/[date]/page.tsx`)

```typescript
// 아침 식단 상세 페이지
export default function BreakfastDetailPage({
  params
}: {
  params: { date: string }
}) {
  return (
    <MealDetailLayout mealType="breakfast" date={params.date}>
      {/* 식단 정보 섹션 */}
      <MealInfoSection mealType="breakfast" date={params.date} />

      {/* 현재 건강 상태 시각화 */}
      <CurrentHealthVisualization userId={userId} />

      {/* 아침 식사 효과 예측 */}
      <MealImpactPredictor
        mealType="breakfast"
        mealData={breakfastMealData}
        currentHealth={currentHealth}
      />

      {/* 건강 인사이트 카드 */}
      <MealHealthInsights
        mealType="breakfast"
        mealData={breakfastMealData}
        healthProfile={healthProfile}
      />
    </MealDetailLayout>
  );
}
```

### 점심 식단 상세 페이지 (`app/diet/lunch/[date]/page.tsx`)

```typescript
// 점심 식단 상세 페이지
export default function LunchDetailPage({
  params
}: {
  params: { date: string }
}) {
  // 아침 식사 데이터도 함께 로드 (누적 효과 계산용)
  const [morningData, setMorningData] = useState(null);

  return (
    <MealDetailLayout mealType="lunch" date={params.date}>
      {/* 식단 정보 섹션 */}
      <MealInfoSection mealType="lunch" date={params.date} />

      {/* 현재 건강 상태 (아침 식사 반영) */}
      <CurrentHealthVisualization
        userId={userId}
        includeMorningMeal={true}
        morningMealData={morningData}
      />

      {/* 점심 식사 효과 예측 */}
      <MealImpactPredictor
        mealType="lunch"
        mealData={lunchMealData}
        currentHealth={currentHealth}
        previousMeals={[morningData]} // 아침 식사 고려
      />

      {/* 건강 인사이트 */}
      <MealHealthInsights
        mealType="lunch"
        mealData={lunchMealData}
        healthProfile={healthProfile}
        previousMeals={[morningData]}
      />
    </MealDetailLayout>
  );
}
```

### 저녁 식단 상세 페이지 (`app/diet/dinner/[date]/page.tsx`)

```typescript
// 저녁 식단 상세 페이지
export default function DinnerDetailPage({
  params
}: {
  params: { date: string }
}) {
  // 아침 + 점심 식사 데이터 로드 (하루 총 효과 계산용)
  const [dayMeals, setDayMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null
  });

  return (
    <MealDetailLayout mealType="dinner" date={params.date}>
      {/* 식단 정보 섹션 */}
      <MealInfoSection mealType="dinner" date={params.date} />

      {/* 현재 건강 상태 (하루 누적 효과) */}
      <CurrentHealthVisualization
        userId={userId}
        includeDayMeals={true}
        dayMealsData={dayMeals}
      />

      {/* 저녁 식사 효과 예측 */}
      <MealImpactPredictor
        mealType="dinner"
        mealData={dinnerMealData}
        currentHealth={currentHealth}
        previousMeals={[dayMeals.breakfast, dayMeals.lunch]}
      />

      {/* 하루 총 건강 요약 */}
      <DailyHealthSummary
        dayMeals={dayMeals}
        healthProfile={healthProfile}
      />
    </MealDetailLayout>
  );
}
```

---

## 🔧 컴포넌트별 상세 구현

### 1. MealInfoSection 컴포넌트

기존 `DietCard`를 확장하여 상세 정보를 표시:

```typescript
// components/diet/meal-info-section.tsx
function MealInfoSection({ mealType, date }: MealInfoSectionProps) {
  const [mealData, setMealData] = useState(null);

  useEffect(() => {
    loadMealData(mealType, date);
  }, [mealType, date]);

  return (
    <Card className="meal-info-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MealTypeIcon mealType={mealType} />
          {getMealTypeLabel(mealType)} 식단 상세
        </CardTitle>
        <CardDescription>
          {date} - 영양 정보 및 레시피 상세
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* 기존 DietCard 내용 + 확장 */}
        <div className="meal-details-grid">
          {/* 메뉴 구성 */}
          <MealCompositionDisplay composition={mealData.composition} />

          {/* 영양 정보 상세 */}
          <NutritionDetailTable nutrition={mealData.nutrition} />

          {/* 레시피 링크들 */}
          <RecipeLinks recipes={mealData.recipes} />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 2. CurrentHealthVisualization 컴포넌트

현재 건강 상태를 간략히 표시하는 컴포넌트:

```typescript
// components/health/current-health-visualization.tsx
function CurrentHealthVisualization({
  userId,
  includeMorningMeal = false,
  morningMealData = null,
  includeDayMeals = false,
  dayMealsData = null
}: CurrentHealthVisualizationProps) {

  const [currentHealth, setCurrentHealth] = useState(null);

  useEffect(() => {
    loadCurrentHealthWithMeals();
  }, [userId, includeMorningMeal, morningMealData, includeDayMeals, dayMealsData]);

  const loadCurrentHealthWithMeals = async () => {
    // 현재 건강 데이터 로드
    const baseHealth = await loadBaseHealthData(userId);

    let adjustedHealth = baseHealth;

    // 식사별 건강 조정 로직
    if (includeMorningMeal && morningMealData) {
      adjustedHealth = calculateHealthAfterMeal(baseHealth, morningMealData);
    }

    if (includeDayMeals && dayMealsData) {
      adjustedHealth = calculateDayHealthImpact(baseHealth, dayMealsData);
    }

    setCurrentHealth(adjustedHealth);
  };

  return (
    <Card className="current-health-visualization">
      <CardHeader>
        <CardTitle>현재 건강 상태</CardTitle>
        <CardDescription>
          {includeMorningMeal && "아침 식사 반영"}
          {includeDayMeals && "하루 누적 효과 반영"}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* 간략한 건강 메트릭스 표시 */}
        <div className="health-summary-grid">
          <HealthMetricItem
            label="전체 건강 점수"
            value={currentHealth.overallHealthScore}
            unit="점"
            status={getHealthStatus(currentHealth.overallHealthScore)}
          />

          <HealthMetricItem
            label="칼로리 균형"
            value={currentHealth.calorieBalance}
            unit="%"
            status={getBalanceStatus(currentHealth.calorieBalance)}
          />

          <HealthMetricItem
            label="영양 균형"
            value={currentHealth.nutritionBalanceScore}
            unit="점"
            status={getNutritionStatus(currentHealth.nutritionBalanceScore)}
          />
        </div>

        {/* 미니 차트 또는 게이지들 */}
        <div className="mini-charts">
          <MiniProgressRing
            label="하루 칼로리 목표"
            current={currentHealth.currentCalories}
            target={currentHealth.targetCalories}
          />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 3. MealHealthInsights 컴포넌트

식사별 맞춤 건강 인사이트:

```typescript
// components/health/meal-health-insights.tsx
function MealHealthInsights({
  mealType,
  mealData,
  healthProfile,
  previousMeals = []
}: MealHealthInsightsProps) {

  const [insights, setInsights] = useState([]);

  useEffect(() => {
    generateMealInsights();
  }, [mealType, mealData, healthProfile, previousMeals]);

  const generateMealInsights = async () => {
    const mealInsights = await analyzeMealHealthImpact(
      mealType,
      mealData,
      healthProfile,
      previousMeals
    );

    setInsights(mealInsights);
  };

  return (
    <HealthInsightsCard
      insights={insights}
      title={`${getMealTypeLabel(mealType)} 건강 인사이트`}
      maxVisible={6}
      showPriorityFilter={false}
    />
  );
}
```

---

## 🔄 데이터 흐름 및 API 연동

### 1. 페이지 데이터 로딩

```typescript
// 각 페이지의 데이터 로딩 로직
async function loadPageData(mealType: string, date: string) {
  // 1. 식단 데이터 로드
  const mealResponse = await fetch(`/api/diet/meal/${mealType}/${date}`);
  const mealData = await mealResponse.json();

  // 2. 건강 프로필 로드
  const healthResponse = await fetch('/api/health/profile');
  const healthProfile = await healthResponse.json();

  // 3. 현재 건강 상태 계산 (이전 식사 고려)
  const currentHealthResponse = await fetch('/api/health/current-state', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      date,
      mealType,
      includePreviousMeals: true
    })
  });
  const currentHealth = await currentHealthResponse.json();

  // 4. 식사 효과 예측 계산
  const predictionResponse = await fetch('/api/health/meal-impact', {
    method: 'POST',
    body: JSON.stringify({
      mealType,
      mealData,
      currentHealth,
      previousMeals: getPreviousMeals(mealType, date)
    })
  });
  const prediction = await predictionResponse.json();

  return {
    mealData,
    healthProfile,
    currentHealth,
    prediction
  };
}
```

### 2. API 엔드포인트

```typescript
// 식단별 상세 데이터 조회
GET /api/diet/meal/{mealType}/{date}

// 현재 건강 상태 계산 (식사 반영)
POST /api/health/current-state

// 식사별 건강 효과 예측
POST /api/health/meal-impact

// 식사별 건강 인사이트 생성
POST /api/health/meal-insights
```

---

## 📱 반응형 디자인 및 UX

### 1. 모바일 최적화

```css
/* 모바일 레이아웃 */
@media (max-width: 768px) {
  .meal-content-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .current-health-visualization {
    order: -1; /* 건강 상태를 상단에 표시 */
  }

  .meal-impact-predictor {
    margin-top: 1rem;
  }
}
```

### 2. 로딩 및 에러 상태

```typescript
// 로딩 상태
if (isLoading) {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48" />
      <Skeleton className="h-32" />
      <Skeleton className="h-64" />
    </div>
  );
}

// 에러 상태
if (error) {
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>데이터 로드 실패</AlertTitle>
      <AlertDescription>{error}</AlertDescription>
      <Button onClick={retry} className="mt-4">
        다시 시도
      </Button>
    </Alert>
  );
}
```

### 3. 인터랙션 및 애니메이션

- **호버 효과**: 차트 요소에 마우스 호버 시 상세 정보 툴팁
- **프로그레스 애니메이션**: 데이터 로드 완료 시 부드러운 진행 바 애니메이션
- **트랜지션**: 섹션 간 전환 시 fade 효과

---

## 🎯 구현 우선순위

### Phase 1: 기본 구조 (1주)
- [ ] 아침/점심/저녁 상세 페이지 기본 구조 생성
- [ ] MealInfoSection 컴포넌트 구현
- [ ] 기본 데이터 로딩 로직 구현

### Phase 2: 건강 시각화 통합 (1주)
- [ ] CurrentHealthVisualization 컴포넌트 통합
- [ ] MealImpactPredictor 컴포넌트 통합
- [ ] 건강 인사이트 표시

### Phase 3: 고급 기능 및 최적화 (1주)
- [ ] 누적 효과 계산 로직 구현
- [ ] 반응형 디자인 적용
- [ ] 성능 최적화 및 캐싱

---

## 🔍 테스트 및 검증

### 1. 단위 테스트
- 컴포넌트 렌더링 테스트
- 데이터 계산 로직 테스트
- API 연동 테스트

### 2. 통합 테스트
- 페이지 전체 플로우 테스트
- 건강 데이터 정확성 검증
- 반응형 디자인 테스트

### 3. 사용자 테스트
- 실제 사용자 피드백 수집
- 사용성 평가
- 성능 모니터링

---

*이 계획서는 실제 구현 과정에서 사용자 피드백과 기술적 제약사항을 반영하여 조정됩니다.*
