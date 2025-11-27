-- 샘플 레시피 데이터 추가
-- AI 맞춤 식단 생성 테스트용
-- 중복 키 에러 방지: ON CONFLICT DO NOTHING 사용

-- 밥류 레시피 추가
INSERT INTO public.recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'white-rice', '흰쌀밥', '기본 흰쌀밥 한 공기', 1, 25, 1, 310, 68.0, 5.5, 0.5, 2),
('550e8400-e29b-41d4-a716-446655440002', 'brown-rice', '현미밥', '건강한 현미밥 한 공기', 1, 40, 1, 330, 72.0, 6.8, 2.3, 2),
('550e8400-e29b-41d4-a716-446655440003', 'mixed-grain-rice', '잡곡밥', '영양 가득한 잡곡밥 한 공기', 2, 35, 1, 320, 69.0, 7.2, 1.8, 5)
ON CONFLICT (id) DO NOTHING;

-- 반찬류 레시피 추가
INSERT INTO public.recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440004', 'spinach-namul', '시금치나물', '건강한 시금치 무침', 2, 10, 1, 45, 4.0, 2.5, 2.5, 15),
('550e8400-e29b-41d4-a716-446655440005', 'bean-sprout-namul', '콩나물무침', '아삭한 콩나물 무침', 1, 8, 1, 40, 5.0, 4.0, 1.5, 10),
('550e8400-e29b-41d4-a716-446655440006', 'sweet-potato-stems', '고구마줄기볶음', '구수한 고구마줄기 볶음', 2, 15, 1, 80, 8.0, 2.0, 4.5, 20),
('550e8400-e29b-41d4-a716-446655440007', 'eggplant-namul', '가지나물', '부드러운 가지나물', 2, 12, 1, 50, 7.0, 1.5, 2.0, 350),
('550e8400-e29b-41d4-a716-446655440008', 'cucumber-muchim', '오이무침', '상큼한 오이무침', 1, 5, 1, 35, 7.0, 1.0, 0.3, 5),
('550e8400-e29b-41d4-a716-446655440009', 'potato-stew', '감자조림', '달콤 짭조름한 감자조림', 2, 20, 1, 120, 25.0, 2.5, 1.5, 450),
('550e8400-e29b-41d4-a716-446655440010', 'tofu-stew', '두부조림', '고소한 두부조림', 2, 15, 1, 100, 4.0, 8.0, 5.0, 400),
('550e8400-e29b-41d4-a716-446655440011', 'egg-custard', '계란찜', '부드러운 계란찜', 1, 15, 1, 110, 1.5, 9.0, 7.5, 150),
('550e8400-e29b-41d4-a716-446655440012', 'zucchini-stir-fry', '애호박볶음', '담백한 애호박볶음', 1, 10, 1, 60, 8.0, 2.0, 2.5, 10),
('550e8400-e29b-41d4-a716-446655440013', 'radish-salad', '무생채', '아삭한 무생채', 1, 5, 1, 40, 8.5, 1.0, 0.2, 5)
ON CONFLICT (id) DO NOTHING;

-- 국/탕류 레시피 추가
INSERT INTO public.recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440014', 'doenjang-soup', '된장국', '구수한 된장국', 2, 15, 1, 60, 6.0, 4.0, 2.0, 650),
('550e8400-e29b-41d4-a716-446655440015', 'seaweed-soup', '미역국', '영양 가득한 미역국', 2, 20, 1, 80, 4.0, 8.0, 3.5, 450),
('550e8400-e29b-41d4-a716-446655440016', 'bean-sprout-soup', '콩나물국', '시원한 콩나물국', 1, 12, 1, 45, 5.0, 4.0, 1.0, 420),
('550e8400-e29b-41d4-a716-446655440017', 'dried-pollack-soup', '북어국', '해장에 좋은 북어국', 2, 25, 1, 70, 4.0, 12.0, 0.5, 480),
('550e8400-e29b-41d4-a716-446655440018', 'radish-soup', '무국', '담백한 무국', 2, 20, 1, 40, 7.0, 2.0, 0.5, 450)
ON CONFLICT (id) DO NOTHING;

-- 찌개류 레시피 추가
INSERT INTO public.recipes (id, slug, title, description, difficulty, cooking_time_minutes, servings, calories, carbohydrates, protein, fat, sodium) VALUES
('550e8400-e29b-41d4-a716-446655440019', 'kimchi-stew', '김치찌개', '얼큰한 김치찌개', 3, 30, 1, 150, 8.0, 12.0, 8.0, 900),
('550e8400-e29b-41d4-a716-446655440020', 'doenjang-stew', '된장찌개', '구수한 된장찌개', 2, 20, 1, 100, 10.0, 6.0, 3.5, 850),
('550e8400-e29b-41d4-a716-446655440021', 'soft-tofu-stew', '순두부찌개', '부드러운 순두부찌개', 2, 15, 1, 120, 6.0, 10.0, 6.0, 550)
ON CONFLICT (id) DO NOTHING;

-- 샘플 레시피 재료 추가 (대표적인 것들만)
-- 중복 키 에러 방지: ON CONFLICT DO NOTHING 사용
INSERT INTO public.recipe_ingredients (recipe_id, name, quantity, unit, order_index) VALUES
-- 흰쌀밥 재료
('550e8400-e29b-41d4-a716-446655440001', '쌀', 100, 'g', 1),
('550e8400-e29b-41d4-a716-446655440001', '물', 120, 'ml', 2),

-- 된장국 재료
('550e8400-e29b-41d4-a716-446655440014', '된장', 1, '큰술', 1),
('550e8400-e29b-41d4-a716-446655440014', '애호박', 0.5, '개', 2),
('550e8400-e29b-41d4-a716-446655440014', '두부', 0.25, '모', 3),
('550e8400-e29b-41d4-a716-446655440014', '멸치육수', 500, 'ml', 4),

-- 시금치나물 재료
('550e8400-e29b-41d4-a716-446655440004', '시금치', 200, 'g', 1),
('550e8400-e29b-41d4-a716-446655440004', '참기름', 1, '큰술', 2),
('550e8400-e29b-41d4-a716-446655440004', '마늘', 1, '쪽', 3),
('550e8400-e29b-41d4-a716-446655440004', '깨소금', 1, '작은술', 4)
ON CONFLICT DO NOTHING;
