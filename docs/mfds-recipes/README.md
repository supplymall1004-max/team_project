# 식약처 레시피 정적 파일 저장소

이 디렉토리는 식약처 API에서 수집한 레시피 데이터를 마크다운 형식으로 저장합니다.

## 디렉토리 구조

```
docs/mfds-recipes/
├── README.md                    # 이 파일
├── index.md                     # 전체 레시피 목록 (검색용)
├── categories/                  # 카테고리별 레시피 목록
│   ├── rice.md                  # 밥류
│   ├── soup.md                  # 국/찌개
│   ├── side.md                  # 반찬
│   ├── snack.md                 # 간식
│   └── ...
├── recipes/                     # 개별 레시피 상세
│   ├── {RCP_SEQ}.md            # 레시피 상세 (RCP_SEQ=1이면 1.md)
│   └── ...
└── nutrition/                   # 영양 정보 인덱스
    ├── nutrition-index.json     # 영양 정보 인덱스 (빠른 검색용)
    ├── by-calories.json         # 칼로리별 정렬
    ├── by-protein.json          # 단백질별 정렬
    └── by-sodium.json           # 나트륨별 정렬
```

## 레시피 파일 형식

각 레시피 파일(`recipes/{RCP_SEQ}.md`)은 다음 형식을 따릅니다:

```markdown
---
rcp_seq: "1"
rcp_nm: "된장찌개"
rcp_way2: "끓이기"
rcp_pat2: "찌개"
---

# 된장찌개

된장찌개는 한국의 대표적인 찌개 요리로...

## 재료
- 된장 2큰술
- 두부 1/2모
...

## 조리 방법
1. 된장을 풀어 끓인다
2. 두부를 넣는다
...

---

## 참고사항

### 기본 정보
- **레시피 순번 (RCP_SEQ)**: 1
- **레시피명 (RCP_NM)**: 된장찌개
...

### 영양 정보
- **칼로리 (INFO_ENG)**: 245.5
...
```

## 사용 방법

정적 파일 로더를 사용하여 레시피를 로드할 수 있습니다:

```typescript
import { loadStaticRecipeBySeq, searchStaticRecipes } from '@/lib/mfds/static-recipe-loader';

// 특정 레시피 로드
const recipe = loadStaticRecipeBySeq('1');

// 레시피 검색
const results = searchStaticRecipes('된장');
```

## 데이터 업데이트

레시피 데이터는 `scripts/collect-mfds-recipes.ts` 스크립트를 통해 업데이트됩니다.

