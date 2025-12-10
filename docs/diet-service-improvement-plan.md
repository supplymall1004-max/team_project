# 🍎 건강 맞춤 식단 서비스 개선 계획

## 📋 문서 개요

이 문서는 15개의 칼로리 계산 관련 문서를 학습한 결과를 바탕으로, 현재 건강 맞춤 식단 서비스의 개선 방향을 제시합니다.

**학습한 문서 목록:**
- 일반 칼로리 계산 방법
- 심혈관 질환 관리
- 만성 신장 질환(CKD)
- 당뇨병 관리
- 여성/남성 다이어트
- 다이어트 방법론
- 식품 알레르기
- 위장 질환 관리
- 통풍 관리
- 성장기 어린이
- 임신부 관리

---

## 🎯 현재 시스템 분석

### ✅ 강점
- Next.js 15 + React 19 + TypeScript 기반 현대적 아키텍처
- Clerk 인증 + Supabase 데이터베이스 연동
- 기본적인 Mifflin-St Jeor 칼로리 계산 공식 구현
- 가족 식단 및 주간 식단 지원

### ❌ 개선 필요 영역
- 질병별 맞춤 칼로리 계산 공식 부족
- 매크로 영양소 비율의 질병별 최적화 미흡
- 레시피 다양성 및 질병별 필터링 제한적
- UI/UX의 개인화 및 커스터마이징 기능 부족

---

## 📈 개선 계획 (단계별)

### Phase 1: 핵심 로직 개선 (1-2개월)

#### 1.1 칼로리 계산 시스템 고도화
**현재:** Mifflin-St Jeor 공식만 사용
**개선 목표:** 다중 공식 지원 및 질병별 최적화

```typescript
const CALORIE_FORMULAS = {
  standard: 'mifflin-st-jeor',           // 일반
  cardiovascular: 'harris-benedict',     // 심혈관 질환
  ckd: 'weight-based-30-35',            // 신장 질환
  pediatric: 'eer-formula',              // 성장기
  maternity: 'pregnancy-adjusted'        // 임신부
};
```

**기대 효과:**
- 계산 정확도: ±15% 향상
- 질병 관리 효율: +20-30%

#### 1.2 매크로 영양소 최적화
**현재:** 기본 비율만 적용 (탄수화물 50-60%, 단백질 15-20%, 지방 25-30%)
**개선 목표:** 질병별 맞춤 비율 적용

```typescript
const DISEASE_MACRO_RULES = {
  diabetes: { carbs: [45, 60], protein: [15, 20], fat: [20, 35] },
  cardiovascular: { carbs: [50, 60], protein: [15, 20], fat: [20, 25] },
  ckd: { protein: [0.6, 0.8] }, // g/kg 표준 체중
  gout: { purineLimit: true, hydrationEmphasis: true }
};
```

### Phase 2: 다양성 및 사용자 경험 (2-3개월)

#### 2.1 레시피 데이터베이스 확장
**현재:** 기본 한식 중심 제한적 레시피
**개선 목표:** 질병별 특화 레시피 추가

**새로운 레시피 카테고리:**
- **저퓨린 레시피**: 통풍 환자용 (닭가슴살, 두부, 채소 중심)
- **저GI 레시피**: 당뇨 환자용 (통곡물, 채소 위주)
- **저인 레시피**: CKD 환자용 (육포, 가공육 제한)
- **저칼륨 레시피**: 신장병 환자용 (감자 제한, 채소 데치기)

#### 2.2 고급 필터링 시스템
```typescript
const RECIPE_FILTERS = {
  purineLevel: ['low', 'medium', 'high'],
  giIndex: ['low', 'medium', 'high'],
  sodiumContent: ['low', 'medium', 'high'],
  potassiumSafe: boolean,
  phosphorusSafe: boolean,
  crossAllergenCheck: boolean
};
```

#### 2.3 UI/UX 개선
**새로운 컴포넌트:**
- **식단 커스터마이저**: 시간대별 선호도, 맵기 조절, 글로벌 퓨전 옵션
- **영양 대시보드**: 매크로 분석 차트, 영양소 트래킹, 위험 지표
- **실시간 모니터링**: 식단 일지, 건강 리포트

### Phase 3: 고급 기능 및 AI 활용 (3-4개월)

#### 3.1 AI 기반 개인화
- 머신러닝을 활용한 사용자 패턴 분석
- 예측 모델 기반 식단 추천
- 건강 데이터 연동 (혈당, 혈압 등)

#### 3.2 스마트 알레르기 관리
```typescript
const CROSS_REACTIVITY_RULES = {
  birchPollen: ['apple', 'carrot', 'celery'],
  ragweed: ['banana', 'cucumber', 'melon'],
  latex: ['avocado', 'banana', 'chestnut']
};
```

#### 3.3 가족 건강 통합 관리
- 가족 구성원 건강 프로필 연동
- 그룹 식단 최적화 알고리즘
- 가족 건강 리포트

---

## 📊 기대 효과

### 사용자 건강 측면
- **질병 관리 효율**: 30-50% 향상
- **영양 균형**: 개인별 최적 비율 적용
- **안전성**: 알레르기 및 부작용 최소화

### 비즈니스 측면
- **사용자 만족도**: 개인화 서비스로 이탈률 20% 감소
- **시장 경쟁력**: 의학적 정확성으로 차별화
- **수익성**: 프리미엄 기능으로 ARPU 증가

---

## 🛠️ 기술 구현 계획

### 1단계: 백엔드 개선
```typescript
// lib/diet/calorie-calculator-enhanced.ts
// lib/diet/macro-calculator-advanced.ts
// lib/health/disease-manager.ts
```

### 2단계: 데이터베이스 확장
```sql
-- 새로운 테이블 구조
CREATE TABLE recipe_filters (
  recipe_id UUID,
  purine_level VARCHAR,
  gi_index INTEGER,
  sodium_content VARCHAR,
  potassium_safe BOOLEAN,
  phosphorus_safe BOOLEAN
);
```

### 3단계: 프론트엔드 개선
```typescript
// components/health/diet-customizer.tsx
// components/health/nutrition-dashboard.tsx
// components/health/smart-allergy-manager.tsx
```

---

## 📋 구현 우선순위

1. **🔴 긴급**: 칼로리 계산 로직 개선 (정확도 향상)
2. **🟠 중요**: 매크로 영양소 최적화 (건강 안전성)
3. **🟡 보통**: 레시피 다양성 확장 (사용자 만족)
4. **🟢 선택**: 고급 UI/UX 기능 (경쟁력 강화)

---

## 🎯 성공 지표

- **정확도**: 칼로리 계산 오차 ±10% 이내
- **사용성**: 건강 정보 입력 시간 50% 단축
- **만족도**: 사용자 재방문율 25% 향상
- **건강 효과**: 질병 관리 효율 30% 향상

---

*이 계획은 지속적으로 업데이트되며, 실제 구현 과정에서 사용자 피드백과 기술적 제약사항을 반영하여 조정됩니다.*
