# 레이아웃 컴포넌트 사용 가이드

> **작성일**: 2025-01-28  
> **목적**: 프로젝트의 레이아웃 컴포넌트 사용법 및 패턴 가이드

---

## 📋 목차

1. [개요](#개요)
2. [레이아웃 컴포넌트](#레이아웃-컴포넌트)
3. [사용 예시](#사용-예시)
4. [반응형 브레이크포인트](#반응형-브레이크포인트)
5. [레이아웃 패턴](#레이아웃-패턴)

---

## 개요

프로젝트의 레이아웃 시스템은 일관성 있고 재사용 가능한 컴포넌트로 구성되어 있습니다.

### 주요 디렉토리 구조

```
components/
├── layout/
│   ├── navbar.tsx              # 상단 네비게이션
│   ├── footer.tsx              # 푸터
│   ├── bottom-navigation.tsx   # 하단 네비게이션 (모바일)
│   ├── page-layout.tsx         # 페이지 레이아웃 래퍼
│   ├── card-grid.tsx           # 반응형 카드 그리드
│   └── types.ts                # 레이아웃 타입 정의
├── admin/
│   └── sidebar-layout.tsx      # 관리자 사이드바 레이아웃
└── section.tsx                 # 섹션 래퍼 컴포넌트
```

---

## 레이아웃 컴포넌트

### 1. PageLayout

페이지별 공통 레이아웃을 제공하는 래퍼 컴포넌트입니다.

**Props:**
- `title: string` - 페이지 제목 (필수)
- `description?: string` - 페이지 설명
- `children: React.ReactNode` - 페이지 콘텐츠 (필수)
- `className?: string` - 추가 CSS 클래스
- `actions?: React.ReactNode` - 헤더 액션 버튼
- `headerClassName?: string` - 헤더 영역 CSS 클래스
- `contentClassName?: string` - 콘텐츠 영역 CSS 클래스

**사용 예시:**

```tsx
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  return (
    <PageLayout
      title="건강 관리"
      description="가족 구성원의 건강 정보를 관리하세요"
      actions={<Button>새 기록 추가</Button>}
    >
      {/* 페이지 콘텐츠 */}
    </PageLayout>
  );
}
```

### 2. CardGrid

반응형 카드 그리드 시스템입니다.

**Props:**
- `children: React.ReactNode` - 그리드 아이템들 (필수)
- `className?: string` - 추가 CSS 클래스
- `columns?: { mobile?: number; tablet?: number; desktop?: number }` - 열 수 설정
  - 기본값: `{ mobile: 1, tablet: 2, desktop: 3 }`
- `gap?: "sm" | "md" | "lg"` - 아이템 간격
  - 기본값: `"md"`

**사용 예시:**

```tsx
import { CardGrid } from "@/components/layout/card-grid";
import { Card } from "@/components/ui/card";

export default function MyPage() {
  return (
    <CardGrid
      columns={{ mobile: 1, tablet: 2, desktop: 4 }}
      gap="lg"
    >
      <Card>카드 1</Card>
      <Card>카드 2</Card>
      <Card>카드 3</Card>
      <Card>카드 4</Card>
    </CardGrid>
  );
}
```

### 3. Section

반복되는 섹션 레이아웃을 위한 래퍼 컴포넌트입니다. 페이지 내에서 섹션을 구분하고 일관된 스타일을 제공합니다.

**Props:**
- `id?: string` - 섹션 ID (앵커 링크용)
- `title?: string` - 섹션 제목
- `description?: string` - 섹션 설명
- `children: React.ReactNode` - 섹션 콘텐츠 (필수)
- `className?: string` - 추가 CSS 클래스
- `actions?: React.ReactNode` - 헤더 액션 버튼
- `variant?: "default" | "card" | "bordered"` - 섹션 스타일 변형
  - `default`: 기본 스타일 (기본값)
  - `card`: 카드 스타일 (배경색, 테두리, 패딩)
  - `bordered`: 하단 테두리만 있는 스타일

**사용 예시:**

```tsx
import { Section } from "@/components/section";
import { Button } from "@/components/ui/button";

export default function MyPage() {
  return (
    <Section
      title="레시피"
      description="다양한 레시피를 확인하세요"
      actions={<Button>더보기</Button>}
      variant="default"
    >
      {/* 섹션 콘텐츠 */}
    </Section>
  );
}
```

**Variant 예시:**

```tsx
// 기본 스타일
<Section title="기본 섹션">
  {/* 콘텐츠 */}
</Section>

// 카드 스타일
<Section title="카드 섹션" variant="card">
  {/* 콘텐츠 */}
</Section>

// 테두리 스타일
<Section title="테두리 섹션" variant="bordered">
  {/* 콘텐츠 */}
</Section>
```

---

## 사용 예시

### 기본 페이지 레이아웃

```tsx
import { PageLayout } from "@/components/layout/page-layout";
import { CardGrid } from "@/components/layout/card-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <PageLayout
      title="대시보드"
      description="전체 현황을 한눈에 확인하세요"
    >
      <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
        <Card>
          <CardHeader>
            <CardTitle>통계 1</CardTitle>
          </CardHeader>
          <CardContent>내용</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>통계 2</CardTitle>
          </CardHeader>
          <CardContent>내용</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>통계 3</CardTitle>
          </CardHeader>
          <CardContent>내용</CardContent>
        </Card>
      </CardGrid>
    </PageLayout>
  );
}
```

### 액션 버튼이 있는 페이지

```tsx
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ListPage() {
  return (
    <PageLayout
      title="목록"
      description="항목을 관리하세요"
      actions={
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새로 만들기
        </Button>
      }
    >
      {/* 목록 콘텐츠 */}
    </PageLayout>
  );
}
```

---

## 반응형 브레이크포인트

프로젝트는 Tailwind CSS의 기본 브레이크포인트를 사용합니다:

- **모바일**: 기본 (0px 이상)
- **태블릿**: `md:` (768px 이상)
- **데스크톱**: `lg:` (1024px 이상)

### CardGrid 열 수 권장사항

- **모바일**: 1-2열
- **태블릿**: 2-3열
- **데스크톱**: 3-4열

---

## 레이아웃 패턴

### 1. 단일 컬럼 레이아웃

```tsx
<PageLayout title="상세 페이지">
  <div className="max-w-3xl mx-auto">
    {/* 콘텐츠 */}
  </div>
</PageLayout>
```

### 2. 카드 그리드 레이아웃

```tsx
<PageLayout title="카드 목록">
  <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
    {/* 카드들 */}
  </CardGrid>
</PageLayout>
```

### 3. 섹션 기반 레이아웃

```tsx
import { Section } from "@/components/section";
import { PageLayout } from "@/components/layout/page-layout";

export default function SectionPage() {
  return (
    <PageLayout title="섹션 페이지">
      <div className="space-y-8">
        <Section title="섹션 1" description="첫 번째 섹션입니다">
          {/* 콘텐츠 */}
        </Section>
        <Section title="섹션 2" description="두 번째 섹션입니다" variant="card">
          {/* 콘텐츠 */}
        </Section>
      </div>
    </PageLayout>
  );
}
```

### 4. Section과 PageLayout 조합

```tsx
import { Section } from "@/components/section";
import { PageLayout } from "@/components/layout/page-layout";
import { CardGrid } from "@/components/layout/card-grid";

export default function CombinedPage() {
  return (
    <PageLayout title="통합 페이지">
      <Section title="카드 그리드" variant="bordered">
        <CardGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }}>
          {/* 카드들 */}
        </CardGrid>
      </Section>
      
      <Section title="다른 콘텐츠" variant="card">
        {/* 다른 콘텐츠 */}
      </Section>
    </PageLayout>
  );
}
```

---

## 추가 레이아웃 컴포넌트

### 5. BottomNavigation

모바일 전용 하단 네비게이션 바입니다. 배달의민족 앱 스타일을 참고하여 구현되었습니다.

**특징:**
- 모바일에서만 표시 (`md:hidden`)
- 5개 메뉴: 홈, 레시피, 식단, 건강, 마이
- 현재 페이지 자동 하이라이트
- `position: fixed`로 항상 하단에 고정
- 키보드 네비게이션 및 스크린리더 지원

**사용 위치:**
- `app/layout.tsx`에서 전역으로 사용
- 모바일에서만 자동 표시

**사용 예시:**
```tsx
// app/layout.tsx에서 자동으로 포함됨
// 별도 import 불필요
```

**스타일링:**
- 활성 상태: `text-teal-600`, `scale-105`
- 비활성 상태: `text-gray-500`
- 아이콘 크기: 24px (`w-6 h-6`)
- 텍스트 크기: 12px (`text-xs`)
- 높이: 64px (`h-16`)

### 6. SidebarLayout (관리자)

관리자 콘솔용 사이드바 레이아웃입니다.

**Props:**
- `navItems: AdminNavItem[]` - 네비게이션 항목 배열
- `user: AdminUserMeta` - 사용자 정보
- `headerContent?: ReactNode` - 헤더 슬롯
- `children: ReactNode` - 메인 콘텐츠

**사용 예시:**
```tsx
import { SidebarLayout } from "@/components/admin/sidebar-layout";

const navItems = [
  { id: "overview", label: "개요", href: "/admin", icon: "overview" },
  { id: "recipes", label: "레시피", href: "/admin/recipes", icon: "recipes" },
];

export default function AdminPage() {
  return (
    <SidebarLayout
      navItems={navItems}
      user={{ id: "1", name: "관리자", email: "admin@example.com" }}
    >
      {/* 관리자 콘텐츠 */}
    </SidebarLayout>
  );
}
```

**특징:**
- 반응형 사이드바 (모바일에서 토글 가능)
- 현재 경로 자동 하이라이트
- 사용자 아바타 및 정보 표시
- 커스터마이징 가능한 헤더 슬롯

---

## 참고사항

1. **일관성 유지**: 모든 페이지에서 `PageLayout`을 사용하여 일관된 레이아웃을 유지하세요.
2. **반응형 고려**: 항상 모바일, 태블릿, 데스크톱을 고려하여 레이아웃을 설계하세요.
3. **접근성**: 적절한 제목 구조와 시맨틱 HTML을 사용하세요.
4. **성능**: 불필요한 중첩을 피하고 컴포넌트를 최적화하세요.
5. **레이아웃 선택**: 
   - 일반 페이지: `PageLayout`
   - 관리자 페이지: `SidebarLayout`
   - 하단 네비게이션: `app/layout.tsx`에서 자동 포함

---

## 추가 리소스

- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [Next.js 레이아웃 가이드](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts)
