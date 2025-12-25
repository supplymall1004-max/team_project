# 게임 요소 API 참조

## 개요

게임 요소 시스템의 Server Actions 및 유틸리티 함수에 대한 API 참조 문서입니다.

## Server Actions

### `actions/game/complete-quest.ts`

#### `completeQuest(params: CompleteQuestParams)`

퀘스트 완료를 처리하고 보상을 지급합니다.

**매개변수:**
```typescript
interface CompleteQuestParams {
  questId: string;
  progress: number;
  questDate?: string; // YYYY-MM-DD 형식, 없으면 오늘
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  completed?: boolean;
  rewardPoints?: number;
}
```

**사용 예시:**
```typescript
const result = await completeQuest({
  questId: "daily_walk_10000",
  progress: 10000,
});

if (result.success && result.completed) {
  console.log(`퀘스트 완료! 보상: ${result.rewardPoints} 포인트`);
}
```

### `actions/game/calculate-level.ts`

#### `calculateLevel(params: CalculateLevelParams)`

건강 점수 기반으로 레벨을 계산하고 업데이트합니다.

**매개변수:**
```typescript
interface CalculateLevelParams {
  memberId?: string;
  healthScore: number;
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  levelData?: LevelData;
  leveledUp?: boolean;
  rewardPoints?: number;
  skinId?: string;
}
```

**사용 예시:**
```typescript
const result = await calculateLevel({
  memberId: "member-123",
  healthScore: 85,
});

if (result.leveledUp) {
  console.log(`레벨업! 레벨 ${result.levelData?.level}, 보상: ${result.rewardPoints} 포인트`);
  if (result.skinId) {
    console.log(`스킨 해제: ${result.skinId}`);
  }
}
```

### `actions/game/trigger-random-event.ts`

#### `triggerRandomEvent(params: TriggerRandomEventParams)`

랜덤 이벤트를 트리거합니다.

**매개변수:**
```typescript
interface TriggerRandomEventParams {
  eventType: EventType; // 'daily' | 'family' | 'special' | 'seasonal'
  eventId?: string; // 특정 이벤트 ID (선택적)
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  event?: RandomEvent;
  rewardPoints?: number;
}
```

#### `completeRandomEvent(eventId: string)`

