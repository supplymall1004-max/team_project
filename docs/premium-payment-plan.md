# 🎯 맛의 아카이브 프리미엄 결제 시스템 계획서

> **작성일**: 2025-11-27  
> **버전**: V1.0  
> **목적**: 프리미엄 구독 기능 및 결제 시스템 구현 로드맵

---

## 📋 목차

1. [개요](#1-개요)
2. [프리미엄 기능 정의](#2-프리미엄-기능-정의)
3. [가격 정책](#3-가격-정책)
4. [결제 시스템 설계](#4-결제-시스템-설계)
5. [기술 스택](#5-기술-스택)
6. [데이터베이스 설계](#6-데이터베이스-설계)
7. [API 설계](#7-api-설계)
8. [UI/UX 플로우](#8-uiux-플로우)
9. [법적/보안 요구사항](#9-법적보안-요구사항)
10. [구현 로드맵](#10-구현-로드맵)

---

## 1. 개요

### 1.1 목표

"맛의 아카이브"의 지속 가능한 수익 모델 구축을 위해 프리미엄 구독 서비스를 도입합니다.

### 1.2 핵심 가치 제안

| 항목 | 내용 |
|:---|:---|
| **Free 사용자** | 기본 레시피 검색, 제한적 AI 식단 추천, 광고 포함 영상 시청 |
| **Premium 사용자** | 광고 없는 경험, 고급 AI 식단, 가족 맞춤 식단, 독점 콘텐츠 |

### 1.3 예상 효과

- 월간 경상 수익(MRR) 확보
- 사용자 충성도 증가
- 프리미엄 콘텐츠 제작 동기 부여

---

## 2. 프리미엄 기능 정의

### 2.1 현재 구현된 프리미엄 기능

| 기능 ID | 기능명 | 설명 | 구현 상태 |
|:---|:---|:---|:---|
| **P-A1** | 광고 없는 영상 시청 | 레거시 아카이브 명인 인터뷰 HD 영상 광고 제거 | ✅ 완료 (플래그만) |
| **P-C2** | AI 맞춤 식단 접근 | 프리미엄 플래그 기반 식단 추천 | ✅ 완료 (플래그만) |
| **P-C7** | 가족 맞춤 식단 | 가족 구성원별 맞춤 식단 + 통합 식단 생성 | ✅ 완료 (플래그만) |

> **현재 상태**: 기능은 구현되었으나 실제 결제 연동이 없어 플래그를 수동으로 변경해야 함

### 2.2 추가 예정 프리미엄 기능

| 기능 ID | 기능명 | 설명 | 우선순위 |
|:---|:---|:---|:---|
| **P-B1** | 레시피 북마크 무제한 | Free는 10개 제한, Premium은 무제한 | 🔴 High |
| **P-C3** | 주간 식단 다운로드 | PDF/이미지 형식으로 식단표 다운로드 | 🟡 Medium |
| **P-C4** | 영양 리포트 | 월간/주간 영양 섭취 분석 리포트 | 🟡 Medium |
| **P-D1** | 독점 레시피 접근 | 프리미엄 전용 명인 레시피 및 특별 콘텐츠 | 🟢 Low |
| **P-E1** | 우선 고객 지원 | 1:1 영양 상담 월 1회 (영양사 연계) | 🟢 Low |
| **P-F1** | 식단 히스토리 무제한 | Free는 최근 7일, Premium은 전체 히스토리 | 🔴 High |

### 2.3 Free vs Premium 비교표

| 기능 | Free | Premium |
|:---|:---|:---|
| 레시피 검색 | ✅ 무제한 | ✅ 무제한 |
| 레시피 업로드 | ✅ 무제한 | ✅ 무제한 |
| 영상 시청 | ⚠️ 광고 포함 | ✅ 광고 없음 |
| AI 식단 추천 | ⚠️ 기본 (본인만) | ✅ 고급 (가족 포함) |
| 레시피 북마크 | ⚠️ 최대 10개 | ✅ 무제한 |
| 식단 히스토리 | ⚠️ 최근 7일 | ✅ 전체 기록 |
| 장보기 리스트 | ✅ 기본 | ✅ 스마트 집계 |
| 영양 리포트 | ❌ 없음 | ✅ 월간 리포트 |
| 식단 다운로드 | ❌ 없음 | ✅ PDF/이미지 |
| 고객 지원 | ⚠️ 이메일 | ✅ 우선 지원 |

---

## 3. 가격 정책

### 3.1 구독 플랜

| 플랜 | 기간 | 월 환산 가격 | 총 결제액 | 할인율 |
|:---|:---|:---|:---|:---|
| **월간** | 1개월 | 9,900원 | 9,900원 | - |
| **연간** | 12개월 | 7,900원 | 94,800원 | 20% 할인 |

### 3.2 가격 산정 근거

- **경쟁사 분석**: 만개의레시피 프리미엄 (월 5,900원), 요리백과 앱 (월 9,900원)
- **목표 객단가**: 월 평균 8,000원
- **타겟**: 건강/식단 관리에 관심 있는 30-50대 주부 및 직장인

### 3.3 프로모션 전략

| 프로모션 | 조건 | 내용 |
|:---|:---|:---|
| **런칭 할인** | 최초 가입자 1,000명 | 평생 월 6,900원 (30% 할인) |
| **무료 체험** | 신규 가입 시 | 14일 무료 체험 (카드 등록 필수) |
| **친구 추천** | 추천인/피추천인 | 양쪽 모두 1개월 무료 연장 |
| **연간 전환 혜택** | 월간 → 연간 전환 | 첫 연간 결제 시 추가 1개월 무료 |

---

## 4. 결제 시스템 설계

### 4.1 결제 흐름도

```
[사용자] 
   ↓
[프리미엄 가입 페이지]
   ↓
[플랜 선택: 월간/연간]
   ↓
[결제 수단 선택: 카드/간편결제]
   ↓
[PG사 결제 페이지] ← Toss Payments/Portone
   ↓
[결제 승인]
   ↓
[Webhook 수신] → [DB 업데이트]
   ↓
[프리미엄 활성화]
   ↓
[이메일 영수증 발송]
```

### 4.2 정기 결제(구독) 흐름

```
[최초 결제 승인]
   ↓
[빌링키(Billing Key) 발급] ← PG사 저장
   ↓
[DB에 빌링키 저장 (암호화)]
   ↓
[결제 예정일 - 3일]
   ↓
[이메일 알림: "3일 후 결제 예정"]
   ↓
[결제 예정일]
   ↓
[빌링키로 자동 결제 요청]
   ↓
   ├─ [성공] → [구독 연장] → [영수증 발송]
   └─ [실패] → [재시도 (최대 3회)]
         ├─ [성공] → [구독 연장]
         └─ [3회 실패] → [구독 일시 정지] → [이메일 알림]
```

### 4.3 환불 정책

| 구분 | 환불 가능 기간 | 환불액 |
|:---|:---|:---|
| **무료 체험 중** | 언제든지 | 전액 환불 (결제 전) |
| **월간 구독** | 결제 후 7일 이내 미사용 | 전액 환불 |
| **월간 구독** | 결제 후 7일 이후 | 일할 계산 환불 |
| **연간 구독** | 결제 후 14일 이내 미사용 | 전액 환불 |
| **연간 구독** | 결제 후 14일 이후 | 일할 계산 환불 (사용 기간 차감) |

---

## 5. 기술 스택

### 5.1 결제 게이트웨이(PG) 선택

#### 옵션 1: Toss Payments (추천 ⭐)

**장점**:
- 한국 시장 특화, 높은 승인율
- 간편한 SDK 및 문서
- 정기결제(빌링) 안정적 지원
- 수수료: 3.0% (월 거래액 기준)

**단점**:
- 해외 진출 시 제한적

#### 옵션 2: Portone (구 아임포트)

**장점**:
- 다양한 PG사 통합 (KG이니시스, 나이스페이 등)
- 국내외 모두 지원
- 오픈소스 커뮤니티 활성화

**단점**:
- 수수료 약간 높음 (3.3%)
- 초기 설정 복잡도

#### 선택: **Toss Payments** (MVP 단계)

### 5.2 기술 스택 구성

| 계층 | 기술 | 역할 |
|:---|:---|:---|
| **Frontend** | Next.js 15 + React 19 | 결제 UI, 플랜 선택 페이지 |
| **Backend** | Next.js Server Actions | 결제 요청, Webhook 처리 |
| **PG 연동** | Toss Payments SDK | 결제 위젯, API 호출 |
| **Database** | Supabase (PostgreSQL) | 구독 정보, 결제 이력 저장 |
| **인증** | Clerk | 사용자 인증 및 권한 관리 |
| **이메일** | Resend (또는 SendGrid) | 영수증, 알림 발송 |
| **크론 작업** | Supabase Edge Functions | 정기결제 실행, 만료 체크 |

---

## 6. 데이터베이스 설계

### 6.1 테이블 구조

#### `subscriptions` (구독 정보)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 구독 상태
  status TEXT NOT NULL DEFAULT 'inactive', -- active, inactive, cancelled, paused
  plan_type TEXT NOT NULL, -- monthly, yearly
  
  -- 결제 정보
  billing_key TEXT, -- PG사 빌링키 (암호화 필요)
  payment_method TEXT, -- card, kakaopay, naverpay
  last_four_digits TEXT, -- 카드 마지막 4자리
  
  -- 구독 기간
  started_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- 가격
  price_per_month INTEGER NOT NULL, -- 월 환산 가격 (원)
  total_paid INTEGER, -- 실제 결제 금액 (원)
  
  -- 메타
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_period_end ON subscriptions(current_period_end);
```

#### `payment_transactions` (결제 내역)

```sql
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  
  -- 결제 상태
  status TEXT NOT NULL, -- pending, completed, failed, refunded
  transaction_type TEXT NOT NULL, -- subscription, one_time, refund
  
  -- PG 정보
  pg_provider TEXT NOT NULL DEFAULT 'toss_payments',
  pg_transaction_id TEXT UNIQUE, -- PG사 거래 ID
  
  -- 금액
  amount INTEGER NOT NULL, -- 결제 금액 (원)
  tax_amount INTEGER DEFAULT 0, -- 세금 (부가세)
  net_amount INTEGER NOT NULL, -- 순액
  
  -- 결제 수단
  payment_method TEXT, -- card, kakaopay, naverpay
  card_info JSONB, -- { "issuer": "신한", "last_four": "1234", "type": "credit" }
  
  -- 날짜
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- 메타
  metadata JSONB, -- 추가 정보 (영수증 번호, 프로모션 코드 등)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 인덱스
CREATE INDEX idx_transactions_user_id ON payment_transactions(user_id);
CREATE INDEX idx_transactions_subscription_id ON payment_transactions(subscription_id);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_pg_id ON payment_transactions(pg_transaction_id);
```

#### `promo_codes` (프로모션 코드)

```sql
CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL, -- "LAUNCH2025", "FRIEND20"
  
  -- 할인 정보
  discount_type TEXT NOT NULL, -- percentage, fixed_amount, free_trial
  discount_value INTEGER NOT NULL, -- 20 (%), 5000 (원), 30 (일)
  
  -- 사용 제한
  max_uses INTEGER, -- NULL이면 무제한
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  
  -- 적용 조건
  applicable_plans TEXT[], -- ['monthly', 'yearly'] 또는 NULL (모두)
  new_users_only BOOLEAN DEFAULT false,
  
  -- 메타
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT valid_discount CHECK (discount_value > 0)
);

-- 인덱스
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_valid_until ON promo_codes(valid_until);
```

#### `promo_code_uses` (프로모션 사용 내역)

```sql
CREATE TABLE promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  
  used_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(promo_code_id, user_id) -- 사용자당 1회만 사용 가능
);
```

#### `users` 테이블 확장

```sql
-- 기존 users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_premium BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
```

### 6.2 RLS 정책 (개발 단계에서는 비활성화)

```sql
-- 프로덕션 배포 전 활성화 예정
-- ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 구독/결제 정보만 조회 가능
-- CREATE POLICY "Users can view own subscriptions"
--   ON subscriptions FOR SELECT
--   USING (auth.jwt()->>'sub' = user_id::text);
```

---

## 7. API 설계

### 7.1 결제 관련 API

#### `POST /api/payments/checkout`

**설명**: 결제 세션 생성 (Toss Payments 결제창 호출용)

**요청**:
```json
{
  "plan_type": "monthly", // "monthly" | "yearly"
  "promo_code": "LAUNCH2025" // 선택적
}
```

**응답**:
```json
{
  "checkout_url": "https://payment.toss.im/checkout/...",
  "order_id": "order_2025112701234",
  "amount": 9900,
  "final_amount": 6930, // 프로모션 적용 후
  "discount_applied": {
    "code": "LAUNCH2025",
    "discount_value": 2970
  }
}
```

#### `POST /api/payments/webhook`

**설명**: Toss Payments Webhook 수신 (결제 승인/실패 처리)

**요청** (Toss에서 전송):
```json
{
  "eventType": "PAYMENT_APPROVED",
  "orderId": "order_2025112701234",
  "paymentKey": "tviva20241127...",
  "status": "DONE",
  "totalAmount": 9900,
  "method": "카드",
  "cardInfo": {
    "issuerCode": "41",
    "issuerName": "신한카드",
    "number": "1234****",
    "type": "신용"
  }
}
```

**처리 로직**:
1. 시그니처 검증 (Toss Secret Key)
2. `payment_transactions` 레코드 생성/업데이트
3. `subscriptions` 레코드 생성/업데이트
4. `users.is_premium` 활성화
5. 이메일 영수증 발송

#### `GET /api/subscriptions/current`

**설명**: 현재 사용자의 구독 정보 조회

**응답**:
```json
{
  "is_premium": true,
  "subscription": {
    "id": "uuid",
    "status": "active",
    "plan_type": "monthly",
    "current_period_start": "2025-11-01T00:00:00Z",
    "current_period_end": "2025-12-01T00:00:00Z",
    "price_per_month": 9900,
    "next_billing_date": "2025-12-01",
    "payment_method": "카드 (신한 **** 1234)"
  },
  "trial": null
}
```

#### `POST /api/subscriptions/cancel`

**설명**: 구독 취소 (현재 기간 종료 시 자동 해지)

**요청**:
```json
{
  "reason": "서비스 만족도 낮음", // 선택적
  "immediate": false // true면 즉시 해지, false면 기간 종료 시
}
```

**응답**:
```json
{
  "success": true,
  "cancelled_at": "2025-12-01T00:00:00Z",
  "message": "구독이 12월 1일에 종료됩니다. 그 전까지는 프리미엄 혜택을 계속 이용하실 수 있습니다."
}
```

#### `POST /api/subscriptions/reactivate`

**설명**: 취소한 구독 재활성화

**응답**:
```json
{
  "success": true,
  "message": "구독이 다시 활성화되었습니다."
}
```

### 7.2 프로모션 코드 API

#### `POST /api/promo-codes/validate`

**요청**:
```json
{
  "code": "LAUNCH2025",
  "plan_type": "monthly"
}
```

**응답**:
```json
{
  "valid": true,
  "discount": {
    "type": "percentage",
    "value": 30,
    "description": "런칭 기념 30% 할인"
  },
  "original_price": 9900,
  "final_price": 6930
}
```

---

## 8. UI/UX 플로우

### 8.1 결제 페이지 구조

#### `/pricing` (플랜 선택 페이지)

**구성 요소**:
- 플랜 비교 카드 (월간 vs 연간)
- "무료 체험 시작" CTA 버튼
- 기능 비교표 (Free vs Premium)
- FAQ 섹션
- 고객 후기 (추후 추가)

**디자인 포인트**:
- 연간 플랜에 "20% 할인" 뱃지 강조
- 무료 체험 문구: "14일 무료, 언제든 취소 가능"
- 결제 수단 아이콘 (카드, 카카오페이, 네이버페이)

#### `/checkout` (결제 페이지)

**단계별 플로우**:

1. **플랜 확인**
   - 선택한 플랜 요약 (월간/연간, 가격)
   - 프로모션 코드 입력란
   - 적용된 할인 표시

2. **결제 정보 입력**
   - Toss Payments 위젯 임베드
   - 결제 수단 선택 (카드, 간편결제)
   - 약관 동의 체크박스

3. **결제 완료**
   - 감사 메시지
   - 영수증 이메일 발송 안내
   - "프리미엄 기능 둘러보기" CTA

### 8.2 구독 관리 페이지

#### `/account/subscription` (구독 관리)

**Free 사용자 화면**:
- "프리미엄으로 업그레이드" CTA 배너
- 프리미엄 혜택 미리보기
- "14일 무료 체험 시작" 버튼

**Premium 사용자 화면**:
- 현재 플랜 정보 (시작일, 다음 결제일, 금액)
- 결제 수단 변경 버튼
- 결제 내역 (최근 3개월)
- "플랜 변경" 버튼 (월간 ↔ 연간)
- "구독 취소" 링크 (하단에 작게)

**구독 취소 플로우**:
1. "구독 취소" 클릭
2. 모달: "정말 취소하시겠습니까?" + 이탈 방지 혜택 제안
3. 취소 사유 선택 (선택적)
4. "즉시 취소" vs "기간 종료 시 취소" 선택
5. 최종 확인 및 처리

### 8.3 프리미엄 전용 콘텐츠 접근 제어

**Free 사용자가 프리미엄 기능 접근 시**:
- 블러 처리된 미리보기 또는 "자물쇠" 아이콘
- 툴팁: "프리미엄 전용 기능입니다"
- "프리미엄 시작하기" 버튼 → `/pricing`으로 이동

**예시 화면**:
```
[가족 맞춤 식단 카드]
  🔒 프리미엄 전용
  "가족 구성원별 맞춤 식단을 받아보세요"
  [프리미엄 시작하기 →]
```

---

## 9. 법적/보안 요구사항

### 9.1 전자상거래법 준수

**필수 고지 사항** (`/pricing`, `/checkout` 페이지):
- 사업자 정보 (상호, 대표, 사업자등록번호, 통신판매업 신고번호)
- 환불 정책 명시
- 이용약관 및 개인정보처리방침 동의
- 청약철회 가능 기간 (7일/14일)

### 9.2 개인정보 보호

| 항목 | 조치 |
|:---|:---|
| **결제 정보 저장** | PG사(Toss)에 위임, 자체 서버에는 빌링키만 암호화 저장 |
| **카드 정보** | 카드 번호 전체는 저장 안 함, 마지막 4자리만 저장 |
| **결제 로그** | 개인정보 최소화 (이름, 연락처 제외) |
| **SSL/TLS** | HTTPS 필수, Supabase 기본 적용 |

### 9.3 PCI-DSS 준수

- **카드 정보 직접 처리 금지**: Toss Payments가 PCI-DSS 인증 보유, 우리는 빌링키만 사용
- **토큰화**: 카드 번호 대신 빌링키(토큰)만 DB 저장
- **암호화**: 빌링키는 Supabase `pgcrypto` 확장으로 암호화

### 9.4 세금 계산서 발행

- **면세 서비스**: 디지털 콘텐츠 구독은 부가세 면세 대상 (단, 확인 필요)
- **영수증 발행**: 이메일로 자동 발송, 마이페이지에서 재다운로드 가능
- **세금계산서**: 사업자 사용자 요청 시 별도 발행 (수동 처리)

---

## 10. 구현 로드맵

### Phase 0: 사전 준비 (1주)

- [ ] Toss Payments 계정 생성 및 API 키 발급
- [ ] 사업자 정보 등록 (통신판매업 신고번호)
- [ ] 환불 정책 및 이용약관 작성/검토
- [ ] 결제 테스트 환경 설정

### Phase 1: 데이터베이스 & 백엔드 (2주)

- [ ] 마이그레이션 작성
  - [ ] `subscriptions` 테이블
  - [ ] `payment_transactions` 테이블
  - [ ] `promo_codes` 테이블
  - [ ] `promo_code_uses` 테이블
  - [ ] `users` 테이블 확장
- [ ] Server Actions 작성
  - [ ] `actions/payments/create-checkout.ts`
  - [ ] `actions/payments/process-webhook.ts`
  - [ ] `actions/subscriptions/get-current.ts`
  - [ ] `actions/subscriptions/cancel.ts`
  - [ ] `actions/subscriptions/reactivate.ts`
- [ ] Toss Payments SDK 연동
  - [ ] `lib/payments/toss-client.ts`
  - [ ] Webhook 시그니처 검증
  - [ ] 빌링키 발급 로직
- [ ] 유틸리티 함수
  - [ ] `lib/payments/billing-key-encryption.ts` (암호화/복호화)
  - [ ] `lib/payments/promo-code-validator.ts`
  - [ ] `lib/payments/subscription-checker.ts` (만료 체크)

### Phase 2: 프론트엔드 UI (2주)

- [ ] 플랜 선택 페이지 (`app/pricing/page.tsx`)
  - [ ] 플랜 비교 카드 컴포넌트
  - [ ] 기능 비교표
  - [ ] FAQ 섹션
- [ ] 결제 페이지 (`app/checkout/page.tsx`)
  - [ ] Toss Payment Widget 임베드
  - [ ] 프로모션 코드 입력
  - [ ] 약관 동의 체크박스
- [ ] 결제 완료 페이지 (`app/checkout/success/page.tsx`)
- [ ] 결제 실패 페이지 (`app/checkout/fail/page.tsx`)
- [ ] 구독 관리 페이지 (`app/account/subscription/page.tsx`)
  - [ ] 현재 구독 정보 표시
  - [ ] 결제 내역 테이블
  - [ ] 플랜 변경 다이얼로그
  - [ ] 구독 취소 모달
- [ ] 프리미엄 전용 콘텐츠 가드 컴포넌트
  - [ ] `components/premium/premium-gate.tsx`
  - [ ] `components/premium/upgrade-banner.tsx`

### Phase 3: 이메일 & 알림 (1주)

- [ ] 이메일 템플릿 작성
  - [ ] 영수증 이메일
  - [ ] 결제 예정 알림 (3일 전)
  - [ ] 결제 실패 알림
  - [ ] 구독 취소 확인
  - [ ] 구독 만료 알림
- [ ] Resend(또는 SendGrid) 연동
  - [ ] `lib/email/send-receipt.ts`
  - [ ] `lib/email/send-payment-reminder.ts`

### Phase 4: 크론 작업 (1주)

- [ ] Supabase Edge Function 생성
  - [ ] `supabase/functions/process-recurring-payments/index.ts`
    - 매일 오전 3시 실행
    - 다음 결제일이 오늘인 구독 조회
    - 빌링키로 자동 결제 요청
    - 성공/실패 처리 및 이메일 발송
  - [ ] `supabase/functions/check-subscription-expiry/index.ts`
    - 매일 오전 4시 실행
    - 만료된 구독 찾기
    - `users.is_premium` 비활성화
    - 만료 알림 이메일 발송
- [ ] 크론 스케줄 설정 (`supabase/functions/.config/`)

### Phase 5: 프로모션 & 마케팅 (1주)

- [ ] 관리자 페이지에 프로모션 코드 관리 추가
  - [ ] `/admin/promo-codes` 페이지
  - [ ] 코드 생성/삭제 UI
  - [ ] 사용 현황 대시보드
- [ ] 런칭 프로모션 준비
  - [ ] "LAUNCH2025" 코드 생성 (30% 할인)
  - [ ] 프리미엄 소개 랜딩 페이지
  - [ ] SNS 공유 이미지 제작
- [ ] 친구 추천 시스템 (선택적)
  - [ ] 추천 링크 생성
  - [ ] 추천 성공 시 양쪽 리워드

### Phase 6: 테스트 & QA (1주)

- [ ] 단위 테스트
  - [ ] 결제 로직 테스트
  - [ ] 프로모션 코드 검증 테스트
  - [ ] 구독 만료 체크 테스트
- [ ] 통합 테스트
  - [ ] Toss Payments 샌드박스 환경에서 전체 플로우 테스트
  - [ ] Webhook 시뮬레이션
  - [ ] 정기결제 시뮬레이션
- [ ] E2E 테스트 (Playwright)
  - [ ] 플랜 선택 → 결제 → 완료 플로우
  - [ ] 구독 취소 플로우
  - [ ] 프리미엄 콘텐츠 접근 제어
- [ ] 보안 테스트
  - [ ] SQL Injection 방지 확인
  - [ ] XSS 방지 확인
  - [ ] 암호화 검증

### Phase 7: 프로덕션 배포 (1주)

- [ ] Toss Payments 프로덕션 API 키로 전환
- [ ] 환경 변수 프로덕션 설정
- [ ] 결제 모니터링 대시보드 설정
- [ ] 에러 추적 (Sentry 등)
- [ ] 소프트 런칭 (베타 테스터 50명)
- [ ] 피드백 수집 및 버그 수정
- [ ] 공식 런칭 🚀

---

## 📊 예상 일정

| Phase | 기간 | 담당 | 우선순위 |
|:---|:---|:---|:---|
| Phase 0: 사전 준비 | 1주 | 기획/법무 | 🔴 Critical |
| Phase 1: DB & Backend | 2주 | 백엔드 개발자 | 🔴 Critical |
| Phase 2: Frontend UI | 2주 | 프론트엔드 개발자 | 🔴 Critical |
| Phase 3: 이메일 & 알림 | 1주 | 풀스택 개발자 | 🟡 High |
| Phase 4: 크론 작업 | 1주 | 백엔드 개발자 | 🟡 High |
| Phase 5: 프로모션 | 1주 | 마케팅/개발 | 🟢 Medium |
| Phase 6: 테스트 & QA | 1주 | QA/개발 전체 | 🔴 Critical |
| Phase 7: 배포 | 1주 | DevOps/개발 | 🔴 Critical |

**총 예상 기간**: **10주 (약 2.5개월)**

---

## 💰 예상 비용

### 초기 개발 비용

| 항목 | 비용 | 비고 |
|:---|:---|:---|
| Toss Payments 가입 | 무료 | 거래 수수료만 발생 |
| 도메인 & SSL | 연 20,000원 | Let's Encrypt 무료 or 유료 인증서 |
| 법률 자문 | 500,000원 | 이용약관, 환불정책 검토 |
| 디자인 에셋 | 200,000원 | 결제 페이지 UI/UX |

### 월간 운영 비용

| 항목 | 비용 | 계산 근거 |
|:---|:---|:---|
| **거래 수수료** | 변동 | 거래액의 3.0% (Toss Payments) |
| **이메일 발송** | 월 10,000원 | Resend 무료(3,000통) → 유료(월 $20) |
| **Supabase** | 월 25,000원 | Pro Plan ($25/월) |
| **모니터링** | 월 0-15,000원 | Sentry 무료 or 유료 |

**예시 계산** (월간 구독자 100명 기준):
- 월 매출: 100명 × 9,900원 = 990,000원
- 거래 수수료: 990,000원 × 3.0% = 29,700원
- 운영 비용: 29,700원 + 10,000원 + 25,000원 = 64,700원
- **순이익**: 925,300원

---

## 🚨 리스크 & 대응 전략

| 리스크 | 확률 | 영향 | 대응 전략 |
|:---|:---|:---|:---|
| **결제 실패율 높음** | 중 | 높음 | 여러 PG사 연동, 실패 시 재시도 로직 |
| **환불 요청 급증** | 중 | 중 | 환불 정책 명확화, 만족도 설문 시행 |
| **법적 이슈** | 낮 | 높음 | 사전 법률 검토, 이용약관 정기 업데이트 |
| **보안 사고** | 낮 | 매우 높음 | PCI-DSS 준수, 정기 보안 감사 |
| **구독 이탈율 높음** | 중 | 높음 | 프리미엄 기능 지속 개선, 사용자 피드백 수집 |

---

## 📈 성공 지표 (KPI)

| 지표 | 목표 (3개월) | 측정 방법 |
|:---|:---|:---|
| **프리미엄 전환율** | 5% | (프리미엄 가입 / 전체 가입자) × 100 |
| **무료 체험 → 유료 전환** | 40% | (유료 전환 / 체험 시작) × 100 |
| **월간 이탈율 (Churn)** | 10% 이하 | (해지 / 전월 구독자) × 100 |
| **평균 구독 기간** | 6개월 이상 | 총 구독 월수 / 구독자 수 |
| **월간 경상 수익 (MRR)** | 3,000,000원 | 전체 프리미엄 구독자의 월 합계 |

---

## 📚 참고 자료

### 문서
- [Toss Payments 개발자 문서](https://docs.tosspayments.com/)
- [전자상거래법 가이드](https://www.ftc.go.kr/)
- [개인정보보호법](https://www.pipc.go.kr/)

### 코드 예시
- `docs/payment-webhook-example.md` — Webhook 처리 예시
- `docs/billing-key-usage.md` — 정기결제 구현 가이드

---

## 🔄 버전 히스토리

| 버전 | 날짜 | 작성자 | 변경 내용 |
|:---|:---|:---|:---|
| V1.0 | 2025-11-27 | Claude | 초안 작성 |

---

**다음 단계**: Phase 0 착수 및 Toss Payments 계정 생성

질문이나 수정 사항이 있으면 언제든 말씀해주세요! 🙌




















