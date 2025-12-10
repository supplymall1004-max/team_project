# 건강 시각화 기능 단계별 구현 가이드

## 📚 이 가이드는 누구를 위한 것인가요?

이 가이드는 **비개발자 또는 초보 개발자**가 건강 시각화 기능을 실제 프로젝트에 통합할 수 있도록 돕습니다. 각 단계를 따라하면 누구나 이 기능을 구현할 수 있습니다!

---

## 🎯 전체 로드맵 (10단계)

```
1단계: 환경 설정 (10분)
2단계: 필수 패키지 설치 (5분)
3단계: 컴포넌트 테스트 (15분)
4단계: API 연동 테스트 (20분)
5단계: 식단 상세 페이지 생성 (30분)
6단계: 건강 시각화 통합 (25분)
7단계: 스타일링 및 반응형 조정 (20분)
8단계: 에러 처리 추가 (15분)
9단계: 성능 최적화 (15분)
10단계: 최종 테스트 및 배포 (20분)

총 예상 시간: 약 2-3시간
```

---

## 📝 Step 1: 환경 설정 (10분)

### 1.1 프로젝트 상태 확인

```bash
# 터미널을 열고 프로젝트 폴더로 이동
cd E:\team\team_project

# 현재 브랜치 확인
git branch

# 새 브랜치 생성 (안전하게 작업하기 위해)
git checkout -b feature/health-visualization

# 현재 상태 확인
git status
```

### 1.2 개발 서버 실행 확인

```bash
# 개발 서버 시작
pnpm dev

# 브라우저에서 확인
http://localhost:3000
```

✅ **체크포인트**: 프로젝트가 정상적으로 실행되나요?

---

## 📦 Step 2: 필수 패키지 설치 (5분)

### 2.1 Progress 컴포넌트 의존성 설치

```bash
# @radix-ui/react-progress 설치
pnpm add @radix-ui/react-progress
```

### 2.2 설치 확인

```bash
# package.json에서 확인
cat package.json | grep "react-progress"

# 또는 VSCode에서 package.json 파일 열어서 확인
```

✅ **체크포인트**: `@radix-ui/react-progress`가 package.json에 추가되었나요?

---

## 🧪 Step 3: 컴포넌트 테스트 (15분)

### 3.1 테스트 페이지 접근

```bash
# 브라우저에서 테스트 페이지 열기
http://localhost:3000/test/health-visualization-test
```

### 3.2 각 컴포넌트 테스트

1. **"전체 테스트 실행" 버튼 클릭**
   - 모든 컴포넌트가 정상 렌더링되는지 확인
   - 테스트 결과 메시지 확인

2. **각 탭 확인**
   - 건강 지표 탭: BMI, 체지방률 카드 표시 확인
   - 영양 분석 탭: 도넛 차트 및 인사이트 확인
   - 위험도 탭: 게이지 바 및 상세 정보 확인
   - 효과 예측 탭: 식단 효과 예측 결과 확인

### 3.3 반응형 테스트

```bash
# 브라우저 개발자 도구 열기 (F12)
# 1. 모바일 뷰 전환 (Ctrl + Shift + M)
# 2. 다양한 화면 크기로 테스트
#    - iPhone SE (375px)
#    - iPad (768px)
#    - Desktop (1280px)
```

✅ **체크포인트**: 
- [ ] 모든 컴포넌트가 렌더링되나요?
- [ ] 차트와 게이지가 정상 표시되나요?
- [ ] 모바일에서도 정상 작동하나요?

---

## 🔌 Step 4: API 연동 테스트 (20분)

### 4.1 로그인 상태 확인

```bash
# 브라우저에서 로그인
http://localhost:3000/sign-in

# 로그인 완료 후 테스트 페이지로 이동
```

### 4.2 API 엔드포인트 테스트

테스트 페이지 하단의 "API 엔드포인트 테스트" 섹션에서:

1. **"/api/health/metrics 테스트" 버튼 클릭**
   - 결과: "건강 메트릭스 API 정상 작동" 확인
   - 실패 시: 로그인 상태 및 환경 변수 확인

