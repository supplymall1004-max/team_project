-- popup_announcements 테이블 Primary Key 보정 (안전)
--
-- ⚠️ 주의:
-- - 기존 파일은 DROP TABLE로 데이터를 삭제하므로 매우 위험합니다.
-- - 현재는 데이터/테이블을 보존하면서, PK/권한/트리거/스키마 캐시만 보정합니다.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema='public' AND table_name='popup_announcements'
  ) THEN
    -- 1) Primary Key가 없으면 추가
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint c
      JOIN pg_class t ON t.oid=c.conrelid
      JOIN pg_namespace n ON n.oid=t.relnamespace
      WHERE n.nspname='public'
        AND t.relname='popup_announcements'
        AND c.contype='p'
    ) THEN
      ALTER TABLE public.popup_announcements
        ADD CONSTRAINT popup_announcements_pkey PRIMARY KEY (id);
    END IF;

    -- 2) 개발 환경: RLS 비활성화 + 권한
    ALTER TABLE public.popup_announcements DISABLE ROW LEVEL SECURITY;
    GRANT ALL ON public.popup_announcements TO anon, authenticated, service_role;

    -- 3) updated_at 트리거 재설정 (update_updated_at_column 함수는 admin 콘솔 마이그레이션에서 생성됨)
    DROP TRIGGER IF EXISTS update_popup_announcements_updated_at ON public.popup_announcements;
    CREATE TRIGGER update_popup_announcements_updated_at
      BEFORE UPDATE ON public.popup_announcements
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

    -- 4) PostgREST 스키마 캐시 갱신
    NOTIFY pgrst, 'reload schema';
  END IF;
END $$;
