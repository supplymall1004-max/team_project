# 💳 프리미엄 결제 시스템 사용 가이드

> **작성일**: 2025-11-27  
> **상태**: 시뮬레이션 모드 (토스페이먼츠 계정 없이 구현 완료)

---

## 📋 개요

"맛의 아카이브" 프리미엄 결제 시스템이 **시뮬레이션 모드**로 완성되었습니다.  
실제 토스페이먼츠 계정 없이도 모든 UI/UX와 데이터 흐름을 테스트할 수 있습니다.

---

## ✅ 구현 완료 항목

### 1. 데이터베이스
- ✅ `subscriptions` 테이블 (구독 정보)
- ✅ `payment_transactions` 테이블 (결제 내역)
- ✅ `promo_codes` 테이블 (프로모션 코드)
- ✅ `promo_code_uses` 테이블 (프로모션 사용 내역)
- ✅ `users` 테이블 확장 (`is_premium`, `premium_expires_at`, `trial_ends_at`)
- ✅ 초기 프로모션 코드 생성 (`LAUNCH2025`, `TEST50`)

### 2. 백엔드 (Server Actions)
- ✅ `createCheckout` - 결제 세션 생성
- ✅ `confirmPayment` - 결제 승인 처리
- ✅ `getCurrentSubscription` - 구독 정보 조회
- ✅ `cancelSubscription` - 구독 취소
- ✅ `reactivateSubscription` - 구독 재활성화
- ✅ `validatePromoCode` - 프로모션 코드 검증
- ✅ `grantPremiumAccess` - 관리자: 프리미엄 부여
- ✅ `revokePremiumAccess` - 관리자: 프리미엄 취소

### 3. Mock 결제 시스템
- ✅ `MockTossPaymentsClient` - 토스 API 시뮬레이션
- ✅ 결제 승인/실패 시뮬레이션 (성공률 90%)
- ✅ 빌링키 발급 시뮬레이션
- ✅ 정기결제 시뮬레이션

### 4. 프론트엔드 UI
- ✅ `/pricing` - 플랜 선택 페이지
- ✅ `/checkout/mock` - Mock 결제 위젯
- ✅ `/checkout/success` - 결제 성공 페이지
- ✅ `/checkout/fail` - 결제 실패 페이지
- ✅ `/account/subscription` - 구독 관리 페이지
- ✅ `PremiumGate` - 프리미엄 전용 콘텐츠 가드
- ✅ `TestModeBanner` - 테스트 모드 알림 배너

---

## 🚀 설치 및 실행

### 1. 마이그레이션 실행

```bash
# Supabase CLI로 마이그레이션 적용
npx supabase db push

# 또는 SQL 파일 직접 실행
# Supabase 대시보드 > SQL Editor에서
# supabase/migrations/20251127030000_create_payment_system.sql 실행
```

### 2. 환경 변수 확인

`.env` 파일에 다음 변수가 설정되어 있는지 확인:

```bash
# Clerk 인증 (기존)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...

# Supabase (기존)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Base URL (선택, 기본값: http://localhost:3000)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

---

## 📱 사용 방법

### 일반 사용자 플로우

1. **플랜 선택**
   - `/pricing` 접속
   - 월간(9,900원) 또는 연간(94,800원) 선택
   - 프로모션 코드 입력 (선택)
     - `LAUNCH2025` → 30% 할인
     - `TEST50` → 50% 할인

2. **결제 진행**
   - "14일 무료 체험 시작" 버튼 클릭
   - Mock 결제 페이지로 이동
   - 결제 수단 선택 (카드/카카오페이/네이버페이)
   - "결제하기" 버튼 클릭 → 2초 대기

3. **결제 완료**
   - 성공 페이지 표시 (90% 확률)
   - "AI 맞춤 식단 보러가기" 또는 "구독 관리"

4. **구독 관리**
   - `/account/subscription` 접속
   - 구독 정보 확인
   - 구독 취소 (즉시 또는 기간 종료 시)
   - 구독 재활성화

### 관리자 플로우

1. **사용자에게 프리미엄 부여**

```typescript
// Server Component 또는 API Route에서
import { grantPremiumAccess } from '@/actions/admin/manage-subscription';