2. **"/api/health/meal-impact 테스트" 버튼 클릭**
   - 결과: "식단 효과 예측 API 정상 작동" 확인
   - 실패 시: API 로그 확인 (터미널)

### 4.3 API 응답 데이터 확인

```bash
# 브라우저 개발자 도구 → Network 탭
# API 요청 클릭 → Response 확인

# 예상 응답 구조 (metrics):
{
  "success": true,
  "metrics": {
    "bmi": 23.5,
    "bodyFatPercentage": 18,
    "overallHealthScore": 78,
    ...
  }
}
```

✅ **체크포인트**:
- [ ] 두 API 모두 정상 응답하나요?
- [ ] 응답 데이터 구조가 올바른가요?
- [ ] 에러 없이 작동하나요?

---

## 📄 Step 5: 식단 상세 페이지 생성 (30분)

### 5.1 아침 식단 상세 페이지 생성

```typescript
// app/diet/breakfast/[date]/page.tsx 생성

import { HealthMetricsCard } from '@/components/health/visualization/HealthMetricsCard';
import { MealImpactPredictor } from '@/components/health/visualization/MealImpactPredictor';

export default async function BreakfastDetailPage({
  params
}: {
  params: { date: string }
}) {
  // 1. 식단 데이터 로드
  const breakfastData = await loadBreakfastData(params.date);
  
  // 2. 건강 프로필 로드
  const healthProfile = await loadHealthProfile();
  
  // 3. 페이지 렌더링
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">
        {params.date} - 아침 식단
      </h1>
      
      {/* 식단 정보 */}
      <MealInfoCard data={breakfastData} />
      
      {/* 건강 시각화 */}
      <HealthMetricsCard metrics={healthMetrics} />
      <MealImpactPredictor
        mealType="breakfast"
        mealData={breakfastData}
        currentHealth={currentHealth}
      />
    </div>
  );
}
```

### 5.2 점심/저녁 페이지 생성

```bash
# 아침 페이지를 복사하여 점심/저녁 생성
# 1. app/diet/breakfast/[date]/page.tsx 복사
# 2. app/diet/lunch/[date]/page.tsx 생성
# 3. app/diet/dinner/[date]/page.tsx 생성

# 각 파일에서 수정할 부분:
# - mealType: 'breakfast' → 'lunch' / 'dinner'
# - 제목: '아침' → '점심' / '저녁'
```

### 5.3 라우팅 테스트

```bash
# 브라우저에서 URL 직접 입력하여 테스트
http://localhost:3000/diet/breakfast/2024-12-10
http://localhost:3000/diet/lunch/2024-12-10
http://localhost:3000/diet/dinner/2024-12-10
```

✅ **체크포인트**:
- [ ] 세 페이지 모두 정상 렌더링되나요?
- [ ] 날짜가 올바르게 표시되나요?
- [ ] 식단 데이터가 로딩되나요?

---

## 🎨 Step 6: 건강 시각화 통합 (25분)

### 6.1 DietCard 컴포넌트 수정

기존 `components/health/diet-card.tsx` 파일에서:

```typescript
// 상세 페이지 링크 수정 (이미 구현됨)
const href = `/diet/${mealType}/${date}`;
```

### 6.2 데이터 로딩 로직 구현

```typescript
// lib/health/data-loaders.ts 생성

export async function loadHealthMetrics(userId: string) {
  const response = await fetch('/api/health/metrics');
  const data = await response.json();
  return data.metrics;
}

export async function loadMealData(mealType: string, date: string) {
  const response = await fetch(`/api/diet/meal/${mealType}/${date}`);
  const data = await response.json();
  return data.meal;
}
```

### 6.3 페이지에 데이터 로딩 통합

```typescript
// app/diet/breakfast/[date]/page.tsx 업데이트

'use client';

import { useEffect, useState } from 'react';

export default function BreakfastDetailPage({ params }: { params: { date: string } }) {
  const [healthMetrics, setHealthMetrics] = useState(null);
  const [mealData, setMealData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [metrics, meal] = await Promise.all([
          loadHealthMetrics(userId),
          loadMealData('breakfast', params.date)
        ]);
        setHealthMetrics(metrics);
        setMealData(meal);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [params.date]);

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div>
      {/* 건강 시각화 컴포넌트들 */}
      <HealthMetricsCard metrics={healthMetrics} />
      <MealImpactPredictor mealData={mealData} currentHealth={healthMetrics} />
    </div>
  );
}
```

