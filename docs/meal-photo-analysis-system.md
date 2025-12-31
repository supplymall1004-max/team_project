# 식사 사진 분석 시스템 문서

## 개요

사용자가 찍은 식사 사진을 AI로 분석하여 실제 섭취 영양소를 추적하고, 건강 식단과 비교하는 시스템입니다.

## 핵심 원칙

### 로컬 스토리지 우선
- **모든 식사 사진과 데이터는 사용자 기기의 IndexedDB에 저장됩니다**
- Supabase Storage는 사용하지 않습니다
- 로컬 저장으로 인한 빠른 로딩 속도 기대

### 거부감 없는 UX
- 자연스러운 분석 과정 (로딩 메시지: "AI가 음식을 분석하고 있어요...")
- 친근한 톤의 안내 메시지
- 시각적으로 명확한 결과 표시

## 아키텍처

### 데이터 흐름

```
사용자 사진 촬영
    ↓
클라이언트: Base64 변환
    ↓
Server Action: Gemini AI 분석
    ↓
클라이언트: IndexedDB 저장
    - meal_photos (사진 + 분석 결과)
    - actual_diet_records (실제 섭취 기록)
    ↓
일주일간 데이터 집계
    ↓
영양소 분석 및 권장사항 제공
```

### 주요 컴포넌트

1. **`components/health/diet/meal-photo-upload.tsx`**
   - 식사 사진 업로드 및 분석 UI
   - 거부감 없는 자연스러운 인터페이스

2. **`components/health/diet/diet-comparison.tsx`**
   - 건강 식단 vs 실제 식단 비교
   - 영양소별 차이 시각화

3. **`components/health/diet/weekly-nutrition-report.tsx`**
   - 일주일간 영양소 분석 리포트
   - 부족/초과 영양소 알림

4. **`lib/gemini/food-analyzer.ts`**
   - Gemini 멀티모달을 사용한 음식 인식
   - 영양소 계산

5. **`lib/storage/meal-photo-storage.ts`**
   - 식사 사진 IndexedDB 저장/조회

6. **`lib/storage/actual-diet-storage.ts`**
   - 실제 섭취 식단 기록 저장/조회
   - 일주일간 영양소 집계

## 사용 방법

### 1. 식사 사진 업로드

```tsx
<MealPhotoUpload
  date="2025-02-01"
  mealType="lunch"
  onAnalysisComplete={(analysis) => {
    console.log("분석 완료:", analysis);
  }}
/>
```

### 2. 식단 비교

```tsx
<DietComparison date="2025-02-01" />
```

### 3. 주간 분석

```tsx
<WeeklyNutritionReport weekStartDate="2025-01-27" />
```

## 데이터 구조

### MealPhoto
```typescript
{
  id: string;
  userId: string;
  date: string; // 'YYYY-MM-DD'
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  imageData: string; // Base64
  analyzed: boolean;
  analysisResult?: MealPhotoAnalysis;
}
```

### ActualDietRecord
```typescript
{
  id: string;
  userId: string;
  date: string;
  mealType: string;
  photoId?: string;
  foods: Array<{ name, calories, protein, carbs, fat, sodium }>;
  nutrition: NutritionInfo;
  source: 'photo_analysis' | 'manual_entry';
}
```

## 성능 최적화

- 모든 데이터는 로컬 스토리지에 저장되어 즉시 조회 가능
- 이미지 분석은 서버에서 수행하되, 결과는 로컬에 캐싱
- 일주일간 데이터 집계는 클라이언트에서 수행

## 보안 및 개인정보 보호

- 모든 데이터는 사용자 기기에만 저장
- 이미지 분석은 서버에서 수행되지만, 이미지 자체는 서버에 저장되지 않음
- 사용자가 언제든지 데이터 삭제 가능

