-- ============================================================================
-- 샘플 데이터 v1.0
-- 작성일: 2025-12-02
-- 설명: 개발 및 테스트용 샘플 데이터
-- 주의: 개발 환경이므로 기존 데이터를 삭제하고 새로 삽입합니다
-- ============================================================================

-- ============================================================================
-- 0. 기존 샘플 데이터 정리 (개발 환경 전용)
-- ============================================================================

-- 기존 샘플 데이터 삭제
DELETE FROM legacy_videos WHERE id IN ('00000000-0000-0000-0000-000000000aaa', '00000000-0000-0000-0000-000000000bbb');
DELETE FROM legacy_masters WHERE id IN ('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000222');
DELETE FROM popup_announcements WHERE title IN ('🎉 서비스 오픈 기념 이벤트', '📢 신규 레시피 업데이트');
DELETE FROM admin_copy_blocks WHERE slug IN ('hero-title', 'hero-description', 'footer-company-menu');
DELETE FROM kcdc_alerts WHERE title IN ('2025년 겨울 독감 주의보 발령', '영유아 필수 예방접종 안내');
DELETE FROM promo_codes WHERE code IN ('LAUNCH2025', 'TEST50', 'WELCOME20');
DELETE FROM recipe_steps WHERE recipe_id IN (SELECT id FROM recipes WHERE slug IN ('doenjang-soup', 'spinach-namul'));
DELETE FROM recipe_ingredients WHERE recipe_id IN (SELECT id FROM recipes WHERE slug IN ('doenjang-soup', 'spinach-namul', 'kimchi-stew'));
DELETE FROM recipes WHERE slug IN ('white-rice', 'brown-rice', 'mixed-grain-rice', 'spinach-namul', 'bean-sprout-namul', 'tofu-stew', 'egg-custard', 'doenjang-soup', 'kimchi-stew', 'soft-tofu-stew');
DELETE FROM calorie_calculation_formulas WHERE formula_name LIKE 'harris_benedict_%' OR formula_name LIKE 'mifflin_st_jeor_%';
DELETE FROM disease_excluded_foods_extended WHERE disease_code IN ('diabetes_type2', 'hypertension');
DELETE FROM allergies WHERE code IN ('peanuts', 'milk', 'eggs', 'fish', 'shellfish', 'soy', 'wheat', 'nuts');
DELETE FROM diseases WHERE code IN ('diabetes_type2', 'hypertension', 'hyperlipidemia', 'gout', 'kidney_disease', 'obesity');

-- ============================================================================
-- 1. 질병 및 알레르기 마스터 데이터
-- ============================================================================

-- 질병 데이터 (총 11개)
INSERT INTO diseases (code, name_ko, name_en, category, description, calorie_adjustment_factor) VALUES
('diabetes_type2', '제2형 당뇨병', 'Type 2 Diabetes', 'metabolic', '인슐린 저항성으로 인한 고혈당 상태', 0.85),
('hypertension', '고혈압', 'Hypertension', 'cardiovascular', '지속적인 고혈압 상태', 1.00),
('hyperlipidemia', '고지혈증', 'Hyperlipidemia', 'cardiovascular', '혈중 콜레스테롤 및 중성지방 수치 이상', 0.90),
('gout', '통풍', 'Gout', 'metabolic', '요산 결정으로 인한 관절염', 0.95),
('kidney_disease', '만성 신장병', 'Chronic Kidney Disease', 'kidney', '신장 기능 저하로 인한 대사 이상', 0.80),
('obesity', '비만', 'Obesity', 'metabolic', '과도한 체지방 축적으로 인한 건강 문제', 0.75),
('cardiovascular', '심혈관 질환', 'Cardiovascular Disease', 'cardiovascular', '심장 및 혈관 관련 질환', 0.9),
('gastrointestinal', '위장 질환', 'Gastrointestinal Disease', 'digestive', '소화기계 관련 질환', 1.0),
('pregnancy', '임신', 'Pregnancy', 'reproductive', '임신 및 출산 관련 건강 관리', 1.1),
('liver', '간 질환', 'Liver Disease', 'liver', '간 기능 관련 질환', 0.9),
('thyroid', '갑상선 질환', 'Thyroid Disease', 'endocrine', '갑상선 호르몬 관련 질환', 1.0)
ON CONFLICT (code) DO NOTHING;

