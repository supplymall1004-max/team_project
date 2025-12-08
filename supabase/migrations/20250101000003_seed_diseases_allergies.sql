/**
 * 질병 및 알레르기 초기 데이터 삽입
 * 
 * 질병과 알레르기 마스터 데이터를 초기화합니다.
 */

-- 질병 데이터 삽입
INSERT INTO diseases (code, name_ko, name_en, category, description, calorie_adjustment_factor) VALUES
-- 대사 질환
('diabetes_type1', '1형 당뇨병', 'Type 1 Diabetes', 'metabolic', '인슐린 의존성 당뇨병으로, 탄수화물 섭취를 엄격히 관리해야 합니다.', 0.9),
('diabetes_type2', '2형 당뇨병', 'Type 2 Diabetes', 'metabolic', '인슐린 저항성 당뇨병으로, 탄수화물과 당분 섭취를 제한해야 합니다.', 0.9),
('hypertension', '고혈압', 'Hypertension', 'metabolic', '혈압 관리가 필요하며, 나트륨 섭취를 제한해야 합니다.', 0.95),
('hyperlipidemia', '고지혈증', 'Hyperlipidemia', 'metabolic', '콜레스테롤과 중성지방 수치 관리가 필요합니다.', 0.95),
('obesity', '비만', 'Obesity', 'metabolic', '체중 관리와 칼로리 제한이 필요합니다.', 0.85),

-- 심혈관 질환
('coronary_heart_disease', '관상동맥질환', 'Coronary Heart Disease', 'cardiovascular', '심장 건강을 위한 식단 관리가 필요합니다.', 0.9),
('stroke', '뇌졸중', 'Stroke', 'cardiovascular', '뇌혈관 건강을 위한 식단 관리가 필요합니다.', 0.9),

-- 신장 질환
('ckd', '만성 신장 질환', 'Chronic Kidney Disease', 'kidney', '단백질과 인, 나트륨 섭취를 제한해야 합니다.', 0.85),
('kidney_stones', '신장 결석', 'Kidney Stones', 'kidney', '옥살산과 나트륨 섭취를 제한해야 합니다.', 0.95),

-- 통풍
('gout', '통풍', 'Gout', 'gout', '퓨린 함량이 높은 음식을 피해야 합니다.', 0.95),

-- 위장 질환
('gastritis', '위염', 'Gastritis', 'digestive', '자극적인 음식과 과식을 피해야 합니다.', 0.95),
('ibs', '과민성 대장 증후군', 'Irritable Bowel Syndrome', 'digestive', '식이섬유와 유발 음식을 관리해야 합니다.', 0.95),
('crohns', '크론병', 'Crohn''s Disease', 'digestive', '염증을 유발하는 음식을 피해야 합니다.', 0.9),
('ulcerative_colitis', '궤양성 대장염', 'Ulcerative Colitis', 'digestive', '대장 건강을 위한 식단 관리가 필요합니다.', 0.9),

-- 임신 관련
('gestational_diabetes', '임신성 당뇨', 'Gestational Diabetes', 'maternity', '임신 중 혈당 관리를 위한 식단이 필요합니다.', 0.9),
('preeclampsia', '임신중독증', 'Preeclampsia', 'maternity', '나트륨 섭취를 제한하고 균형 잡힌 식단이 필요합니다.', 0.95)
ON CONFLICT (code) DO NOTHING;

-- 알레르기 데이터 삽입
INSERT INTO allergies (code, name_ko, name_en, category, severity_level, description) VALUES
-- 8대 주요 알레르기
('milk', '우유', 'Milk', 'major_8', 'high', '우유 및 유제품 알레르기입니다. 모든 유제품과 파생 재료를 피해야 합니다.'),
('egg', '계란', 'Egg', 'major_8', 'high', '계란 알레르기입니다. 계란과 계란을 포함한 모든 음식을 피해야 합니다.'),
('peanuts', '땅콩', 'Peanuts', 'major_8', 'high', '땅콩 알레르기입니다. 땅콩과 땅콩 오일을 포함한 모든 음식을 피해야 합니다.'),
('tree_nuts', '견과류', 'Tree Nuts', 'major_8', 'high', '견과류 알레르기입니다. 아몬드, 호두, 캐슈넛 등 모든 견과류를 피해야 합니다.'),
('soy', '대두', 'Soy', 'major_8', 'high', '대두 알레르기입니다. 두부, 된장, 간장 등 대두 제품을 피해야 합니다.'),
('wheat', '밀', 'Wheat', 'major_8', 'high', '밀 알레르기입니다. 밀가루와 밀을 포함한 모든 음식을 피해야 합니다.'),
('fish', '생선', 'Fish', 'major_8', 'high', '생선 알레르기입니다. 모든 종류의 생선을 피해야 합니다.'),
('crustacean', '갑각류', 'Crustacean', 'major_8', 'high', '갑각류 알레르기입니다. 새우, 게, 바닷가재 등을 피해야 합니다.'),

-- 특수 알레르기
('sesame', '참깨', 'Sesame', 'special', 'high', '참깨 알레르기입니다. 참깨와 참기름을 피해야 합니다.'),
('shellfish', '조개류', 'Shellfish', 'special', 'high', '조개류 알레르기입니다. 조개, 홍합, 전복 등을 피해야 합니다.'),
('strawberry', '딸기', 'Strawberry', 'special', 'medium', '딸기 알레르기입니다. 딸기와 딸기 제품을 피해야 합니다.'),
('tomato', '토마토', 'Tomato', 'special', 'medium', '토마토 알레르기입니다. 토마토와 토마토 제품을 피해야 합니다.'),
('chocolate', '초콜릿', 'Chocolate', 'special', 'medium', '초콜릿 알레르기입니다. 초콜릿과 코코아 제품을 피해야 합니다.'),
('sulfites', '아황산염', 'Sulfites', 'special', 'high', '아황산염 알레르기입니다. 보존제가 포함된 음식을 피해야 합니다.')
ON CONFLICT (code) DO NOTHING;

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diseases_category ON diseases(category);
CREATE INDEX IF NOT EXISTS idx_allergies_category ON allergies(category);
CREATE INDEX IF NOT EXISTS idx_allergies_severity ON allergies(severity_level);

