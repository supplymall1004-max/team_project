# 마이그레이션 파일 정리 요약

## 정리 완료 (2025-12-02)

### 삭제된 파일들

#### 통합 마이그레이션 중복 파일
- `combined_migration_v1.sql` ❌ 삭제
- `unified_migration_complete.sql` ❌ 삭제
- `apply_all_migrations.sql` ❌ 삭제
- `setup_schema.sql` ❌ 삭제
- `setup_storage.sql` ❌ 삭제

#### 개별 마이그레이션 파일 (통합 파일에 포함됨)
- `20250122000000_create_recipes.sql` ❌ 삭제
- `20250124000000_family_health_schema.sql` ❌ 삭제
- `20250124000001_user_health_profile.sql` ❌ 삭제
- `20250124000002_diet_plans.sql` ❌ 삭제
- `20250124000002_update_health_profile_premium.sql` ❌ 삭제
- `20250124000003_recipe_usage_history.sql` ❌ 삭제
- `20250124000004_user_subscriptions.sql` ❌ 삭제
- `20250130000000_add_recipe_nutrition_columns.sql` ❌ 삭제
- `20250130000001_seed_sample_recipes.sql` ❌ 삭제
- `20250130000002_add_recipe_images.sql` ❌ 삭제
- `20250130000003_add_include_in_unified_diet.sql` ❌ 삭제
- `20250131000000_set_max_family_members_to_10.sql` ❌ 삭제
- `20250131120000_create_royal_recipes_posts.sql` ❌ 삭제
- `20251121090000_create_legacy_archive.sql` ❌ 삭제
- `20251121090001_create_disease_excluded_foods.sql` ❌ 삭제
- `20251121090002_create_diet_notification_settings.sql` ❌ 삭제
- `20251121090003_add_composition_summary.sql` ❌ 삭제
- `20251127030000_create_payment_system.sql` ❌ 삭제
- `20251127140000_create_weekly_diet_tables.sql` ❌ 삭제
- `20251127150000_create_image_cache_tables.sql` ❌ 삭제
- `20251127160000_create_kcdc_alerts_table.sql` ❌ 삭제
- `20251127170000_create_recipe_ingredients_table.sql` ❌ 삭제
- `20251127191700_add_clerk_id_unique_constraint.sql` ❌ 삭제
- `20251127211820_create_admin_console_tables.sql` ❌ 삭제
- `20251127220000_insert_popup_dummy_data.sql` ❌ 삭제
- `20251127221000_fix_popup_table.sql` ❌ 삭제
- `20251127222000_simple_popup_data.sql` ❌ 삭제
- `20251127223000_fix_popup_data_final.sql` ❌ 삭제
- `20251127224000_check_popup_data.sql` ❌ 삭제
- `20251127225000_fix_popup_table_primary_key.sql` ❌ 삭제
- `20251127230000_verify_primary_key.sql` ❌ 삭제
- `20251127231000_add_image_url_to_popups.sql` ❌ 삭제
- `20251127232000_create_popup_images_bucket.sql` ❌ 삭제
- `20251127233000_add_link_url_to_popups.sql` ❌ 삭제
- `20251127234000_reload_schema_for_copy.sql` ❌ 삭제
- `20251127235000_create_notification_logs_table.sql` ❌ 삭제
- `20251128000000_add_mfa_to_users.sql` ❌ 삭제
- `20251129000000_create_premium_diet_features.sql` ❌ 삭제
- `20251130_health_system_enhancement.sql` ❌ 삭제
- `20251201000000_setup_kcdc_cron_job.sql` ❌ 삭제
- `20251201120000_add_kcdc_enabled_to_notification_settings.sql` ❌ 삭제
- `20251202000000_fix_diet_notification_settings.sql` ❌ 삭제
- `20251202120000_fix_diet_notification_settings_unique_constraint.sql` ❌ 삭제
- `20251202130000_fix_diet_notification_settings_final.sql` ❌ 삭제
- `20251202140000_fix_popup_settings_save_error.sql` ❌ 삭제

#### 기타
- `README_INTEGRATED.md` ❌ 삭제 (README.md로 통합)

### 최종 마이그레이션 파일 구조

#### ✅ 통합 마이그레이션 파일 (순서대로 실행)
1. `000_integrated_01_base_schema.sql` - 기본 스키마
2. `000_integrated_02_recipes.sql` - 레시피 관련
3. `000_integrated_03_health.sql` - 건강 관련
4. `000_integrated_04_diet.sql` - 식단 관련
5. `000_integrated_05_payment_premium.sql` - 결제 및 프리미엄
6. `000_integrated_06_admin_legacy.sql` - 관리자 및 레거시

#### ✅ 초기 데이터 파일
- `20251130000000_insert_homepage_default_content.sql` - 홈페이지 기본 콘텐츠

#### ✅ 샘플 데이터 파일
- `sample_data_v1.sql` - 개발 및 테스트용 샘플 데이터

#### ✅ 문서
- `README.md` - 마이그레이션 가이드

## 정리 결과

### Before (정리 전)
- 총 **60개 이상**의 마이그레이션 파일
- 중복된 통합 파일 3개
- 개별 마이그레이션 파일 50개 이상

### After (정리 후)
- 총 **9개**의 마이그레이션 파일
  - 통합 마이그레이션: 6개
  - 초기 데이터: 1개
  - 샘플 데이터: 1개
  - 문서: 1개

### 개선 사항
1. ✅ 중복 파일 제거 (약 50개 파일 삭제)
2. ✅ 논리적 그룹화 (6개 통합 파일)
3. ✅ 명확한 실행 순서 (파일명 번호로 구분)
4. ✅ 문서 통합 (README.md 하나로 통합)

## 사용 방법

### 신규 프로젝트 설정
```bash
# Supabase CLI 사용 (권장)
supabase db reset

# 또는 수동 실행
psql -f 000_integrated_01_base_schema.sql
psql -f 000_integrated_02_recipes.sql
psql -f 000_integrated_03_health.sql
psql -f 000_integrated_04_diet.sql
psql -f 000_integrated_05_payment_premium.sql
psql -f 000_integrated_06_admin_legacy.sql
psql -f 20251130000000_insert_homepage_default_content.sql
psql -f sample_data_v1.sql  # 선택사항
```

## 주의사항

1. **RLS 비활성화**: 모든 테이블의 RLS가 개발 환경을 위해 비활성화되어 있습니다.
2. **프로덕션 배포**: 프로덕션 배포 전에 적절한 RLS 정책을 설정해야 합니다.
3. **샘플 데이터**: `sample_data_v1.sql`은 개발 및 테스트용이므로 프로덕션에서는 실행하지 마세요.