const result = await grantPremiumAccess({
  userId: 'user-uuid',
  planType: 'monthly',
  durationDays: 30,
});

console.log(result.message);
// "사용자에게 30일 프리미엄 권한이 부여되었습니다."
```

2. **프리미엄 권한 취소**

```typescript
import { revokePremiumAccess } from '@/actions/admin/manage-subscription';

const result = await revokePremiumAccess('user-uuid');
console.log(result.message);
// "사용자의 프리미엄 권한이 취소되었습니다."
```

---

## 🔒 프리미엄 전용 콘텐츠 보호

### 컴포넌트에서 사용

```typescript
import { PremiumGate } from '@/components/premium/premium-gate';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';

export default async function MyPage() {
  const { isPremium } = await getCurrentSubscription();

  return (
    <div>
      {/* Overlay 스타일 (콘텐츠 위에 덮기) */}
      <div className="relative">
        <PremiumGate 
          isPremium={isPremium} 
          variant="overlay" 
          message="가족 식단은 프리미엄 전용입니다"
        >
          <FamilyDietContent />
        </PremiumGate>
      </div>

      {/* Banner 스타일 (콘텐츠 대신 배너 표시) */}
      <PremiumGate 
        isPremium={isPremium} 
        variant="banner" 
        message="광고 없는 영상은 프리미엄 전용입니다"
      >
        <VideoPlayer />
      </PremiumGate>

      {/* Card 스타일 (독립 카드) */}
      <PremiumGate 
        isPremium={isPremium} 
        variant="card" 
        message="무제한 북마크를 이용하세요"
      >
        <BookmarkList />
      </PremiumGate>
    </div>
  );
}
```

### 프리미엄 업그레이드 배너

```typescript
import { UpgradeBanner } from '@/components/premium/premium-gate';
import { getCurrentSubscription } from '@/actions/payments/get-subscription';

export default async function Layout({ children }) {
  const { isPremium } = await getCurrentSubscription();

  return (
    <>
      {!isPremium && <UpgradeBanner />}
      {children}
    </>
  );
}
```

---

## 🧪 테스트 시나리오

### 시나리오 1: 월간 플랜 가입

1. `/pricing` 접속
2. "월간" 탭 선택
3. 프로모션 코드 `LAUNCH2025` 입력
4. "14일 무료 체험 시작" 클릭
5. Mock 결제 페이지에서 "신용/체크카드" 선택
6. "9,900원 결제하기" 클릭
7. 2초 대기 후 성공 페이지 확인
8. `/account/subscription`에서 구독 정보 확인

**예상 결과**:
- 원가: 9,900원
- 할인가: 6,930원 (30% 할인)
- 구독 시작
- 프리미엄 배지 표시

### 시나리오 2: 구독 취소 (기간 종료 시)

1. `/account/subscription` 접속
2. "구독 취소" 버튼 클릭
3. "기간 종료 시 취소" 선택
4. 확인

**예상 결과**:
- "구독 취소 예정" 알림 표시
- 다음 갱신일까지 프리미엄 유지
- 프리미엄 기능 계속 이용 가능

### 시나리오 3: 구독 재활성화

1. 취소 예정 상태에서
2. "구독 재활성화하기" 클릭
3. 확인

**예상 결과**:
- 취소 예약 해제
- 다음 갱신일에 자동 결제 재개

### 시나리오 4: 프리미엄 콘텐츠 접근 제어

1. Free 사용자로 로그인
2. 프리미엄 전용 페이지 접속
3. `PremiumGate` 표시 확인
4. "프리미엄 시작하기" 버튼 클릭 → `/pricing`으로 이동

---

## 📊 데이터베이스 조회

### 모든 구독 조회

```sql
SELECT 
  u.name,
  s.status,
  s.plan_type,
  s.price_per_month,
  s.current_period_end,
  s.is_test_mode
