-- ============================================================================
-- 17. RLS 정책 설정
-- ============================================================================

-- ============================================================================
-- A. 개인 데이터 테이블 정책
-- ============================================================================

-- users 테이블 정책
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (clerk_id = (SELECT auth.jwt()->>'sub'))
WITH CHECK (clerk_id = (SELECT auth.jwt()->>'sub'));

-- user_health_profiles 테이블 정책
CREATE POLICY "Users can view own health profile"
ON public.user_health_profiles FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own health profile"
ON public.user_health_profiles FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own health profile"
ON public.user_health_profiles FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- family_members 테이블 정책
CREATE POLICY "Users can view own family members"
ON public.family_members FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own family members"
ON public.family_members FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own family members"
ON public.family_members FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own family members"
ON public.family_members FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- identity_verifications 테이블 정책
CREATE POLICY "Users can view own identity verifications"
ON public.identity_verifications FOR SELECT
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can insert own identity verifications"
ON public.identity_verifications FOR INSERT
TO authenticated
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));

-- consent_records 테이블 정책
CREATE POLICY "Users can view own consent records"
ON public.consent_records FOR SELECT
TO authenticated
USING (clerk_user_id = (SELECT auth.jwt()->>'sub'));

CREATE POLICY "Users can insert own consent records"
ON public.consent_records FOR INSERT
TO authenticated
WITH CHECK (clerk_user_id = (SELECT auth.jwt()->>'sub'));

-- ============================================================================
-- B. 사용자 소유 데이터 테이블 정책
-- ============================================================================

