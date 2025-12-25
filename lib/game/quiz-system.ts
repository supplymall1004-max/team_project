/**
 * @file lib/game/quiz-system.ts
 * @description 퀴즈 정의 및 관리
 *
 * 건강 지식을 습득할 수 있는 퀴즈 시스템입니다.
 *
 * 주요 기능:
 * 1. 건강 퀴즈 정의
 * 2. 영양소 맞추기 게임 정의
 * 3. 퀴즈 정답 확인
 * 4. 보상 계산
 *
 * @dependencies
 * - @/types/game/quiz: Quiz 타입 정의
 */

export type QuizCategory = "health" | "nutrition" | "exercise" | "medication" | "general";

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Quiz {
  id: string;
  category: QuizCategory;
  question: string;
  options: QuizOption[];
  explanation: string;
  rewardPoints: number;
  difficulty: "easy" | "medium" | "hard";
}

/**
 * 건강 퀴즈 정의
 */
export const HEALTH_QUIZZES: Quiz[] = [
  {
    id: "health_water_intake",
    category: "health",
    question: "하루 권장 물 섭취량은 얼마일까요?",
    options: [
      { id: "1", text: "1L", isCorrect: false },
      { id: "2", text: "2L", isCorrect: true },
      { id: "3", text: "3L", isCorrect: false },
      { id: "4", text: "4L", isCorrect: false },
    ],
    explanation: "성인의 하루 권장 물 섭취량은 약 2L입니다.",
    rewardPoints: 20,
    difficulty: "easy",
  },
  {
    id: "health_sleep_hours",
    category: "health",
    question: "성인의 권장 수면 시간은 몇 시간일까요?",
    options: [
      { id: "1", text: "5-6시간", isCorrect: false },
      { id: "2", text: "7-9시간", isCorrect: true },
      { id: "3", text: "10-12시간", isCorrect: false },
      { id: "4", text: "13시간 이상", isCorrect: false },
    ],
    explanation: "성인의 권장 수면 시간은 7-9시간입니다.",
    rewardPoints: 20,
    difficulty: "easy",
  },
  {
    id: "health_walking_steps",
    category: "exercise",
    question: "하루 권장 걸음 수는 몇 보일까요?",
    options: [
      { id: "1", text: "5,000보", isCorrect: false },
      { id: "2", text: "10,000보", isCorrect: true },
      { id: "3", text: "15,000보", isCorrect: false },
      { id: "4", text: "20,000보", isCorrect: false },
    ],
    explanation: "하루 권장 걸음 수는 10,000보입니다.",
    rewardPoints: 20,
    difficulty: "easy",
  },
  {
    id: "nutrition_vitamin_c",
    category: "nutrition",
    question: "비타민 C가 많이 들어있는 과일은?",
    options: [
      { id: "1", text: "사과", isCorrect: false },
      { id: "2", text: "오렌지", isCorrect: true },
      { id: "3", text: "바나나", isCorrect: false },
      { id: "4", text: "포도", isCorrect: false },
    ],
    explanation: "오렌지에는 비타민 C가 풍부하게 들어있습니다.",
    rewardPoints: 30,
    difficulty: "medium",
  },
  {
    id: "medication_timing",
    category: "medication",
    question: "약물을 복용할 때 가장 중요한 것은?",
    options: [
      { id: "1", text: "맛", isCorrect: false },
      { id: "2", text: "시간", isCorrect: true },
      { id: "3", text: "색깔", isCorrect: false },
      { id: "4", text: "크기", isCorrect: false },
    ],
    explanation: "약물은 정해진 시간에 복용하는 것이 가장 중요합니다.",
    rewardPoints: 30,
    difficulty: "medium",
  },
];

/**
 * 영양소 맞추기 게임 데이터
 */
export interface NutritionMatch {
  nutrient: string;
  food: string;
  description: string;
}

export const NUTRITION_MATCHES: NutritionMatch[] = [
  {
    nutrient: "비타민 C",
    food: "오렌지",
    description: "비타민 C는 면역력 향상에 도움을 줍니다.",
  },
  {
    nutrient: "칼슘",
    food: "우유",
    description: "칼슘은 뼈와 치아 건강에 중요합니다.",
  },
  {
    nutrient: "단백질",
    food: "닭가슴살",
    description: "단백질은 근육 형성에 필요합니다.",
  },
  {
    nutrient: "철분",
    food: "시금치",
    description: "철분은 빈혈 예방에 도움을 줍니다.",
  },
  {
    nutrient: "오메가-3",
    food: "연어",
    description: "오메가-3는 뇌 건강에 좋습니다.",
  },
  {
    nutrient: "비타민 A",
    food: "당근",
    description: "비타민 A는 시력 보호에 중요합니다.",
  },
];

/**
 * 퀴즈 ID로 퀴즈 찾기
 */
export function getQuizById(quizId: string): Quiz | undefined {
  return HEALTH_QUIZZES.find((q) => q.id === quizId);
}

/**
 * 카테고리별 퀴즈 목록 가져오기
 */
export function getQuizzesByCategory(category: QuizCategory): Quiz[] {
  return HEALTH_QUIZZES.filter((q) => q.category === category);
}

/**
 * 난이도별 퀴즈 목록 가져오기
 */
export function getQuizzesByDifficulty(difficulty: Quiz["difficulty"]): Quiz[] {
  return HEALTH_QUIZZES.filter((q) => q.difficulty === difficulty);
}

/**
 * 랜덤 퀴즈 선택
 */
export function selectRandomQuiz(category?: QuizCategory): Quiz | null {
  let quizzes = HEALTH_QUIZZES;
  if (category) {
    quizzes = getQuizzesByCategory(category);
  }
  if (quizzes.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * quizzes.length);
  return quizzes[randomIndex];
}

/**
 * 퀴즈 정답 확인
 */
export function checkQuizAnswer(quiz: Quiz, selectedOptionId: string): boolean {
  const selectedOption = quiz.options.find((o) => o.id === selectedOptionId);
  return selectedOption?.isCorrect || false;
}

/**
 * 퀴즈 보상 계산
 */
export function calculateQuizReward(quiz: Quiz, isCorrect: boolean): number {
  if (!isCorrect) return 0;

  const baseReward = quiz.rewardPoints;
  const difficultyMultiplier = {
    easy: 1,
    medium: 1.5,
    hard: 2,
  };

  return Math.floor(baseReward * difficultyMultiplier[quiz.difficulty]);
}

