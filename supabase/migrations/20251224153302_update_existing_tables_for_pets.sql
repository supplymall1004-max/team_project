-- ============================================================================
-- 기존 테이블 확장 - 반려동물 지원 추가
-- 작성일: 2025-12-24
-- 설명: 기존 테이블들이 반려동물(family_members의 member_type='pet')도 지원하도록 확장
--       별도 테이블 생성 없이 기존 테이블 활용으로 테이블 수 감소
-- ============================================================================

-- 1. user_vaccination_records 테이블 코멘트 업데이트
--    이미 family_member_id로 연결되어 있으므로 반려동물도 사용 가능
COMMENT ON TABLE user_vaccination_records IS '예방접종 기록 테이블 - 사람과 반려동물 모두 지원. family_member_id가 NULL이면 본인(user_id), NULL이 아니면 가족 구성원(사람 또는 반려동물)';

-- 2. weight_logs 테이블 코멘트 업데이트
--    이미 family_member_id로 연결되어 있으므로 반려동물도 사용 가능
COMMENT ON TABLE weight_logs IS '체중 기록 테이블 - 사람과 반려동물 모두 지원. family_member_id가 NULL이면 본인(user_id), NULL이 아니면 가족 구성원(사람 또는 반려동물)';

-- 3. hospital_records 테이블 코멘트 업데이트
--    이미 family_member_id로 연결되어 있으므로 반려동물도 사용 가능
COMMENT ON TABLE hospital_records IS '병원 방문 기록 테이블 - 사람과 반려동물 모두 지원. family_member_id가 NULL이면 본인(user_id), NULL이 아니면 가족 구성원(사람 또는 반려동물). 반려동물의 경우 수의사 방문 기록으로 사용';

-- 4. user_health_checkup_records 테이블 코멘트 업데이트
--    이미 family_member_id로 연결되어 있으므로 반려동물도 사용 가능
COMMENT ON TABLE user_health_checkup_records IS '건강검진 기록 테이블 - 사람과 반려동물 모두 지원. family_member_id가 NULL이면 본인(user_id), NULL이 아니면 가족 구성원(사람 또는 반려동물). 반려동물의 경우 정기 검진, 치과 검진, 혈액 검사 등으로 사용';

-- 5. notifications 테이블 코멘트 업데이트
--    이미 family_member_id로 연결되어 있으므로 반려동물도 사용 가능
COMMENT ON TABLE notifications IS '통합 알림 로그 테이블 - 모든 알림 타입을 하나의 테이블로 관리. 사람과 반려동물 모두 지원. family_member_id가 NULL이면 본인(user_id), NULL이 아니면 가족 구성원(사람 또는 반려동물)';

-- 6. 기존 테이블들의 제약조건 확인 및 업데이트 (필요한 경우)
--    대부분의 테이블이 이미 family_member_id를 외래키로 가지고 있으므로 추가 작업 불필요

-- 7. 인덱스 확인 (이미 존재하는 인덱스는 건너뜀)
--    대부분의 테이블이 이미 family_member_id에 인덱스를 가지고 있으므로 추가 작업 불필요

