# 디자인 시스템 가이드

맛의 아카이브(Flavor Archive) 프로젝트의 디자인 시스템 문서입니다.

## 1. 색상 팔레트

### 브랜드 색상

#### 주황/빨강 계열 (Primary)
요리와 음식을 연상시키는 따뜻한 주황색을 메인 컬러로 사용합니다.

- **Orange 50**: `oklch(0.98 0.02 50)` - 가장 밝은 배경
- **Orange 100**: `oklch(0.95 0.04 50)` - 배경 강조
- **Orange 200**: `oklch(0.90 0.06 50)` - 경계선
- **Orange 300**: `oklch(0.85 0.08 50)` - 비활성 상태
- **Orange 400**: `oklch(0.75 0.12 50)` - 호버 상태
- **Orange 500**: `oklch(0.65 0.16 50)` - 기본 버튼/링크
- **Orange 600**: `oklch(0.55 0.18 50)` - 활성 상태
- **Orange 700**: `oklch(0.45 0.20 50)` - 강조 텍스트
- **Orange 800**: `oklch(0.35 0.22 50)` - 제목
- **Orange 900**: `oklch(0.25 0.24 50)` - 가장 진한 색상

#### 녹색 계열 (Accent)
건강과 신선함을 연상시키는 자연스러운 녹색을 보조 컬러로 사용합니다.

- **Green 50-900**: Orange와 동일한 구조, hue 150 사용

#### 금색 계열 (Premium)
프리미엄 구독 및 인증 마크에 사용하는 금색입니다.

- **Gold 50-900**: Orange와 동일한 구조, hue 85 사용

### 사용 예시

```tsx
// 주황색 버튼
<Button className="bg-orange-500 hover:bg-orange-600 text-white">
  레시피 보기
</Button>

// 녹색 강조
<div className="bg-green-50 border-green-200">
  건강 정보
</div>

// 금색 프리미엄 배지
<span className="bg-gold-500 text-white px-2 py-1 rounded">
  프리미엄
</span>
```

## 2. 타이포그래피

### 폰트 패밀리

#### 제목용 폰트: Jalnan (예쁘게 오뜨제 잘난)
- **폰트명**: `YeogiOttaeJalnan`
- **용도**: H1, H2, H3 등 모든 제목
- **특징**: 친근하고 따뜻한 느낌의 한글 폰트

#### 본문용 폰트: Geist Sans
- **폰트명**: `var(--font-geist-sans)`
- **폴백**: `'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif`
- **용도**: 본문 텍스트, 버튼, 입력 필드 등

#### 코드용 폰트: Geist Mono
- **폰트명**: `var(--font-geist-mono)`
- **용도**: 코드 블록, 인라인 코드

### 타이포그래피 스케일

| 요소 | 크기 | Line Height | Font Weight |
|------|------|-------------|-------------|
| H1 | 2.5rem (40px) | 1.2 | Normal (Jalnan) |
| H2 | 2rem (32px) | 1.3 | Normal (Jalnan) |
| H3 | 1.5rem (24px) | 1.4 | Normal (Jalnan) |
| H4 | 1.25rem (20px) | 1.4 | Normal (Jalnan) |
| 본문 | 1rem (16px) | 1.6 | 400 |
| 작은 텍스트 | 0.875rem (14px) | 1.5 | 400 |
| 매우 작은 텍스트 | 0.75rem (12px) | 1.4 | 400 |

### 사용 예시

```tsx
// 제목 (Jalnan 폰트 자동 적용)
<h1>잊혀진 손맛을 연결하는 디지털 식탁</h1>

// 본문
<p className="text-base">명인의 전통 레시피부터...</p>

// 작은 텍스트
<span className="text-sm text-muted-foreground">30분 | 중급</span>
```

## 3. 간격(Spacing) 시스템

4px 기준의 간격 시스템을 사용합니다.

| 이름 | 크기 | 용도 |
|------|------|------|
| xs | 0.25rem (4px) | 매우 작은 간격 |
| sm | 0.5rem (8px) | 작은 간격 |
| md | 1rem (16px) | 기본 간격 |
| lg | 1.5rem (24px) | 큰 간격 |
| xl | 2rem (32px) | 매우 큰 간격 |
| 2xl | 3rem (48px) | 섹션 간격 |
| 3xl | 4rem (64px) | 큰 섹션 간격 |

### 사용 예시

