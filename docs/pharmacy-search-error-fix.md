# 약국 검색 오류 해결 보고서

## ✅ 수정 완료된 내용

### 1. XML 파싱 오류 처리 강화

**파일**: `lib/health/pharmacy-api.ts`

**개선 사항:**
- XML 파싱 실패 시 명확한 에러 메시지 제공
- 응답 구조 검증 추가 (response, header, body 존재 확인)
- 빈 응답이나 잘못된 형식의 응답 안전 처리
- resultCode "03" (NODATA) 정상 처리

**변경 내용:**
```typescript
// XML 파싱 오류 처리
try {
  jsonData = await parseXMLToJSON(xmlText);
} catch (parseError) {
  console.error("❌ XML 파싱 실패:", parseError);
  throw new Error(`약국 정보 API 응답 파싱 실패: ${parseError.message}`);
}

// 응답 구조 검증
if (!jsonData || !jsonData.response) {
  throw new Error("약국 정보 API 응답 형식이 올바르지 않습니다.");
}

// 데이터 없음 정상 처리
if (resultCode === "03" || resultMsg.includes("NODATA")) {
  return { totalCount: 0, pharmacies: [], hasMore: false };
}
```

### 2. 약국 데이터 변환 오류 처리 강화

**파일**: `lib/health/medical-facilities/facility-utils.ts`

**개선 사항:**
- 입력 검증 추가 (배열 여부 확인)
- 필수 필드 검증 강화 (타입 체크 포함)
- 좌표 범위 검증 (한국 영역: 위도 33~43, 경도 124~132)
- 영업시간 파싱 실패 시에도 약국 정보 표시
- 개별 약국 변환 실패 시 전체 실패하지 않도록 처리

**변경 내용:**
```typescript
// 입력 검증
if (!Array.isArray(pharmacies)) {
  console.error("pharmacies가 배열이 아닙니다");
  return [];
}

// 필수 필드 검증 강화
if (!pharmacy.dutyName || typeof pharmacy.dutyName !== 'string' || pharmacy.dutyName.trim() === '') {
  return false;
}

// 좌표 범위 검증
if (lat < 33 || lat > 43 || lon < 124 || lon > 132) {
  console.warn("좌표가 한국 영역을 벗어남");
  return null;
}

// 영업시간 파싱 실패 시에도 약국 정보 표시
try {
  operatingHours = parsePharmacyOperatingHours(pharmacy);
} catch (hoursError) {
  console.warn("영업시간 파싱 실패:", hoursError);
  operatingHours = undefined; // 영업시간 없이도 약국 정보는 표시
}
```

### 3. API 라우트 에러 처리 개선

**파일**: `app/api/health/medical-facilities/search/route.ts`

**개선 사항:**
- 약국 데이터 변환 실패 시 안전 처리
- API 키 오류 시 명확한 메시지 제공
- 빈 응답 처리 개선

**변경 내용:**
```typescript
// 약국 데이터 변환 오류 처리
try {
  facilities = convertPharmacyToMedicalFacilities(
    pharmacyResult.pharmacies,
    lat,
    lon,
  );
} catch (convertError) {
  console.error("❌ 약국 데이터 변환 실패:", convertError);
  facilities = []; // 변환 실패 시 빈 배열 반환
}

// API 키 오류 명확한 메시지
if (apiErrorMessage.includes("API 키") || apiErrorMessage.includes("PHARMACY_API_KEY")) {
  throw new Error("약국 정보 API 키가 설정되지 않았습니다. 환경변수를 확인해주세요.");
}
```

### 4. XML 파서 안정성 개선

**파일**: `lib/health/pharmacy-api.ts` - `parseXMLToJSON` 함수

**개선 사항:**
- 개별 약국 항목 파싱 실패 시에도 계속 진행
- 필수 필드(dutyName) 검증 추가
- 빈 items 태그 처리

**변경 내용:**
```typescript
// 개별 항목 파싱 실패 시 무시하고 계속 진행
try {
  // ... 항목 파싱 로직
} catch (itemError) {
  console.warn("약국 항목 파싱 실패 (건너뜀):", itemError);
  // 개별 항목 파싱 실패는 무시
}

// 최소한 dutyName이 있어야 유효한 약국 정보
if (Object.keys(item).length > 0 && item.dutyName) {
  items.push(item);
}
```

---

## 🔍 확인해야 할 사항

