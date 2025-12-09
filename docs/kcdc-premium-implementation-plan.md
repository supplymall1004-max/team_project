# KCDC 프리미엄 기능 구현 계획서

> **작성일**: 2025-01-27  
> **기반 문서**: `plan.plan.md`, `api.plan.md`, `docs/PRD.md`, `docs/TODO.md`  
> **UI/UX 참고**: `docs/01_UI_UX.md`, `docs/02.md`, `docs/03.md`, `docs/04.md`

---

## 📋 목차

1. [개요](#개요)
2. [전체 구조](#전체-구조)
3. [Phase 1: 핵심 프리미엄 기능](#phase-1-핵심-프리미엄-기능)
4. [Phase 9: 주기적 건강 관리 서비스](#phase-9-주기적-건강-관리-서비스)
5. [파일 구조](#파일-구조)
6. [구현 우선순위](#구현-우선순위)
7. [체크리스트](#체크리스트)

---

## 개요

### 목표

KCDC(질병관리청) 공개 데이터와 사용자 건강 정보를 결합하여 개인 맞춤형 프리미엄 건강 관리 서비스를 제공합니다.

### 주요 기능

**Phase 1 (핵심 기능)**:
- 감염병 위험 지수 계산 및 모니터링
- 예방접종 기록 및 일정 관리
- 여행 위험도 평가
- 건강검진 기록 및 권장 일정 관리

**Phase 9 (주기적 관리)**:
- 주기적 건강 관리 서비스 (예방접종, 건강검진, 구충제 등)
- 구충제 복용 기록 관리
- 알림 설정 및 리마인더 시스템

### 기술 스택

- **프론트엔드**: Next.js 15, React 19, Tailwind CSS v4, shadcn/ui
- **백엔드**: Next.js API Routes, Supabase (PostgreSQL)
- **인증**: Clerk
- **타입**: TypeScript (strict mode)

---

## 전체 구조

### 데이터베이스 스키마

✅ **이미 완료**: `supabase/migrations/20250127120000_create_kcdc_premium_tables.sql`

**새 테이블 (Phase 1)**:
- `user_infection_risk_scores` - 감염병 위험 지수
- `user_vaccination_records` - 예방접종 기록
- `user_vaccination_schedules` - 예방접종 일정
- `user_travel_risk_assessments` - 여행 위험도 평가
- `user_health_checkup_records` - 건강검진 기록
- `user_health_checkup_recommendations` - 건강검진 권장 일정
- `kcdc_disease_outbreaks` - 감염병 발생 정보 캐시 (확장)
- `kcdc_health_checkup_statistics` - 건강검진 통계 캐시

**새 테이블 (Phase 9)**:
- `user_periodic_health_services` - 주기적 건강 관리 서비스
- `user_deworming_records` - 구충제 복용 기록
- `deworming_medications` - 구충제 마스터 데이터
- `user_periodic_service_reminders` - 주기적 서비스 알림 로그
- `user_notification_settings` - 사용자 알림 설정

**기존 테이블 확장**:
- `user_health_profiles`: `vaccination_history`, `last_health_checkup_date`, `region` 추가
- `family_members`: `vaccination_history`, `last_health_checkup_date` 추가

### 아키텍처 패턴

```
┌─────────────────────────────────────────────────────────┐
│                    클라이언트 (Browser)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Pages      │  │  Components  │  │    Hooks     │ │
│  │ (app/health) │  │ (components/ │  │  (hooks/)    │ │
│  │              │  │   health/)   │  │              │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↕ HTTP/JSON
┌─────────────────────────────────────────────────────────┐
│              Next.js API Routes (Server)                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  app/api/health/kcdc-premium/                    │  │
│  │    - risk-scores/                                │  │
│  │    - vaccinations/                               │  │
│  │    - travel-risk/                                │  │
│  │    - checkups/                                   │  │
│  │    - periodic-services/ (Phase 9)                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ Supabase Client
┌─────────────────────────────────────────────────────────┐
│              비즈니스 로직 레이어                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │  lib/kcdc/                                       │  │
│  │    - risk-calculator.ts                          │  │
│  │    - vaccination-manager.ts                      │  │
│  │    - travel-risk-assessor.ts                      │  │
│  │    - checkup-manager.ts                          │  │
│  │    - periodic-service-manager.ts (Phase 9)       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕ Supabase Client
┌─────────────────────────────────────────────────────────┐
│              데이터베이스 (Supabase)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  PostgreSQL Tables                               │  │
│  │    - user_infection_risk_scores                   │  │
│  │    - user_vaccination_*                          │  │
│  │    - user_travel_risk_assessments                 │  │
│  │    - user_health_checkup_*                       │  │
│  │    - user_periodic_health_services (Phase 9)     │  │
│  │    - user_deworming_records (Phase 9)            │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Phase 1: 핵심 프리미엄 기능

### 1.1 감염병 위험 지수 (Infection Risk Score)

#### 기능 설명
사용자의 건강 정보(질병, 연령, 지역, 예방접종 이력)와 KCDC 감염병 발생 데이터를 결합하여 개인별 감염병 위험 지수를 계산합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface InfectionRiskScore {
  id: string;
  user_id: string;
  family_member_id?: string;
  risk_score: number; // 0-100
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  flu_stage?: string;
  flu_week?: string;
  region?: string;
  factors: {
    age?: number;
    diseases?: string[];
    vaccination_status?: Record<string, boolean>;
    region_risk?: number;
  };
  recommendations: string[];
  calculated_at: string;
  expires_at?: string;
}
```

**비즈니스 로직** (`lib/kcdc/risk-calculator.ts`):
- 위험 지수 계산 알고리즘
- KCDC 감염병 발생 데이터 조회
- 사용자 건강 프로필 기반 위험 요인 분석
- 권장 사항 생성

**API 라우트** (`app/api/health/kcdc-premium/risk-scores/route.ts`):
- `GET /api/health/kcdc-premium/risk-scores` - 위험 지수 조회
- `POST /api/health/kcdc-premium/risk-scores/calculate` - 위험 지수 계산

**UI 컴포넌트** (`components/health/infection-risk-card.tsx`):
- 위험 지수 표시 카드
- 위험 등급별 색상 구분
- 권장 사항 리스트
- 위험 요인 상세 보기

**페이지** (`app/(dashboard)/health/premium/infection-risk/page.tsx`):
- 감염병 위험 지수 대시보드
- 가족 구성원별 위험 지수 비교
- 위험 지수 히스토리 차트

---

### 1.2 예방접종 기록 및 일정 관리

#### 기능 설명
사용자 및 가족 구성원의 예방접종 기록을 관리하고, KCDC 권장 일정에 따라 예방접종 일정을 자동 생성합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface VaccinationRecord {
  id: string;
  user_id: string;
  family_member_id?: string;
  vaccine_name: string;
  vaccine_code?: string;
  target_age_group?: string;
  scheduled_date?: string;
  completed_date?: string;
  dose_number: number;
  total_doses: number;
  vaccination_site?: string;
  reminder_enabled: boolean;
  notes?: string;
}

export interface VaccinationSchedule {
  id: string;
  user_id: string;
  family_member_id: string;
  vaccine_name: string;
  recommended_date: string;
  priority: 'required' | 'recommended' | 'optional';
  status: 'pending' | 'completed' | 'skipped';
  source: 'kcdc' | 'user_input';
}
```

**비즈니스 로직** (`lib/kcdc/vaccination-manager.ts`):
- KCDC 예방접종 일정 파싱
- 사용자 연령대별 권장 일정 생성
- 예방접종 기록 CRUD
- 일정 자동 업데이트

**API 라우트** (`app/api/health/kcdc-premium/vaccinations/route.ts`):
- `GET /api/health/kcdc-premium/vaccinations` - 예방접종 기록 조회
- `POST /api/health/kcdc-premium/vaccinations` - 예방접종 기록 추가
- `PUT /api/health/kcdc-premium/vaccinations/[id]` - 예방접종 기록 수정
- `GET /api/health/kcdc-premium/vaccinations/schedules` - 예방접종 일정 조회
- `POST /api/health/kcdc-premium/vaccinations/schedules/sync` - KCDC 일정 동기화

**UI 컴포넌트**:
- `components/health/vaccination-record-card.tsx` - 예방접종 기록 카드
- `components/health/vaccination-schedule-list.tsx` - 예방접종 일정 리스트
- `components/health/vaccination-form.tsx` - 예방접종 기록 입력 폼

**페이지** (`app/(dashboard)/health/premium/vaccinations/page.tsx`):
- 예방접종 기록 및 일정 관리 페이지
- 가족 구성원별 탭
- 캘린더 뷰

---

### 1.3 여행 위험도 평가

#### 기능 설명
여행 목적지의 감염병 발생 현황을 조회하고, 사용자 건강 정보를 기반으로 여행 위험도를 평가합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface TravelRiskAssessment {
  id: string;
  user_id: string;
  destination_country: string;
  destination_region?: string;
  travel_start_date: string;
  travel_end_date: string;
  risk_level: 'low' | 'moderate' | 'high' | 'critical';
  disease_alerts: Array<{
    disease_name: string;
    severity: string;
    description: string;
  }>;
  prevention_checklist: string[];
  vaccination_requirements: Array<{
    vaccine_name: string;
    required: boolean;
    recommended_date?: string;
  }>;
}
```

**비즈니스 로직** (`lib/kcdc/travel-risk-assessor.ts`):
- 목적지 감염병 발생 데이터 조회
- 위험도 계산 알고리즘
- 필수/권장 백신 목록 생성
- 예방 체크리스트 생성

**API 라우트** (`app/api/health/kcdc-premium/travel-risk/route.ts`):
- `POST /api/health/kcdc-premium/travel-risk/assess` - 여행 위험도 평가
- `GET /api/health/kcdc-premium/travel-risk` - 평가 이력 조회

**UI 컴포넌트**:
- `components/health/travel-risk-form.tsx` - 여행 정보 입력 폼
- `components/health/travel-risk-result.tsx` - 위험도 평가 결과 카드
- `components/health/travel-prevention-checklist.tsx` - 예방 체크리스트

**페이지** (`app/(dashboard)/health/premium/travel-risk/page.tsx`):
- 여행 위험도 평가 페이지
- 평가 이력 목록

---

### 1.4 건강검진 기록 및 권장 일정

#### 기능 설명
건강검진 기록을 관리하고, 연령대별 권장 검진 일정을 추적합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface HealthCheckupRecord {
  id: string;
  user_id: string;
  family_member_id?: string;
  checkup_type: 'national' | 'cancer' | 'special';
  checkup_date: string;
  checkup_site?: string;
  results: Record<string, any>;
  next_recommended_date?: string;
  overdue_days?: number;
}

export interface HealthCheckupRecommendation {
  id: string;
  user_id: string;
  family_member_id: string;
  checkup_type: string;
  checkup_name: string;
  recommended_date: string;
  priority: 'high' | 'medium' | 'low';
  overdue: boolean;
  last_checkup_date?: string;
  age_requirement?: string;
  gender_requirement?: string;
}
```

**비즈니스 로직** (`lib/kcdc/checkup-manager.ts`):
- 연령대별 권장 검진 일정 생성
- 검진 기록 CRUD
- 연체 검진 알림 생성
- KCDC 건강검진 통계 활용

**API 라우트** (`app/api/health/kcdc-premium/checkups/route.ts`):
- `GET /api/health/kcdc-premium/checkups/records` - 검진 기록 조회
- `POST /api/health/kcdc-premium/checkups/records` - 검진 기록 추가
- `GET /api/health/kcdc-premium/checkups/recommendations` - 권장 일정 조회
- `POST /api/health/kcdc-premium/checkups/recommendations/sync` - 권장 일정 동기화

**UI 컴포넌트**:
- `components/health/checkup-record-card.tsx` - 검진 기록 카드
- `components/health/checkup-recommendation-list.tsx` - 권장 일정 리스트
- `components/health/checkup-form.tsx` - 검진 기록 입력 폼
- `components/health/checkup-overdue-alert.tsx` - 연체 검진 알림

**페이지** (`app/(dashboard)/health/premium/checkups/page.tsx`):
- 건강검진 관리 페이지
- 검진 기록 및 권장 일정 통합 뷰

---

## Phase 9: 주기적 건강 관리 서비스

### 9.1 주기적 건강 관리 서비스

#### 기능 설명
예방접종, 건강검진, 구충제 복용 등 주기적으로 수행해야 하는 건강 관리 서비스를 통합 관리합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface PeriodicHealthService {
  id: string;
  user_id: string;
  family_member_id?: string;
  service_type: 'vaccination' | 'checkup' | 'deworming' | 'disease_management' | 'other';
  service_name: string;
  cycle_type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  cycle_days?: number;
  last_service_date?: string;
  next_service_date: string;
  reminder_days_before: number;
  reminder_enabled: boolean;
  notes?: string;
  is_active: boolean;
}
```

**비즈니스 로직** (`lib/kcdc/periodic-service-manager.ts`):
- 주기적 서비스 CRUD
- 다음 서비스 일정 자동 계산
- 알림 생성 로직

**API 라우트** (`app/api/health/kcdc-premium/periodic-services/route.ts`):
- `GET /api/health/kcdc-premium/periodic-services` - 서비스 목록 조회
- `POST /api/health/kcdc-premium/periodic-services` - 서비스 추가
- `PUT /api/health/kcdc-premium/periodic-services/[id]` - 서비스 수정
- `DELETE /api/health/kcdc-premium/periodic-services/[id]` - 서비스 삭제

**UI 컴포넌트**:
- `components/health/periodic-service-list.tsx` - 서비스 목록
- `components/health/periodic-service-form.tsx` - 서비스 입력 폼
- `components/health/periodic-service-card.tsx` - 서비스 카드

---

### 9.2 구충제 복용 기록

#### 기능 설명
구충제 복용 기록을 관리하고 다음 복용 일정을 추적합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface DewormingRecord {
  id: string;
  user_id: string;
  family_member_id?: string;
  medication_name: string;
  dosage: string;
  taken_date: string;
  next_due_date?: string;
  cycle_days: number;
  prescribed_by?: string;
  notes?: string;
}

export interface DewormingMedication {
  id: string;
  medication_name: string;
  active_ingredient: string;
  standard_dosage: string;
  standard_cycle_days: number;
  target_parasites: string[];
  age_group?: string;
  contraindications: string[];
}
```

**비즈니스 로직** (`lib/kcdc/deworming-manager.ts`):
- 구충제 복용 기록 CRUD
- 다음 복용 일정 계산
- 구충제 마스터 데이터 조회

**API 라우트** (`app/api/health/kcdc-premium/deworming/route.ts`):
- `GET /api/health/kcdc-premium/deworming/records` - 복용 기록 조회
- `POST /api/health/kcdc-premium/deworming/records` - 복용 기록 추가
- `GET /api/health/kcdc-premium/deworming/medications` - 구충제 목록 조회

**UI 컴포넌트**:
- `components/health/deworming-record-card.tsx` - 복용 기록 카드
- `components/health/deworming-form.tsx` - 복용 기록 입력 폼

---

### 9.3 알림 설정

#### 기능 설명
주기적 서비스 알림 설정을 관리합니다.

#### 구현 항목

**타입 정의** (`types/kcdc.ts` 확장):
```typescript
export interface UserNotificationSettings {
  id: string;
  user_id: string;
  periodic_services_enabled: boolean;
  periodic_services_reminder_days: number;
  deworming_reminders_enabled: boolean;
  vaccination_reminders_enabled: boolean;
  checkup_reminders_enabled: boolean;
  infection_risk_alerts_enabled: boolean;
  travel_risk_alerts_enabled: boolean;
}
```

**API 라우트** (`app/api/health/kcdc-premium/notification-settings/route.ts`):
- `GET /api/health/kcdc-premium/notification-settings` - 알림 설정 조회
- `PUT /api/health/kcdc-premium/notification-settings` - 알림 설정 업데이트

**UI 컴포넌트**:
- `components/health/premium-notification-settings.tsx` - 알림 설정 폼

---

## 파일 구조

### 새로 생성할 파일

```
types/
  └── kcdc.ts (확장)
      - InfectionRiskScore
      - VaccinationRecord
      - VaccinationSchedule
      - TravelRiskAssessment
      - HealthCheckupRecord
      - HealthCheckupRecommendation
      - PeriodicHealthService
      - DewormingRecord
      - DewormingMedication
      - UserNotificationSettings

lib/
  └── kcdc/
      ├── risk-calculator.ts (신규)
      ├── vaccination-manager.ts (신규)
      ├── travel-risk-assessor.ts (신규)
      ├── checkup-manager.ts (신규)
      ├── periodic-service-manager.ts (신규, Phase 9)
      └── deworming-manager.ts (신규, Phase 9)

app/
  └── api/
      └── health/
          └── kcdc-premium/
              ├── risk-scores/
              │   └── route.ts
              ├── vaccinations/
              │   ├── route.ts
              │   ├── schedules/
              │   │   └── route.ts
              │   └── [id]/
              │       └── route.ts
              ├── travel-risk/
              │   └── route.ts
              ├── checkups/
              │   ├── records/
              │   │   └── route.ts
              │   └── recommendations/
              │       └── route.ts
              ├── periodic-services/ (Phase 9)
              │   ├── route.ts
              │   └── [id]/
              │       └── route.ts
              ├── deworming/ (Phase 9)
              │   ├── records/
              │   │   └── route.ts
              │   └── medications/
              │       └── route.ts
              └── notification-settings/ (Phase 9)
                  └── route.ts

app/
  └── (dashboard)/
      └── health/
          └── premium/
              ├── page.tsx (프리미엄 건강 관리 대시보드)
              ├── infection-risk/
              │   └── page.tsx
              ├── vaccinations/
              │   └── page.tsx
              ├── travel-risk/
              │   └── page.tsx
              ├── checkups/
              │   └── page.tsx
              └── periodic-services/ (Phase 9)
                  └── page.tsx

components/
  └── health/
      ├── infection-risk-card.tsx (신규)
      ├── vaccination-record-card.tsx (신규)
      ├── vaccination-schedule-list.tsx (신규)
      ├── vaccination-form.tsx (신규)
      ├── travel-risk-form.tsx (신규)
      ├── travel-risk-result.tsx (신규)
      ├── travel-prevention-checklist.tsx (신규)
      ├── checkup-record-card.tsx (신규)
      ├── checkup-recommendation-list.tsx (신규)
      ├── checkup-form.tsx (신규)
      ├── checkup-overdue-alert.tsx (신규)
      ├── periodic-service-list.tsx (신규, Phase 9)
      ├── periodic-service-form.tsx (신규, Phase 9)
      ├── periodic-service-card.tsx (신규, Phase 9)
      ├── deworming-record-card.tsx (신규, Phase 9)
      ├── deworming-form.tsx (신규, Phase 9)
      └── premium-notification-settings.tsx (신규, Phase 9)
```

---

## 구현 우선순위

### Phase 1 구현 순서

1. **타입 정의** (1일)
   - `types/kcdc.ts` 확장
   - 모든 인터페이스 정의

2. **비즈니스 로직** (3일)
   - `lib/kcdc/risk-calculator.ts`
   - `lib/kcdc/vaccination-manager.ts`
   - `lib/kcdc/travel-risk-assessor.ts`
   - `lib/kcdc/checkup-manager.ts`

3. **API 라우트** (3일)
   - 모든 API 엔드포인트 구현
   - 프리미엄 가드 적용
   - 에러 핸들링

4. **UI 컴포넌트** (4일)
   - 카드 컴포넌트
   - 폼 컴포넌트
   - 리스트 컴포넌트

5. **페이지** (2일)
   - 각 기능별 페이지 구현
   - 프리미엄 가드 적용

**총 예상 기간**: 약 13일 (Phase 1)

### Phase 9 구현 순서

1. **타입 정의** (0.5일)
2. **비즈니스 로직** (2일)
3. **API 라우트** (2일)
4. **UI 컴포넌트** (2일)
5. **페이지** (1일)

**총 예상 기간**: 약 7.5일 (Phase 9)

---

## 체크리스트

### Phase 1 체크리스트

#### 타입 정의
- [ ] `types/kcdc.ts` 확장
  - [ ] `InfectionRiskScore` 인터페이스
  - [ ] `VaccinationRecord` 인터페이스
  - [ ] `VaccinationSchedule` 인터페이스
  - [ ] `TravelRiskAssessment` 인터페이스
  - [ ] `HealthCheckupRecord` 인터페이스
  - [ ] `HealthCheckupRecommendation` 인터페이스

#### 비즈니스 로직
- [ ] `lib/kcdc/risk-calculator.ts`
  - [ ] 위험 지수 계산 함수
  - [ ] KCDC 데이터 조회 함수
  - [ ] 권장 사항 생성 함수
- [ ] `lib/kcdc/vaccination-manager.ts`
  - [ ] 예방접종 기록 CRUD 함수
  - [ ] 일정 생성 함수
  - [ ] KCDC 일정 동기화 함수
- [ ] `lib/kcdc/travel-risk-assessor.ts`
  - [ ] 여행 위험도 평가 함수
  - [ ] 백신 요구사항 조회 함수
- [ ] `lib/kcdc/checkup-manager.ts`
  - [ ] 검진 기록 CRUD 함수
  - [ ] 권장 일정 생성 함수

#### API 라우트
- [ ] `app/api/health/kcdc-premium/risk-scores/route.ts`
- [ ] `app/api/health/kcdc-premium/vaccinations/route.ts`
- [ ] `app/api/health/kcdc-premium/vaccinations/schedules/route.ts`
- [ ] `app/api/health/kcdc-premium/travel-risk/route.ts`
- [ ] `app/api/health/kcdc-premium/checkups/records/route.ts`
- [ ] `app/api/health/kcdc-premium/checkups/recommendations/route.ts`

#### UI 컴포넌트
- [ ] `components/health/infection-risk-card.tsx`
- [ ] `components/health/vaccination-record-card.tsx`
- [ ] `components/health/vaccination-schedule-list.tsx`
- [ ] `components/health/vaccination-form.tsx`
- [ ] `components/health/travel-risk-form.tsx`
- [ ] `components/health/travel-risk-result.tsx`
- [ ] `components/health/checkup-record-card.tsx`
- [ ] `components/health/checkup-recommendation-list.tsx`
- [ ] `components/health/checkup-form.tsx`

#### 페이지
- [ ] `app/(dashboard)/health/premium/page.tsx` (대시보드)
- [ ] `app/(dashboard)/health/premium/infection-risk/page.tsx`
- [ ] `app/(dashboard)/health/premium/vaccinations/page.tsx`
- [ ] `app/(dashboard)/health/premium/travel-risk/page.tsx`
- [ ] `app/(dashboard)/health/premium/checkups/page.tsx`

### Phase 9 체크리스트

#### 타입 정의
- [ ] `types/kcdc.ts` 확장
  - [ ] `PeriodicHealthService` 인터페이스
  - [ ] `DewormingRecord` 인터페이스
  - [ ] `DewormingMedication` 인터페이스
  - [ ] `UserNotificationSettings` 인터페이스

#### 비즈니스 로직
- [ ] `lib/kcdc/periodic-service-manager.ts`
- [ ] `lib/kcdc/deworming-manager.ts`

#### API 라우트
- [ ] `app/api/health/kcdc-premium/periodic-services/route.ts`
- [ ] `app/api/health/kcdc-premium/deworming/records/route.ts`
- [ ] `app/api/health/kcdc-premium/deworming/medications/route.ts`
- [ ] `app/api/health/kcdc-premium/notification-settings/route.ts`

#### UI 컴포넌트
- [ ] `components/health/periodic-service-list.tsx`
- [ ] `components/health/periodic-service-form.tsx`
- [ ] `components/health/deworming-record-card.tsx`
- [ ] `components/health/deworming-form.tsx`
- [ ] `components/health/premium-notification-settings.tsx`

#### 페이지
- [ ] `app/(dashboard)/health/premium/periodic-services/page.tsx`

---

## 다음 단계

1. **사용자 승인 대기**: 이 계획서 검토 및 승인
2. **Phase 1 구현 시작**: 타입 정의부터 순차적으로 진행
3. **테스트 및 검증**: 각 단계별 테스트 수행
4. **Phase 9 구현**: Phase 1 완료 후 진행

---

**작성자**: AI Assistant  
**최종 수정일**: 2025-01-27

