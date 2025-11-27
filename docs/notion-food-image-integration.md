# 음식 이미지 Notion 연계 방안

## 개요

Gemini로 생성된 음식 이미지를 Notion에 연계하여 관리하고 공유하기 위한 방안을 정의합니다.

## 기본 원칙

### 저장 전략
- **이미지 원본**: Supabase Storage에 저장 (비용 효율적, 고성능)
- **Notion 역할**: 선별된 이미지의 링크와 메모만 기록
- **용량 절감**: Notion에 이미지 파일을 직접 업로드하지 않음

### 데이터 흐름
```
Gemini 생성 → Supabase Storage 저장 → 품질 평가 → Notion 선별 기록
```

## Notion 데이터베이스 구조

### 데이터베이스 필드
- **음식 이름** (Title): 음식명 + 영문명
- **이미지 링크**: Supabase Storage 공개 URL
- **썸네일**: 작은 크기 이미지 미리보기
- **생성일**: 이미지 생성 날짜
- **품질 점수**: AI 평가 점수 (1-10)
- **프롬프트**: 사용된 프롬프트 요약
- **태그**: 계절, 스타일, 카테고리
- **메모**: 품질 평가 및 개선 제안

### 페이지 템플릿
```markdown
# 🍜 김치찌개 (Kimchi Jjigae)

## 이미지
![썸네일](https://supabase-url/food-images/{foodId}/{date}/thumbnail.webp)

## 상세 정보
- **생성일**: 2025-01-26
- **품질 점수**: 8.5/10
- **프롬프트**: "Traditional Korean Kimchi Jjigae in stone bowl..."
- **원본 링크**: [View Full Image](https://supabase-url/food-images/{foodId}/{date}/original.webp)

## 평가 메모
- 색감이 좋음
- 국물 텍스처가 사실적
- 채소 배치가 자연스러움

## 태그
#국 #겨울 #전통 #고기
```

## 자동 동기화 정책

### 동기화 트리거
- 음식 이미지 배치 완료 시 자동 실행
- 일일 1회 제한 (Notion API rate limit 준수)

### 선별 기준
1. **품질 점수 필터링**: 상위 30% 이미지만 선별
2. **중복 제거**: 동일 음식의 기존 이미지와 비교
3. **카테고리 우선순위**: 국/찌개 > 반찬 > 디저트

### 동기화 프로세스
```typescript
// 의사코드
async function syncToNotion(batchId: string) {
  const images = await getBatchImages(batchId);
  const topImages = filterTopQuality(images, 0.3); // 상위 30%

  for (const image of topImages) {
    if (await shouldCreateNotionPage(image)) {
      await createNotionPage(image);
    }
  }
}
```

## Notion API 연동

### 필요 권한
- Database access
- Page creation
- Content writing

### API 제한 고려
- **Rate Limit**: 분당 3회 요청
- **일일 제한**: 계정별 상이
- **배치 처리**: 여러 페이지를 한 번에 생성하지 않음

### 에러 처리
- API 제한 초과 시: 다음 날 재시도
- 권한 에러: 로그 기록 및 수동 처리 알림
- 네트워크 에러: 최대 3회 재시도

## 운영 워크플로우

### 이미지 검토 프로세스
1. Gemini 생성 → Storage 저장 → DB 기록
2. 품질 점수 기반 자동 선별
3. Notion 페이지 자동 생성
4. 담당자 수동 검토 및 메모 추가
5. 승인된 이미지만 서비스에 반영

### 유지보수 작업
- **주간 검토**: 생성된 이미지 품질 모니터링
- **월간 정리**: 낮은 품질 이미지 삭제
- **분기별 최적화**: 프롬프트 개선 및 선별 기준 조정

## 기술 구현

### 환경 변수
```bash
NOTION_API_KEY=secret_...
NOTION_DATABASE_ID=...
NOTION_SYNC_ENABLED=true
NOTION_QUALITY_THRESHOLD=7.0
```

### Supabase Function 구조
```typescript
// supabase/functions/sync-notion-images/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Client } from 'https://esm.sh/@notionhq/client@2';

export async function syncNotionImages() {
  // 1. 최근 성공한 배치 조회
  // 2. 품질 점수로 필터링
  // 3. Notion 페이지 생성
  // 4. 결과 로깅
}
```

## 모니터링 및 알림

### 성공 메트릭
- 동기화 성공률
- 생성된 Notion 페이지 수
- 평균 처리 시간

### 알림 조건
- 동기화 실패 시 Slack/Webhook 알림
- 일일 동기화 요약 보고
- 품질 점수 임계치 미달 시 경고

## 향후 확장

### 추가 기능
- **이미지 비교**: A/B 테스트를 위한 이미지 비교 기능
- **태그 자동화**: AI 기반 태그 자동 생성
- **사용자 피드백**: Notion에서 사용자 평가 수집

### 통합 개선
- **Zapier 연동**: 더 복잡한 워크플로우 자동화
- **Notion Database API**: 더 풍부한 쿼리 기능 활용
- **이미지 분석**: 생성 이미지의 자동 품질 평가 고도화