### 1. 환경변수 확인

약국 검색이 작동하려면 다음 환경변수가 설정되어 있어야 합니다:

```bash
PHARMACY_API_KEY=your_api_key_here
```

**확인 방법:**
- Vercel Dashboard → Settings → Environment Variables
- `PHARMACY_API_KEY`가 설정되어 있는지 확인
- 프로덕션 환경에 적용되어 있는지 확인

### 2. API 키 발급

약국 정보 API 키는 [공공데이터포털](https://www.data.go.kr/data/15000500/openapi.do)에서 발급받을 수 있습니다.

---

## 🚨 일반적인 오류 원인

### 오류 1: "약국 정보 API 키가 설정되지 않았습니다"

**원인**: `PHARMACY_API_KEY` 환경변수가 없음

**해결:**
1. Vercel Dashboard → Settings → Environment Variables
2. `PHARMACY_API_KEY` 추가
3. 공공데이터포털에서 발급받은 API 키 입력
4. 재배포

### 오류 2: "약국 정보 API 오류 (코드: 03): NODATA"

**원인**: 해당 지역에 약국이 없음 (정상 응답)

**해결**: 다른 위치에서 검색하거나, 검색 결과가 없다는 메시지 표시

### 오류 3: "약국 정보 API 응답 파싱 실패"

**원인**: API 응답 형식이 예상과 다름

**해결**: 
- API 키가 올바른지 확인
- API 서버 상태 확인
- 브라우저 콘솔에서 상세 오류 확인

### 오류 4: "약국 데이터 변환 실패"

**원인**: 약국 데이터 형식이 예상과 다름

**해결**:
- 브라우저 콘솔에서 변환 실패한 약국 데이터 확인
- API 응답 형식 변경 여부 확인

---

## ✅ 테스트 방법

### 1. 로컬 테스트

```bash
# 개발 서버 실행
pnpm dev

# 약국 검색 페이지 접속
http://localhost:3000/health/emergency/medical-facilities/pharmacy
```

### 2. 브라우저 콘솔 확인

1. F12 → Console 탭
2. 약국 검색 시도
3. 다음 로그 확인:
   - `🔑 API 키 확인 완료`
   - `약국 정보 API 호출`
   - `✅ 약국 정보 조회 성공`
   - `🔄 약국 API 응답 변환 시작`
   - `✅ 변환 완료`

### 3. 네트워크 탭 확인

1. F12 → Network 탭
2. 약국 검색 시도
3. `/api/health/medical-facilities/search?category=pharmacy` 요청 확인
4. 응답 상태 코드 확인 (200이어야 함)
5. 응답 본문 확인

---

## 📊 개선된 오류 처리 흐름

```
약국 검색 요청
  ↓
API 키 확인
  ↓ (없으면 명확한 에러)
약국 API 호출
  ↓ (실패 시 상세 로그)
XML 응답 수신
  ↓ (인코딩 자동 감지)
XML 파싱
  ↓ (실패 시 명확한 에러)
응답 구조 검증
  ↓ (실패 시 안전한 빈 응답)
약국 데이터 추출
  ↓ (배열/단일 항목 자동 처리)
의료기관 형식 변환
  ↓ (개별 실패 시 건너뜀)
영업중 필터링
  ↓ (필터링 실패 시 전체 표시)
반경 필터링
  ↓
최종 결과 반환
```

---

## 💡 추가 개선 사항

### 로깅 강화

모든 단계에서 상세한 로그를 남기도록 개선했습니다:
- API 키 확인
- API 호출 URL (일부만 표시)
- 응답 상태
- 변환 과정
- 필터링 결과

### 안전한 실패 처리

- 개별 약국 변환 실패 시 전체 실패하지 않음
- 영업시간 파싱 실패 시에도 약국 정보 표시
- 빈 응답이나 잘못된 형식도 안전하게 처리

---

## 🚀 다음 단계

1. **환경변수 확인**
   - Vercel에 `PHARMACY_API_KEY` 설정 확인

2. **재배포**
   - 수정된 코드 배포

3. **테스트**
   - 약국 검색 페이지에서 검색 시도
   - 브라우저 콘솔에서 오류 확인

4. **오류 발생 시**
   - 브라우저 콘솔의 정확한 에러 메시지 확인
   - 네트워크 탭에서 API 응답 확인
   - 에러 메시지를 공유해주시면 추가로 진단하겠습니다
