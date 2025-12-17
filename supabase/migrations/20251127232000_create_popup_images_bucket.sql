-- 팝업 이미지를 위한 Supabase Storage 버킷 생성
--
-- ⚠️ 개발 규칙: DB 마이그레이션에서 RLS 정책을 복잡하게 추가하면 개발 중 오류가 자주 발생합니다.
-- 이 프로젝트 규칙에 따라(개발 환경) RLS는 비활성화 전략을 사용하므로,
-- 여기서는 "버킷 생성"만 수행하고, 정책 생성은 별도(운영 전)로 관리합니다.

-- 1) popup-images 버킷 생성 (public 접근 가능)
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2) (참고) 정책은 프로덕션 전 별도 적용 권장
-- - SELECT/INSERT/UPDATE/DELETE 정책은 운영 보안 설계 후 적용하세요.