-- 알레르기 데이터
INSERT INTO allergies (code, name_ko, name_en, category, severity_level, description) VALUES
('peanuts', '땅콩', 'Peanuts', 'major_8', 'critical', '가장 흔한 식품 알레르기 중 하나'),
('milk', '우유', 'Milk', 'major_8', 'high', '유당 불내증을 포함한 우유 단백질 알레르기'),
('eggs', '달걀', 'Eggs', 'major_8', 'high', '달걀 흰자 또는 노른자 알레르기'),
('fish', '생선', 'Fish', 'major_8', 'high', '물고기 알레르기 (연어, 참치 등)'),
('shellfish', '갑각류', 'Shellfish', 'major_8', 'critical', '새우, 게, 조개류 알레르기'),
('soy', '대두', 'Soy', 'major_8', 'high', '콩 및 콩 제품 알레르기'),
('wheat', '밀', 'Wheat', 'major_8', 'high', '밀가루 및 밀 제품 알레르기'),
('nuts', '견과류', 'Tree Nuts', 'major_8', 'critical', '아몬드, 호두, 잣 등 견과류 알레르기')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 2.5. 응급조치 정보 데이터
-- ============================================================================

-- 땅콩 알레르기 아나필락시스 대처법
INSERT INTO emergency_procedures (allergy_code, procedure_type, title_ko, title_en, steps, warning_signs, when_to_call_911) VALUES
('peanuts', 'anaphylaxis', '땅콩 알레르기 아나필락시스 대처법', 'Peanut Allergy Anaphylaxis Response',
 '["에피네프린 자가주사기를 사용합니다", "119에 즉시 전화합니다", "냉찬한 자세로 눕힙니다"]',
 '["호흡곤란", "심한 가려움증", "부종", "어지러움"]',
 '증상이 나타난 즉시, 특히 호흡곤란이 있거나 의식을 잃을 경우');

-- ============================================================================
-- 2.6. 알레르기 파생 재료 데이터
-- ============================================================================

-- 새우 알레르기 파생 재료
INSERT INTO allergy_derived_ingredients (allergy_code, ingredient_name, ingredient_type, description) VALUES
('shellfish', '새우젓', 'condiment', '새우를 발효시켜 만든 전통 장'),
('shellfish', '해물육수', 'broth', '새우, 게, 멸치 등 해산물로 만든 육수'),
('shellfish', '김치', 'vegetable', '새우젓을 넣어 숙성시키는 경우 (선택적)');

-- ============================================================================
-- 3. 제외 음식 데이터
-- ============================================================================

-- 당뇨병 제외 음식
INSERT INTO disease_excluded_foods_extended (disease_code, food_name, food_type, severity, reason) VALUES
('diabetes_type2', '설탕', 'ingredient', 'high', '혈당 급상승의 주요 원인'),
('diabetes_type2', '꿀', 'ingredient', 'high', '고당류 식품'),
('diabetes_type2', '탄산음료', 'ingredient', 'high', '액상 당분'),
('diabetes_type2', '케이크', 'recipe_keyword', 'high', '고당류 베이킹 제품'),
('diabetes_type2', '아이스크림', 'recipe_keyword', 'high', '고당류 및 지방'),
('diabetes_type2', '흰쌀밥', 'recipe_keyword', 'moderate', '정제 탄수화물');

-- 고혈압 제외 음식
INSERT INTO disease_excluded_foods_extended (disease_code, food_name, food_type, severity, reason) VALUES
('hypertension', '소금', 'ingredient', 'high', '나트륨 과다 섭취'),
('hypertension', '간장', 'ingredient', 'high', '고나트륨 조미료'),
('hypertension', '햄', 'ingredient', 'high', '가공육, 고나트륨'),
('hypertension', '김치', 'ingredient', 'moderate', '염장 식품'),
('hypertension', '라면', 'recipe_keyword', 'high', '고나트륨 즉석식품');

-- ============================================================================
-- 3. 칼로리 계산 공식
-- ============================================================================

INSERT INTO calorie_calculation_formulas (
  formula_name, formula_type, gender, age_min, age_max,
  formula_expression, description, is_default
) VALUES
('harris_benedict_male', 'bmr', 'male', 18, 99,
 '88.362 + (13.397 × weight_kg) + (4.799 × height_cm) - (5.677 × age)',
 'Harris-Benedict 공식 (남성)', true),
('harris_benedict_female', 'bmr', 'female', 18, 99,
 '447.593 + (9.247 × weight_kg) + (3.098 × height_cm) - (4.330 × age)',
 'Harris-Benedict 공식 (여성)', true),
