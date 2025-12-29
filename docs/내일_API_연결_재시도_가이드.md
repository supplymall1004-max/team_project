# 내일 식약처 API 연결 재시도 가이드

## 현재 상태

### ✅ 완료된 개선 사항

1. **배치 크기 감소**: 100개 → 10개
2. **단계별 데이터 수집**: 레시피 기본 정보 먼저, 상세 정보는 개별 처리
3. **진행 상황 저장**: 중단 시 자동 저장, 재개 가능
4. **타임아웃 조정**: 60초 → 15초 (작은 배치용)
5. **대기 시간 추가**: 레시피 간 200ms, 배치 간 2초

### 📁 파일 위치

- **데이터 수집 스크립트**: `scripts/collect-mfds-recipes.ts`
- **진행 상황 파일**: `docs/mfds-recipes/.progress.json` (자동 생성)
- **레시피 저장 위치**: `docs/mfds-recipes/recipes/`
- **카테고리 파일**: `docs/mfds-recipes/categories/`
- **영양 정보 인덱스**: `docs/mfds-recipes/nutrition/nutrition-index.json`

## 내일 재시도 방법

### 1단계: API 연결 테스트

먼저 API가 정상 작동하는지 확인:

```bash
# 간단한 테스트 스크립트 실행
pnpm tsx scripts/test-mfds-api.ts
```

또는 브라우저에서 직접 테스트:

```
http://openapi.foodsafetykorea.go.kr/api/4e7ac25e7b614d039a99/COOKRCP01/json/1/10
```

**예상 결과:**
- ✅ 성공: JSON 데이터가 표시됨
- ❌ 실패: 에러 메시지 또는 타임아웃

### 2단계: 데이터 수집 시작

API가 정상 작동하면 데이터 수집 시작:

```bash
pnpm tsx scripts/collect-mfds-recipes.ts
```

**특징:**
- 자동으로 진행 상황 저장 (`docs/mfds-recipes/.progress.json`)
- 중단되어도 재실행 시 이전 위치부터 재개
- 10개씩 작은 배치로 안전하게 수집
- 각 레시피 처리 후 200ms 대기
- 각 배치 처리 후 2초 대기

### 3단계: 진행 상황 확인

수집 중 콘솔에서 진행 상황 확인:

```
📥 [1~10] 범위 레시피 기본 정보 조회 중...
✅ 10개 레시피 기본 정보 조회됨
  ✅ 레시피 1 (된장찌개) 저장 완료
  ✅ 레시피 2 (김치찌개) 저장 완료
  ...
⏳ 다음 배치까지 대기 중... (2초)
```

### 4단계: 중단 및 재개

**중단 방법:**
- `Ctrl + C`로 중단
- 진행 상황이 자동 저장됨

**재개 방법:**
- 동일한 명령어 재실행
- 자동으로 이전 진행 상황부터 재개

```bash
pnpm tsx scripts/collect-mfds-recipes.ts
```

## 문제 해결

### 문제 1: 여전히 타임아웃 발생

**해결 방법:**
1. 배치 크기를 더 줄이기 (10개 → 5개)
2. `scripts/collect-mfds-recipes.ts` 파일에서 `batchSize` 수정:

```typescript
const batchSize = 5; // 10에서 5로 변경
```

### 문제 2: API 키 오류

**해결 방법:**
1. `.env.local` 파일 확인
2. API 키가 올바른지 확인
3. [공공데이터포털](https://www.data.go.kr)에서 API 키 재확인

### 문제 3: 네트워크 연결 문제

**해결 방법:**
1. 방화벽/프록시 설정 확인
2. VPN 사용 여부 확인
3. 다른 네트워크에서 테스트

## 수집 완료 후 확인 사항

### 1. 레시피 파일 확인

```bash
# 레시피 파일 개수 확인
Get-ChildItem -Path "docs\mfds-recipes\recipes" -File | Measure-Object | Select-Object -ExpandProperty Count
```

### 2. 샘플 레시피 확인

```bash
# 첫 번째 레시피 파일 확인
Get-Content "docs\mfds-recipes\recipes\1.md" | Select-Object -First 20
```

### 3. 카테고리 파일 확인

```bash
# 카테고리 파일 목록
Get-ChildItem -Path "docs\mfds-recipes\categories" -File
```

## 현재 설정

- **배치 크기**: 10개
- **최대 수집 개수**: 500개 (테스트용, 필요시 조정)
- **타임아웃**: 15초
- **재시도 횟수**: 3회
- **재시도 지연**: 2초

## 다음 단계

1. ✅ API 연결 테스트
2. ✅ 데이터 수집 시작
3. ✅ 진행 상황 모니터링
4. ⏳ 수집 완료 후 시스템 테스트

## 참고 문서

- `docs/API_연결_개선_사항.md`: 개선 사항 상세 설명
- `docs/API_연결_문제_해결_가이드.md`: 문제 해결 가이드
- `docs/API_연결_테스트_방법.md`: 테스트 방법