✅ **체크포인트**:
- [ ] 데이터가 정상적으로 로딩되나요?
- [ ] 로딩 상태가 표시되나요?
- [ ] 건강 시각화가 데이터와 함께 표시되나요?

---

## 💅 Step 7: 스타일링 및 반응형 조정 (20분)

### 7.1 레이아웃 개선

```typescript
// 그리드 레이아웃 적용
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <HealthMetricsCard metrics={healthMetrics} />
  <NutritionBalanceChart balance={nutritionBalance} />
</div>
```

### 7.2 색상 및 간격 조정

```css
/* globals.css에 추가 */
.health-visualization {
  @apply space-y-6;
}

.health-card {
  @apply rounded-2xl border border-border/60 bg-white shadow-sm;
}

.health-section {
  @apply p-6 space-y-4;
}
```

### 7.3 모바일 최적화

```typescript
// 모바일 전용 레이아웃
<div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-6 lg:space-y-0">
  {/* 모바일: 세로 스택, 데스크톱: 가로 그리드 */}
</div>
```

✅ **체크포인트**:
- [ ] 데스크톱에서 깔끔하게 표시되나요?
- [ ] 모바일에서 스크롤이 자연스러운가요?
- [ ] 색상과 간격이 일관성 있나요?

---

## 🚨 Step 8: 에러 처리 추가 (15분)

### 8.1 에러 바운더리 추가

```typescript
// components/health/error-boundary.tsx

'use client';

import { Component, ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

export class HealthVisualizationErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>건강 시각화 오류</AlertTitle>
          <AlertDescription>
            데이터를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침해주세요.
          </AlertDescription>
        </Alert>
      );
    }

    return this.props.children;
  }
}
```

### 8.2 페이지에 에러 바운더리 적용

```typescript
// app/diet/breakfast/[date]/page.tsx

import { HealthVisualizationErrorBoundary } from '@/components/health/error-boundary';

export default function BreakfastDetailPage() {
  return (
    <HealthVisualizationErrorBoundary>
      {/* 기존 컴포넌트들 */}
    </HealthVisualizationErrorBoundary>
  );
}
```

### 8.3 API 에러 처리

```typescript
// API 호출 시 try-catch 추가
try {
  const response = await fetch('/api/health/metrics');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const data = await response.json();
  // ...
} catch (error) {
  console.error('API 오류:', error);
  setError('건강 데이터를 불러올 수 없습니다.');
}
```

✅ **체크포인트**:
- [ ] 네트워크 오류 시 에러 메시지가 표시되나요?
- [ ] 에러 바운더리가 작동하나요?
- [ ] 사용자에게 친화적인 오류 안내가 되나요?

---

## ⚡ Step 9: 성능 최적화 (15분)

### 9.1 React.memo 적용

```typescript
// components/health/visualization/HealthMetricsCard.tsx

import { memo } from 'react';

export const HealthMetricsCard = memo(function HealthMetricsCard({ metrics }) {
  // ...
});
```

### 9.2 데이터 캐싱

```typescript
// 클라이언트 사이드 캐싱
const [cachedMetrics, setCachedMetrics] = useState(() => {
  const cached = localStorage.getItem('health_metrics');
  return cached ? JSON.parse(cached) : null;
});

useEffect(() => {
  if (healthMetrics) {
    localStorage.setItem('health_metrics', JSON.stringify(healthMetrics));
  }
}, [healthMetrics]);
```

### 9.3 이미지 및 차트 최적화

```typescript
// 차트 렌더링 지연 (viewport에 들어올 때만)
import { useInView } from 'react-intersection-observer';

const { ref, inView } = useInView({
  triggerOnce: true,
  threshold: 0.1,
});

return (
  <div ref={ref}>
    {inView ? <NutritionBalanceChart /> : <ChartSkeleton />}
  </div>
);
```