('mifflin_st_jeor_male', 'bmr', 'male', 18, 99,
 '(10 × weight_kg) + (6.25 × height_cm) - (5 × age) + 5',
 'Mifflin-St Jeor 공식 (남성)', false),
('mifflin_st_jeor_female', 'bmr', 'female', 18, 99,
 '(10 × weight_kg) + (6.25 × height_cm) - (5 × age) - 161',
 'Mifflin-St Jeor 공식 (여성)', false)
ON CONFLICT (formula_name) DO NOTHING;

-- ============================================================================
-- 4. 샘플 레시피 데이터
-- ============================================================================

-- 밥류
INSERT INTO recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'white-rice', '흰쌀밥', '기본 흰쌀밥 한 공기', 1, 25, 1, 310, 68.0, 5.5, 0.5, 2),
('550e8400-e29b-41d4-a716-446655440002', 'brown-rice', '현미밥', '건강한 현미밥 한 공기', 1, 40, 1, 330, 72.0, 6.8, 2.3, 2),
('550e8400-e29b-41d4-a716-446655440003', 'mixed-grain-rice', '잡곡밥', '영양 가득한 잡곡밥 한 공기', 2, 35, 1, 320, 69.0, 7.2, 1.8, 5)
ON CONFLICT (id) DO NOTHING;

-- 반찬류
INSERT INTO recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'spinach-namul', '시금치나물', '건강한 시금치 무침', 2, 10, 1, 45, 4.0, 2.5, 2.5, 15),
('550e8400-e29b-41d4-a716-446655440005', 'bean-sprout-namul', '콩나물무침', '아삭한 콩나물 무침', 1, 8, 1, 40, 5.0, 4.0, 1.5, 10),
('550e8400-e29b-41d4-a716-446655440006', 'tofu-stew', '두부조림', '고소한 두부조림', 2, 15, 1, 100, 4.0, 8.0, 5.0, 400),
('550e8400-e29b-41d4-a716-446655440007', 'egg-custard', '계란찜', '부드러운 계란찜', 1, 15, 1, 110, 1.5, 9.0, 7.5, 150)
ON CONFLICT (id) DO NOTHING;

-- 국/찌개류
INSERT INTO recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440008', 'doenjang-soup', '된장국', '구수한 된장국', 2, 15, 1, 60, 6.0, 4.0, 2.0, 650),
('550e8400-e29b-41d4-a716-446655440009', 'kimchi-stew', '김치찌개', '얼큰한 김치찌개', 3, 30, 1, 150, 8.0, 12.0, 8.0, 900),
('550e8400-e29b-41d4-a716-446655440010', 'soft-tofu-stew', '순두부찌개', '부드러운 순두부찌개', 2, 15, 1, 120, 6.0, 10.0, 6.0, 550)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 5. 샘플 레시피 재료 데이터
-- ============================================================================

