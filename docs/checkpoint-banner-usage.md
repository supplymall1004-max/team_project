# CheckpointBanner 사용 가이드

## 개요

Discord 스타일의 체크포인트 배너 컴포넌트 사용 방법을 설명합니다.

## 기본 사용법

### 1. 간단한 사용 예시

```tsx
import { CheckpointBanner } from "@/components/checkpoint-banner";

export default function Page() {
  return (
    <>
      <CheckpointBanner
        message="2025년 활동을 되돌아보세요"
        actionUrl="/activity-summary"
      />
      {/* 나머지 콘텐츠 */}
    </>
  );
}
```

### 2. 레이아웃에 추가하기

`app/layout.tsx`에 추가하여 모든 페이지에서 표시:

```tsx
import { CheckpointBanner } from "@/components/checkpoint-banner";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <CheckpointBanner
          title="체크포인트"
          message="2025년 활동을 되돌아보세요"
          storageKey="checkpoint_2025_dismissed"
          actionUrl="/activity-summary"
        />
      </body>
    </html>
  );
}
```

### 3. 조건부 표시

특정 조건에서만 표시:

```tsx
import { CheckpointBanner } from "@/components/checkpoint-banner";
import { useAuth } from "@clerk/nextjs";

export default function Page() {
  const { userId } = useAuth();
  const isNewYear = new Date().getMonth() === 0; // 1월인지 확인

  return (
    <>
      {isNewYear && userId && (
        <CheckpointBanner
          message="새해를 맞이하여 작년 활동을 확인해보세요"
          storageKey="newyear_checkpoint_2025"
          actionUrl="/yearly-summary"
        />
      )}
    </>
  );
}
```

### 4. 커스텀 콜백 사용

```tsx
import { CheckpointBanner } from "@/components/checkpoint-banner";

export default function Page() {
  const handleClose = () => {
    console.log("배너가 닫혔습니다");
    // 추가 로직 (예: 분석 이벤트 전송)
  };

  const handleAction = () => {
    console.log("액션 버튼 클릭됨");
    // 커스텀 액션 로직
  };

  return (
    <>
      <CheckpointBanner
        message="특별 이벤트가 진행 중입니다"
        onClose={handleClose}
        onAction={handleAction}
      />
    </>
  );
}
```

## Props 설명

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `title` | `string` | `"체크포인트"` | 배너 제목 |
| `message` | `string` | **필수** | 배너 본문 텍스트 |
| `actionUrl` | `string` | `undefined` | 클릭 시 이동할 URL |
| `storageKey` | `string` | `"checkpoint_dismissed"` | localStorage 키 |
| `shouldShow` | `boolean` | `true` | 배너 표시 여부 |
| `onClose` | `() => void` | `undefined` | 닫기 버튼 클릭 시 콜백 |
| `onAction` | `() => void` | `undefined` | 액션 버튼 클릭 시 콜백 |

## 스타일 커스터마이징

컴포넌트 내부의 Tailwind CSS 클래스를 수정하여 스타일을 변경할 수 있습니다:

- **배경색**: `bg-green-500` → `bg-blue-500` 등
- **위치**: `top-5 right-5` → `top-10 right-10` 등
- **크기**: `w-[320px]` → `w-[400px]` 등
- **빛나는 효과**: `style` prop의 `boxShadow` 값 수정

## 주의사항

1. **localStorage 키 충돌 방지**: 각 배너마다 고유한 `storageKey` 사용
2. **모바일 반응형**: 기본적으로 `max-w-[calc(100vw-2rem)]`로 설정되어 있음
3. **접근성**: `role="alert"`와 `aria-live="polite"`가 설정되어 있음
4. **성능**: 애니메이션은 CSS transitions 사용으로 GPU 가속 활용

## 실제 사용 사례

### 연말 활동 요약
```tsx
<CheckpointBanner
  title="연말 요약"
  message="2024년 한 해 동안의 활동을 확인해보세요"
  storageKey="year_end_summary_2024"
  actionUrl="/yearly-summary/2024"
/>
```

### 새 기능 소개
```tsx
<CheckpointBanner
  title="새로운 기능"
  message="AI 맞춤 식단 기능이 추가되었습니다"
  storageKey="new_feature_ai_diet"
  actionUrl="/features/ai-diet"
/>
```

### 이벤트 알림
```tsx
<CheckpointBanner
  title="특별 이벤트"
  message="프리미엄 구독 시 첫 달 무료!"
  storageKey="premium_event_2025_01"
  actionUrl="/pricing"
/>
```