✅ **체크포인트**:
- [ ] 페이지 로딩 속도가 개선되었나요?
- [ ] 불필요한 리렌더링이 줄었나요?
- [ ] 큰 차트도 부드럽게 렌더링되나요?

---

## ✅ Step 10: 최종 테스트 및 배포 (20분)

### 10.1 전체 기능 테스트

```bash
# 체크리스트
□ 로그인 → 건강 정보 입력 → 식단 추천 → 상세 페이지
□ 아침/점심/저녁 모든 페이지 정상 작동
□ 건강 시각화 모든 컴포넌트 표시
□ API 정상 응답
□ 모바일/태블릿/데스크톱 반응형
□ 에러 처리 작동
□ 로딩 상태 표시
```

### 10.2 프로덕션 빌드 테스트

```bash
# 빌드 실행
pnpm build

# 빌드 성공 확인
# 오류가 있다면 수정 후 다시 빌드

# 프로덕션 모드 실행
pnpm start

# 브라우저에서 확인
http://localhost:3000
```

### 10.3 Git 커밋 및 배포

```bash
# 변경사항 확인
git status

# 모든 파일 추가
git add .

# 커밋
git commit -m "feat: 건강 시각화 기능 추가

- 건강 메트릭스 API 구현
- 식단 효과 예측 API 구현
- 건강 시각화 컴포넌트 6개 추가
- 식단 상세 페이지에 시각화 통합
- 반응형 디자인 및 에러 처리 완료"

# 메인 브랜치로 병합 (선택)
git checkout main
git merge feature/health-visualization

# 원격 저장소에 푸시
git push origin main
```

### 10.4 배포 확인

```bash
# Vercel 자동 배포 확인
# GitHub에 푸시 시 자동으로 배포됨

# 배포 URL에서 확인
https://your-project.vercel.app
```

✅ **최종 체크포인트**:
- [ ] 모든 기능이 프로덕션에서 정상 작동하나요?
- [ ] 빌드 오류가 없나요?
- [ ] 성능이 만족스러운가요?
- [ ] 사용자 피드백을 수집할 준비가 되었나요?

---

## 🎉 완료! 다음 단계는?

### 1주차: 사용자 피드백 수집
- 실제 사용자 테스트 진행
- 피드백 양식 작성
- 개선사항 리스트 작성

### 2주차: 기능 개선
- 사용자 피드백 반영
- 버그 수정
- 성능 최적화 추가

### 3주차: 고급 기능 추가 (선택)
- 웨어러블 기기 연동
- AI 기반 건강 예측
- 커뮤니티 기능

---

## 🆘 문제 해결 가이드

### Q1: 컴포넌트가 렌더링되지 않아요
```bash
A: 다음을 확인하세요
1. import 경로가 올바른가요?
2. 필요한 props를 모두 전달했나요?
3. 데이터가 null이 아닌가요?
4. 브라우저 콘솔에 오류가 있나요?
```

### Q2: API가 401 오류를 반환해요
```bash
A: 인증 문제입니다
1. 로그인 상태를 확인하세요
2. Clerk 토큰이 유효한가요?
3. 환경 변수가 올바른가요?
```

### Q3: 차트가 표시되지 않아요
```bash
A: 데이터 문제일 수 있습니다
1. 데이터가 올바른 형식인가요?
2. 필수 필드가 모두 있나요?
3. 브라우저 개발자 도구에서 데이터 확인
```

### Q4: 모바일에서 레이아웃이 깨져요
```bash
A: 반응형 클래스를 확인하세요
1. Tailwind CSS 반응형 클래스 (lg:, md:) 사용
2. 최소/최대 너비 설정
3. 터치 인터랙션 크기 조정
```

---

**축하합니다! 🎊**

건강 시각화 기능을 성공적으로 구현했습니다! 

이제 사용자들이 자신의 건강 상태를 직관적으로 이해하고, 
식단 선택의 효과를 실시간으로 확인할 수 있게 되었습니다.

궁금한 점이 있으면 언제든 문의하세요! 😊
