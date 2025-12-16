# 이유식 레시피 상세페이지 구현 계획

> **작성일**: 2025-01-27  
> **목적**: 레거시 아카이브에 이유식 레시피 기능 추가

---

## 1. 페이지 구조

### 1.1. 이유식 레시피 목록 페이지 (`/archive/recipes?tab=baby`)

**기능:**
- 이유식 단계별 필터 (초기/중기/후기/완료기)
- 월령별 필터 (4-6개월, 7-8개월, 9-11개월, 12개월+)
- 레시피 카드 그리드 표시
- 검색 기능

**UI 구성:**
- 상단: 이유식 안내 배너 (공지 컴포넌트)
- 중단: 필터 및 검색바
- 하단: 레시피 카드 그리드

### 1.2. 이유식 레시피 상세 페이지 (`/archive/recipes/baby/[id]`)

**기능:**
- 레시피 상세 정보 표시
- 단계별 조리 방법
- 재료 및 영양 정보
- 월령별 추천 표시
- 주의사항 및 알레르기 정보

**UI 구성:**
- 상단: 레시피 썸네일 및 기본 정보
- 중단: 재료 목록, 조리 단계
- 하단: 주의사항, 영양 정보, 관련 레시피 추천

---

## 2. 데이터 구조

### 2.1. 이유식 레시피 테이블 (`baby_recipes`)

```sql
CREATE TABLE baby_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    stage TEXT NOT NULL CHECK (stage IN ('initial', 'middle', 'late', 'complete')),
    age_months_min INTEGER NOT NULL, -- 최소 월령
    age_months_max INTEGER, -- 최대 월령 (NULL이면 12개월+)
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition_info JSONB, -- 영양 정보
    allergy_warnings TEXT[], -- 알레르기 주의 재료
    tips TEXT[], -- 조리 팁
    cooking_time_minutes INTEGER,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**재료 구조 (JSONB):**
```json
[
  {
    "name": "쌀",
    "amount": "50g",
    "note": "불린 쌀"
  }
]
```

**조리 단계 구조 (JSONB):**
```json
[
  {
    "step": 1,
    "description": "쌀을 충분히 불린다",
    "image_url": "optional",
    "timer_minutes": null
  }
]
```

---

## 3. 컴포넌트 구조

### 3.1. 이유식 안내 배너 (`BabyRecipeNotice.tsx`)

**위치**: `/components/baby-recipes/baby-recipe-notice.tsx`

**기능:**
- docs/baby.md 내용을 바탕으로 이유식 기본 정보 표시
- 단계별 설명
- 주의사항 강조

### 3.2. 이유식 레시피 목록 (`BabyRecipeList.tsx`)

**위치**: `/components/baby-recipes/baby-recipe-list.tsx`

**기능:**
- 필터링 (단계, 월령)
- 검색
- 레시피 카드 그리드

### 3.3. 이유식 레시피 상세 (`BabyRecipeDetail.tsx`)

**위치**: `/components/baby-recipes/baby-recipe-detail.tsx`

**기능:**
- 레시피 상세 정보 표시
- 단계별 조리 가이드
- 영양 정보 표시

---

## 4. 구현 순서

1. ✅ 메인화면 아이콘 추가 (완료)
2. ⏳ 이유식 안내 배너 컴포넌트 생성
3. ⏳ 이유식 레시피 목록 컴포넌트 생성
4. ⏳ 레시피 아카이브 페이지에 탭 추가
5. ⏳ 데이터베이스 테이블 생성 (선택사항 - 초기에는 하드코딩된 데이터 사용 가능)
6. ⏳ 이유식 레시피 상세 페이지 생성

---

## 5. 초기 데이터

docs/baby.md에 있는 레시피 아이디어를 바탕으로 초기 레시피 데이터를 생성:

### 초기 단계 (4-6개월)
- 쌀 미음
- 단호박 미음
- 고구마 미음

### 중기 (7-8개월)
- 소고기 청경채 죽
- 닭고기 브로콜리 죽
- 두부 애호박 죽

### 후기/완료기 (9-12개월+)
- 채소 계란말이/찜
- 생선 감자 무른 밥
- 부드러운 과일

---

## 6. 디자인 가이드

- **색상**: 핑크/로즈 계열 (아기 느낌)
- **아이콘**: Baby 아이콘 사용
- **레이아웃**: 기존 레시피 아카이브와 일관성 유지
- **반응형**: 모바일 우선 설계