랜덤 이벤트를 완료 처리합니다.

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  rewardPoints?: number;
}
```

### `actions/game/update-family-intimacy.ts`

#### `updateFamilyIntimacy(params: UpdateFamilyIntimacyParams)`

가족 친밀도를 업데이트합니다.

**매개변수:**
```typescript
interface UpdateFamilyIntimacyParams {
  memberId: string;
  interactionType: "health_help" | "challenge_participation" | "daily_interaction";
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  intimacy?: FamilyIntimacy;
}
```

### `actions/game/save-minigame-record.ts`

#### `saveMinigameRecord(params: SaveMinigameRecordParams)`

미니게임 기록을 저장합니다.

**매개변수:**
```typescript
interface SaveMinigameRecordParams {
  memberId?: string;
  gameType: "medication_memory" | "exercise_timing" | "nutrition_puzzle";
  score: number;
  completed: boolean;
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  recordId?: string;
}
```

### `actions/game/get-leaderboard.ts`

#### `getLeaderboard(params: GetLeaderboardParams)`

리더보드 데이터를 조회합니다.

**매개변수:**
```typescript
interface GetLeaderboardParams {
  type: "weekly" | "monthly" | "all-time";
  limit?: number; // 기본값: 10
}
```

**반환값:**
```typescript
{
  success: boolean;
  error?: string;
  leaderboard?: LeaderboardEntry[];
  userRank?: number;
}
```

## 유틸리티 함수

### `lib/health/gamification.ts`

#### `addPoints(userId: string, points: number, reason?: string)`

포인트를 추가하고 배지를 확인합니다.

**반환값:**
```typescript
{
  success: boolean;
  newTotalPoints: number;
  newBadges: string[];
  error?: string;
}
```

#### `getUserGamificationData(userId: string)`

사용자의 게임화 데이터를 조회합니다.

**반환값:**
```typescript
{
  totalPoints: number;
  streakDays: number;
  badges: string[];
  lastCompletedDate: string | null;
}
```

### `lib/game/quest-system.ts`

#### `getQuestById(questId: string): Quest | undefined`

퀘스트 ID로 퀘스트 정보를 조회합니다.

#### `isQuestCompleted(progress: number, target: number): boolean`

퀘스트 완료 여부를 확인합니다.

#### `calculateQuestProgress(progress: number, target: number): number`

퀘스트 진행률을 계산합니다 (0-100).

### `lib/game/level-system.ts`

#### `convertHealthScoreToExperience(healthScore: number): number`

건강 점수를 경험치로 변환합니다.

#### `createLevelData(currentExperience: number, additionalExperience?: number): LevelData`

레벨 데이터를 생성합니다.

#### `checkLevelUp(oldTotalExperience: number, newTotalExperience: number): boolean`

레벨업 여부를 확인합니다.

#### `calculateLevelUpReward(newLevel: number): { points: number; skinId?: string }`

레벨업 보상을 계산합니다.

### `lib/game/collection-system.ts`

#### `calculateCollectionProgress(unlockedCount: number, totalCount: number): number`

컬렉션 진행률을 계산합니다 (0-100).

#### `getRarityColor(rarity: SkinRarity): string`

스킨 등급에 따른 색상을 반환합니다.

### `lib/game/random-events.ts`

#### `selectRandomEvent(eventType: EventType): RandomEvent | null`

랜덤 이벤트를 선택합니다.

#### `getEventById(eventId: string): RandomEvent | undefined`

이벤트 ID로 이벤트 정보를 조회합니다.

### `lib/game/quiz-system.ts`

#### `selectRandomQuiz(category?: QuizCategory): Quiz | null`

랜덤 퀴즈를 선택합니다.

#### `checkQuizAnswer(quiz: Quiz, selectedOptionId: string): boolean`

퀴즈 정답 여부를 확인합니다.

#### `calculateQuizReward(quiz: Quiz, isCorrect: boolean): number`

퀴즈 보상을 계산합니다.

### `lib/game/performance-optimization.ts`

#### `batchFetchGameData<T>(fetchers: Array<() => Promise<T>>, batchSize?: number): Promise<T[]>`

여러 데이터 페칭을 배치로 처리합니다.

#### `debounce<T>(func: T, wait: number): (...args: Parameters<T>) => void`

디바운스 함수를 생성합니다.

#### `throttle<T>(func: T, limit: number): (...args: Parameters<T>) => void`

쓰로틀 함수를 생성합니다.

#### `GameDataCache`

게임 데이터 캐싱 클래스입니다.

**메서드:**
- `set(key: string, data: any, ttl?: number): void`
- `get(key: string): any | null`
- `clear(): void`
- `invalidate(key: string): void`

### `lib/game/game-interaction-validator.ts`

#### `validateQuestToPointsFlow(userId: string, questId: string, rewardPoints: number): Promise<GameInteractionResult>`

퀘스트 완료 → 포인트 획득 흐름을 검증합니다.

#### `validatePointsToBadgesFlow(userId: string, pointsAdded: number): Promise<GameInteractionResult>`

포인트 획득 → 배지 획득 흐름을 검증합니다.

#### `validateLevelUpToSkinsFlow(userId: string, memberId: string | null, levelBefore: number, levelAfter: number): Promise<GameInteractionResult>`

레벨업 → 스킨 해제 흐름을 검증합니다.

#### `validateAllGameInteractions(userId: string, memberId?: string): Promise<{ success: boolean; results: GameInteractionResult[]; summary: string }>`

전체 게임 요소 상호작용을 검증합니다.

## 타입 정의

### `types/game/quest.ts`

```typescript
export interface Quest {
  id: string;
  type: QuestType; // "daily" | "weekly" | "special"
  category: QuestCategory; // "health" | "exercise" | "nutrition" | "medication" | "checkup" | "vaccine"
  title: string;
  description: string;
  target: number;
  unit?: string;
  rewardPoints: number;
  icon?: string;
}
```

### `types/game/level.ts`

```typescript
export interface LevelData {
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalExperience: number;
}
```

### `types/game/collection.ts`

```typescript
export interface Skin {
  id: string;
  name: string;
  description: string;
  rarity: SkinRarity; // "common" | "rare" | "epic" | "legendary"
  imageUrl?: string;
  unlockCondition: string;
}
```

## 데이터베이스 스키마

### `daily_quests`

일일 퀘스트 진행 상황을 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 ID
- `quest_id`: 퀘스트 ID
- `progress`: 현재 진행도
- `target`: 목표 수치
- `completed`: 완료 여부
- `quest_date`: 퀘스트 날짜

### `character_levels`

캐릭터 레벨 정보를 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 ID
- `family_member_id`: 가족 구성원 ID (NULL 가능)
- `level`: 현재 레벨
- `experience`: 현재 경험치
- `experience_to_next_level`: 다음 레벨까지 필요한 경험치

### `character_skins`

캐릭터 스킨 컬렉션을 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 ID
- `family_member_id`: 가족 구성원 ID (NULL 가능)
- `skin_id`: 스킨 ID
- `unlocked_at`: 해제 시간
- `is_active`: 활성화 여부

### `random_events`

랜덤 이벤트 기록을 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 ID
- `event_id`: 이벤트 ID
- `event_type`: 이벤트 유형
- `triggered_at`: 발생 시간
- `completed`: 완료 여부
- `reward_points`: 보상 포인트

### `user_gamification`

사용자 게임화 데이터를 저장합니다.

**주요 컬럼:**
- `user_id`: 사용자 ID
- `total_points`: 총 포인트
- `streak_days`: 연속 완료 일수
- `badges`: 획득한 배지 배열
- `last_completed_date`: 마지막 완료 날짜

## 에러 처리

모든 Server Actions는 다음 형식의 에러를 반환합니다:

```typescript
{
  success: false,
  error: string; // 에러 메시지
}
```

일반적인 에러:
- `"로그인이 필요합니다."`: 인증되지 않은 사용자
- `"사용자 정보를 찾을 수 없습니다."`: 사용자 데이터 없음
- `"퀘스트를 찾을 수 없습니다."`: 잘못된 퀘스트 ID
- `"이벤트를 찾을 수 없습니다."`: 잘못된 이벤트 ID

## 성능 고려사항

1. **배치 처리**: 여러 데이터를 한 번에 가져올 때 `batchFetchGameData` 사용
2. **캐싱**: 자주 조회하는 데이터는 `GameDataCache` 사용
3. **디바운스/쓰로틀**: 자주 발생하는 이벤트는 디바운스/쓰로틀 적용
4. **지연 로딩**: 이미지는 `createLazyImageLoader` 사용

## 보안 고려사항

1. 모든 Server Actions는 인증이 필요합니다.
2. 사용자는 자신의 데이터만 접근할 수 있습니다.
3. 포인트 조작 방지를 위한 서버 사이드 검증이 필요합니다.

