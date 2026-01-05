# UI/UX 디자인 패턴 분석 (GDWEB 기반)

## 1. 네비게이션 및 메뉴 구조

### 메인 헤더 구성요소
- **로고**: 좌측 상단에 텍스트 기반 로고 배치
- **메인 메뉴**: 수상작 안내, 심사등록, 문의하기 등 주요 기능
- **사용자 메뉴**: 로그인, 회원가입 (우측 상단)
- **디지털 에이전시 검색**: 헤더 영역 내 별도 섹션

### 필터링 시스템
```javascript
// 필터링 UI 구현 예시
const filterOptions = {
  연도별: ['2024년', '2023년', '2022년', '2021년'],
  타겟층: ['여성', '남성', '초등학생', '중고등학생', '대학생', '기업'],
  표현방법: ['3D', '모션그래픽', '사진', '영상', '일러스트'],
  디자인컨셉: ['고급스러운', '귀여운', '복고적인', '심플한', '역동적인'],
  컬러별: ['#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF']
};
```

## 2. 레이아웃 패턴

### 그리드 시스템
- **썸네일 그리드**: 4-6열 반응형 그리드
- **카드형 레이아웃**: 이미지 + 타이틀 + 날짜 + 조회수
- **에이전시 목록**: 상단 히어로 영역 + 썸네일 그리드

### 반응형 디자인
```css
/* 반응형 그리드 CSS */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  padding: 20px;
}

@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
  }
}
```

## 3. 버튼 및 인터랙션 요소

### 버튼 스타일 분류
- **프라이머리 버튼**: 주요 액션 (포트폴리오 보기, 다운로드)
- **세컨더리 버튼**: 보조 액션 (스크랩하기, 공유하기)
- **필터 버튼**: 토글형 필터 선택

### 버튼 구현 예시
```css
/* 버튼 스타일 */
.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}
```

## 4. 폼 요소 및 입력

### 검색 폼
- **통합 검색**: 전체 컨텐츠 검색
- **필터 드롭다운**: 다중 선택 가능
- **실시간 필터링**: 선택 즉시 결과 반영

### 폼 구현
```html
<!-- 검색 폼 예시 -->
<form class="search-form">
  <div class="search-input-group">
    <input type="text" placeholder="검색어를 입력하세요" class="search-input">
    <button type="submit" class="search-btn">
      <img src="search-icon.png" alt="검색">
    </button>
  </div>
</form>
```

## 5. 로딩 및 상태 표시

### 로딩 상태
- **이미지 로딩**: 플레이스홀더 이미지 사용
- **페이지 로딩**: 스켈레톤 UI
- **무한 스크롤**: 자동 로딩 인디케이터

### 로딩 구현
```javascript
// 이미지 로딩 처리
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = reject;
    img.src = src;
  });
}

// 스켈레톤 로딩
const skeletonLoader = `
  <div class="skeleton-card">
    <div class="skeleton-image"></div>
    <div class="skeleton-text"></div>
    <div class="skeleton-text short"></div>
  </div>
`;
```

## 6. 모달 및 오버레이

### 모달 패턴
- **이미지 확대**: 클릭 시 큰 이미지 표시
- **상세 정보**: 작품 상세 정보 팝업
- **공유하기**: 소셜 공유 옵션

### 모달 구현
```javascript
// 모달 토글 함수
function toggleModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.toggle('active');
  document.body.classList.toggle('modal-open');
}
```

## 7. 애니메이션 및 트랜지션

### 마이크로 인터랙션
- **호버 효과**: 카드 호버 시 살짝 올라감
- **클릭 피드백**: 버튼 클릭 시 스케일 다운
- **페이지 전환**: 부드러운 fade 효과

### 애니메이션 CSS
```css
/* 호버 애니메이션 */
.card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

/* 로딩 애니메이션 */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading { animation: pulse 1.5s ease-in-out infinite; }
```
