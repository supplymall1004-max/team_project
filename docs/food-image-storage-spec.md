# 음식 이미지 저장소 사양

## 개요

Gemini AI로 생성된 음식 이미지를 Supabase Storage에 저장하기 위한 구조 및 변환 규칙을 정의합니다.

## Storage 버킷 구조

### 버킷 이름
- `food-images` (공개 버킷, 이미지 URL 직접 접근 허용)

### 폴더 구조
```
food-images/
├── {foodId}/
│   └── {yyyyMMdd}/
│       ├── original.webp     # 원본 이미지 (최대 2048px)
│       ├── thumbnail.webp    # 썸네일 이미지 (최대 512px)
│       └── original-1.webp   # 재시도 시 접미사 추가
```

### 파일명 규칙
- `{variant}.webp` - 정상 업로드
- `{variant}-{attempt}.webp` - 재시도 업로드 (attempt: 1, 2, ...)

## 이미지 변환 규칙

### 입력 형식
- Gemini API 응답: Base64 인코딩된 이미지 데이터
- 지원 형식: PNG (Gemini 기본 출력)

### 변환 프로세스

#### 1. Base64 → Buffer 변환
```typescript
const buffer = Buffer.from(base64Data, 'base64');
```

#### 2. WebP 변환 및 리사이징
- **원본 (original)**:
  - 최대 너비: 2048px
  - 최대 높이: 2048px
  - 품질: 90%
  - 리사이즈 모드: `fit: 'inside'`, `withoutEnlargement: true`

- **썸네일 (thumbnail)**:
  - 최대 너비: 512px
  - 최대 높이: 512px
  - 품질: 80%
  - 리사이즈 모드: `fit: 'inside'`, `withoutEnlargement: true`

### Sharp 설정
```typescript
const pipeline = sharp(buffer)
  .resize({
    width: targetWidth,
    height: targetHeight,
    fit: 'inside',
    withoutEnlargement: true
  })
  .webp({ quality: qualityValue });
```

## 메타데이터 저장

### 체크섬 계산
- 알고리즘: SHA-256
- 입력: 원본 변환 후의 WebP 버퍼
- 용도: 중복 이미지 검출, 무결성 검증

### 화면비 계산
- 최대공약수(GCD)로 기약분수 형태로 저장
- 예시: `2048x1365` → `3:2`, `1024x1024` → `1:1`

## 저장 정책

### 접근 권한
- **SELECT**: 익명 사용자 허용 (public 버킷)
- **INSERT/UPDATE/DELETE**: 서비스 롤만 허용

### 파일 크기 제한
- 최대 2MB (2097152 bytes)
- WebP 압축으로 충분한 용량

### MIME 타입 제한
- `image/webp`만 허용

## 업로드 재시도 정책

### 재시도 조건
- HTTP 5xx 에러
- 타임아웃, 네트워크 에러
- "too many", "temporarily", "retry" 포함 에러 메시지

### 재시도 설정
- 최대 재시도 횟수: 3회
- 백오프 지연: `200ms * 2^attempt`
- 파일명 접미사: `-{attempt}`

## 캐시 제어

### Cache-Control 헤더
- 값: `31536000` (1년)
- 용도: CDN 캐싱 최적화, 비용 절감

## 모니터링 포인트

### 저장 비용 추적
- 월별 파일 수 집계
- 월별 총 용량 집계
- 평균 파일 크기 계산

### 성능 메트릭
- 업로드 성공률
- 평균 업로드 시간
- 재시도 빈도

## 마이그레이션 노트

이 스펙에 따라 `food-images` 버킷이 생성되며, 기존 `uploads` 버킷과 분리하여 음식 이미지 전용으로 운영됩니다.
