# AI 맞춤 식단 큐레이션 설계도

## 🎯 전체 레이아웃 구조

```
┌─────────────────────────────────────────────────────────────┐
│ Header: 우리집 건강밥상                                      │
├─────────────────────────────────────────────────────────────┤
│ 가족 구성원 탭 영역                                          │
│ ┌─────┬─────┬─────┬─────┬─────────────┐                    │
│ │ 엄마 │ 아빠 │ 아이1│ 아이2│ +가족추가 │                    │
│ └─────┴─────┴─────┴─────┴─────────────┘                    │
├─────────────────────────────────────────────────────────────┤
│ 메인 콘텐츠 영역                                            │
│ ┌─────────────────┬───────────────────────┐              │
│ │ 오늘의 추천식단   │ AI 큐레이션 패널      │              │
│ │                 │                       │              │
│ │ ┌─────────────┐ │ ┌───────────────────┐ │              │
│ │ │ 아침: 밥+된장국│ │ │ AI 추천 ON/OFF   │ │              │
│ │ │ 점심: 불고기   │ │ │ □ ON  ■ OFF     │ │              │
│ │ │ 저녁: 김치찌개 │ │ │                   │ │              │
│ │ │ 간식: 과일     │ │ │ 맞춤 설정         │ │              │
│ │ └─────────────┘ │ │ │ □ 건강 포커스     │ │              │
│ │                 │ │ │ □ 맛 포커스       │ │              │
│ │                 │ │ │ □ 빠른 조리       │ │              │
│ │                 │ │ │ □ 예산 절약       │ │              │
│ └─────────────────┴───────────────────────┘              │
├─────────────────────────────────────────────────────────────┤
│ 푸터: © 2024 우리집 건강밥상                               │
└─────────────────────────────────────────────────────────────┘
```

## 📋 상세 컴포넌트 설계

### 1. 가족 구성원 탭 (Family Member Tabs)

**위치**: 헤더 바로 아래, 전체 너비
**기능**:
- 각 가족 구성원별 식단 표시 전환
- + 버튼으로 가족 구성원 추가 가능
- 현재 선택된 구성원은 하이라이트 표시

**구현 세부사항**:
```typescript
interface FamilyMember {
  id: string;
  name: string;
  role: 'parent' | 'child';
  preferences: {
    allergies: string[];
    dislikes: string[];
    healthGoals: string[];
  };
}
```

### 2. 오늘의 추천식단 (Today's Meal Plan)

**위치**: 메인 영역 좌측
**기능**:
- 아침, 점심, 저녁, 간식 표시
- 각 끼니별 상세 레시피 모달
- 영양 정보 표시
- 재료 쇼핑 리스트 생성

**데이터 구조**:
```typescript
interface MealPlan {
  memberId: string;
  date: Date;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Snack[];
  };
  nutrition: NutritionInfo;
}
```

### 3. AI 큐레이션 패널 (AI Curation Panel)

**위치**: 메인 영역 우측
**기능**:
- ON/OFF 토글 스위치
- 맞춤 설정 옵션들
- 실시간 추천 생성

**토글 기능**:
- **ON 상태**: AI가 자동으로 식단 추천
- **OFF 상태**: 수동으로 식단 선택

## 🔄 AI 큐레이션 워크플로우

```
사용자 선택 → AI 분석 → 추천 생성 → 사용자 확인 → 최종 적용
     ↓           ↓          ↓          ↓           ↓
  가족구성원    건강정보    식단패턴    피드백      저장
  선호도       알레르기    영양균형    조정        DB저장
  예산범위     체중관리    조리시간
  활동량
```

## 🎨 UI/UX 디자인 세부사항

