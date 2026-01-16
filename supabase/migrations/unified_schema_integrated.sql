-- ============================================================================
-- 통합 데이터베이스 스키마 마이그레이션
-- 작성일: 2025-01-27
-- 설명: 중고거래 사이트 형식에 맞춘 통합 버전
-- 주의: 실제 적용하지 말고 통합 버전으로만 사용
-- ============================================================================

-- ============================================================================
-- 1. 핵심 사용자 테이블
-- ============================================================================

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
	`id`	uuid	NOT NULL,
	`clerk_id`	text	NOT NULL	COMMENT 'Clerk 사용자 ID (Unique)',
	`name`	text	NOT NULL,
	`is_premium`	bool	NOT NULL	DEFAULT false	COMMENT '프리미엄 구독 여부',
	`premium_expires_at`	timestamp	NULL,
	`trial_ends_at`	timestamp	NULL,
	`mfa_secret`	text	NULL,
	`mfa_enabled`	bool	NOT NULL	DEFAULT false,
	`mfa_backup_codes`	text[]	NULL,
	`notification_settings`	jsonb	NOT NULL	DEFAULT '{"kcdcAlerts": false, "healthPopups": false, "generalNotifications": false}'::jsonb,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`trial_used_at`	timestamp	NULL	COMMENT '14일 무료 체험을 시작한 시각',
	`bio`	text	NULL	COMMENT '사용자 소개글',
	`profile_image_url`	text	NULL	COMMENT '프로필 이미지 URL',
	`follower_count`	int4	NOT NULL	DEFAULT 0	COMMENT '팔로워 수',
	`following_count`	int4	NOT NULL	DEFAULT 0	COMMENT '팔로잉 수',
	`post_count`	int4	NOT NULL	DEFAULT 0	COMMENT '작성한 게시글 수',
	`game_settings`	jsonb	NOT NULL	DEFAULT '{"gameTheme": "default", "soundEnabled": true, "autoWalkEnabled": true, "notificationEnabled": true, "characterGameEnabled": true}'::jsonb	COMMENT '캐릭터창 게임 설정',
	`home_customization`	jsonb	NULL	COMMENT '홈페이지 커스텀 설정'
);

DROP TABLE IF EXISTS `user_health_profiles`;

CREATE TABLE `user_health_profiles` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`disliked_ingredients`	text[]	NOT NULL	DEFAULT '{}',
	`excluded_ingredients`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '비선호 식재료 목록',
	`premium_features`	text[]	NOT NULL	DEFAULT '{}',
	`height_cm`	int4	NULL,
	`weight_kg`	numeric	NULL,
	`age`	int4	NULL,
	`gender`	text	NULL	COMMENT '성별: male, female, other',
	`activity_level`	text	NULL	COMMENT '활동 수준',
	`daily_calorie_goal`	int4	NULL,
	`calorie_calculation_method`	varchar	NOT NULL	DEFAULT 'auto'	COMMENT '칼로리 계산 방식',
	`manual_target_calories`	int4	NULL	COMMENT '사용자가 직접 설정한 목표 칼로리',
	`show_calculation_formula`	bool	NOT NULL	DEFAULT false	COMMENT '칼로리 계산 공식 표시 여부',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now(),
	`vaccination_history`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '과거 접종 이력',
	`last_health_checkup_date`	date	NULL	COMMENT '마지막 건강검진 일자',
	`region`	text	NULL	COMMENT '거주 지역',
	`diseases`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '사용자 질병 목록',
	`allergies`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '사용자 알레르기 목록',
	`preferred_ingredients`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '선호 식재료 목록',
	`dietary_preferences`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '프리미엄 식단 타입',
	`birth_date`	date	NULL	COMMENT '사용자 생년월일'
);

DROP TABLE IF EXISTS `family_members`;

CREATE TABLE `family_members` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`name`	text	NOT NULL,
	`birth_date`	date	NOT NULL,
	`gender`	text	NULL	COMMENT '성별: male, female, other',
	`relationship`	text	NOT NULL,
	`diseases`	text[]	NOT NULL	DEFAULT '{}',
	`allergies`	text[]	NOT NULL	DEFAULT '{}',
	`height_cm`	int4	NULL,
	`weight_kg`	numeric	NULL,
	`activity_level`	text	NULL	COMMENT '활동 수준',
	`dietary_preferences`	text[]	NOT NULL	DEFAULT '{}',
	`include_in_unified_diet`	bool	NOT NULL	DEFAULT true	COMMENT '통합 식단 포함 여부',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now(),
	`vaccination_history`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '과거 접종 이력',
	`last_health_checkup_date`	date	NULL	COMMENT '마지막 건강검진 일자',
	`member_type`	text	NOT NULL	DEFAULT 'human'	COMMENT '구성원 유형: human(사람), pet(반려동물)',
	`pet_type`	text	NULL	COMMENT '반려동물 종류: dog(강아지), cat(고양이), other(기타)',
	`breed`	text	NULL	COMMENT '견종/묘종',
	`lifecycle_stage`	text	NULL	COMMENT '생애주기 단계',
	`pet_metadata`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '반려동물 추가 정보',
	`photo_url`	text	NULL	COMMENT '프로필 사진 URL',
	`avatar_type`	text	NOT NULL	DEFAULT 'icon'	COMMENT '아바타 타입: photo(사진) 또는 icon(아이콘)',
	`health_score`	int4	NULL	COMMENT '최근 계산된 건강 점수 (0-100)',
	`health_score_updated_at`	timestamp	NULL	COMMENT '건강 점수 계산 시각'
);

-- ============================================================================
-- 2. 마스터 데이터 테이블
-- ============================================================================

DROP TABLE IF EXISTS `diseases`;

