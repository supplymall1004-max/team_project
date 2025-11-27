# 🖼️ Unsplash 한국 음식 이미지 검색 통합 가이드

이 문서는 Unsplash API를 사용하여 한국 음식 사진을 검색하는 기능의 사용 방법을 안내합니다.

## 📋 목차

1. [환경 변수 설정](#환경-변수-설정)
2. [API 사용 방법](#api-사용-방법)
3. [코드 예시](#코드-예시)
4. [검색 키워드 가이드](#검색-키워드-가이드)

---

## 🔧 환경 변수 설정

### 1. Unsplash API 키 발급

1. [Unsplash Developers](https://unsplash.com/developers)에 접속
2. 계정 생성 또는 로그인
3. "New Application" 클릭하여 앱 생성
4. Access Key 복사

### 2. 환경 변수 추가

`.env` 또는 `.env.local` 파일에 다음을 추가:

```bash
# Unsplash API
UNSPLASH_ACCESS_KEY=your_access_key_here
```

> ⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 포함되어 있는지 확인하세요.

---

## 📡 API 사용 방법

### API 엔드포인트

```
GET /api/unsplash/search
```

### Query Parameters

| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `q` | string | 조건부* | 검색어 (한국 음식명 또는 영어 키워드) |
| `foods` | string | 조건부* | 쉼표로 구분된 여러 음식명 (예: "김치,비빔밥,떡볶이") |
| `orientation` | string | 선택 | 이미지 방향: `landscape`, `portrait`, `squarish` |
| `limit` | number | 선택 | 반환할 최대 이미지 수 (기본 10, 최대 30) |
| `page` | number | 선택 | 페이지 번호 (기본 1) |

\* `q` 또는 `foods` 중 하나는 필수입니다.

### 응답 형식

#### 단일 검색 응답

```json
{
  "success": true,
  "mode": "single",
  "query": {
    "original": "김치찌개",
    "translated": "Kimchi stew"
  },
  "total": 150,
  "total_pages": 15,
  "page": 1,
  "results": [
    {
      "id": "abc123",
      "width": 4000,
      "height": 3000,
      "urls": {
        "regular": "https://images.unsplash.com/...",
        "small": "https://images.unsplash.com/...",
        "thumb": "https://images.unsplash.com/..."
      },
      "likes": 250,
      "user": {
        "name": "Photographer Name",
        "username": "photographer"
      },
      "description": "Delicious kimchi stew"
    }
  ],
  "count": 10
}
```

#### 다중 검색 응답

```json
{
  "success": true,
  "mode": "multiple",
  "results": {
    "김치": [
      {
        "id": "abc123",
        "urls": { ... },
        ...
      }
    ],
    "비빔밥": [
      {
        "id": "def456",
        "urls": { ... },
        ...
      }
    ]
  },
  "count": 2
}
```

---

## 💻 코드 예시

### 1. 서버 사이드에서 직접 사용

```typescript
import { getKoreanFoodImage } from '@/lib/unsplash-image-search';

// 단일 음식 이미지 검색
const images = await getKoreanFoodImage('김치찌개', 5, 'landscape');
console.log('검색된 이미지:', images);

// 이미지 URL 사용
if (images.length > 0) {
  const imageUrl = images[0].urls.regular;
  console.log('이미지 URL:', imageUrl);
}
```

### 2. API 라우트 사용 (클라이언트/서버)

```typescript
// 단일 검색
const response = await fetch('/api/unsplash/search?q=김치찌개&orientation=landscape&limit=5');
const data = await response.json();

if (data.success) {
  const images = data.results;
  images.forEach((image: any) => {
    console.log('이미지 URL:', image.urls.regular);
  });
}

// 다중 검색
const response = await fetch('/api/unsplash/search?foods=김치,비빔밥,떡볶이');
const data = await response.json();

if (data.success) {
  Object.entries(data.results).forEach(([foodName, images]: [string, any[]]) => {
    console.log(`${foodName}:`, images[0]?.urls.regular);
  });
}
```

### 3. React 컴포넌트에서 사용

```tsx
'use client';

import { useState, useEffect } from 'react';

export function KoreanFoodImage({ foodName }: { foodName: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      try {
        const response = await fetch(
          `/api/unsplash/search?q=${encodeURIComponent(foodName)}&limit=1&orientation=landscape`
        );
        const data = await response.json();

        if (data.success && data.results.length > 0) {
          setImageUrl(data.results[0].urls.regular);
        }
      } catch (error) {
        console.error('이미지 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchImage();
  }, [foodName]);

  if (loading) {
    return <div>이미지 로딩 중...</div>;
  }

  if (!imageUrl) {
    return <div>이미지를 찾을 수 없습니다</div>;
  }

  return (
    <img
      src={imageUrl}
      alt={foodName}
      className="w-full h-auto rounded-lg"
    />
  );
}
```

---

## 🔍 검색 키워드 가이드

### 자동 변환되는 한국 음식명

다음 한국 음식명은 **공식 로마자 표기법**을 우선 사용하여 영어 키워드로 변환됩니다:

#### 밥류 (Rice Dishes)
| 한국어 | 로마자 표기 | 영어 설명 |
|--------|------------|----------|
| 쌀밥 | Bap | Cooked Rice |
| 비빔밥 | Bibimbap | Mixed Rice |
| 돌솥비빔밥 | Dolsot Bibimbap | Hot Stone Pot Bibimbap |
| 김치볶음밥 | Kimchi Bokkeumbap | Kimchi Fried Rice |
| 잡곡밥 | Japgokbap | Multigrain Rice |
| 콩나물밥 | Kongnamulbap | Rice with Bean Sprouts |
| 김밥 | Gimbap | Seaweed Rolls |
| 주먹밥 | Jumeokbap | Rice Balls |
| 죽 | Juk | Porridge |

#### 찌개류 (Stews)
| 한국어 | 로마자 표기 | 영어 설명 |
|--------|------------|----------|
| 찌개 | Jjigae | Korean Stew |
| 김치찌개 | Kimchi Jjigae | Kimchi Stew |
| 된장찌개 | Doenjang Jjigae | Soybean Paste Stew |
| 순두부찌개 | Sundubu Jjigae | Soft Tofu Stew |
| 부대찌개 | Budae Jjigae | Army Stew |
| 해물찌개 | Haemul Jjigae | Seafood Stew |
| 청국장찌개 | Cheonggukjang Jjigae | Fermented Soybean Stew |
| 전골 | Jeongol | Hot Pot |

#### 국/탕류 (Soups)
| 한국어 | 로마자 표기 | 영어 설명 |
|--------|------------|----------|
| 국 | Guk | Soup |
| 미역국 | Miyeok Guk | Seaweed Soup |
| 콩나물국 | Kongnamul Guk | Bean Sprout Soup |
| 떡국 | Tteok Guk | Rice Cake Soup |
| 육개장 | Yukgaejang | Spicy Beef Soup |
| 갈비탕 | Galbitang | Beef Rib Soup |
| 설렁탕 | Seolleongtang | Ox Bone Soup |
| 감자탕 | Gamjatang | Pork Backbone Stew |

#### 반찬류 (Side Dishes)
| 한국어 | 로마자 표기 | 영어 설명 |
|--------|------------|----------|
| 반찬 | Banchan | Korean Side Dishes |
| 김치 | Kimchi | Fermented Cabbage |
| 깍두기 | Kkakdugi | Cubed Radish Kimchi |
| 잡채 | Japchae | Glass Noodles |
| 불고기 | Bulgogi | Marinated Beef |
| 갈비 | Galbi | Grilled Ribs |
| 나물 | Namul | Seasoned Vegetables |
| 전 | Jeon | Korean Pancake |
| 떡볶이 | Tteokbokki | Spicy Rice Cakes |

> 📖 **출처**: 이 표기들은 농림축산식품부, 국립국어원 등에서 권장하는 한식 메뉴의 표준 표기 방식을 기반으로 합니다.  
> 더 자세한 키워드 매핑은 `lib/unsplash-image-search.ts`의 `translateKoreanFoodToEnglish` 함수를 참고하세요.

### 직접 영어 키워드 사용

영어 키워드를 직접 사용할 수도 있습니다:

```typescript
// API 호출
const response = await fetch('/api/unsplash/search?q=Korean food&orientation=landscape');
```

**권장 영어 키워드** (foodresearch.md 참고):

- `Korean food` - 일반적인 한국 음식
- `Kimchi` - 김치
- `Bibimbap` - 비빔밥
- `Tteokbokki` - 떡볶이
- `Korean BBQ` - 한국식 바베큐
- `Korean street food` - 한국 길거리 음식
- `Banchan` - 반찬
- `Korean restaurant` - 한국 식당 분위기
- `Korean food close up` - 음식 클로즈업
- `Korean food flat lay` - 푸드 스타일링

---

## 🎨 Orientation 필터링

### 사용 사례별 추천

| Orientation | 설명 | 추천 사용 사례 |
|------------|------|--------------|
| `landscape` | 가로형 | 웹사이트 배너, 와이드한 이미지 |
| `portrait` | 세로형 | 인스타그램, 모바일 화면 |
| `squarish` | 정사각형 | 썸네일, 카드 이미지 |

### 예시

```typescript
// 가로형 이미지 검색 (배너용)
const landscapeImages = await getKoreanFoodImage('비빔밥', 5, 'landscape');

// 세로형 이미지 검색 (모바일용)
const portraitImages = await getKoreanFoodImage('김치', 5, 'portrait');

// 정사각형 이미지 검색 (썸네일용)
const squareImages = await getKoreanFoodImage('떡볶이', 5, 'squarish');
```

---

## ⚠️ 주의사항

### 1. API Rate Limit

Unsplash API는 시간당 요청 수에 제한이 있습니다:
- **Demo 앱**: 시간당 50회 요청
- **Production 앱**: 시간당 5,000회 요청 (승인 필요)

### 2. 이미지 라이선스

Unsplash 이미지는 [Unsplash License](https://unsplash.com/license)에 따라 무료로 사용 가능하지만, 크레딧 표기를 권장합니다.

### 3. 에러 처리

```typescript
try {
  const images = await getKoreanFoodImage('김치찌개');
  if (images.length === 0) {
    // 검색 결과가 없을 때 폴백 처리
    console.log('이미지를 찾을 수 없습니다');
  }
} catch (error) {
  // API 키 누락 또는 네트워크 오류 처리
  console.error('이미지 검색 실패:', error);
}
```

---

## 🔗 관련 문서

- [Unsplash API 공식 문서](https://unsplash.com/documentation)
- [foodresearch.md](./foodresearch.md) - 한국 음식 검색 가이드
- [lib/unsplash-image-search.ts](../lib/unsplash-image-search.ts) - 구현 코드

---

## 📝 예제 프로젝트

전체 예제는 다음 파일들을 참고하세요:

- `lib/unsplash-image-search.ts` - Unsplash API 클라이언트
- `app/api/unsplash/search/route.ts` - API 라우트
- `docs/foodresearch.md` - 검색 키워드 가이드

