# 식단 충돌 관리 시스템 개발자 문서

## 개요

질병과 특수 식단 간의 의학적 충돌을 감지하고 관리하는 시스템입니다. 사용자가 질병이 있는 상태에서 부적절한 특수 식단을 선택하는 것을 방지하고, 안전한 식단 선택을 유도합니다.

## 아키텍처

### 핵심 모듈

- **`lib/health/diet-conflict-manager.ts`**: 충돌 규칙 정의 및 검사 로직
- **`components/health/diet-conflict-warning.tsx`**: 충돌 경고 UI 컴포넌트
- **`components/health/diet-type-selector.tsx`**: 특수 식단 선택 UI (충돌 검사 통합)

### 데이터 흐름

```
사용자 입력 (질병 + 특수 식단)
  ↓
충돌 검사 (diet-conflict-manager)
  ↓
결과: 절대 금지 / 경고 / 주의
  ↓
UI 반영 (비활성화 / 경고 표시)
  ↓
API 검증 (절대 금지 조합 거부)
  ↓
식단 생성 시 최종 검증
```

## 충돌 규칙 정의

### 규칙 구조

```typescript
const CONFLICT_RULES: Record<
  string, // 질병 코드
  Record<
    string, // 식단 타입 또는 'diet_mode'
    {
      severity: 'absolute' | 'warning' | 'caution';
      reason: string;
      medicalSource: string;
      alternativeSuggestion?: string;
    }
  >
>
```

### 현재 정의된 충돌 규칙

#### 절대 금지 (absolute)

1. **CKD + fitness (고단백)**
   - 이유: CKD 환자는 단백질을 0.6-0.8g/kg로 엄격히 제한해야 함
   - 출처: KDOQI 가이드라인

2. **통풍 + diet 모드**
   - 이유: 급격한 체중 감량은 케톤체 생성을 유발하여 요산 수치 상승
   - 출처: ACR 가이드라인

3. **통풍 + low_carb**
   - 이유: 극단적인 저탄수화물 식단은 케톤체 생성으로 요산 수치 상승
   - 출처: ACR 가이드라인

4. **어린이(18세 미만) + diet 모드**
   - 이유: 성장기 체중 감량 금지
   - 출처: 소아과 가이드라인

5. **어린이(18세 미만) + low_carb**
   - 이유: 성장에 필요한 탄수화물 부족
   - 출처: 소아과 가이드라인

#### 경고 (warning)

1. **통풍 + fitness**
   - 이유: 고단백 식품 중 퓨린 함량이 높은 것들이 있음
   - 출처: ACR 가이드라인

2. **당뇨병 + low_carb**
   - 이유: 극단적인 저탄수화물 식단은 저혈당 위험
   - 출처: ADA 가이드라인

## API 사용법

### 충돌 검사 함수

```typescript
import { checkDietConflicts } from '@/lib/health/diet-conflict-manager';

const conflictResult = checkDietConflicts(healthProfile);

if (conflictResult.hasConflict) {
  // 절대 금지 옵션 확인
  if (conflictResult.blockedOptions.length > 0) {
    // UI에서 비활성화 또는 API에서 거부
  }
  
  // 경고 확인
  if (conflictResult.warnings.length > 0) {
    // 경고 메시지 표시
  }
}
```

### 가족 구성원 충돌 검사

```typescript
import { checkAllFamilyConflicts } from '@/lib/health/diet-conflict-manager';

const familyConflicts = checkAllFamilyConflicts(userProfile, familyMembers);

for (const memberConflict of familyConflicts) {
  if (memberConflict.conflicts.blockedOptions.length > 0) {
    console.warn(`${memberConflict.memberName}의 충돌:`, memberConflict.conflicts);
  }
}
```

## UI 통합

### DietTypeSelector 사용

```tsx
import { DietTypeSelector } from '@/components/health/diet-type-selector';

<DietTypeSelector
  selectedTypes={dietaryPreferences}
  onChange={setDietaryPreferences}
  isPremium={isPremium}
  healthProfile={healthProfile} // 충돌 검사용
/>
```

### 충돌 경고 표시

```tsx
import { DietConflictWarning } from '@/components/health/diet-conflict-warning';

{conflictResult && conflictResult.hasConflict && (
  <DietConflictWarning conflictResult={conflictResult} />
)}
```

## 새로운 충돌 규칙 추가 방법

1. **의학적 근거 확인**: 최신 의학 가이드라인 확인
2. **규칙 정의**: `lib/health/diet-conflict-manager.ts`의 `CONFLICT_RULES`에 추가
3. **심각도 결정**: `absolute` (절대 금지), `warning` (경고), `caution` (주의)
4. **테스트 작성**: `__tests__/lib/health/diet-conflict-manager.test.ts`에 테스트 케이스 추가
5. **문서 업데이트**: 이 문서에 규칙 추가

### 예시: 새로운 규칙 추가

```typescript
// lib/health/diet-conflict-manager.ts
const CONFLICT_RULES = {
  // ... 기존 규칙들
  'new_disease': {
    'problematic_diet': {
      severity: 'absolute',
      reason: '의학적 이유 설명',
      medicalSource: '의학 가이드라인 출처',
      alternativeSuggestion: '대안 제안',
    },
  },
};
```

## 가족 식단 생성 시 충돌 처리

가족 식단 생성 시 각 구성원별로 개별 충돌 검사를 수행합니다:

```typescript
// lib/diet/family-diet-generator.ts
const familyConflicts = checkAllFamilyConflicts(userProfile, familyMembers);

// 각 구성원의 충돌을 로그로 기록
for (const memberConflict of familyConflicts) {
  if (memberConflict.conflicts.blockedOptions.length > 0) {
    console.warn(`${memberConflict.memberName}의 식단 충돌 감지`);
  }
}
```

## 에러 처리

### API 응답 형식

**절대 금지 조합 (400 Bad Request)**:
```json
{
  "error": "Diet conflict detected",
  "message": "선택하신 질병과 식단 조합은 의학적으로 권장되지 않습니다.",
  "details": [
    {
      "disease": "kidney_disease",
      "dietType": "fitness",
      "reason": "...",
      "medicalSource": "..."
    }
  ],
  "conflicts": { ... }
}
```

**경고 포함 성공 (200 OK)**:
```json
{
  "success": true,
  "profile": { ... },
  "warnings": [
    {
      "disease": "gout",
      "dietType": "fitness",
      "reason": "...",
      "medicalSource": "...",
      "alternativeSuggestion": "..."
    }
  ]
}
```

## 성능 고려사항

- 충돌 검사는 메모리 기반 규칙 매핑을 사용하므로 매우 빠름
- 가족 구성원이 많은 경우에도 각 구성원별 검사는 O(n) 시간 복잡도
- UI에서 실시간 검사 시 `useMemo`로 결과 캐싱 권장

## 확장성

- 새로운 질병 추가: `CONFLICT_RULES`에 질병 코드 추가
- 새로운 특수 식단 추가: `CONFLICT_RULES`의 각 질병별 규칙에 식단 타입 추가
- 데이터베이스 기반 규칙 관리 (선택사항): `diet_conflict_rules` 테이블 생성 후 동적 로드

## 참고 자료

- ACR (American College of Rheumatology): 통풍 가이드라인
- ADA (American Diabetes Association): 당뇨병 가이드라인
- KDOQI: 만성 신장질환 가이드라인
- 소아과/산부인과 가이드라인: 어린이 및 임신부 식단 제한

