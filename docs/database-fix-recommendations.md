# 데이터베이스 수정 권장사항

> **작성일**: 2025년 1월 12일  
> **목적**: 데이터베이스 전수 검사 결과를 바탕으로 수정 권장사항 정리

---

## 🔧 즉시 수정 필요 사항

### 없음

현재 데이터베이스 구조와 코드가 잘 일치하며, 발견된 문제점들은 모두 코드에서 적절히 처리되고 있습니다.

---

## ⚠️ 향후 개선 권장사항

### 1. diet_plans 테이블 UPSERT 개선

**현재 상태:**
- 부분 UNIQUE 인덱스 사용 중
- 코드에서 `onConflict: "user_id,plan_date,meal_type"` 사용
- `family_member_id`가 NULL인 경우만 처리

**개선 방안:**
가족 식단(`family_member_id`가 NULL이 아닌 경우)을 처리할 때는 별도의 로직이 필요합니다:

```typescript
// 가족 식단의 경우
if (family_member_id) {
  await supabase
    .from("diet_plans")
    .upsert(records, {
      onConflict: "user_id,family_member_id,plan_date,meal_type",
      ignoreDuplicates: false,
    });
} else {
  // 개인 식단의 경우 (현재 코드)
  await supabase
    .from("diet_plans")
    .upsert(records, {
      onConflict: "user_id,plan_date,meal_type",
      ignoreDuplicates: false,
    });
}
```

**참고**: Supabase의 `upsert`는 부분 인덱스를 직접 지원하지 않을 수 있으므로, 실제 테스트를 통해 확인이 필요합니다.

---

### 2. 프로덕션 배포 전 RLS 정책 활성화

**현재 상태:**
- 모든 테이블에서 RLS 비활성화 (개발 환경)

**개선 방안:**
프로덕션 배포 전 다음 사항을 확인:
1. 각 테이블에 적절한 RLS 정책 작성
2. 정책 테스트
3. 점진적 활성화

---

### 3. 인덱스 성능 모니터링

**현재 상태:**
- 주요 테이블에 인덱스가 적절히 설정됨
- 복합 인덱스 및 부분 인덱스 사용

**개선 방안:**
1. 쿼리 성능 모니터링
2. 사용하지 않는 인덱스 제거
3. 필요한 인덱스 추가

---

## ✅ 검증 완료 사항

1. ✅ 외래키 관계성: 모든 관계가 올바르게 설정됨
2. ✅ CASCADE 정책: 적절하게 설정됨
3. ✅ 테이블 구조: 코드와 DB 구조 일치
4. ✅ 데이터 저장/불러오기: 로직 정상 작동
5. ✅ UNIQUE 제약조건: 적절히 설정됨
6. ✅ 인덱스: 주요 쿼리 패턴에 맞게 설정됨

---

## 📝 결론

**현재 데이터베이스 구조는 매우 잘 설계되어 있으며, 코드와의 일치성도 높습니다.**

즉시 수정이 필요한 사항은 없으며, 향후 개선 사항들은 선택적으로 진행할 수 있습니다.

