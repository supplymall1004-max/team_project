# 테이블 생성 순서 가이드

이 문서는 Supabase에서 AWS RDS PostgreSQL로 마이그레이션할 때 테이블을 생성해야 하는 순서를 정의합니다.

## 생성 순서 원칙

1. **외래 키가 없는 테이블을 먼저 생성**
2. **의존하는 테이블이 모두 생성된 후에 의존 테이블 생성**
3. **순환 참조가 있는 경우, 외래 키를 나중에 추가**

## 테이블 생성 순서

### 1단계: 마스터 데이터 테이블 (외래 키 없음)
- `allergies` - 알레르기 마스터 데이터
- `diseases` - 질병 마스터 데이터
- `deworming_medications` - 구충제 마스터 데이터
- `pet_vaccine_master` - 반려동물 백신 마스터 데이터
- `lifecycle_vaccination_schedules` - 생애주기별 예방주사 마스터 데이터

### 2단계: 사용자 기본 테이블
- `users` - 사용자 기본 정보

### 3단계: 사용자 확장 테이블 (users 의존)
- `user_health_profiles` - 사용자 건강 프로필
- `user_subscriptions` - 사용자 구독 관리
- `user_gamification` - 사용자 게임화 데이터
- `user_notification_settings` - 사용자 알림 설정
- `user_push_tokens` - 사용자 푸시 알림 토큰
- `user_api_keys` - 사용자 API 키

### 4단계: 가족 구성원 테이블 (users 의존)
- `family_members` - 가족 구성원

### 5단계: 레시피 관련 테이블
- `recipes` - 레시피 기본 정보 (users 의존, 하지만 user_id는 nullable)
- `recipe_variation_groups` - 레시피 변형 그룹 (recipes 의존, 순환 참조 주의)
- `recipe_ingredients` - 레시피 재료 정보 (recipes 의존)
- `recipe_steps` - 레시피 조리 단계 (recipes 의존)
- `recipe_ratings` - 레시피 평가 (recipes, users 의존)
- `recipe_reports` - 레시피 신고 (recipes, users 의존)
- `recipe_usage_history` - 레시피 사용 이력 (recipes, users, family_members 의존)
- `favorite_meals` - 즐겨찾기 식단 (recipes, users 의존)

### 6단계: 식단 관련 테이블
- `weekly_diet_plans` - 주간 식단 메타데이터 (users 의존)
- `diet_plans` - 식단 계획 (users, family_members, recipes, weekly_diet_plans 의존)
- `weekly_nutrition_stats` - 주간 영양 통계 (weekly_diet_plans 의존)
- `weekly_shopping_lists` - 주간 장보기 리스트 (weekly_diet_plans 의존)

### 7단계: 건강 데이터 소스 및 기록 테이블
- `health_data_sources` - 건강정보 데이터 소스 연결 (users 의존)
- `hospital_records` - 병원 방문 기록 (users, family_members, health_data_sources 의존)
- `medication_records` - 약물 복용 기록 (users, family_members, hospital_records, health_data_sources 의존)
- `disease_records` - 질병 진단 기록 (users, family_members, diseases, hospital_records, health_data_sources 의존)
- `vital_signs` - 생체 신호 기록 (users, family_members 의존)
- `weight_logs` - 체중 기록 (users, family_members 의존)
- `activity_logs` - 활동량 기록 (users, family_members 의존)
- `sleep_logs` - 수면 기록 (users, family_members 의존)

### 8단계: 건강 관리 및 알림 테이블
- `user_vaccination_schedules` - 예방접종 일정 (users, family_members 의존)
- `user_vaccination_records` - 예방접종 기록 (users, family_members 의존)
- `user_health_checkup_records` - 건강검진 기록 (users, family_members 의존)
- `user_health_checkup_recommendations` - 건강검진 권장 일정 (users, family_members 의존)
- `user_periodic_health_services` - 주기적 건강 관리 서비스 (users, family_members 의존)
- `user_deworming_records` - 구충제 복용 기록 (users, family_members 의존)
- `user_infection_risk_scores` - 감염병 위험 지수 (users, family_members 의존)
- `user_travel_risk_assessments` - 여행 위험도 평가 (users 의존)
- `notifications` - 통합 알림 로그 (users, family_members 의존)
- `health_notifications` - 건강 알림 (DEPRECATED, notifications로 통합)
- `vaccination_notification_logs` - 예방접종 알림 로그 (DEPRECATED, notifications로 통합)
- `medication_reminder_logs` - 약물 복용 알림 로그 (DEPRECATED, notifications로 통합)
- `user_periodic_service_reminders` - 주기적 서비스 리마인더 (DEPRECATED, notifications로 통합)

### 9단계: 알레르기 및 질병 관련 확장 테이블
- `allergy_derived_ingredients` - 알레르기 파생 재료 (allergies 의존)
- `emergency_procedures` - 알레르기 응급조치 정보 (allergies 의존)
- `disease_excluded_foods_extended` - 질병별 제외 음식 목록 (diseases 의존)
- `disease_excluded_foods` - 질병별 제외 음식 (레거시)

### 10단계: 구독 및 결제 테이블
- `subscriptions` - 구독 정보 (users 의존)
- `promo_codes` - 프로모션 코드 (users 의존)
- `payment_transactions` - 결제 내역 (users, subscriptions 의존)
- `promo_code_uses` - 프로모션 코드 사용 내역 (users, promo_codes, subscriptions 의존)