### 가족 구성원 탭
- **색상**: 활성 탭 - 파란색 (#3B82F6), 비활성 - 회색 (#6B7280)
- **폰트**: Pretendard Medium, 14px
- **간격**: 탭 간 8px, 패딩 12px
- **호버 효과**: 배경색 변경 (#EFF6FF)

### AI 토글 스위치
- **ON 상태**: 녹색 배경, 흰색 텍스트
- **OFF 상태**: 회색 배경, 검정 텍스트
- **전환 애니메이션**: 0.3초 ease-in-out
- **크기**: 60x30px

### 추천 식단 카드
- **배경**: 흰색, 그림자 효과
- **테두리**: 1px solid #E5E7EB
- **코너 반경**: 8px
- **호버**: 살짝 위로 올라가는 효과

## 🔧 기술 구현 계획

### 프론트엔드 컴포넌트 구조
```
components/
├── family/
│   ├── FamilyMemberTabs.tsx
│   ├── AddFamilyMember.tsx
│   └── FamilyMemberCard.tsx
├── meal/
│   ├── TodaysMealPlan.tsx
│   ├── MealCard.tsx
│   └── NutritionInfo.tsx
├── ai/
│   ├── AICurationPanel.tsx
│   ├── AIToggle.tsx
│   └── AICustomization.tsx
└── ui/
    ├── Toggle.tsx
    └── Tab.tsx
```

### 데이터베이스 스키마
```sql
-- 가족 구성원 테이블
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('parent', 'child')),
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 식단 계획 테이블
CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id),
  date DATE NOT NULL,
  meals JSONB NOT NULL,
  nutrition_info JSONB,
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI 설정 테이블
CREATE TABLE ai_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_member_id UUID REFERENCES family_members(id),
  focus_areas TEXT[] DEFAULT ARRAY['health', 'taste'],
  budget_range TEXT DEFAULT 'medium',
  cooking_time TEXT DEFAULT 'normal',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### API 엔드포인트 설계
```
GET  /api/family-members          # 가족 구성원 목록
POST /api/family-members          # 가족 구성원 추가
GET  /api/meal-plans/:memberId    # 특정 구성원 식단 조회
POST /api/meal-plans/generate     # AI 식단 생성
PUT  /api/ai-preferences/:memberId # AI 설정 업데이트
POST /api/meal-plans/manual       # 수동 식단 저장
```

## 🚀 구현 우선순위

### Phase 1: 기본 구조 (1-2주)
1. 가족 구성원 탭 UI 구현
2. 기본 식단 표시 컴포넌트
3. AI ON/OFF 토글 구현

### Phase 2: AI 기능 (2-3주)
1. AI 큐레이션 알고리즘 개발
2. 맞춤 설정 옵션 구현
3. 추천 식단 생성 로직

### Phase 3: 고급 기능 (2-3주)
1. 영양 분석 기능
2. 쇼핑 리스트 자동 생성
3. 식단 히스토리 및 통계

## 🎯 핵심 기능 요구사항

### 가족 구성원 관리
- [ ] 최대 6명까지 등록 가능
- [ ] 각 구성원별 선호도/알레르기 설정
- [ ] 실시간 탭 전환

### AI 큐레이션
- [ ] 건강 포커스 모드
- [ ] 맛 포커스 모드
- [ ] 빠른 조리 모드
- [ ] 예산 절약 모드
- [ ] 다중 모드 동시 선택 가능

### 식단 관리
- [ ] 일일 4끼 식사 관리 (아침/점심/저녁/간식)
- [ ] 영양 정보 자동 계산
- [ ] 재료 기반 쇼핑 리스트 생성

## 📱 반응형 디자인

### 데스크톱 (1024px+)
- 2열 레이아웃 유지
- 탭과 패널 모두 가로 배치

### 태블릿 (768px-1023px)
- 1열 레이아웃으로 변경
- AI 패널을 식단 아래로 배치

### 모바일 (320px-767px)
- 단일 열 스택 레이아웃
- 탭을 가로 스크롤로 변경
- AI 패널을 접을 수 있게 구현

---

*이 설계도는 초기 버전이며, 사용자 피드백에 따라 지속적으로 개선됩니다.*
