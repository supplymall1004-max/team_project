-- ============================================================================
-- 반려동물 백신 마스터 데이터 초기화 (AVMA/AAHA 기준)
-- 작성일: 2025-12-24
-- 설명: 강아지와 고양이의 필수 백신 정보를 AVMA/AAHA 기준으로 삽입
-- 참고: American Veterinary Medical Association (AVMA)
--       American Animal Hospital Association (AAHA)
-- 주의: 이 파일은 pet_vaccine_master 테이블이 생성된 후 실행되어야 합니다
-- ============================================================================

-- 강아지 필수 백신 (Dogs)
INSERT INTO pet_vaccine_master (vaccine_name, vaccine_code, pet_type, lifecycle_stage, recommended_age_weeks, recommended_age_months, booster_interval_months, is_required, description) VALUES
-- Puppy 단계 (6-16주)
('종합백신 (DHPP)', 'dog_dhpp', 'dog', 'puppy', 6, NULL, 12, true, '대홍열, 간염, 파보바이러스, 파라인플루엔자 예방 백신 (6주, 9주, 12주, 16주 접종)'),
('코로나바이러스', 'dog_corona', 'dog', 'puppy', 6, NULL, 12, false, '코로나바이러스 예방 백신 (6주, 9주, 12주 접종)'),
('켄넬코프', 'dog_kennel_cough', 'dog', 'puppy', 6, NULL, 12, false, '기관지염 예방 백신 (6주, 9주, 12주 접종)'),
('광견병', 'dog_rabies', 'dog', 'puppy', 12, NULL, 36, true, '광견병 예방 백신 (12주 이후 접종, 1년 후 추가 접종, 이후 3년마다)'),

-- Adult 단계 (1세 이후)
('종합백신 (DHPP) 추가접종', 'dog_dhpp_booster', 'dog', 'adult', NULL, 12, 12, true, '종합백신 추가 접종 (매년 1회)'),
('광견병 추가접종', 'dog_rabies_booster', 'dog', 'adult', NULL, 12, 36, true, '광견병 추가 접종 (1년 후, 이후 3년마다)'),

-- Senior 단계 (7세 이상)
('종합백신 (DHPP) - 노령견', 'dog_dhpp_senior', 'dog', 'senior', NULL, NULL, 12, false, '노령견 종합백신 (수의사 상담 후 결정)'),
('광견병 - 노령견', 'dog_rabies_senior', 'dog', 'senior', NULL, NULL, 36, true, '노령견 광견병 (법적 의무, 수의사 상담 후 결정)')

ON CONFLICT (vaccine_code) DO NOTHING;

-- 고양이 필수 백신 (Cats)
INSERT INTO pet_vaccine_master (vaccine_name, vaccine_code, pet_type, lifecycle_stage, recommended_age_weeks, recommended_age_months, booster_interval_months, is_required, description) VALUES
-- Kitten 단계 (6-16주)
('종합백신 (FVRCP)', 'cat_fvrcp', 'cat', 'kitten', 6, NULL, 12, true, '고양이 바이러스성 비기관지염, 칼리시바이러스, 범백혈구감소증 예방 백신 (6주, 9주, 12주, 16주 접종)'),
('복막염', 'cat_fip', 'cat', 'kitten', 16, NULL, NULL, false, '고양이 전염성 복막염 예방 백신 (16주 접종, 권장 여부는 수의사와 상담)'),
('광견병', 'cat_rabies', 'cat', 'kitten', 12, NULL, 36, true, '광견병 예방 백신 (12주 이후 접종, 1년 후 추가 접종, 이후 3년마다)'),

-- Adult 단계 (1-10세)
('종합백신 (FVRCP) 추가접종', 'cat_fvrcp_booster', 'cat', 'adult', NULL, 12, 36, true, '종합백신 추가 접종 (1-3년 주기, 수의사 상담 후 결정)'),
('광견병 추가접종', 'cat_rabies_booster', 'cat', 'adult', NULL, 12, 36, true, '광견병 추가 접종 (1년 후, 이후 3년마다)'),

-- Senior 단계 (10세 이상)
('종합백신 (FVRCP) - 노묘', 'cat_fvrcp_senior', 'cat', 'senior', NULL, NULL, 36, false, '노묘 종합백신 (수의사 상담 후 결정)'),
('광견병 - 노묘', 'cat_rabies_senior', 'cat', 'senior', NULL, NULL, 36, true, '노묘 광견병 (법적 의무, 수의사 상담 후 결정)')

ON CONFLICT (vaccine_code) DO NOTHING;

-- 코멘트
COMMENT ON TABLE pet_vaccine_master IS '반려동물 백신 마스터 데이터 - AVMA/AAHA 기준 강아지/고양이 필수 백신 정보';