### 11단계: 커뮤니티 관련 테이블
- `community_groups` - 커뮤니티 그룹 (users 의존)
- `group_members` - 그룹 멤버 (users, community_groups 의존)
- `group_posts` - 그룹 게시글 (users, community_groups 의존)
- `post_comments` - 게시글 댓글 (users, group_posts, post_comments 의존 - 자기 참조)
- `post_likes` - 게시글/댓글 좋아요 (users, group_posts, post_comments 의존)
- `user_follows` - 사용자 팔로우 (users 의존 - 자기 참조)

### 12단계: 캐릭터 게임 관련 테이블
- `character_levels` - 캐릭터 레벨 시스템 (users, family_members 의존)
- `character_skins` - 캐릭터 스킨 컬렉션 (users, family_members 의존)
- `character_positions` - 캐릭터 위치 및 활동 상태 (users, family_members 의존)
- `character_game_events` - 캐릭터창 게임 이벤트 (users, family_members 의존)
- `character_game_interactions` - 캐릭터 게임 상호작용 기록 (users, family_members, character_game_events 의존)
- `daily_quests` - 일일 퀘스트 시스템 (users 의존)
- `random_events` - 랜덤 이벤트 시스템 (users 의존)
- `minigame_records` - 미니게임 기록 (users, family_members 의존)
- `quiz_records` - 건강 퀴즈 기록 (users 의존)
- `family_intimacy` - 가족 친밀도 시스템 (users, family_members 의존)
- `family_challenges` - 가족 챌린지 시스템 (users 의존)
- `fridge_guardian_scores` - 냉장고 파수꾼 게임 점수 기록 (users 의존)

### 13단계: 생애주기 알림 관련 테이블
- `lifecycle_notification_reminder_settings` - 생애주기별 알림 리마인더 설정 (users, family_members 의존)
- `lifecycle_notification_shares` - 생애주기별 알림 공유 (users, family_members, notifications 의존)

### 14단계: 가족 그룹 관련 테이블
- `family_groups` - 가족 그룹 (users 의존)
- `family_group_members` - 가족 그룹 멤버 (users, family_groups 의존)

### 15단계: 신원 확인 및 동의 관련 테이블
- `identity_verifications` - 신원 확인 (users, family_members 의존)
- `consent_records` - 개인정보 처리 동의 내역 (users, identity_verifications 의존)

### 16단계: 기타 기능 테이블
- `calorie_calculation_formulas` - 칼로리 계산 공식 (users 의존)
- `diet_notification_settings` - 식단 알림 설정 (users 의존)
- `baby_feeding_schedules` - 아기 분유 먹일 시간 스케줄 (users, family_members 의존)
- `health_dashboard_cache` - 건강 대시보드 캐시 (users, family_members 의존)
- `health_data_sync_logs` - 건강정보 동기화 로그 (users, health_data_sources 의존)

### 17단계: 레거시 및 관리 테이블
- `legacy_masters` - 레거시 명인 정보
- `legacy_videos` - 레거시 비디오 정보 (legacy_masters 의존)
- `legacy_documents` - 레거시 문서화 기록 (legacy_videos 의존)
- `legacy_replacement_guides` - 레거시 대체 가이드
- `foodsafety_recipes_cache` - 식약처 레시피 캐시
- `meal_kits` - 수동 등록 밀키트 제품 (users 의존)
- `meal_kit_products` - 쿠팡 API 제품 캐시
- `royal_recipes_posts` - 궁중 레시피 블로그
- `kcdc_alerts` - 질병관리청 공지 및 알림 데이터
- `kcdc_disease_outbreaks` - 감염병 발생 정보 캐시
- `kcdc_health_checkup_statistics` - 건강검진 통계 캐시
- `admin_security_audit` - 관리자 보안 감사 로그
- `admin_copy_blocks` - 페이지 문구 관리
- `popup_announcements` - 팝업 공지 관리
- `image_cache_stats` - 이미지 캐시 통계 스냅샷
- `image_cache_cleanup_logs` - 이미지 캐시 정리 로그
- `image_usage_logs` - 이미지 사용 로그
- `medication_interactions` - 약물 상호작용 정보
- `notification_logs` - 알림 로그 (DEPRECATED)

## 주의사항

1. **순환 참조 처리**: 
   - `recipes`와 `recipe_variation_groups`는 순환 참조가 있습니다. `recipes` 테이블을 먼저 생성하고, `variation_group_id` 외래 키는 나중에 추가하거나 NULL로 허용해야 합니다.

2. **자기 참조 처리**:
   - `post_comments`는 자기 참조(`parent_comment_id`)가 있습니다. 테이블 생성 후 외래 키를 추가해야 합니다.
   - `user_follows`는 자기 참조(`follower_id`, `following_id`)가 있습니다.

3. **DEPRECATED 테이블**:
   - 일부 테이블은 DEPRECATED로 표시되어 있지만, 기존 데이터 호환성을 위해 포함했습니다.

4. **RLS 정책**:
   - 이 마이그레이션 스크립트는 RLS(Row Level Security) 정책을 포함하지 않습니다. 프로덕션 환경에서는 적절한 RLS 정책을 추가해야 합니다.

