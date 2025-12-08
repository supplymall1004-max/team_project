# Discord "체크포인트" 알림 UI 분석

## 개요

Discord의 오른쪽 사이드바에 표시되는 "체크포인트" 알림은 사용자에게 특정 이벤트나 활동을 알리는 고정형 배너입니다.

## UI 특징 분석

### 1. 위치 및 레이아웃
- **위치**: 오른쪽 사이드바 상단 (fixed position)
- **크기**: 중간 크기의 직사각형 박스
- **z-index**: 높은 값으로 다른 요소 위에 표시

### 2. 시각적 디자인
- **배경색**: 녹색 (green) - 주목을 끄는 색상
- **테두리**: 빛나는 효과 (glowing border) - `box-shadow` 또는 `border` + `filter: drop-shadow()` 사용
- **모서리**: 둥근 모서리 (border-radius)
- **그림자**: 부드러운 그림자 효과

### 3. 콘텐츠 구성
- **제목**: "체크포인트" (Checkpoint)
- **본문**: "2025년 Discord 활동을 되돌아보세요"
- **액션 버튼**: 
  - 닫기 버튼 (X 아이콘)
  - 오른쪽 화살표 아이콘 (클릭 시 상세 페이지로 이동)

### 4. 인터랙션
- **닫기 기능**: 클릭 시 알림이 사라지고 localStorage에 상태 저장
- **애니메이션**: 
  - 나타날 때: fade-in + slide-in 효과
  - 사라질 때: fade-out + slide-out 효과
- **호버 효과**: 마우스 오버 시 약간의 확대 또는 그림자 강화

## 구현 방법

### 기술 스택
- **React** (Next.js 15)
- **Tailwind CSS** (스타일링)
- **Framer Motion** 또는 CSS 애니메이션 (선택사항)
- **localStorage** (상태 저장)

### 핵심 구현 요소

#### 1. CSS 스타일링
```css
/* 빛나는 테두리 효과 */
.glow-border {
  box-shadow: 
    0 0 10px rgba(34, 197, 94, 0.5),
    0 0 20px rgba(34, 197, 94, 0.3),
    0 0 30px rgba(34, 197, 94, 0.2);
  border: 1px solid rgba(34, 197, 94, 0.5);
}

/* 또는 Tailwind CSS 사용 */
.glow-green {
  box-shadow: 
    0 0 10px rgb(34 197 94 / 0.5),
    0 0 20px rgb(34 197 94 / 0.3),
    0 0 30px rgb(34 197 94 / 0.2);
  border: 1px solid rgb(34 197 94 / 0.5);
}
```

#### 2. 상태 관리
- localStorage에 닫힌 상태 저장
- 키: `checkpoint_dismissed_2025` (예시)
- 값: `true` 또는 타임스탬프

#### 3. 위치 설정
```css
/* Fixed position으로 오른쪽 상단에 배치 */
position: fixed;
top: 20px;
right: 20px;
z-index: 1000;
```

#### 4. 애니메이션
- CSS transitions 또는 Framer Motion 사용
- fade-in/slide-in 효과

## 구현 예시 컴포넌트

프로젝트에 적용 가능한 컴포넌트 예시는 `components/checkpoint-banner.tsx` 파일을 참고하세요.

## 사용 사례

이런 패턴은 다음과 같은 상황에 유용합니다:
- 연말/연초 활동 요약
- 특별 이벤트 알림
- 새로운 기능 소개
- 사용자 참여 유도

## 참고사항

- 모바일에서는 화면 크기에 맞게 반응형으로 조정 필요
- 접근성: 키보드 네비게이션 및 스크린 리더 지원
- 성능: 애니메이션은 GPU 가속 활용 (transform, opacity 사용)

