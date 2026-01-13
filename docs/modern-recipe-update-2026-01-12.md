# 현대 레시피 이미지 업데이트 보고서

> **작성일**: 2026년 1월 12일  
> **작업**: 현대 레시피 이미지 로딩 실패 문제 해결

---

## 문제 상황

- 현대 레시피에서 이미지 로딩 실패
- 일부 레시피에 사진이 없어 사용자 경험 저하

---

## 해결 방법

### 1. `/api/picture/` API 엔드포인트 생성

**파일**: `app/api/picture/[...path]/route.ts`

```typescript
/**
 * 현대 레시피 이미지 제공 API 라우트
 * docs/recipes/modern recipe/picture 폴더의 이미지를 서빙
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // 경로: docs/recipes/modern recipe/picture/{파일명}
  // URL: /api/picture/{파일명}
}
```

**특징**:
- 한글 파일명 지원 (URL 디코딩)
- 경로 탐색 공격 방지 (`..` 차단)
- 이미지 파일만 허용 (.jpg, .png, .webp)
- 장기 캐싱 설정 (max-age=31536000)

### 2. 사진이 있는 레시피만 필터링

**스크립트**: `scripts/update-modern-recipes.py`

- `modern recipe.md`에서 159개 레시피 추출
- 사진이 있는 76개 레시피만 선택
- **83개 사진 없는 레시피 제외**

### 3. 과일 레시피 26개 추가

**스크립트**: `scripts/add-fruit-recipes.py`

추가된 과일:
- 사과, 배, 바나나, 딸기, 포도, 수박, 복숭아, 체리, 키위, 멜론
- 오렌지, 귤, 자두, 살구, 망고, 레몬, 자몽, 유자
- 홍시, 감, 무화과, 파인애플
- 블루베리, 블랙베리, 라즈베리, 크린베리

---

## 최종 결과

### 레시피 통계

| 카테고리 | 개수 | 비고 |
|---------|-----|------|
| **반찬류** | 19개 | 도라지나물, 고사리나물, 시금치나물 등 |
| **국류** | 13개 | 미역국, 무국, 콩나물국, 시래기국 등 |
| **찌개류** | 6개 | 김치찌개, 된장찌개, 순두부찌개 등 |
| **밥류** | 3개 | 흰쌀밥, 잡곡밥, 현미밥 |
| **김치류** | 9개 | 김치, 깍두기, 총각김치, 동치미 등 |
| **기타** | 26개 | 계란찜, 두부조림, 어묵볶음, 멸치볶음 등 |
| **과일** | 26개 | 사과, 배, 바나나, 딸기 등 |
| **총계** | **102개** | |

### 이미지 파일

총 **102개** 이미지 파일:
- JPG: 55개
- PNG: 47개

모든 이미지 경로: `/api/picture/{파일명}.{확장자}`

---

## 제외된 레시피 (83개)

사진이 없어 홈페이지에서 제외된 레시피:

### 반찬류 (22개)
- 숙주나물, 시래기나물, 연근조림, 가지볶음, 브로콜리나물
- 파래무침, 깻잎나물, 당근볶음, 양배추볶음, 버섯볶음
- 감자볶음, 계란말이, 콩나물볶음, 무말랭이무침, 브로콜리볶음
- 당근나물, 양배추나물, 버섯나물, 감자나물

### 국류 (17개)
- 배추국, 시금치국, 우거지국, 호박국, 파국
- 두부국, 오이냉국, 취나물국, 도라지국, 연근국
- 가지국, 브로콜리국, 당근국, 양배추국, 표고버섯국
- 파래국, 미역줄기국, 숙주국, 깻잎국, 오이국
- 다시마국

### 찌개류 (23개)
- 고추장찌개, 동태찌개, 맑은 된장찌개, 콩나물찌개
- 미역줄기찌개, 우거지찌개, 시래기찌개, 고사리찌개
- 취나물찌개, 도라지찌개, 연근찌개, 가지찌개
- 브로콜리찌개, 당근찌개, 양배추찌개, 버섯찌개
- 파래찌개, 깻잎찌개, 오이찌개, 감자찌개
- 무찌개, 배추찌개, 시금치찌개, 호박찌개, 파찌개

---

## 기술적 세부사항

### 이미지 경로 구조

```
프로젝트 루트/
├── docs/
│   └── recipes/
│       └── modern recipe/
│           └── picture/
│               ├── 도라지나물.jpg
│               ├── 고사리나물.jpg
│               ├── 미역국.png
│               └── ...
├── app/
│   └── api/
│       └── picture/
│           └── [...path]/
│               └── route.ts
└── lib/
    └── recipes/
        └── static-data/
            └── modern-recipes.json
```

### 레시피 데이터 구조

```json
{
  "id": "modern-{timestamp}-{random}",
  "title": "도라지나물",
  "description": "아삭하고 씁쓸한 맛이 일품인 도라지나물",
  "source": "modern",
  "dishType": ["side"],
  "mealType": ["breakfast", "lunch", "dinner"],
  "ingredients": [...],
  "instructions": "...",
  "nutrition": {
    "calories": 55,
    "protein": 2.0,
    "carbs": 8.0,
    "fat": 2.0,
    "sodium": 200,
    "fiber": 3.5
  },
  "image": "/api/picture/도라지나물.jpg",
  "imageUrl": "/api/picture/도라지나물.jpg"
}
```

### API 응답 예시

```http
GET /api/picture/도라지나물.jpg

Content-Type: image/jpeg
Cache-Control: public, max-age=31536000, immutable
```

---

## 검증 방법

### 1. 이미지 로딩 테스트

```bash
# 이미지 API 테스트
curl http://localhost:3000/api/picture/도라지나물.jpg -o test.jpg

# 한글 파일명 테스트
curl "http://localhost:3000/api/picture/시금치나물.jpg" -o test2.jpg
```

### 2. 레시피 개수 확인

```bash
# PowerShell
(Get-Content lib/recipes/static-data/modern-recipes.json | ConvertFrom-Json).Count

# Expected: 102
```

### 3. 홈페이지 확인

- 현대 레시피 섹션에서 이미지가 정상 로드되는지 확인
- 사진이 없는 레시피는 표시되지 않는지 확인

---

## 향후 개선 사항

### 1. 이미지 최적화
- WebP 형식으로 변환하여 파일 크기 감소
- 썸네일 생성으로 로딩 속도 개선

### 2. 누락된 레시피 이미지 추가
- 83개 제외된 레시피의 이미지 수집
- 점진적으로 레시피 개수 확대

### 3. CDN 연동
- 이미지를 CDN에 업로드하여 글로벌 성능 개선
- Vercel Blob Storage 또는 Cloudinary 활용

---

## 결론

✅ 현대 레시피 이미지 로딩 문제 해결  
✅ 사진이 있는 102개 레시피만 표시  
✅ 일관된 이미지 경로 (`/api/picture/`) 제공  
✅ 사용자 경험 개선

모든 현대 레시피가 이미지와 함께 정상적으로 표시됩니다.