FROM subscriptions s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;
```

### 프리미엄 사용자 수

```sql
SELECT COUNT(*) FROM users WHERE is_premium = true;
```

### 프로모션 코드 사용 현황

```sql
SELECT 
  pc.code,
  pc.discount_type,
  pc.discount_value,
  pc.current_uses,
  pc.max_uses
FROM promo_codes pc
ORDER BY pc.created_at DESC;
```

### 결제 내역

```sql
SELECT 
  u.name,
  pt.status,
  pt.amount,
  pt.payment_method,
  pt.paid_at
FROM payment_transactions pt
JOIN users u ON pt.user_id = u.id
WHERE pt.status = 'completed'
ORDER BY pt.paid_at DESC;
```

---

## 🔧 실제 PG 연동 시 변경 사항

Mock 결제 시스템을 실제 토스페이먼츠로 교체하려면:

### 1. 토스페이먼츠 계정 생성
- https://www.tosspayments.com/ 가입
- API 키 발급 (테스트/프로덕션)

### 2. 환경 변수 추가

```bash
# .env
TOSS_PAYMENTS_CLIENT_KEY=test_ck_...
TOSS_PAYMENTS_SECRET_KEY=test_sk_...
```

### 3. Mock 클라이언트 교체

```typescript
// lib/payments/toss-client.ts (새 파일 생성)
import { TossPayments } from '@tosspayments/sdk';

const tossPayments = new TossPayments(
  process.env.TOSS_PAYMENTS_CLIENT_KEY!
);

export { tossPayments };
```

### 4. Server Actions 수정

```typescript
// actions/payments/create-checkout.ts
// import { getMockTossClient } from '@/lib/payments/mock-toss-client';
import { tossPayments } from '@/lib/payments/toss-client';

// const tossClient = getMockTossClient();
// 실제 토스 클라이언트 사용
```

### 5. Webhook 엔드포인트 생성

```typescript
// app/api/payments/webhook/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('toss-signature');
  const payload = await request.text();
  
  // 시그니처 검증
  // 결제 처리
  // DB 업데이트
}
```

---

## 🐛 디버깅

### 로그 확인

모든 결제 플로우는 `console.group`으로 로깅됩니다:

- `[PricingSection]` - 플랜 선택
- `[CreateCheckout]` - 결제 세션 생성
- `[MockTossClient]` - Mock 결제 API 호출
- `[ConfirmPayment]` - 결제 승인
- `[SubscriptionManager]` - 구독 관리
- `[PremiumGate]` - 프리미엄 가드

### 문제 해결

**Q: 결제 버튼을 눌러도 아무 반응이 없어요**
- 브라우저 콘솔에서 에러 확인
- Clerk 로그인 상태 확인
- `createCheckout` Server Action 로그 확인

**Q: 구독 정보가 표시되지 않아요**
- Supabase 테이블에 데이터가 있는지 확인
- `users.is_premium` 필드 확인
- `getCurrentSubscription` 로그 확인

**Q: 프로모션 코드가 적용되지 않아요**
- 코드가 대문자인지 확인 (`LAUNCH2025`)
- 유효 기간 확인
- 이미 사용한 코드인지 확인

---

## 📈 다음 단계

실제 서비스 오픈을 위해:

1. ✅ Mock 결제 → 실제 토스페이먼츠 연동
2. ✅ Webhook 보안 강화 (시그니처 검증)
3. ✅ 정기결제 크론 작업 설정
4. ✅ 이메일 영수증 발송 (Resend 연동)
5. ✅ 결제 실패 재시도 로직
6. ✅ 환불 처리 자동화
7. ✅ 관리자 대시보드에 결제 통계 추가
8. ✅ 세금계산서 발행 시스템
9. ✅ 결제 로그 모니터링 (Sentry)
10. ✅ 보안 감사 및 PCI-DSS 준수 확인

---

**문의**: 시스템 개선 제안이나 버그 리포트는 GitHub Issues에 등록해주세요.

**작성자**: Claude AI  
**최종 업데이트**: 2025-11-27




