```tsx
<div className="space-y-4"> {/* md 간격 */}
  <Card />
  <Card />
</div>

<div className="p-6"> {/* lg 패딩 */}
  내용
</div>
```

## 4. 그림자 시스템

| 이름 | 값 | 용도 |
|------|-----|------|
| sm | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | 작은 카드 |
| default | `0 1px 3px 0 rgb(0 0 0 / 0.1)...` | 기본 카드 |
| md | `0 4px 6px -1px rgb(0 0 0 / 0.1)...` | 호버 상태 |
| lg | `0 10px 15px -3px rgb(0 0 0 / 0.1)...` | 모달, 드롭다운 |
| xl | `0 20px 25px -5px rgb(0 0 0 / 0.1)...` | 큰 모달 |

## 5. 테두리 반경

| 이름 | 크기 | 용도 |
|------|------|------|
| sm | 0.125rem (2px) | 작은 요소 |
| md | 0.375rem (6px) | 입력 필드 |
| lg | 0.5rem (8px) | 버튼 |
| xl | 0.75rem (12px) | 카드 |
| 2xl | 1rem (16px) | 큰 카드 |
| full | 9999px | 원형 |

## 6. 반응형 디자인

### 브레이크포인트

| 이름 | 크기 | 용도 |
|------|------|------|
| sm | 640px | 작은 태블릿 |
| md | 768px | 태블릿 |
| lg | 1024px | 작은 데스크톱 |
| xl | 1280px | 데스크톱 |
| 2xl | 1536px | 큰 데스크톱 |

### 터치 친화적 요소

- **최소 터치 영역**: 44px × 44px (iOS 가이드라인)
- **버튼 높이**: 최소 44px
- **카드 간 간격**: 16px 이상
- **텍스트 크기**: 최소 14px (가독성 확보)

### 반응형 레이아웃 예시

```tsx
// 그리드: 모바일 1열, 태블릿 2열, 데스크톱 3열
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

// 플렉스: 모바일 세로, 데스크톱 가로
<div className="flex flex-col lg:flex-row gap-4">
  <div>내용 1</div>
  <div>내용 2</div>
</div>
```

## 7. 아이콘 시스템

**라이브러리**: `lucide-react`

### 사용 예시

```tsx
import { ChefHat, Film, Brain } from "lucide-react";

<ChefHat className="h-5 w-5 text-orange-600" />
<Film className="h-6 w-6" />
<Brain className="h-4 w-4" />
```

### 아이콘 크기 가이드

- **작은 아이콘**: 16px (h-4 w-4) - 인라인 텍스트 옆
- **기본 아이콘**: 20px (h-5 w-5) - 버튼, 카드
- **큰 아이콘**: 24px (h-6 w-6) - 섹션 헤더
- **매우 큰 아이콘**: 32px (h-8 w-8) - 히어로 섹션

## 8. 다크 모드

다크 모드는 자동으로 지원됩니다. 색상 변수는 라이트/다크 모드에 따라 자동으로 변경됩니다.

### 사용 예시

```tsx
// 다크 모드 자동 대응
<div className="bg-card text-card-foreground">
  내용
</div>
```

## 9. 접근성

### 색상 대비

- **일반 텍스트**: 최소 4.5:1 대비 비율 (WCAG AA)
- **큰 텍스트**: 최소 3:1 대비 비율
- **인터랙티브 요소**: 명확한 포커스 표시

### 키보드 네비게이션

- 모든 인터랙티브 요소는 키보드로 접근 가능
- 포커스 표시: `focus-visible:ring-2 focus-visible:ring-orange-500`

## 10. 컴포넌트 스타일 가이드

### 버튼

```tsx
// Primary 버튼 (주황색)
<Button>레시피 보기</Button>

// Secondary 버튼
<Button variant="outline">취소</Button>

// Accent 버튼 (녹색)
<Button className="bg-green-500 hover:bg-green-600">
  건강 정보 입력
</Button>
```

### 카드

```tsx
<Card className="hover:shadow-lg transition-shadow">
  <CardHeader>
    <CardTitle>레시피 제목</CardTitle>
    <CardDescription>레시피 설명</CardDescription>
  </CardHeader>
  <CardContent>내용</CardContent>
</Card>
```

## 참고 자료

- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui 문서](https://ui.shadcn.com/)
- [lucide-react 아이콘](https://lucide.dev/)
- [WCAG 2.1 가이드라인](https://www.w3.org/WAI/WCAG21/quickref/)

