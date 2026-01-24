-- C. 공개/마스터 데이터 테이블 정책
-- ============================================================================

-- recipes 테이블 정책
CREATE POLICY "Authenticated users can view recipes"
ON public.recipes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own recipes"
ON public.recipes FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own recipes"
ON public.recipes FOR UPDATE
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

CREATE POLICY "Users can delete own recipes"
ON public.recipes FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- recipe_ingredients 테이블 정책
CREATE POLICY "Authenticated users can view recipe ingredients"
ON public.recipe_ingredients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can manage recipe ingredients for own recipes"
ON public.recipe_ingredients FOR INSERT
TO authenticated
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can update recipe ingredients for own recipes"
ON public.recipe_ingredients FOR UPDATE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
)
WITH CHECK (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can delete recipe ingredients for own recipes"
ON public.recipe_ingredients FOR DELETE
TO authenticated
USING (
  recipe_id IN (
    SELECT id FROM public.recipes
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- diseases 테이블 정책 (마스터 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view diseases"
ON public.diseases FOR SELECT
TO authenticated
USING (true);

-- allergies 테이블 정책 (마스터 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view allergies"
ON public.allergies FOR SELECT
TO authenticated
USING (true);

-- disease_excluded_foods 테이블 정책
CREATE POLICY "Authenticated users can view disease excluded foods"
ON public.disease_excluded_foods FOR SELECT
TO authenticated
USING (true);

-- disease_excluded_foods_extended 테이블 정책
CREATE POLICY "Authenticated users can view disease excluded foods extended"
ON public.disease_excluded_foods_extended FOR SELECT
TO authenticated
USING (true);

-- allergy_derived_ingredients 테이블 정책
CREATE POLICY "Authenticated users can view allergy derived ingredients"
ON public.allergy_derived_ingredients FOR SELECT
TO authenticated
USING (true);

-- emergency_procedures 테이블 정책
CREATE POLICY "Authenticated users can view emergency procedures"
ON public.emergency_procedures FOR SELECT
TO authenticated
USING (true);

-- calorie_calculation_formulas 테이블 정책
CREATE POLICY "Authenticated users can view calorie calculation formulas"
ON public.calorie_calculation_formulas FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can insert own calorie calculation formulas"
ON public.calorie_calculation_formulas FOR INSERT
TO authenticated
WITH CHECK (
  user_id IS NULL OR user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own calorie calculation formulas"
ON public.calorie_calculation_formulas FOR UPDATE
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

CREATE POLICY "Users can delete own calorie calculation formulas"
ON public.calorie_calculation_formulas FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- medication_interactions 테이블 정책 (마스터 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view medication interactions"
ON public.medication_interactions FOR SELECT
TO authenticated
USING (true);

-- pet_vaccine_master 테이블 정책 (마스터 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view pet vaccine master"
ON public.pet_vaccine_master FOR SELECT
TO authenticated
USING (true);

-- kcdc_alerts 테이블 정책 (공개 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view kcdc alerts"
ON public.kcdc_alerts FOR SELECT
TO authenticated
USING (true);

-- meal_kits 테이블 정책 (공개 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view meal kits"
ON public.meal_kits FOR SELECT
TO authenticated
USING (true);

-- promo_codes 테이블 정책 (공개 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (true);

-- promo_code_uses 테이블 정책
CREATE POLICY "Users can view own promo code uses"
ON public.promo_code_uses FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own promo code uses"
ON public.promo_code_uses FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- quests 테이블 정책 (마스터 데이터 - 읽기 전용)
CREATE POLICY "Authenticated users can view quests"
ON public.quests FOR SELECT
TO authenticated
USING (true);

-- quest_completions 테이블 정책
CREATE POLICY "Users can view own quest completions"
ON public.quest_completions FOR SELECT
TO authenticated
USING (
  user_quest_id IN (
    SELECT id FROM public.user_quests
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

CREATE POLICY "Users can insert own quest completions"
ON public.quest_completions FOR INSERT
TO authenticated
WITH CHECK (
  user_quest_id IN (
    SELECT id FROM public.user_quests
    WHERE user_id IN (
      SELECT id FROM public.users 
      WHERE clerk_id = (SELECT auth.jwt()->>'sub')
    )
  )
);

-- ============================================================================
-- D. 건강 로그 테이블 정책
-- ============================================================================

-- sleep_logs 테이블 정책
CREATE POLICY "Users can view own sleep logs"
ON public.sleep_logs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own sleep logs"
ON public.sleep_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own sleep logs"
ON public.sleep_logs FOR UPDATE
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

CREATE POLICY "Users can delete own sleep logs"
ON public.sleep_logs FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- activity_logs 테이블 정책
CREATE POLICY "Users can view own activity logs"
ON public.activity_logs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own activity logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own activity logs"
ON public.activity_logs FOR UPDATE
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

CREATE POLICY "Users can delete own activity logs"
ON public.activity_logs FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- vital_signs 테이블 정책
CREATE POLICY "Users can view own vital signs"
ON public.vital_signs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own vital signs"
ON public.vital_signs FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own vital signs"
ON public.vital_signs FOR UPDATE
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

CREATE POLICY "Users can delete own vital signs"
ON public.vital_signs FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- weight_logs 테이블 정책
CREATE POLICY "Users can view own weight logs"
ON public.weight_logs FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own weight logs"
ON public.weight_logs FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own weight logs"
ON public.weight_logs FOR UPDATE
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

CREATE POLICY "Users can delete own weight logs"
ON public.weight_logs FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- health_dashboard_cache 테이블 정책
CREATE POLICY "Users can view own health dashboard cache"
ON public.health_dashboard_cache FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can insert own health dashboard cache"
ON public.health_dashboard_cache FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

CREATE POLICY "Users can update own health dashboard cache"
ON public.health_dashboard_cache FOR UPDATE
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

CREATE POLICY "Users can delete own health dashboard cache"
ON public.health_dashboard_cache FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.users 
    WHERE clerk_id = (SELECT auth.jwt()->>'sub')
  )
);

-- ============================================================================