-- diet_plans 테이블 정책
CREATE POLICY "Users can view own diet plans"
ON public.diet_plans FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own diet plans"
ON public.diet_plans FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own diet plans"
ON public.diet_plans FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own diet plans"
ON public.diet_plans FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- weekly_diet_plans 테이블 정책
CREATE POLICY "Users can view own weekly diet plans"
ON public.weekly_diet_plans FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own weekly diet plans"
ON public.weekly_diet_plans FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own weekly diet plans"
ON public.weekly_diet_plans FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own weekly diet plans"
ON public.weekly_diet_plans FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- weekly_shopping_lists 테이블 정책 (주간 식단 소유자만 접근)
CREATE POLICY "Users can view own weekly shopping lists"
ON public.weekly_shopping_lists FOR SELECT
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can insert own weekly shopping lists"
ON public.weekly_shopping_lists FOR INSERT
TO authenticated
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can update own weekly shopping lists"
ON public.weekly_shopping_lists FOR UPDATE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can delete own weekly shopping lists"
ON public.weekly_shopping_lists FOR DELETE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- weekly_nutrition_stats 테이블 정책
CREATE POLICY "Users can view own weekly nutrition stats"
ON public.weekly_nutrition_stats FOR SELECT
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can insert own weekly nutrition stats"
ON public.weekly_nutrition_stats FOR INSERT
TO authenticated
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can update own weekly nutrition stats"
ON public.weekly_nutrition_stats FOR UPDATE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can delete own weekly nutrition stats"
ON public.weekly_nutrition_stats FOR DELETE
TO authenticated
USING (
  weekly_diet_plan_id IN (
    SELECT id FROM public.weekly_diet_plans
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- favorite_meals 테이블 정책
CREATE POLICY "Users can view own favorite meals"
ON public.favorite_meals FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own favorite meals"
ON public.favorite_meals FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own favorite meals"
ON public.favorite_meals FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- subscriptions 테이블 정책
CREATE POLICY "Users can view own subscriptions"
ON public.subscriptions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own subscriptions"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own subscriptions"
ON public.subscriptions FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- payment_transactions 테이블 정책 (읽기 전용)
CREATE POLICY "Users can view own payment transactions"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- user_push_tokens 테이블 정책
CREATE POLICY "Users can view own push tokens"
ON public.user_push_tokens FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own push tokens"
ON public.user_push_tokens FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own push tokens"
ON public.user_push_tokens FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own push tokens"
ON public.user_push_tokens FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- notifications 테이블 정책
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- user_gamification 테이블 정책
CREATE POLICY "Users can view own gamification"
ON public.user_gamification FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own gamification"
ON public.user_gamification FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own gamification"
ON public.user_gamification FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- user_quests 테이블 정책
CREATE POLICY "Users can view own quests"
ON public.user_quests FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own quests"
ON public.user_quests FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own quests"
ON public.user_quests FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- daily_quests 테이블 정책
CREATE POLICY "Users can view own daily quests"
ON public.daily_quests FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own daily quests"
ON public.daily_quests FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own daily quests"
ON public.daily_quests FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- character_levels 테이블 정책
CREATE POLICY "Users can view own character levels"
ON public.character_levels FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own character levels"
ON public.character_levels FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own character levels"
ON public.character_levels FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- character_skins 테이블 정책
CREATE POLICY "Users can view own character skins"
ON public.character_skins FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own character skins"
ON public.character_skins FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own character skins"
ON public.character_skins FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- character_game_events 테이블 정책
CREATE POLICY "Users can view own character game events"
ON public.character_game_events FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own character game events"
ON public.character_game_events FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own character game events"
ON public.character_game_events FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- character_positions 테이블 정책
CREATE POLICY "Users can view own character positions"
ON public.character_positions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own character positions"
ON public.character_positions FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own character positions"
ON public.character_positions FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- character_game_interactions 테이블 정책
CREATE POLICY "Users can view own character game interactions"
ON public.character_game_interactions FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own character game interactions"
ON public.character_game_interactions FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- baby_feeding_schedules 테이블 정책
CREATE POLICY "Users can view own baby feeding schedules"
ON public.baby_feeding_schedules FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own baby feeding schedules"
ON public.baby_feeding_schedules FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own baby feeding schedules"
ON public.baby_feeding_schedules FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can delete own baby feeding schedules"
ON public.baby_feeding_schedules FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- random_events 테이블 정책
CREATE POLICY "Users can view own random events"
ON public.random_events FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own random events"
ON public.random_events FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own random events"
ON public.random_events FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- family_intimacy 테이블 정책
CREATE POLICY "Users can view own family intimacy"
ON public.family_intimacy FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own family intimacy"
ON public.family_intimacy FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own family intimacy"
ON public.family_intimacy FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- family_challenges 테이블 정책
CREATE POLICY "Users can view own family challenges"
ON public.family_challenges FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own family challenges"
ON public.family_challenges FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own family challenges"
ON public.family_challenges FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- minigame_records 테이블 정책
CREATE POLICY "Users can view own minigame records"
ON public.minigame_records FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own minigame records"
ON public.minigame_records FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- quiz_records 테이블 정책
CREATE POLICY "Users can view own quiz records"
ON public.quiz_records FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own quiz records"
ON public.quiz_records FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- lifecycle_notification_reminder_settings 테이블 정책
CREATE POLICY "Users can view own lifecycle reminder settings"
ON public.lifecycle_notification_reminder_settings FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own lifecycle reminder settings"
ON public.lifecycle_notification_reminder_settings FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own lifecycle reminder settings"
ON public.lifecycle_notification_reminder_settings FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- lifecycle_notification_shares 테이블 정책
CREATE POLICY "Users can view related lifecycle notification shares"
ON public.lifecycle_notification_shares FOR SELECT
TO authenticated
USING (
  shared_by_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  OR shared_with_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own lifecycle notification shares"
ON public.lifecycle_notification_shares FOR INSERT
TO authenticated
WITH CHECK (
  shared_by_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own lifecycle notification shares"
ON public.lifecycle_notification_shares FOR UPDATE
TO authenticated
USING (
  shared_by_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  OR shared_with_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
)
WITH CHECK (
  shared_by_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
  OR shared_with_user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