CREATE TABLE `diseases` (
	`id`	uuid	NOT NULL,
	`code`	varchar	NOT NULL	COMMENT '질병 코드 (Unique)',
	`name_ko`	varchar	NOT NULL,
	`name_en`	varchar	NULL,
	`category`	varchar	NULL,
	`description`	text	NULL,
	`calorie_adjustment_factor`	numeric	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `allergies`;

CREATE TABLE `allergies` (
	`id`	uuid	NOT NULL,
	`code`	varchar	NOT NULL	COMMENT '알레르기 코드 (Unique)',
	`name_ko`	varchar	NOT NULL,
	`name_en`	varchar	NULL,
	`category`	varchar	NULL,
	`severity_level`	varchar	NOT NULL	DEFAULT 'high'	COMMENT '심각도 레벨: high, medium, low',
	`description`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 3. 레시피 관련 테이블
-- ============================================================================

DROP TABLE IF EXISTS `recipes`;

CREATE TABLE `recipes` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NULL,
	`slug`	text	NOT NULL	COMMENT 'URL 친화적 식별자 (Unique)',
	`title`	text	NOT NULL,
	`description`	text	NULL,
	`thumbnail_url`	text	NULL,
	`difficulty`	int4	NOT NULL	COMMENT '난이도 (1~5점)',
	`cooking_time_minutes`	int4	NOT NULL,
	`servings`	int4	NOT NULL	DEFAULT 1,
	`calories`	numeric	NULL,
	`carbohydrates`	numeric	NULL,
	`protein`	numeric	NULL,
	`fat`	numeric	NULL,
	`sodium`	numeric	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now(),
	`main_ingredients`	text[]	NOT NULL	DEFAULT ARRAY[]::text[]	COMMENT '메인 재료 목록',
	`cooking_method`	text	NULL	COMMENT '조리법',
	`variation_group_id`	uuid	NULL	COMMENT '변형 그룹 ID',
	`nutrition_focus`	text[]	NOT NULL	DEFAULT ARRAY[]::text[]	COMMENT '영양소 강점',
	`age_group_suitable`	text[]	NOT NULL	DEFAULT ARRAY[]::text[]	COMMENT '적합 연령대'
);

DROP TABLE IF EXISTS `recipe_ingredients`;

CREATE TABLE `recipe_ingredients` (
	`id`	uuid	NOT NULL,
	`recipe_id`	uuid	NOT NULL,
	`name`	text	NOT NULL,
	`ingredient_name`	text	NULL,
	`quantity`	numeric	NULL,
	`unit`	text	NULL,
	`notes`	text	NULL,
	`display_order`	int4	NOT NULL,
	`category`	ingredient_category	NOT NULL	DEFAULT '기타',
	`is_optional`	bool	NOT NULL	DEFAULT false,
	`preparation_note`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `recipe_steps`;

CREATE TABLE `recipe_steps` (
	`id`	uuid	NOT NULL,
	`recipe_id`	uuid	NOT NULL,
	`step_number`	int4	NOT NULL,
	`content`	text	NOT NULL,
	`image_url`	text	NULL,
	`video_url`	text	NULL,
	`timer_minutes`	int4	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 4. 식단 관련 테이블
-- ============================================================================

DROP TABLE IF EXISTS `weekly_diet_plans`;

CREATE TABLE `weekly_diet_plans` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`week_start_date`	date	NOT NULL	COMMENT '주차 시작일 (항상 월요일)',
	`week_year`	int4	NOT NULL,
	`week_number`	int4	NOT NULL	COMMENT 'ISO 8601 주차 번호 (1-53)',
	`is_family`	bool	NOT NULL	DEFAULT false	COMMENT '가족 식단 여부',
	`total_recipes_count`	int4	NOT NULL	DEFAULT 0,
	`generation_duration_ms`	int4	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `diet_plans`;

CREATE TABLE `diet_plans` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`plan_date`	date	NOT NULL,
	`meal_type`	text	NOT NULL	COMMENT '식사 타입: breakfast, lunch, dinner, snack',
	`recipe_id`	uuid	NULL,
	`recipe_title`	text	NOT NULL,
	`recipe_description`	text	NULL,
	`ingredients`	jsonb	NOT NULL	DEFAULT '[]'::jsonb,
	`instructions`	text	NULL,
	`calories`	int4	NULL,
	`protein_g`	numeric	NULL,
	`carbs_g`	numeric	NULL,
	`fat_g`	numeric	NULL,
	`sodium_mg`	int4	NULL,
	`fiber_g`	numeric	NULL,
	`potassium_mg`	int4	NULL,
	`phosphorus_mg`	int4	NULL,
	`gi_index`	numeric	NULL,
	`composition_summary`	jsonb	NOT NULL	DEFAULT '[]'::jsonb,
	`is_unified`	bool	NOT NULL	DEFAULT false,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`weekly_diet_plan_id`	uuid	NULL	COMMENT '주간 식단 계획 ID'
);

-- ============================================================================
-- 5. 구독/결제 테이블 (통합)
-- ============================================================================

DROP TABLE IF EXISTS `subscriptions`;

CREATE TABLE `subscriptions` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`status`	text	NOT NULL	DEFAULT 'inactive'	COMMENT '구독 상태: active, inactive, cancelled, paused',
	`plan_type`	text	NOT NULL,
	`subscription_plan`	text	NOT NULL	DEFAULT 'free'	COMMENT '구독 플랜: free, single, premium, enterprise (user_subscriptions 통합)',
	`billing_key`	text	NULL,
	`payment_method`	text	NULL,
	`last_four_digits`	text	NULL,
	`started_at`	timestamp	NOT NULL,
	`current_period_start`	timestamp	NOT NULL,
	`current_period_end`	timestamp	NOT NULL,
	`expires_at`	timestamp	NULL	COMMENT '구독 만료일 (user_subscriptions 통합)',
	`cancelled_at`	timestamp	NULL,
	`price_per_month`	int4	NOT NULL,
	`total_paid`	int4	NOT NULL	DEFAULT 0,
	`is_active`	bool	NOT NULL	DEFAULT false	COMMENT '활성 상태 (user_subscriptions 통합)',
	`is_test_mode`	bool	NOT NULL	DEFAULT false,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `promo_codes`;

CREATE TABLE `promo_codes` (
	`id`	uuid	NOT NULL,
	`code`	text	NOT NULL,
	`discount_type`	text	NOT NULL	COMMENT '할인 유형: percentage, fixed_amount, free_trial',
	`discount_value`	int4	NOT NULL,
	`max_uses`	int4	NULL,
	`current_uses`	int4	NOT NULL	DEFAULT 0,
	`valid_from`	timestamp	NOT NULL,
	`valid_until`	timestamp	NOT NULL,
	`applicable_plans`	text[]	NULL,
	`new_users_only`	bool	NOT NULL	DEFAULT false,
	`description`	text	NULL,
	`created_by`	uuid	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `payment_transactions`;

CREATE TABLE `payment_transactions` (
	`id`	uuid	NOT NULL,
	`subscription_id`	uuid	NULL,
	`user_id`	uuid	NOT NULL,
	`status`	text	NOT NULL	COMMENT '상태: pending, completed, failed, refunded',
	`transaction_type`	text	NOT NULL	COMMENT '거래 유형: subscription, one_time, refund',
	`pg_provider`	text	NOT NULL	DEFAULT 'toss_payments',
	`pg_transaction_id`	text	NULL,
	`amount`	int4	NOT NULL,
	`tax_amount`	int4	NULL,
	`net_amount`	int4	NOT NULL,
	`payment_method`	text	NULL,
	`card_info`	jsonb	NULL,
	`paid_at`	timestamp	NULL,
	`refunded_at`	timestamp	NULL,
	`metadata`	jsonb	NULL,
	`is_test_mode`	bool	NOT NULL	DEFAULT false,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `promo_code_uses`;

CREATE TABLE `promo_code_uses` (
	`id`	uuid	NOT NULL,
	`promo_code_id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`subscription_id`	uuid	NULL,
	`used_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 6. 알림 테이블 (통합)
-- ============================================================================

DROP TABLE IF EXISTS `notifications`;

CREATE TABLE `notifications` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NULL,
	`family_member_id`	uuid	NULL,
	`type`	text	NOT NULL	COMMENT '알림 타입: system, health, vaccination, medication, periodic_service, lifecycle_event, pet_healthcare',
	`category`	text	NULL	COMMENT '세부 카테고리',
	`channel`	text	NULL	COMMENT '알림 채널: push, sms, email, in_app',
	`title`	text	NULL,
	`message`	text	NULL,
	`status`	text	NOT NULL	DEFAULT 'pending'	COMMENT '상태: pending, sent, failed, dismissed, confirmed, missed, cancelled',
	`priority`	text	NOT NULL	DEFAULT 'normal'	COMMENT '우선순위: low, normal, high, urgent',
	`context_data`	jsonb	NOT NULL	DEFAULT '{}'::jsonb,
	`scheduled_at`	timestamp	NULL,
	`sent_at`	timestamp	NULL,
	`read_at`	timestamp	NULL,
	`confirmed_at`	timestamp	NULL,
	`related_id`	uuid	NULL,
	`related_type`	text	NULL,
	`recipient`	text	NULL,
	`error_message`	text	NULL,
	`retry_count`	int4	NOT NULL	DEFAULT 0,
	`is_test`	bool	NOT NULL	DEFAULT false,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- PRIMARY KEY 제약조건
-- ============================================================================

ALTER TABLE `users` ADD CONSTRAINT `PK_USERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_health_profiles` ADD CONSTRAINT `PK_USER_HEALTH_PROFILES` PRIMARY KEY (
	`id`
);

ALTER TABLE `family_members` ADD CONSTRAINT `PK_FAMILY_MEMBERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `diseases` ADD CONSTRAINT `PK_DISEASES` PRIMARY KEY (
	`id`
);

ALTER TABLE `allergies` ADD CONSTRAINT `PK_ALLERGIES` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipes` ADD CONSTRAINT `PK_RECIPES` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `PK_RECIPE_INGREDIENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipe_steps` ADD CONSTRAINT `PK_RECIPE_STEPS` PRIMARY KEY (
	`id`
);

ALTER TABLE `weekly_diet_plans` ADD CONSTRAINT `PK_WEEKLY_DIET_PLANS` PRIMARY KEY (
	`id`
);

ALTER TABLE `diet_plans` ADD CONSTRAINT `PK_DIET_PLANS` PRIMARY KEY (
	`id`
);

ALTER TABLE `subscriptions` ADD CONSTRAINT `PK_SUBSCRIPTIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `promo_codes` ADD CONSTRAINT `PK_PROMO_CODES` PRIMARY KEY (
	`id`
);

ALTER TABLE `payment_transactions` ADD CONSTRAINT `PK_PAYMENT_TRANSACTIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `promo_code_uses` ADD CONSTRAINT `PK_PROMO_CODE_USES` PRIMARY KEY (
	`id`
);

ALTER TABLE `notifications` ADD CONSTRAINT `PK_NOTIFICATIONS` PRIMARY KEY (
	`id`
);

-- ============================================================================
-- FOREIGN KEY 제약조건
-- ============================================================================

ALTER TABLE `user_health_profiles` ADD CONSTRAINT `FK_users_TO_user_health_profiles_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `family_members` ADD CONSTRAINT `FK_users_TO_family_members_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `recipes` ADD CONSTRAINT `FK_users_TO_recipes_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `recipe_ingredients` ADD CONSTRAINT `FK_recipes_TO_recipe_ingredients_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipe_steps` ADD CONSTRAINT `FK_recipes_TO_recipe_steps_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `weekly_diet_plans` ADD CONSTRAINT `FK_users_TO_weekly_diet_plans_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `diet_plans` ADD CONSTRAINT `FK_users_TO_diet_plans_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `diet_plans` ADD CONSTRAINT `FK_family_members_TO_diet_plans_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `diet_plans` ADD CONSTRAINT `FK_recipes_TO_diet_plans_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `diet_plans` ADD CONSTRAINT `FK_weekly_diet_plans_TO_diet_plans_1` FOREIGN KEY (
	`weekly_diet_plan_id`
)
REFERENCES `weekly_diet_plans` (
	`id`
);

ALTER TABLE `subscriptions` ADD CONSTRAINT `FK_users_TO_subscriptions_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `promo_codes` ADD CONSTRAINT `FK_users_TO_promo_codes_1` FOREIGN KEY (
	`created_by`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `payment_transactions` ADD CONSTRAINT `FK_subscriptions_TO_payment_transactions_1` FOREIGN KEY (
	`subscription_id`
)
REFERENCES `subscriptions` (
	`id`
);

ALTER TABLE `payment_transactions` ADD CONSTRAINT `FK_users_TO_payment_transactions_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `promo_code_uses` ADD CONSTRAINT `FK_promo_codes_TO_promo_code_uses_1` FOREIGN KEY (
	`promo_code_id`
)
REFERENCES `promo_codes` (
	`id`
);

ALTER TABLE `promo_code_uses` ADD CONSTRAINT `FK_users_TO_promo_code_uses_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `promo_code_uses` ADD CONSTRAINT `FK_subscriptions_TO_promo_code_uses_1` FOREIGN KEY (
	`subscription_id`
)
REFERENCES `subscriptions` (
	`id`
);

ALTER TABLE `notifications` ADD CONSTRAINT `FK_users_TO_notifications_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `notifications` ADD CONSTRAINT `FK_family_members_TO_notifications_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

-- ============================================================================
-- 7. 건강 관리 테이블
-- ============================================================================

DROP TABLE IF EXISTS `medication_records`;

CREATE TABLE `medication_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`medication_name`	text	NOT NULL,
	`medication_code`	text	NULL,
	`active_ingredient`	text	NULL,
	`dosage`	text	NOT NULL,
	`frequency`	text	NOT NULL,
	`start_date`	date	NOT NULL,
	`end_date`	date	NULL,
	`reminder_times`	time[]	NOT NULL	DEFAULT '{}'	COMMENT '복용 알림 시간 배열',
	`reminder_enabled`	bool	NOT NULL	DEFAULT true,
	`hospital_record_id`	uuid	NULL	COMMENT '처방받은 병원 기록 참조',
	`data_source_id`	uuid	NULL,
	`is_auto_synced`	bool	NOT NULL	DEFAULT false	COMMENT '자동 동기화 여부',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `hospital_records`;

CREATE TABLE `hospital_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`visit_date`	date	NOT NULL,
	`hospital_name`	text	NOT NULL,
	`hospital_code`	text	NULL,
	`department`	text	NULL,
	`diagnosis`	text[]	NOT NULL	DEFAULT '{}'	COMMENT '진단명 배열',
	`diagnosis_codes`	text[]	NOT NULL	DEFAULT '{}'	COMMENT '진단 코드 배열',
	`prescribed_medications`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '처방약물 정보 배열',
	`treatment_summary`	text	NULL,
	`data_source_id`	uuid	NULL,
	`is_auto_synced`	bool	NOT NULL	DEFAULT false	COMMENT '자동 동기화 여부',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `disease_records`;

CREATE TABLE `disease_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`disease_name`	text	NOT NULL,
	`disease_code`	text	NULL	COMMENT '질병 코드 (diseases 테이블 참조)',
	`diagnosis_date`	date	NOT NULL,
	`hospital_name`	text	NULL,
	`hospital_record_id`	uuid	NULL	COMMENT '진단받은 병원 기록 참조',
	`status`	text	NOT NULL	DEFAULT 'active'	COMMENT '질병 상태: active, cured, chronic, monitoring',
	`severity`	text	NULL	COMMENT '심각도: mild, moderate, severe',
	`treatment_plan`	text	NULL,
	`data_source_id`	uuid	NULL,
	`is_auto_synced`	bool	NOT NULL	DEFAULT false,
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_vaccination_records`;

CREATE TABLE `user_vaccination_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`vaccine_name`	text	NOT NULL,
	`vaccine_code`	text	NULL,
	`target_age_group`	text	NULL,
	`scheduled_date`	date	NULL,
	`completed_date`	date	NULL,
	`dose_number`	int4	NULL	COMMENT '접종 차수',
	`total_doses`	int4	NULL	COMMENT '총 접종 차수',
	`vaccination_site`	text	NULL,
	`vaccination_site_address`	text	NULL,
	`reminder_enabled`	bool	NOT NULL	DEFAULT true,
	`reminder_days_before`	int4	NOT NULL	DEFAULT 7,
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_health_checkup_records`;

CREATE TABLE `user_health_checkup_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`checkup_type`	text	NOT NULL	COMMENT '검진 유형: national, cancer, special',
	`checkup_date`	date	NOT NULL,
	`checkup_site`	text	NULL,
	`checkup_site_address`	text	NULL,
	`results`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '검진 결과 데이터',
	`next_recommended_date`	date	NULL,
	`overdue_days`	int4	NULL	COMMENT '연체 일수',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `vital_signs`;

CREATE TABLE `vital_signs` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`measured_at`	timestamp	NOT NULL,
	`systolic_bp`	int4	NULL	COMMENT '수축기 혈압 (mmHg)',
	`diastolic_bp`	int4	NULL	COMMENT '이완기 혈압 (mmHg)',
	`fasting_glucose`	int4	NULL	COMMENT '공복 혈당 (mg/dL)',
	`postprandial_glucose`	int4	NULL	COMMENT '식후 혈당 (mg/dL)',
	`heart_rate`	int4	NULL	COMMENT '심박수 (bpm)',
	`source`	text	NOT NULL	DEFAULT 'manual'	COMMENT '데이터 출처',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `weight_logs`;

CREATE TABLE `weight_logs` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`date`	date	NOT NULL,
	`weight_kg`	numeric	NOT NULL	COMMENT '체중 (kg)',
	`body_fat_percentage`	numeric	NULL	COMMENT '체지방률 (%)',
	`muscle_mass_kg`	numeric	NULL	COMMENT '근육량 (kg)',
	`source`	text	NOT NULL	DEFAULT 'manual',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `activity_logs`;

CREATE TABLE `activity_logs` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`date`	date	NOT NULL,
	`steps`	int4	NOT NULL	DEFAULT 0	COMMENT '걸음 수',
	`exercise_minutes`	int4	NOT NULL	DEFAULT 0	COMMENT '운동 시간 (분)',
	`calories_burned`	int4	NOT NULL	DEFAULT 0	COMMENT '소모 칼로리',
	`activity_type`	text	NULL	COMMENT '운동 유형',
	`source`	text	NOT NULL	DEFAULT 'manual'	COMMENT '데이터 출처',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `sleep_logs`;

CREATE TABLE `sleep_logs` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`date`	date	NOT NULL,
	`sleep_duration_minutes`	int4	NULL	COMMENT '수면 시간 (분)',
	`sleep_quality_score`	int4	NULL	COMMENT '수면 품질 점수 (1-10)',
	`deep_sleep_minutes`	int4	NULL	COMMENT '깊은 수면 시간 (분)',
	`light_sleep_minutes`	int4	NULL	COMMENT '얕은 수면 시간 (분)',
	`rem_sleep_minutes`	int4	NULL	COMMENT 'REM 수면 시간 (분)',
	`bedtime`	time	NULL,
	`wake_time`	time	NULL,
	`source`	text	NOT NULL	DEFAULT 'manual'	COMMENT '데이터 출처',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 8. 게임화/소셜 테이블
-- ============================================================================

DROP TABLE IF EXISTS `user_gamification`;

CREATE TABLE `user_gamification` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`total_points`	int4	NOT NULL	DEFAULT 0	COMMENT '총 포인트',
	`streak_days`	int4	NOT NULL	DEFAULT 0	COMMENT '연속 완료 일수',
	`badges`	text[]	NOT NULL	DEFAULT '{}'	COMMENT '획득한 배지 ID 배열',
	`last_completed_date`	timestamp	NULL	COMMENT '마지막 알림 완료 날짜',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `daily_quests`;

CREATE TABLE `daily_quests` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`quest_id`	text	NOT NULL	COMMENT '퀘스트 식별자',
	`progress`	int4	NOT NULL	DEFAULT 0	COMMENT '현재 진행도',
	`target`	int4	NOT NULL	COMMENT '목표 달성 수치',
	`completed`	bool	NOT NULL	DEFAULT false,
	`completed_at`	timestamp	NULL,
	`quest_date`	date	NOT NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `character_levels`;

CREATE TABLE `character_levels` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL	COMMENT '가족 구성원 ID',
	`level`	int4	NOT NULL	DEFAULT 1,
	`experience`	int4	NOT NULL	DEFAULT 0,
	`experience_to_next_level`	int4	NOT NULL	DEFAULT 100	COMMENT '다음 레벨까지 필요한 경험치',
	`last_level_up_at`	timestamp	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `community_groups`;

CREATE TABLE `community_groups` (
	`id`	uuid	NOT NULL,
	`name`	text	NOT NULL,
	`description`	text	NULL,
	`category`	text	NOT NULL	COMMENT '그룹 카테고리: health, pet, recipe, exercise, region',
	`cover_image_url`	text	NULL,
	`is_public`	bool	NOT NULL	DEFAULT true	COMMENT '공개 그룹 여부',
	`is_family_only`	bool	NOT NULL	DEFAULT false	COMMENT '가족 내부 그룹 여부',
	`owner_id`	uuid	NOT NULL,
	`member_count`	int4	NOT NULL	DEFAULT 0	COMMENT '그룹 멤버 수',
	`post_count`	int4	NOT NULL	DEFAULT 0	COMMENT '그룹 게시글 수',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `group_members`;

CREATE TABLE `group_members` (
	`id`	uuid	NOT NULL,
	`group_id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`role`	text	NOT NULL	DEFAULT 'member'	COMMENT '멤버 역할: owner, moderator, member',
	`joined_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `group_posts`;

CREATE TABLE `group_posts` (
	`id`	uuid	NOT NULL,
	`group_id`	uuid	NOT NULL,
	`author_id`	uuid	NOT NULL,
	`title`	text	NOT NULL,
	`content`	text	NOT NULL,
	`post_type`	text	NOT NULL	DEFAULT 'general'	COMMENT '게시글 타입',
	`images`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '이미지 URL 배열',
	`like_count`	int4	NOT NULL	DEFAULT 0,
	`comment_count`	int4	NOT NULL	DEFAULT 0,
	`view_count`	int4	NOT NULL	DEFAULT 0,
	`is_pinned`	bool	NOT NULL	DEFAULT false	COMMENT '고정글 여부',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `post_comments`;

CREATE TABLE `post_comments` (
	`id`	uuid	NOT NULL,
	`post_id`	uuid	NOT NULL,
	`author_id`	uuid	NOT NULL,
	`content`	text	NOT NULL,
	`parent_comment_id`	uuid	NULL	COMMENT '대댓글인 경우 부모 댓글 ID',
	`like_count`	int4	NOT NULL	DEFAULT 0,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `post_likes`;

CREATE TABLE `post_likes` (
	`id`	uuid	NOT NULL,
	`post_id`	uuid	NULL	COMMENT '게시글 ID',
	`comment_id`	uuid	NULL	COMMENT '댓글 ID',
	`user_id`	uuid	NOT NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_follows`;

CREATE TABLE `user_follows` (
	`id`	uuid	NOT NULL,
	`follower_id`	uuid	NOT NULL	COMMENT '팔로우하는 사용자 ID',
	`following_id`	uuid	NOT NULL	COMMENT '팔로우받는 사용자 ID',
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 추가 PRIMARY KEY 제약조건
-- ============================================================================

ALTER TABLE `medication_records` ADD CONSTRAINT `PK_MEDICATION_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `hospital_records` ADD CONSTRAINT `PK_HOSPITAL_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `PK_DISEASE_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_vaccination_records` ADD CONSTRAINT `PK_USER_VACCINATION_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_health_checkup_records` ADD CONSTRAINT `PK_USER_HEALTH_CHECKUP_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `vital_signs` ADD CONSTRAINT `PK_VITAL_SIGNS` PRIMARY KEY (
	`id`
);

ALTER TABLE `weight_logs` ADD CONSTRAINT `PK_WEIGHT_LOGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `activity_logs` ADD CONSTRAINT `PK_ACTIVITY_LOGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `sleep_logs` ADD CONSTRAINT `PK_SLEEP_LOGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_gamification` ADD CONSTRAINT `PK_USER_GAMIFICATION` PRIMARY KEY (
	`id`
);

ALTER TABLE `daily_quests` ADD CONSTRAINT `PK_DAILY_QUESTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `character_levels` ADD CONSTRAINT `PK_CHARACTER_LEVELS` PRIMARY KEY (
	`id`
);

ALTER TABLE `community_groups` ADD CONSTRAINT `PK_COMMUNITY_GROUPS` PRIMARY KEY (
	`id`
);

ALTER TABLE `group_members` ADD CONSTRAINT `PK_GROUP_MEMBERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `group_posts` ADD CONSTRAINT `PK_GROUP_POSTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `post_comments` ADD CONSTRAINT `PK_POST_COMMENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `post_likes` ADD CONSTRAINT `PK_POST_LIKES` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_follows` ADD CONSTRAINT `PK_USER_FOLLOWS` PRIMARY KEY (
	`id`
);

-- ============================================================================
-- 추가 FOREIGN KEY 제약조건
-- ============================================================================

ALTER TABLE `medication_records` ADD CONSTRAINT `FK_users_TO_medication_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `medication_records` ADD CONSTRAINT `FK_family_members_TO_medication_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `hospital_records` ADD CONSTRAINT `FK_users_TO_hospital_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `hospital_records` ADD CONSTRAINT `FK_family_members_TO_hospital_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `FK_users_TO_disease_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `FK_family_members_TO_disease_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `FK_diseases_TO_disease_records_1` FOREIGN KEY (
	`disease_code`
)
REFERENCES `diseases` (
	`code`
);

ALTER TABLE `user_vaccination_records` ADD CONSTRAINT `FK_users_TO_user_vaccination_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_vaccination_records` ADD CONSTRAINT `FK_family_members_TO_user_vaccination_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_health_checkup_records` ADD CONSTRAINT `FK_users_TO_user_health_checkup_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_health_checkup_records` ADD CONSTRAINT `FK_family_members_TO_user_health_checkup_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `vital_signs` ADD CONSTRAINT `FK_users_TO_vital_signs_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `vital_signs` ADD CONSTRAINT `FK_family_members_TO_vital_signs_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `weight_logs` ADD CONSTRAINT `FK_users_TO_weight_logs_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `weight_logs` ADD CONSTRAINT `FK_family_members_TO_weight_logs_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `activity_logs` ADD CONSTRAINT `FK_users_TO_activity_logs_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `activity_logs` ADD CONSTRAINT `FK_family_members_TO_activity_logs_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `sleep_logs` ADD CONSTRAINT `FK_users_TO_sleep_logs_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `sleep_logs` ADD CONSTRAINT `FK_family_members_TO_sleep_logs_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_gamification` ADD CONSTRAINT `FK_users_TO_user_gamification_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `daily_quests` ADD CONSTRAINT `FK_users_TO_daily_quests_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_levels` ADD CONSTRAINT `FK_users_TO_character_levels_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_levels` ADD CONSTRAINT `FK_family_members_TO_character_levels_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `community_groups` ADD CONSTRAINT `FK_users_TO_community_groups_1` FOREIGN KEY (
	`owner_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `group_members` ADD CONSTRAINT `FK_community_groups_TO_group_members_1` FOREIGN KEY (
	`group_id`
)
REFERENCES `community_groups` (
	`id`
);

ALTER TABLE `group_members` ADD CONSTRAINT `FK_users_TO_group_members_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `group_posts` ADD CONSTRAINT `FK_community_groups_TO_group_posts_1` FOREIGN KEY (
	`group_id`
)
REFERENCES `community_groups` (
	`id`
);

ALTER TABLE `group_posts` ADD CONSTRAINT `FK_users_TO_group_posts_1` FOREIGN KEY (
	`author_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `post_comments` ADD CONSTRAINT `FK_group_posts_TO_post_comments_1` FOREIGN KEY (
	`post_id`
)
REFERENCES `group_posts` (
	`id`
);

ALTER TABLE `post_comments` ADD CONSTRAINT `FK_users_TO_post_comments_1` FOREIGN KEY (
	`author_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `post_likes` ADD CONSTRAINT `FK_group_posts_TO_post_likes_1` FOREIGN KEY (
	`post_id`
)
REFERENCES `group_posts` (
	`id`
);

ALTER TABLE `post_likes` ADD CONSTRAINT `FK_post_comments_TO_post_likes_1` FOREIGN KEY (
	`comment_id`
)
REFERENCES `post_comments` (
	`id`
);

ALTER TABLE `post_likes` ADD CONSTRAINT `FK_users_TO_post_likes_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_follows` ADD CONSTRAINT `FK_users_TO_user_follows_1` FOREIGN KEY (
	`follower_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_follows` ADD CONSTRAINT `FK_users_TO_user_follows_2` FOREIGN KEY (
	`following_id`
)
REFERENCES `users` (
	`id`
);

-- ============================================================================
-- 9. 레시피 관련 추가 테이블
-- ============================================================================

DROP TABLE IF EXISTS `recipe_ratings`;

CREATE TABLE `recipe_ratings` (
	`id`	uuid	NOT NULL,
	`recipe_id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`rating`	numeric	NOT NULL	COMMENT '별점 0~5점',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `recipe_reports`;

CREATE TABLE `recipe_reports` (
	`id`	uuid	NOT NULL,
	`recipe_id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`report_type`	text	NOT NULL	COMMENT '신고 유형: inappropriate, copyright, spam, other',
	`reason`	text	NOT NULL,
	`status`	text	NOT NULL	DEFAULT 'pending'	COMMENT '상태: pending, reviewing, resolved, dismissed',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `favorite_meals`;

CREATE TABLE `favorite_meals` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`recipe_id`	uuid	NULL,
	`recipe_title`	text	NOT NULL,
	`meal_type`	text	NULL	COMMENT '식사 타입: breakfast, lunch, dinner, snack',
	`calories`	int4	NULL,
	`protein`	numeric	NULL,
	`carbs`	numeric	NULL,
	`fat`	numeric	NULL,
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `recipe_usage_history`;

CREATE TABLE `recipe_usage_history` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`recipe_id`	uuid	NULL	COMMENT '레시피 ID',
	`recipe_title`	text	NOT NULL,
	`recipe_url`	text	NULL,
	`meal_type`	text	NULL	COMMENT '식사 타입',
	`used_date`	date	NOT NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `recipe_variation_groups`;

CREATE TABLE `recipe_variation_groups` (
	`id`	uuid	NOT NULL,
	`main_ingredient`	text	NOT NULL	COMMENT '메인 재료',
	`base_recipe_id`	uuid	NULL	COMMENT '기본 레시피 ID',
	`variation_type`	text	NOT NULL	COMMENT '변형 타입',
	`description`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `weekly_nutrition_stats`;

CREATE TABLE `weekly_nutrition_stats` (
	`id`	uuid	NOT NULL,
	`weekly_diet_plan_id`	uuid	NOT NULL,
	`day_of_week`	int4	NOT NULL	COMMENT '요일 (0=일요일, 6=토요일)',
	`date`	date	NOT NULL,
	`total_calories`	numeric	NULL,
	`total_carbohydrates`	numeric	NULL,
	`total_protein`	numeric	NULL,
	`total_fat`	numeric	NULL,
	`total_sodium`	numeric	NULL,
	`meal_count`	int4	NOT NULL	DEFAULT 0,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `weekly_shopping_lists`;

CREATE TABLE `weekly_shopping_lists` (
	`id`	uuid	NOT NULL,
	`weekly_diet_plan_id`	uuid	NOT NULL,
	`ingredient_name`	text	NOT NULL,
	`total_quantity`	numeric	NULL,
	`unit`	text	NULL,
	`category`	text	NULL,
	`recipes_using`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '해당 재료를 사용하는 레시피 ID 목록',
	`is_purchased`	bool	NOT NULL	DEFAULT false,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 10. 설정 테이블
-- ============================================================================

DROP TABLE IF EXISTS `user_notification_settings`;

CREATE TABLE `user_notification_settings` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`periodic_services_enabled`	bool	NOT NULL	DEFAULT true	COMMENT '주기적 서비스 알림 활성화',
	`periodic_services_reminder_days`	int4	NOT NULL	DEFAULT 7	COMMENT '알림 일수 전',
	`deworming_reminders_enabled`	bool	NOT NULL	DEFAULT true	COMMENT '구충제 복용 알림 활성화',
	`vaccination_reminders_enabled`	bool	NOT NULL	DEFAULT true,
	`checkup_reminders_enabled`	bool	NOT NULL	DEFAULT true,
	`infection_risk_alerts_enabled`	bool	NOT NULL	DEFAULT true,
	`travel_risk_alerts_enabled`	bool	NOT NULL	DEFAULT true,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `diet_notification_settings`;

CREATE TABLE `diet_notification_settings` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`popup_enabled`	bool	NOT NULL	DEFAULT true,
	`browser_enabled`	bool	NOT NULL	DEFAULT false,
	`notification_time`	time	NOT NULL	DEFAULT '05:00:00',
	`kcdc_enabled`	bool	NOT NULL	DEFAULT true,
	`last_notification_date`	date	NULL,
	`last_dismissed_date`	date	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 11. 마스터 데이터 및 참조 테이블
-- ============================================================================

DROP TABLE IF EXISTS `allergy_derived_ingredients`;

CREATE TABLE `allergy_derived_ingredients` (
	`id`	uuid	NOT NULL,
	`allergy_code`	varchar	NULL,
	`ingredient_name`	varchar	NOT NULL,
	`ingredient_type`	varchar	NULL,
	`description`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `disease_excluded_foods_extended`;

CREATE TABLE `disease_excluded_foods_extended` (
	`id`	uuid	NOT NULL,
	`disease_code`	varchar	NULL,
	`food_name`	varchar	NOT NULL,
	`food_type`	varchar	NULL,
	`severity`	varchar	NOT NULL	DEFAULT 'high'	COMMENT '심각도: high, medium, low',
	`reason`	text	NULL,
	`exclusion_type`	text	NOT NULL	DEFAULT 'absolute',
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `emergency_procedures`;

CREATE TABLE `emergency_procedures` (
	`id`	uuid	NOT NULL,
	`allergy_code`	varchar	NULL,
	`procedure_type`	varchar	NULL,
	`title_ko`	varchar	NOT NULL,
	`title_en`	varchar	NULL,
	`steps`	jsonb	NOT NULL,
	`warning_signs`	jsonb	NULL,
	`when_to_call_911`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `pet_vaccine_master`;

CREATE TABLE `pet_vaccine_master` (
	`id`	uuid	NOT NULL,
	`vaccine_name`	text	NOT NULL,
	`vaccine_code`	text	NOT NULL,
	`pet_type`	text	NOT NULL	COMMENT '대상 반려동물: dog, cat, both',
	`lifecycle_stage`	text	NULL	COMMENT '권장 생애주기 단계',
	`recommended_age_weeks`	int4	NULL,
	`recommended_age_months`	int4	NULL,
	`booster_interval_months`	int4	NULL	COMMENT '추가 접종 주기',
	`is_required`	bool	NOT NULL	DEFAULT false,
	`description`	text	NULL,
	`is_active`	bool	NOT NULL	DEFAULT true,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `deworming_medications`;

CREATE TABLE `deworming_medications` (
	`id`	uuid	NOT NULL,
	`medication_name`	text	NOT NULL,
	`active_ingredient`	text	NOT NULL,
	`standard_dosage`	text	NOT NULL,
	`standard_cycle_days`	int4	NOT NULL	DEFAULT 90,
	`target_parasites`	text[]	NOT NULL	DEFAULT '{}'	COMMENT '대상 기생충 배열',
	`age_group`	text	NULL,
	`contraindications`	text[]	NOT NULL	DEFAULT '{}'	COMMENT '금기 사항 배열',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_deworming_records`;

CREATE TABLE `user_deworming_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`medication_name`	text	NOT NULL,
	`dosage`	text	NOT NULL,
	`taken_date`	date	NOT NULL,
	`next_due_date`	date	NULL,
	`cycle_days`	int4	NOT NULL	DEFAULT 90	COMMENT '복용 주기',
	`prescribed_by`	text	NULL	COMMENT '처방 의사/기관',
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `calorie_calculation_formulas`;

CREATE TABLE `calorie_calculation_formulas` (
	`id`	uuid	NOT NULL,
	`formula_name`	varchar	NOT NULL,
	`formula_type`	varchar	NULL,
	`gender`	varchar	NULL	COMMENT '성별: male, female, all',
	`age_min`	int4	NULL,
	`age_max`	int4	NULL,
	`formula_expression`	text	NOT NULL,
	`description`	text	NULL,
	`user_id`	uuid	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 추가 PRIMARY KEY 제약조건 (레시피 관련)
-- ============================================================================

ALTER TABLE `recipe_ratings` ADD CONSTRAINT `PK_RECIPE_RATINGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipe_reports` ADD CONSTRAINT `PK_RECIPE_REPORTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `favorite_meals` ADD CONSTRAINT `PK_FAVORITE_MEALS` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipe_usage_history` ADD CONSTRAINT `PK_RECIPE_USAGE_HISTORY` PRIMARY KEY (
	`id`
);

ALTER TABLE `recipe_variation_groups` ADD CONSTRAINT `PK_RECIPE_VARIATION_GROUPS` PRIMARY KEY (
	`id`
);

ALTER TABLE `weekly_nutrition_stats` ADD CONSTRAINT `PK_WEEKLY_NUTRITION_STATS` PRIMARY KEY (
	`id`
);

ALTER TABLE `weekly_shopping_lists` ADD CONSTRAINT `PK_WEEKLY_SHOPPING_LISTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_notification_settings` ADD CONSTRAINT `PK_USER_NOTIFICATION_SETTINGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `diet_notification_settings` ADD CONSTRAINT `PK_DIET_NOTIFICATION_SETTINGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `allergy_derived_ingredients` ADD CONSTRAINT `PK_ALLERGY_DERIVED_INGREDIENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `disease_excluded_foods_extended` ADD CONSTRAINT `PK_DISEASE_EXCLUDED_FOODS_EXTENDED` PRIMARY KEY (
	`id`
);

ALTER TABLE `emergency_procedures` ADD CONSTRAINT `PK_EMERGENCY_PROCEDURES` PRIMARY KEY (
	`id`
);

ALTER TABLE `pet_vaccine_master` ADD CONSTRAINT `PK_PET_VACCINE_MASTER` PRIMARY KEY (
	`id`
);

ALTER TABLE `deworming_medications` ADD CONSTRAINT `PK_DEWORMING_MEDICATIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_deworming_records` ADD CONSTRAINT `PK_USER_DEWORMING_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `calorie_calculation_formulas` ADD CONSTRAINT `PK_CALORIE_CALCULATION_FORMULAS` PRIMARY KEY (
	`id`
);

-- ============================================================================
-- 추가 FOREIGN KEY 제약조건 (레시피 관련)
-- ============================================================================

ALTER TABLE `recipe_ratings` ADD CONSTRAINT `FK_recipes_TO_recipe_ratings_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipe_ratings` ADD CONSTRAINT `FK_users_TO_recipe_ratings_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `recipe_reports` ADD CONSTRAINT `FK_recipes_TO_recipe_reports_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipe_reports` ADD CONSTRAINT `FK_users_TO_recipe_reports_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `favorite_meals` ADD CONSTRAINT `FK_users_TO_favorite_meals_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `favorite_meals` ADD CONSTRAINT `FK_recipes_TO_favorite_meals_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipe_usage_history` ADD CONSTRAINT `FK_users_TO_recipe_usage_history_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `recipe_usage_history` ADD CONSTRAINT `FK_recipes_TO_recipe_usage_history_1` FOREIGN KEY (
	`recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipe_usage_history` ADD CONSTRAINT `FK_family_members_TO_recipe_usage_history_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `recipe_variation_groups` ADD CONSTRAINT `FK_recipes_TO_recipe_variation_groups_1` FOREIGN KEY (
	`base_recipe_id`
)
REFERENCES `recipes` (
	`id`
);

ALTER TABLE `recipes` ADD CONSTRAINT `FK_recipe_variation_groups_TO_recipes_1` FOREIGN KEY (
	`variation_group_id`
)
REFERENCES `recipe_variation_groups` (
	`id`
);

ALTER TABLE `weekly_nutrition_stats` ADD CONSTRAINT `FK_weekly_diet_plans_TO_weekly_nutrition_stats_1` FOREIGN KEY (
	`weekly_diet_plan_id`
)
REFERENCES `weekly_diet_plans` (
	`id`
);

ALTER TABLE `weekly_shopping_lists` ADD CONSTRAINT `FK_weekly_diet_plans_TO_weekly_shopping_lists_1` FOREIGN KEY (
	`weekly_diet_plan_id`
)
REFERENCES `weekly_diet_plans` (
	`id`
);

ALTER TABLE `user_notification_settings` ADD CONSTRAINT `FK_users_TO_user_notification_settings_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `diet_notification_settings` ADD CONSTRAINT `FK_users_TO_diet_notification_settings_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `allergy_derived_ingredients` ADD CONSTRAINT `FK_allergies_TO_allergy_derived_ingredients_1` FOREIGN KEY (
	`allergy_code`
)
REFERENCES `allergies` (
	`code`
);

ALTER TABLE `disease_excluded_foods_extended` ADD CONSTRAINT `FK_diseases_TO_disease_excluded_foods_extended_1` FOREIGN KEY (
	`disease_code`
)
REFERENCES `diseases` (
	`code`
);

ALTER TABLE `emergency_procedures` ADD CONSTRAINT `FK_allergies_TO_emergency_procedures_1` FOREIGN KEY (
	`allergy_code`
)
REFERENCES `allergies` (
	`code`
);

ALTER TABLE `user_deworming_records` ADD CONSTRAINT `FK_users_TO_user_deworming_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_deworming_records` ADD CONSTRAINT `FK_family_members_TO_user_deworming_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `calorie_calculation_formulas` ADD CONSTRAINT `FK_users_TO_calorie_calculation_formulas_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

-- ============================================================================
-- 12. 캐릭터 게임 관련 테이블
-- ============================================================================

DROP TABLE IF EXISTS `character_skins`;

CREATE TABLE `character_skins` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`skin_id`	text	NOT NULL	COMMENT '스킨 식별자',
	`unlocked_at`	timestamp	NOT NULL	DEFAULT now(),
	`is_active`	bool	NOT NULL	DEFAULT false	COMMENT '현재 착용 중인 스킨 여부'
);

DROP TABLE IF EXISTS `character_positions`;

CREATE TABLE `character_positions` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NOT NULL,
	`current_position`	jsonb	NOT NULL	DEFAULT '{"x": 0, "y": 0, "z": 0}'::jsonb	COMMENT '현재 위치',
	`target_position`	jsonb	NULL	COMMENT '목표 위치',
	`activity_type`	text	NULL	COMMENT '현재 활동 유형',
	`last_updated`	timestamp	NOT NULL	DEFAULT now(),
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `character_game_events`;

CREATE TABLE `character_game_events` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`event_type`	text	NOT NULL	COMMENT '이벤트 유형',
	`event_data`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '이벤트별 상세 데이터',
	`scheduled_time`	timestamp	NOT NULL	COMMENT '이벤트 발생 예정 시간',
	`status`	text	NOT NULL	DEFAULT 'pending'	COMMENT '상태',
	`priority`	text	NOT NULL	DEFAULT 'normal'	COMMENT '우선순위',
	`completed_at`	timestamp	NULL,
	`points_earned`	int4	NOT NULL	DEFAULT 0	COMMENT '이벤트 완료 시 획득한 포인트',
	`experience_earned`	int4	NOT NULL	DEFAULT 0	COMMENT '이벤트 완료 시 획득한 경험치',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `character_game_interactions`;

CREATE TABLE `character_game_interactions` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`event_id`	uuid	NULL,
	`interaction_type`	text	NOT NULL	COMMENT '상호작용 유형',
	`interaction_data`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '상호작용 상세 데이터',
	`points_earned`	int4	NOT NULL	DEFAULT 0,
	`experience_earned`	int4	NOT NULL	DEFAULT 0,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `random_events`;

CREATE TABLE `random_events` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`event_id`	text	NOT NULL,
	`event_type`	text	NOT NULL	COMMENT '이벤트 유형: daily, family, special, seasonal',
	`triggered_at`	timestamp	NOT NULL	DEFAULT now(),
	`triggered_date`	date	NOT NULL	DEFAULT CURRENT_DATE,
	`completed`	bool	NOT NULL	DEFAULT false,
	`completed_at`	timestamp	NULL,
	`reward_points`	int4	NOT NULL	DEFAULT 0	COMMENT '완료 시 획득 포인트'
);

DROP TABLE IF EXISTS `family_intimacy`;

CREATE TABLE `family_intimacy` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NOT NULL,
	`intimacy_score`	int4	NOT NULL	DEFAULT 0	COMMENT '친밀도 점수 (0-100)',
	`last_interaction_at`	timestamp	NULL	COMMENT '마지막 상호작용 시간',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `family_challenges`;

CREATE TABLE `family_challenges` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`challenge_id`	text	NOT NULL,
	`challenge_type`	text	NOT NULL	COMMENT '챌린지 유형: weekly, monthly, special',
	`start_date`	date	NOT NULL,
	`end_date`	date	NOT NULL,
	`progress`	int4	NOT NULL	DEFAULT 0,
	`target`	int4	NOT NULL,
	`completed`	bool	NOT NULL	DEFAULT false,
	`reward_points`	int4	NOT NULL	DEFAULT 0	COMMENT '완료 시 획득 포인트',
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `minigame_records`;

CREATE TABLE `minigame_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`game_type`	text	NOT NULL	COMMENT '게임 유형',
	`score`	int4	NOT NULL,
	`completed`	bool	NOT NULL	DEFAULT false,
	`reward_points`	int4	NOT NULL	DEFAULT 0	COMMENT '게임 완료 시 획득 포인트',
	`played_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `quiz_records`;

CREATE TABLE `quiz_records` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`quiz_id`	text	NOT NULL	COMMENT '퀴즈 식별자',
	`correct`	bool	NOT NULL,
	`reward_points`	int4	NOT NULL	DEFAULT 0	COMMENT '정답 시 획득 포인트',
	`answered_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `fridge_guardian_scores`;

CREATE TABLE `fridge_guardian_scores` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`score`	int4	NOT NULL	DEFAULT 0,
	`stats`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '게임 통계',
	`played_at`	timestamp	NOT NULL	DEFAULT now(),
	`game_type`	text	NOT NULL	DEFAULT 'fridge_guardian'	COMMENT '게임 유형',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `baby_feeding_schedules`;

CREATE TABLE `baby_feeding_schedules` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NOT NULL,
	`feeding_interval_hours`	numeric	NOT NULL	DEFAULT 3.0	COMMENT '분유 먹일 시간 간격',
	`last_feeding_time`	timestamp	NULL,
	`next_feeding_time`	timestamp	NULL	COMMENT '다음 분유 먹일 시간',
	`is_active`	bool	NOT NULL	DEFAULT true,
	`reminder_enabled`	bool	NOT NULL	DEFAULT true,
	`reminder_minutes_before`	int4	NOT NULL	DEFAULT 10,
	`notes`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 13. 가족 그룹 테이블
-- ============================================================================

DROP TABLE IF EXISTS `family_groups`;

CREATE TABLE `family_groups` (
	`id`	uuid	NOT NULL,
	`invite_code`	text	NOT NULL,
	`admin_user_id`	uuid	NOT NULL,
	`name`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `family_group_members`;

CREATE TABLE `family_group_members` (
	`id`	uuid	NOT NULL,
	`family_group_id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`role`	text	NOT NULL	DEFAULT 'member'	COMMENT '멤버 역할: admin, member',
	`joined_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 14. KCDC 및 공지 테이블
-- ============================================================================

DROP TABLE IF EXISTS `kcdc_alerts`;

CREATE TABLE `kcdc_alerts` (
	`id`	uuid	NOT NULL,
	`alert_type`	text	NOT NULL	COMMENT '알림 유형: flu, vaccination, disease_outbreak',
	`title`	text	NOT NULL,
	`content`	text	NOT NULL,
	`severity`	text	NOT NULL	DEFAULT 'info'	COMMENT '심각도: info, warning, critical',
	`flu_stage`	text	NULL	COMMENT '독감 경보 단계',
	`flu_week`	text	NULL,
	`vaccine_name`	text	NULL,
	`target_age_group`	text	NULL	COMMENT '대상 연령대',
	`recommended_date`	date	NULL,
	`source_url`	text	NULL,
	`published_at`	timestamp	NULL,
	`is_active`	bool	NOT NULL	DEFAULT true,
	`priority`	int4	NOT NULL	DEFAULT 0	COMMENT '우선순위',
	`fetched_at`	timestamp	NOT NULL	DEFAULT now(),
	`expires_at`	timestamp	NULL	COMMENT '캐시 만료 시간',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `popup_announcements`;

CREATE TABLE `popup_announcements` (
	`id`	uuid	NOT NULL,
	`title`	text	NOT NULL,
	`body`	text	NOT NULL,
	`active_from`	timestamp	NOT NULL,
	`active_until`	timestamp	NULL,
	`status`	text	NOT NULL	DEFAULT 'draft'	COMMENT '상태: draft, published, archived',
	`priority`	int4	NOT NULL	DEFAULT 0,
	`target_segments`	jsonb	NOT NULL	DEFAULT '[]'::jsonb,
	`metadata`	jsonb	NOT NULL	DEFAULT '{}'::jsonb,
	`image_url`	text	NULL,
	`link_url`	text	NULL,
	`display_type`	text	NOT NULL	DEFAULT 'modal'	COMMENT '표시 유형: modal, checkpoint',
	`created_by`	text	NOT NULL,
	`updated_by`	text	NOT NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `admin_copy_blocks`;

CREATE TABLE `admin_copy_blocks` (
	`id`	uuid	NOT NULL,
	`slug`	text	NOT NULL	COMMENT '콘텐츠 슬롯 식별자',
	`locale`	text	NOT NULL	DEFAULT 'ko',
	`content`	jsonb	NOT NULL	COMMENT '구조화된 콘텐츠 데이터',
	`version`	int4	NOT NULL	DEFAULT 1,
	`updated_by`	text	NOT NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `admin_security_audit`;

CREATE TABLE `admin_security_audit` (
	`id`	uuid	NOT NULL,
	`action`	text	NOT NULL	COMMENT '액션 유형',
	`user_id`	text	NOT NULL,
	`details`	jsonb	NOT NULL	DEFAULT '{}'::jsonb,
	`ip_address`	inet	NULL,
	`user_agent`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 15. 건강 데이터 소스 및 동기화 테이블
-- ============================================================================

DROP TABLE IF EXISTS `health_data_sources`;

CREATE TABLE `health_data_sources` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`source_type`	text	NOT NULL	COMMENT '데이터 소스 유형',
	`source_name`	text	NOT NULL,
	`connection_status`	text	NOT NULL	DEFAULT 'pending'	COMMENT '연결 상태',
	`connected_at`	timestamp	NULL,
	`last_synced_at`	timestamp	NULL,
	`sync_frequency`	text	NOT NULL	DEFAULT 'daily'	COMMENT '동기화 빈도',
	`connection_metadata`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '연결 메타데이터',
	`error_message`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `health_data_sync_logs`;

CREATE TABLE `health_data_sync_logs` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`data_source_id`	uuid	NULL,
	`sync_type`	text	NOT NULL	COMMENT '동기화 유형: full, incremental, manual',
	`sync_status`	text	NOT NULL	COMMENT '동기화 상태: success, failed, partial',
	`records_synced`	int4	NOT NULL	DEFAULT 0,
	`hospital_records_count`	int4	NOT NULL	DEFAULT 0,
	`medication_records_count`	int4	NOT NULL	DEFAULT 0,
	`disease_records_count`	int4	NOT NULL	DEFAULT 0,
	`checkup_records_count`	int4	NOT NULL	DEFAULT 0,
	`error_message`	text	NULL,
	`error_details`	jsonb	NOT NULL	DEFAULT '{}'::jsonb,
	`sync_duration_ms`	int4	NULL,
	`synced_at`	timestamp	NOT NULL	DEFAULT now(),
	`created_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `health_dashboard_cache`;

CREATE TABLE `health_dashboard_cache` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`cache_key`	text	NOT NULL	COMMENT '캐시 키',
	`cache_data`	jsonb	NOT NULL	COMMENT '캐시 데이터',
	`expires_at`	timestamp	NOT NULL	COMMENT '캐시 만료 시간',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 16. 추가 테이블들
-- ============================================================================

DROP TABLE IF EXISTS `user_vaccination_schedules`;

CREATE TABLE `user_vaccination_schedules` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NOT NULL,
	`vaccine_name`	text	NOT NULL,
	`recommended_date`	date	NOT NULL,
	`priority`	text	NOT NULL	COMMENT '우선순위: required, recommended, optional',
	`status`	text	NOT NULL	DEFAULT 'pending'	COMMENT '상태: pending, completed, skipped',
	`source`	text	NOT NULL	DEFAULT 'kcdc'	COMMENT '출처',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now(),
	`notification_sent_at`	timestamp	NULL	COMMENT '마지막 알림 발송 시간',
	`notification_channel`	text	NOT NULL	DEFAULT 'push'	COMMENT '알림 채널',
	`reminder_count`	int4	NOT NULL	DEFAULT 0	COMMENT '리마인더 발송 횟수'
);

DROP TABLE IF EXISTS `user_periodic_health_services`;

CREATE TABLE `user_periodic_health_services` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`service_type`	text	NOT NULL	COMMENT '서비스 유형',
	`service_name`	text	NOT NULL,
	`cycle_type`	text	NOT NULL	COMMENT '주기 유형',
	`cycle_days`	int4	NULL	COMMENT '주기 일수',
	`last_service_date`	date	NULL,
	`next_service_date`	date	NULL,
	`reminder_days_before`	int4	NOT NULL	DEFAULT 7,
	`reminder_enabled`	bool	NOT NULL	DEFAULT true,
	`notes`	text	NULL,
	`is_active`	bool	NOT NULL	DEFAULT true,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_health_checkup_recommendations`;

CREATE TABLE `user_health_checkup_recommendations` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NOT NULL,
	`checkup_type`	text	NOT NULL,
	`checkup_name`	text	NOT NULL,
	`recommended_date`	date	NOT NULL,
	`priority`	text	NOT NULL	COMMENT '우선순위: high, medium, low',
	`overdue`	bool	NOT NULL	DEFAULT false	COMMENT '연체 여부',
	`last_checkup_date`	date	NULL,
	`age_requirement`	text	NULL,
	`gender_requirement`	text	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_infection_risk_scores`;

CREATE TABLE `user_infection_risk_scores` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`risk_score`	int4	NOT NULL	COMMENT '위험 지수 (0-100)',
	`risk_level`	text	NOT NULL	COMMENT '위험 등급: low, moderate, high, critical',
	`flu_stage`	text	NULL,
	`flu_week`	text	NULL,
	`region`	text	NULL,
	`factors`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '위험 요인 상세',
	`recommendations`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '구체적 행동 지침 배열',
	`calculated_at`	timestamp	NOT NULL	DEFAULT now(),
	`expires_at`	timestamp	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_travel_risk_assessments`;

CREATE TABLE `user_travel_risk_assessments` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`destination_country`	text	NOT NULL,
	`destination_region`	text	NULL,
	`travel_start_date`	date	NOT NULL,
	`travel_end_date`	date	NOT NULL,
	`risk_level`	text	NOT NULL	COMMENT '위험 등급',
	`disease_alerts`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '해당 지역 감염병 경보 정보',
	`prevention_checklist`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '예방 물품/행동 체크리스트',
	`vaccination_requirements`	jsonb	NOT NULL	DEFAULT '[]'::jsonb	COMMENT '필수/권장 백신 목록',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `lifecycle_vaccination_schedules`;

CREATE TABLE `lifecycle_vaccination_schedules` (
	`id`	uuid	NOT NULL,
	`vaccine_name`	text	NOT NULL,
	`vaccine_code`	text	NULL,
	`target_age_min_months`	int4	NULL	COMMENT '대상 연령 최소 (개월)',
	`target_age_max_months`	int4	NULL	COMMENT '대상 연령 최대 (개월)',
	`priority`	text	NOT NULL	COMMENT '우선순위',
	`dose_number`	int4	NOT NULL,
	`total_doses`	int4	NOT NULL,
	`interval_days`	int4	NULL	COMMENT '접종 간격 (일)',
	`gender_requirement`	text	NULL	COMMENT '성별 요구사항',
	`description`	text	NULL,
	`source`	text	NOT NULL	DEFAULT 'kcdc',
	`is_active`	bool	NOT NULL	DEFAULT true,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `lifecycle_notification_reminder_settings`;

CREATE TABLE `lifecycle_notification_reminder_settings` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`family_member_id`	uuid	NULL,
	`reminder_enabled`	bool	NOT NULL	DEFAULT true,
	`reminder_days_before`	int4[]	NOT NULL	DEFAULT ARRAY[0, 1, 7]	COMMENT '리마인더 일수 배열',
	`notification_channels`	text[]	NOT NULL	DEFAULT ARRAY['in_app', 'push']	COMMENT '알림 채널 배열',
	`quiet_hours_enabled`	bool	NOT NULL	DEFAULT true,
	`quiet_hours_start`	time	NOT NULL	DEFAULT '22:00:00'	COMMENT '조용한 시간대 시작 시간',
	`quiet_hours_end`	time	NOT NULL	DEFAULT '08:00:00'	COMMENT '조용한 시간대 종료 시간',
	`per_notification_settings`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '알림별 개별 설정',
	`timezone`	text	NOT NULL	DEFAULT 'Asia/Seoul',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `lifecycle_notification_shares`;

CREATE TABLE `lifecycle_notification_shares` (
	`id`	uuid	NOT NULL,
	`notification_id`	uuid	NOT NULL,
	`shared_by_user_id`	uuid	NOT NULL,
	`shared_with_user_id`	uuid	NOT NULL,
	`shared_with_family_member_id`	uuid	NULL,
	`share_completion_status`	bool	NOT NULL	DEFAULT true	COMMENT '완료 상태 공유 여부',
	`share_reminders`	bool	NOT NULL	DEFAULT false	COMMENT '리마인더 공유 여부',
	`status`	text	NOT NULL	DEFAULT 'active'	COMMENT '상태: active, revoked',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `identity_verifications`;

CREATE TABLE `identity_verifications` (
	`id`	uuid	NOT NULL,
	`clerk_user_id`	text	NOT NULL,
	`name`	text	NOT NULL,
	`national_id_hash`	text	NOT NULL,
	`consent`	bool	NOT NULL,
	`status`	text	NOT NULL	DEFAULT 'pending',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`verified_at`	timestamp	NULL,
	`family_member_id`	uuid	NULL	COMMENT '가족 구성원 ID'
);

DROP TABLE IF EXISTS `consent_records`;

CREATE TABLE `consent_records` (
	`id`	uuid	NOT NULL,
	`clerk_user_id`	text	NOT NULL,
	`consent_type`	text	NOT NULL	COMMENT '동의 유형',
	`consent_content`	text	NOT NULL	COMMENT '동의한 내용',
	`consent_status`	text	NOT NULL	DEFAULT 'granted'	COMMENT '동의 상태',
	`consent_time`	timestamp	NOT NULL	DEFAULT now(),
	`ip_address`	inet	NULL	COMMENT '동의 시 IP 주소',
	`user_agent`	text	NULL	COMMENT '브라우저/기기 정보',
	`device_type`	text	NULL	COMMENT '기기 유형',
	`location_country`	text	NULL	COMMENT '동의 시 국가',
	`location_region`	text	NULL	COMMENT '동의 시 지역/주',
	`location_city`	text	NULL	COMMENT '동의 시 도시',
	`verification_id`	uuid	NULL,
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `medication_interactions`;

CREATE TABLE `medication_interactions` (
	`id`	uuid	NOT NULL,
	`medication_a`	text	NOT NULL	COMMENT '첫 번째 약물명',
	`medication_b`	text	NOT NULL	COMMENT '두 번째 약물명',
	`interaction_level`	text	NOT NULL	COMMENT '상호작용 위험도',
	`description`	text	NULL	COMMENT '상호작용 설명',
	`recommendation`	text	NULL	COMMENT '권장사항',
	`source`	text	NOT NULL	DEFAULT 'manual'	COMMENT '데이터 출처',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

DROP TABLE IF EXISTS `user_push_tokens`;

CREATE TABLE `user_push_tokens` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL	COMMENT '사용자 ID',
	`token`	text	NOT NULL	COMMENT '푸시 알림 토큰',
	`device_type`	text	NOT NULL	COMMENT '디바이스 유형: ios, android, web',
	`device_id`	text	NULL	COMMENT '디바이스 고유 ID',
	`app_version`	text	NULL	COMMENT '앱 버전',
	`active`	bool	NOT NULL	DEFAULT true	COMMENT '토큰 활성화 여부',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now(),
	`last_used_at`	timestamp	NULL	COMMENT '마지막 사용 시간'
);

DROP TABLE IF EXISTS `user_api_keys`;

CREATE TABLE `user_api_keys` (
	`id`	uuid	NOT NULL,
	`user_id`	uuid	NOT NULL,
	`api_type`	text	NOT NULL	COMMENT 'API 종류',
	`api_key`	text	NOT NULL	COMMENT 'API 키 값',
	`metadata`	jsonb	NOT NULL	DEFAULT '{}'::jsonb	COMMENT '추가 정보',
	`status`	text	NOT NULL	DEFAULT 'active'	COMMENT '키 상태',
	`last_used_at`	timestamp	NULL	COMMENT '마지막 사용 시간',
	`created_at`	timestamp	NOT NULL	DEFAULT now(),
	`updated_at`	timestamp	NOT NULL	DEFAULT now()
);

-- ============================================================================
-- 추가 PRIMARY KEY 제약조건 (캐릭터 게임 및 기타)
-- ============================================================================

ALTER TABLE `character_skins` ADD CONSTRAINT `PK_CHARACTER_SKINS` PRIMARY KEY (
	`id`
);

ALTER TABLE `character_positions` ADD CONSTRAINT `PK_CHARACTER_POSITIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `character_game_events` ADD CONSTRAINT `PK_CHARACTER_GAME_EVENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `character_game_interactions` ADD CONSTRAINT `PK_CHARACTER_GAME_INTERACTIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `random_events` ADD CONSTRAINT `PK_RANDOM_EVENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `family_intimacy` ADD CONSTRAINT `PK_FAMILY_INTIMACY` PRIMARY KEY (
	`id`
);

ALTER TABLE `family_challenges` ADD CONSTRAINT `PK_FAMILY_CHALLENGES` PRIMARY KEY (
	`id`
);

ALTER TABLE `minigame_records` ADD CONSTRAINT `PK_MINIGAME_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `quiz_records` ADD CONSTRAINT `PK_QUIZ_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `fridge_guardian_scores` ADD CONSTRAINT `PK_FRIDGE_GUARDIAN_SCORES` PRIMARY KEY (
	`id`
);

ALTER TABLE `baby_feeding_schedules` ADD CONSTRAINT `PK_BABY_FEEDING_SCHEDULES` PRIMARY KEY (
	`id`
);

ALTER TABLE `family_groups` ADD CONSTRAINT `PK_FAMILY_GROUPS` PRIMARY KEY (
	`id`
);

ALTER TABLE `family_group_members` ADD CONSTRAINT `PK_FAMILY_GROUP_MEMBERS` PRIMARY KEY (
	`id`
);

ALTER TABLE `kcdc_alerts` ADD CONSTRAINT `PK_KCDC_ALERTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `popup_announcements` ADD CONSTRAINT `PK_POPUP_ANNOUNCEMENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `admin_copy_blocks` ADD CONSTRAINT `PK_ADMIN_COPY_BLOCKS` PRIMARY KEY (
	`id`
);

ALTER TABLE `admin_security_audit` ADD CONSTRAINT `PK_ADMIN_SECURITY_AUDIT` PRIMARY KEY (
	`id`
);

ALTER TABLE `health_data_sources` ADD CONSTRAINT `PK_HEALTH_DATA_SOURCES` PRIMARY KEY (
	`id`
);

ALTER TABLE `health_data_sync_logs` ADD CONSTRAINT `PK_HEALTH_DATA_SYNC_LOGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `health_dashboard_cache` ADD CONSTRAINT `PK_HEALTH_DASHBOARD_CACHE` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_vaccination_schedules` ADD CONSTRAINT `PK_USER_VACCINATION_SCHEDULES` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_periodic_health_services` ADD CONSTRAINT `PK_USER_PERIODIC_HEALTH_SERVICES` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_health_checkup_recommendations` ADD CONSTRAINT `PK_USER_HEALTH_CHECKUP_RECOMMENDATIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_infection_risk_scores` ADD CONSTRAINT `PK_USER_INFECTION_RISK_SCORES` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_travel_risk_assessments` ADD CONSTRAINT `PK_USER_TRAVEL_RISK_ASSESSMENTS` PRIMARY KEY (
	`id`
);

ALTER TABLE `lifecycle_vaccination_schedules` ADD CONSTRAINT `PK_LIFECYCLE_VACCINATION_SCHEDULES` PRIMARY KEY (
	`id`
);

ALTER TABLE `lifecycle_notification_reminder_settings` ADD CONSTRAINT `PK_LIFECYCLE_NOTIFICATION_REMINDER_SETTINGS` PRIMARY KEY (
	`id`
);

ALTER TABLE `lifecycle_notification_shares` ADD CONSTRAINT `PK_LIFECYCLE_NOTIFICATION_SHARES` PRIMARY KEY (
	`id`
);

ALTER TABLE `identity_verifications` ADD CONSTRAINT `PK_IDENTITY_VERIFICATIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `consent_records` ADD CONSTRAINT `PK_CONSENT_RECORDS` PRIMARY KEY (
	`id`
);

ALTER TABLE `medication_interactions` ADD CONSTRAINT `PK_MEDICATION_INTERACTIONS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_push_tokens` ADD CONSTRAINT `PK_USER_PUSH_TOKENS` PRIMARY KEY (
	`id`
);

ALTER TABLE `user_api_keys` ADD CONSTRAINT `PK_USER_API_KEYS` PRIMARY KEY (
	`id`
);

-- ============================================================================
-- 추가 FOREIGN KEY 제약조건 (캐릭터 게임 및 기타)
-- ============================================================================

ALTER TABLE `character_skins` ADD CONSTRAINT `FK_users_TO_character_skins_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_skins` ADD CONSTRAINT `FK_family_members_TO_character_skins_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `character_positions` ADD CONSTRAINT `FK_users_TO_character_positions_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_positions` ADD CONSTRAINT `FK_family_members_TO_character_positions_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `character_game_events` ADD CONSTRAINT `FK_users_TO_character_game_events_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_game_events` ADD CONSTRAINT `FK_family_members_TO_character_game_events_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `character_game_interactions` ADD CONSTRAINT `FK_users_TO_character_game_interactions_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `character_game_interactions` ADD CONSTRAINT `FK_family_members_TO_character_game_interactions_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `character_game_interactions` ADD CONSTRAINT `FK_character_game_events_TO_character_game_interactions_1` FOREIGN KEY (
	`event_id`
)
REFERENCES `character_game_events` (
	`id`
);

ALTER TABLE `random_events` ADD CONSTRAINT `FK_users_TO_random_events_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `family_intimacy` ADD CONSTRAINT `FK_users_TO_family_intimacy_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `family_intimacy` ADD CONSTRAINT `FK_family_members_TO_family_intimacy_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `family_challenges` ADD CONSTRAINT `FK_users_TO_family_challenges_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `minigame_records` ADD CONSTRAINT `FK_users_TO_minigame_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `minigame_records` ADD CONSTRAINT `FK_family_members_TO_minigame_records_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `quiz_records` ADD CONSTRAINT `FK_users_TO_quiz_records_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `fridge_guardian_scores` ADD CONSTRAINT `FK_users_TO_fridge_guardian_scores_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `baby_feeding_schedules` ADD CONSTRAINT `FK_users_TO_baby_feeding_schedules_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `baby_feeding_schedules` ADD CONSTRAINT `FK_family_members_TO_baby_feeding_schedules_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `family_groups` ADD CONSTRAINT `FK_users_TO_family_groups_1` FOREIGN KEY (
	`admin_user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `family_group_members` ADD CONSTRAINT `FK_family_groups_TO_family_group_members_1` FOREIGN KEY (
	`family_group_id`
)
REFERENCES `family_groups` (
	`id`
);

ALTER TABLE `family_group_members` ADD CONSTRAINT `FK_users_TO_family_group_members_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_vaccination_schedules` ADD CONSTRAINT `FK_users_TO_user_vaccination_schedules_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_vaccination_schedules` ADD CONSTRAINT `FK_family_members_TO_user_vaccination_schedules_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_periodic_health_services` ADD CONSTRAINT `FK_users_TO_user_periodic_health_services_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_periodic_health_services` ADD CONSTRAINT `FK_family_members_TO_user_periodic_health_services_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_health_checkup_recommendations` ADD CONSTRAINT `FK_users_TO_user_health_checkup_recommendations_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_health_checkup_recommendations` ADD CONSTRAINT `FK_family_members_TO_user_health_checkup_recommendations_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_infection_risk_scores` ADD CONSTRAINT `FK_users_TO_user_infection_risk_scores_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_infection_risk_scores` ADD CONSTRAINT `FK_family_members_TO_user_infection_risk_scores_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `user_travel_risk_assessments` ADD CONSTRAINT `FK_users_TO_user_travel_risk_assessments_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `lifecycle_notification_reminder_settings` ADD CONSTRAINT `FK_users_TO_lifecycle_notification_reminder_settings_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `lifecycle_notification_reminder_settings` ADD CONSTRAINT `FK_family_members_TO_lifecycle_notification_reminder_settings_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `lifecycle_notification_shares` ADD CONSTRAINT `FK_notifications_TO_lifecycle_notification_shares_1` FOREIGN KEY (
	`notification_id`
)
REFERENCES `notifications` (
	`id`
);

ALTER TABLE `lifecycle_notification_shares` ADD CONSTRAINT `FK_users_TO_lifecycle_notification_shares_1` FOREIGN KEY (
	`shared_by_user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `lifecycle_notification_shares` ADD CONSTRAINT `FK_users_TO_lifecycle_notification_shares_2` FOREIGN KEY (
	`shared_with_user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `lifecycle_notification_shares` ADD CONSTRAINT `FK_family_members_TO_lifecycle_notification_shares_1` FOREIGN KEY (
	`shared_with_family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `identity_verifications` ADD CONSTRAINT `FK_users_TO_identity_verifications_1` FOREIGN KEY (
	`clerk_user_id`
)
REFERENCES `users` (
	`clerk_id`
);

ALTER TABLE `identity_verifications` ADD CONSTRAINT `FK_family_members_TO_identity_verifications_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `consent_records` ADD CONSTRAINT `FK_users_TO_consent_records_1` FOREIGN KEY (
	`clerk_user_id`
)
REFERENCES `users` (
	`clerk_id`
);

ALTER TABLE `consent_records` ADD CONSTRAINT `FK_identity_verifications_TO_consent_records_1` FOREIGN KEY (
	`verification_id`
)
REFERENCES `identity_verifications` (
	`id`
);

ALTER TABLE `health_data_sources` ADD CONSTRAINT `FK_users_TO_health_data_sources_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `health_data_sync_logs` ADD CONSTRAINT `FK_users_TO_health_data_sync_logs_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `health_data_sync_logs` ADD CONSTRAINT `FK_health_data_sources_TO_health_data_sync_logs_1` FOREIGN KEY (
	`data_source_id`
)
REFERENCES `health_data_sources` (
	`id`
);

ALTER TABLE `health_dashboard_cache` ADD CONSTRAINT `FK_users_TO_health_dashboard_cache_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `health_dashboard_cache` ADD CONSTRAINT `FK_family_members_TO_health_dashboard_cache_1` FOREIGN KEY (
	`family_member_id`
)
REFERENCES `family_members` (
	`id`
);

ALTER TABLE `hospital_records` ADD CONSTRAINT `FK_health_data_sources_TO_hospital_records_1` FOREIGN KEY (
	`data_source_id`
)
REFERENCES `health_data_sources` (
	`id`
);

ALTER TABLE `medication_records` ADD CONSTRAINT `FK_hospital_records_TO_medication_records_1` FOREIGN KEY (
	`hospital_record_id`
)
REFERENCES `hospital_records` (
	`id`
);

ALTER TABLE `medication_records` ADD CONSTRAINT `FK_health_data_sources_TO_medication_records_1` FOREIGN KEY (
	`data_source_id`
)
REFERENCES `health_data_sources` (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `FK_hospital_records_TO_disease_records_1` FOREIGN KEY (
	`hospital_record_id`
)
REFERENCES `hospital_records` (
	`id`
);

ALTER TABLE `disease_records` ADD CONSTRAINT `FK_health_data_sources_TO_disease_records_1` FOREIGN KEY (
	`data_source_id`
)
REFERENCES `health_data_sources` (
	`id`
);

ALTER TABLE `user_push_tokens` ADD CONSTRAINT `FK_users_TO_user_push_tokens_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);

ALTER TABLE `user_api_keys` ADD CONSTRAINT `FK_users_TO_user_api_keys_1` FOREIGN KEY (
	`user_id`
)
REFERENCES `users` (
	`id`
);



