# 마이그레이션 가이드

## 빠른 시작

### 방법 1: Supabase CLI 사용 (권장)

```bash
# 로컬 Supabase가 실행 중이라면
npx supabase migration up

# 또는 프로덕션 배포
npx supabase db push
```

### 방법 2: 통합 SQL 파일 사용

Supabase Dashboard 또는 SQL Editor에서 다음 파일을 실행하세요:

```
supabase/migrations/apply_all_migrations.sql
```

## 적용되는 테이블

### 1. 주간 식단 시스템
- `weekly_diet_plans`: 주간 식단 메타데이터
- `weekly_shopping_lists`: 장보기 리스트
- `weekly_nutrition_stats`: 일별 영양 통계

### 2. KCDC 알림 시스템
- `kcdc_alerts`: 질병관리청 공지 및 알림

### 3. 레시피 재료 시스템
- `recipe_ingredients`: 레시피별 재료 정보
- `ingredient_category`: 재료 카테고리 ENUM

## 마이그레이션 확인

```sql
-- 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'weekly_diet_plans',
    'weekly_shopping_lists',
    'weekly_nutrition_stats',
    'kcdc_alerts',
    'recipe_ingredients'
  );

-- 샘플 데이터 확인
SELECT COUNT(*) as kcdc_alerts_count FROM kcdc_alerts;
SELECT COUNT(*) as ingredients_count FROM recipe_ingredients;
```

## 롤백 방법

마이그레이션을 되돌리려면:

```sql
-- 테이블 삭제 (역순으로)
DROP TABLE IF EXISTS recipe_ingredients CASCADE;
DROP TABLE IF EXISTS weekly_nutrition_stats CASCADE;
DROP TABLE IF EXISTS weekly_shopping_lists CASCADE;
DROP TABLE IF EXISTS weekly_diet_plans CASCADE;
DROP TABLE IF EXISTS kcdc_alerts CASCADE;

-- ENUM 타입 삭제
DROP TYPE IF EXISTS ingredient_category;
```

## 문제 해결

### 오류: "relation already exists"
- 이미 테이블이 존재합니다. `IF NOT EXISTS`를 사용하므로 안전합니다.
- 무시하고 계속 진행하세요.

### 오류: "type already exists"
- 이미 ENUM 타입이 존재합니다. 정상입니다.
- 무시하고 계속 진행하세요.

### 오류: "foreign key constraint"
- `users` 또는 `recipes` 테이블이 없을 수 있습니다.
- 기존 마이그레이션을 먼저 실행하세요.

## 다음 단계

마이그레이션 완료 후:

1. ✅ 환경 변수 설정 (`.env.local`)
   ```bash
   KCDC_API_KEY=c641dff48d4a8a2c3ff868e4fd7edcc5c42018bab2dbd8ef752ec8d0e6a685ca
   CRON_SECRET=your-secret-key
   ```

2. ✅ 개발 서버 시작
   ```bash
   pnpm dev
   ```

3. ✅ 기능 테스트
   - 주간 식단: http://localhost:3000/diet/weekly
   - KCDC 알림: 앱 접속 시 자동 팝업

4. ✅ Edge Function 배포 (프로덕션)
   ```bash
   npx supabase functions deploy sync-kcdc-alerts
   npx supabase secrets set KCDC_API_KEY=...
   ```

## 참고 문서

- [KCDC API 설정](./KCDC_API_SETUP.md)
- [TODO 목록](./TODO.md)
- [PRD 문서](./PRD.md)
























