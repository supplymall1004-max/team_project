-- E. 커뮤니티 테이블 정책
-- ============================================================================

-- community_groups 테이블 정책
CREATE POLICY "Authenticated users can view public community groups"
ON public.community_groups FOR SELECT
TO authenticated
USING (is_public = true);

CREATE POLICY "Users can view own community groups"
ON public.community_groups FOR SELECT
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own community groups"
ON public.community_groups FOR INSERT
TO authenticated
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own community groups"
ON public.community_groups FOR UPDATE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  owner_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own community groups"
ON public.community_groups FOR DELETE
TO authenticated
USING (
  owner_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- group_members 테이블 정책
CREATE POLICY "Group members can view group members"
ON public.group_members FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM public.community_groups
    WHERE is_public = true
    OR owner_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
  OR user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Group owners can insert group members"
ON public.group_members FOR INSERT
TO authenticated
WITH CHECK (
  group_id IN (
    SELECT id FROM public.community_groups
    WHERE owner_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Group owners can delete group members"
ON public.group_members FOR DELETE
TO authenticated
USING (
  group_id IN (
    SELECT id FROM public.community_groups
    WHERE owner_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- group_posts 테이블 정책
CREATE POLICY "Group members can view group posts"
ON public.group_posts FOR SELECT
TO authenticated
USING (
  group_id IN (
    SELECT id FROM public.community_groups
    WHERE is_public = true
    OR id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id IN (
        SELECT id FROM public.users 
        WHERE clerk_id = (SELECT auth.jwt()->>'sub')
      )
    )
  )
);

CREATE POLICY "Group members can insert group posts"
ON public.group_posts FOR INSERT
TO authenticated
WITH CHECK (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  AND group_id IN (
    SELECT id FROM public.community_groups
    WHERE is_public = true
    OR id IN (
      SELECT group_id FROM public.group_members
      WHERE user_id IN (
        SELECT id FROM public.users 
        WHERE clerk_id = (SELECT auth.jwt()->>'sub')
      )
    )
  )
);

CREATE POLICY "Users can update own group posts"
ON public.group_posts FOR UPDATE
TO authenticated
USING (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own group posts"
ON public.group_posts FOR DELETE
TO authenticated
USING (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- post_comments 테이블 정책
CREATE POLICY "Group members can view post comments"
ON public.post_comments FOR SELECT
TO authenticated
USING (
  post_id IN (
    SELECT id FROM public.group_posts
    WHERE group_id IN (
      SELECT id FROM public.community_groups
      WHERE is_public = true
      OR id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id IN (
          SELECT id FROM public.users 
          WHERE clerk_id = (SELECT auth.jwt()->>'sub')
        )
      )
    )
  )
);

CREATE POLICY "Group members can insert post comments"
ON public.post_comments FOR INSERT
TO authenticated
WITH CHECK (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  AND post_id IN (
    SELECT id FROM public.group_posts
    WHERE group_id IN (
      SELECT id FROM public.community_groups
      WHERE is_public = true
      OR id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id IN (
          SELECT id FROM public.users 
          WHERE clerk_id = (SELECT auth.jwt()->>'sub')
        )
      )
    )
  )
);

CREATE POLICY "Users can update own post comments"
ON public.post_comments FOR UPDATE
TO authenticated
USING (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own post comments"
ON public.post_comments FOR DELETE
TO authenticated
USING (
  author_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- post_likes 테이블 정책
CREATE POLICY "Group members can view post likes"
ON public.post_likes FOR SELECT
TO authenticated
USING (
  (post_id IS NOT NULL AND post_id IN (
    SELECT id FROM public.group_posts
    WHERE group_id IN (
      SELECT id FROM public.community_groups
      WHERE is_public = true
      OR id IN (
        SELECT group_id FROM public.group_members
        WHERE user_id IN (
          SELECT id FROM public.users 
          WHERE clerk_id = (SELECT auth.jwt()->>'sub')
        )
      )
    )
  ))
  OR (comment_id IS NOT NULL AND comment_id IN (
    SELECT id FROM public.post_comments
    WHERE post_id IN (
      SELECT id FROM public.group_posts
      WHERE group_id IN (
        SELECT id FROM public.community_groups
        WHERE is_public = true
        OR id IN (
          SELECT group_id FROM public.group_members
          WHERE user_id IN (
            SELECT id FROM public.users 
            WHERE clerk_id = (SELECT auth.jwt()->>'sub')
          )
        )
      )
    )
  ))
);

CREATE POLICY "Users can insert own post likes"
ON public.post_likes FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own post likes"
ON public.post_likes FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- user_follows 테이블 정책
CREATE POLICY "Users can view own follows"
ON public.user_follows FOR SELECT
TO authenticated
USING (
  follower_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  OR following_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own follows"
ON public.user_follows FOR INSERT
TO authenticated
WITH CHECK (
  follower_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own follows"
ON public.user_follows FOR DELETE
TO authenticated
USING (
  follower_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
-- F. 이미지 캐시 테이블 정책 (읽기 전용)
-- ============================================================================

CREATE POLICY "Authenticated users can view image usage logs"
ON public.image_usage_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view image cache stats"
ON public.image_cache_stats FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can view image cache cleanup logs"
ON public.image_cache_cleanup_logs FOR SELECT
TO authenticated
USING (true);

-- ============================================================================
-- 18. 코멘트 추가
-- ============================================================================

COMMENT ON TABLE users IS '중앙 허브 테이블 - 모든 사용자 관련 테이블의 부모';
COMMENT ON TABLE user_health_profiles IS '사용자 건강 프로필 - users와 1:1 관계';
COMMENT ON TABLE family_members IS '가족 구성원 테이블 - 사람과 반려동물 모두 관리';
COMMENT ON TABLE notifications IS '통합 알림 로그 테이블 - 모든 알림 타입을 하나의 테이블로 관리';
COMMENT ON TABLE diet_plans IS '일일 식단 계획 테이블';
COMMENT ON TABLE weekly_diet_plans IS '주간 식단 메타데이터 테이블';
COMMENT ON TABLE subscriptions IS '사용자 구독 정보';
COMMENT ON TABLE payment_transactions IS '결제 내역';

DO $$
BEGIN
  RAISE NOTICE '✅ 통합 스키마 마이그레이션 완료';
END $$;