-- 된장국 재료
INSERT INTO recipe_ingredients (recipe_id, name, ingredient_name, quantity, unit, category, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440008', '된장', '된장', 1, '큰술', '조미료'::ingredient_category, 1),
('550e8400-e29b-41d4-a716-446655440008', '애호박', '애호박', 0.5, '개', '채소'::ingredient_category, 2),
('550e8400-e29b-41d4-a716-446655440008', '두부', '두부', 0.25, '모', '유제품'::ingredient_category, 3),
('550e8400-e29b-41d4-a716-446655440008', '대파', '대파', 1, '대', '채소'::ingredient_category, 4),
('550e8400-e29b-41d4-a716-446655440008', '멸치육수', '멸치육수', 500, 'ml', '기타'::ingredient_category, 5);

-- 시금치나물 재료
INSERT INTO recipe_ingredients (recipe_id, name, ingredient_name, quantity, unit, category, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440004', '시금치', '시금치', 200, 'g', '채소'::ingredient_category, 1),
('550e8400-e29b-41d4-a716-446655440004', '참기름', '참기름', 1, '큰술', '조미료'::ingredient_category, 2),
('550e8400-e29b-41d4-a716-446655440004', '마늘', '마늘', 1, '쪽', '조미료'::ingredient_category, 3),
('550e8400-e29b-41d4-a716-446655440004', '깨소금', '깨소금', 1, '작은술', '조미료'::ingredient_category, 4);

-- 김치찌개 재료
INSERT INTO recipe_ingredients (recipe_id, name, ingredient_name, quantity, unit, category, display_order) VALUES
('550e8400-e29b-41d4-a716-446655440009', '배추김치', '배추김치', 300, 'g', '채소'::ingredient_category, 1),
('550e8400-e29b-41d4-a716-446655440009', '돼지고기', '돼지고기', 200, 'g', '육류'::ingredient_category, 2),
('550e8400-e29b-41d4-a716-446655440009', '두부', '두부', 1, '모', '유제품'::ingredient_category, 3),
('550e8400-e29b-41d4-a716-446655440009', '대파', '대파', 1, '대', '채소'::ingredient_category, 4),
('550e8400-e29b-41d4-a716-446655440009', '고춧가루', '고춧가루', 1, '큰술', '조미료'::ingredient_category, 5);

-- ============================================================================
-- 6. 샘플 레시피 단계 데이터
-- ============================================================================

-- 된장국 조리 단계
INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
('550e8400-e29b-41d4-a716-446655440008', 1, '냄비에 멸치육수를 넣고 끓입니다.'),
('550e8400-e29b-41d4-a716-446655440008', 2, '애호박과 두부를 먹기 좋은 크기로 썰어 넣습니다.'),
('550e8400-e29b-41d4-a716-446655440008', 3, '된장을 풀어 넣고 끓입니다.'),
('550e8400-e29b-41d4-a716-446655440008', 4, '대파를 썰어 넣고 한 번 더 끓입니다.');

-- 시금치나물 조리 단계
INSERT INTO recipe_steps (recipe_id, step_number, content) VALUES
('550e8400-e29b-41d4-a716-446655440004', 1, '시금치를 깨끗이 씻어 데칩니다.'),
('550e8400-e29b-41d4-a716-446655440004', 2, '찬물에 헹구어 물기를 짜줍니다.'),
('550e8400-e29b-41d4-a716-446655440004', 3, '참기름, 다진 마늘, 깨소금을 넣고 무칩니다.'),
('550e8400-e29b-41d4-a716-446655440004', 4, '접시에 담아냅니다.');

-- ============================================================================
-- 7. 프로모션 코드 샘플 데이터
-- ============================================================================

INSERT INTO promo_codes (code, discount_type, discount_value, valid_from, valid_until, description, new_users_only) VALUES
('LAUNCH2025', 'percentage', 30, now(), now() + interval '90 days', '런칭 기념 30% 할인', true),
('TEST50', 'percentage', 50, now(), now() + interval '365 days', '테스트용 50% 할인', false),
('WELCOME20', 'fixed_amount', 5000, now(), now() + interval '180 days', '신규 가입 환영 5,000원 할인', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- 8. KCDC 샘플 알림 데이터
-- ============================================================================

INSERT INTO kcdc_alerts (
  alert_type, title, content, severity, flu_stage, flu_week,
  source_url, published_at, is_active, priority, expires_at
) VALUES
(
  'flu',
  '2025년 겨울 독감 주의보 발령',
  '전국적으로 독감 환자가 증가하고 있습니다. 손씻기 등 개인 위생 수칙을 준수하시고, 고위험군은 예방접종을 권장합니다.',
  'warning',
  '주의',
  '2025-W48',
  'https://www.kdca.go.kr',
  '2025-11-27 09:00:00+09',
  true,
  10,
  now() + interval '30 days'
),
(
  'vaccination',
  '영유아 필수 예방접종 안내',
  '생후 12개월 영유아는 MMR(홍역·유행성이하선염·풍진) 백신 1차 접종을 받아야 합니다.',
  'info',
  null,
  null,
  'https://www.kdca.go.kr',
  '2025-11-20 10:00:00+09',
  true,
  5,
  now() + interval '90 days'
);

-- ============================================================================
-- 9. 관리자 콘텐츠 샘플 데이터
-- ============================================================================

-- 페이지 문구
INSERT INTO admin_copy_blocks (slug, locale, content, updated_by) VALUES
('hero-title', 'ko', '{"title": "잊혀진 손맛을 연결하는 디지털 식탁", "subtitle": "전통과 현대를 잇는 레시피 아카이브"}'::jsonb, 'system'),
('hero-description', 'ko', '{"text": "명인의 전통 레시피부터 AI 맞춤 식단까지, 세대와 세대를 넘나드는 요리 지식을 한 곳에서 경험하세요."}'::jsonb, 'system'),
('footer-company-menu', 'ko', '{"links": [{"label": "회사소개", "href": "/about"}, {"label": "이용약관", "href": "/terms"}, {"label": "개인정보처리방침", "href": "/privacy"}, {"label": "문의하기", "href": "mailto:hello@flavor-archive.com"}]}'::jsonb, 'system')
ON CONFLICT (slug, locale) DO NOTHING;

-- 팝업 공지
INSERT INTO popup_announcements (
  title, body, active_from, active_until, status, priority,
  target_segments, metadata, created_by, updated_by
) VALUES
(
  '🎉 서비스 오픈 기념 이벤트',
  '맛의 아카이브가 정식 오픈했습니다! 지금 가입하시면 프리미엄 기능을 1개월 무료로 이용하실 수 있습니다.',
  now(),
  now() + interval '30 days',
  'published',
  100,
  '["all"]'::jsonb,
  '{"theme": "success", "showCloseButton": true}'::jsonb,
  'system',
  'system'
),
(
  '📢 신규 레시피 업데이트',
  '전통 음식 명인 10분의 인터뷰와 레시피가 추가되었습니다. 지금 바로 확인해보세요!',
  now(),
  now() + interval '7 days',
  'published',
  80,
  '["premium", "standard"]'::jsonb,
  '{"theme": "info", "showCloseButton": true}'::jsonb,
  'system',
  'system'
);

-- ============================================================================
-- 10. 레거시 아카이브 샘플 데이터
-- ============================================================================

INSERT INTO legacy_masters (id, name, title, region, bio) VALUES
('00000000-0000-0000-0000-000000000111', '김연자 명인', '안동 전통 장 명인', '경북 안동', '100년 장독대를 지켜온 장 명인'),
('00000000-0000-0000-0000-000000000222', '박정희 장인', '한정식 셰프', '전남 담양', '전라도 한정식 코스 전문가')
ON CONFLICT (id) DO NOTHING;

INSERT INTO legacy_videos (
  id, master_id, slug, title, description, duration_minutes,
  region, era, ingredients, thumbnail_url, video_url, premium_only, tags
) VALUES
(
  '00000000-0000-0000-0000-000000000aaa',
  '00000000-0000-0000-0000-000000000111',
  'traditional-soybean-paste',
  '전통 장 담그기',
  '100년 간 이어온 장독대 비법과 대체 재료 활용 팁을 소개합니다.',
  32,
  '경북 안동',
  '조선 후기',
  ARRAY['된장','천일염','메주'],
  '/legacy/jang-thumbnail.jpg',
  'https://example.com/videos/jang.mp4',
  true,
  ARRAY['발효','장류','명인']
),
(
  '00000000-0000-0000-0000-000000000bbb',
  '00000000-0000-0000-0000-000000000222',
  'jeolla-hanjeongsik',
  '전라도 한정식 상차림',
  '산지 직송 식재료로 담아낸 전라도 한정식 코스 10가지를 소개합니다.',
  27,
  '전남 담양',
  '근현대',
  ARRAY['표고버섯','들기름','대파'],
  '/legacy/hanjeongsik-thumbnail.jpg',
  'https://example.com/videos/hanjeongsik.mp4',
  false,
  ARRAY['한정식','코스요리']
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 샘플 데이터 삽입 완료 메시지
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ 샘플 데이터가 성공적으로 삽입되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 삽입된 샘플 데이터:';
  RAISE NOTICE '  - 질병 데이터: 11개';
  RAISE NOTICE '  - 알레르기 데이터: 8개';
  RAISE NOTICE '  - 응급조치 정보: 1개';
  RAISE NOTICE '  - 알레르기 파생 재료: 3개';
  RAISE NOTICE '  - 제외 음식: 11개';
  RAISE NOTICE '  - 칼로리 공식: 4개';
  RAISE NOTICE '  - 레시피: 10개';
  RAISE NOTICE '  - 레시피 재료: 15개';
  RAISE NOTICE '  - 레시피 단계: 8개';
  RAISE NOTICE '  - 프로모션 코드: 3개';
  RAISE NOTICE '  - KCDC 알림: 2개';
  RAISE NOTICE '  - 팝업 공지: 2개';
  RAISE NOTICE '  - 레거시 데이터: 2개';
  RAISE NOTICE '';
  RAISE NOTICE '🎉 이제 개발을 시작할 수 있습니다!';
END $$;
