/**
 * @file components/games/health-quiz.tsx
 * @description 건강 퀴즈 UI
 *
 * 건강 관리, 질병 예방, 영양 등에 관한 퀴즈를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 퀴즈 문제 및 선택지 표시
 * 2. 정답/오답 피드백
 * 3. 보상 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/lib/game/quiz-system: Quiz, selectRandomQuiz, checkQuizAnswer, calculateQuizReward
 * - @/actions/game/save-quiz-record: 퀴즈 기록 저장
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import {
  selectRandomQuiz,
  checkQuizAnswer,
  calculateQuizReward,
  type Quiz,
} from "@/lib/game/quiz-system";

interface HealthQuizProps {
  memberId?: string;
  category?: "health" | "nutrition" | "exercise" | "medication" | "general";
  onComplete?: (score: number) => void;
}

export function HealthQuiz({ memberId, category, onComplete }: HealthQuizProps) {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);

  // 퀴즈 로드
  useEffect(() => {
    loadNewQuiz();
  }, [category]);

  const loadNewQuiz = () => {
    const newQuiz = selectRandomQuiz(category);
    setQuiz(newQuiz);
    setSelectedOptionId(null);
    setShowResult(false);
  };

  // 답변 선택
  const handleAnswerSelect = (optionId: string) => {
    if (!quiz || showResult) return;

    setSelectedOptionId(optionId);
    const correct = checkQuizAnswer(quiz, optionId);
    setIsCorrect(correct);
    setShowResult(true);
    setTotalQuestions((prev) => prev + 1);

    if (correct) {
      const reward = calculateQuizReward(quiz, true);
      setScore((prev) => prev + reward);
      setCorrectAnswers((prev) => prev + 1);

      // 퀴즈 기록 저장
      if (memberId) {
        // TODO: 실제 API 호출로 대체
        // saveQuizRecord({ memberId, quizId: quiz.id, correct: true, rewardPoints: reward });
      }
    } else {
      // 퀴즈 기록 저장
      if (memberId) {
        // TODO: 실제 API 호출로 대체
        // saveQuizRecord({ memberId, quizId: quiz.id, correct: false, rewardPoints: 0 });
      }
    }
  };

  // 다음 퀴즈
  const handleNextQuiz = () => {
    loadNewQuiz();
  };

  // 퀴즈 종료
  const handleFinish = () => {
    if (onComplete) {
      onComplete(score);
    }
  };

  if (!quiz) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">퀴즈를 불러오는 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-400" />
            건강 퀴즈
          </div>
          <div className="text-sm text-gray-400">
            점수: {score} | 정답률: {totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0}%
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 문제 */}
        <div className="p-4 rounded-lg bg-blue-500/10 border-2 border-blue-500">
          <p className="text-lg font-bold text-white mb-2">{quiz.question}</p>
          <div className="text-sm text-gray-400">
            난이도: {quiz.difficulty === "easy" ? "쉬움" : quiz.difficulty === "medium" ? "보통" : "어려움"}
          </div>
        </div>

        {/* 선택지 */}
        <div className="space-y-2">
          {quiz.options.map((option, index) => {
            const isSelected = selectedOptionId === option.id;
            let buttonClass = "w-full text-left justify-start";
            
            if (showResult) {
              if (option.isCorrect) {
                buttonClass += " bg-green-500/20 border-green-500 text-green-400";
              } else if (isSelected && !option.isCorrect) {
                buttonClass += " bg-red-500/20 border-red-500 text-red-400";
              } else {
                buttonClass += " bg-gray-800/50 border-gray-700 text-gray-400 opacity-50";
              }
            } else {
              buttonClass += isSelected
                ? " bg-blue-500/20 border-blue-500"
                : " bg-gray-800/50 border-gray-700";
            }

            return (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Button
                  onClick={() => handleAnswerSelect(option.id)}
                  disabled={showResult}
                  variant="outline"
                  className={buttonClass}
                >
                  <div className="flex items-center gap-2 w-full">
                    {showResult && option.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    )}
                    {showResult && isSelected && !option.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <span className="flex-1">{option.text}</span>
                  </div>
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* 결과 */}
        {showResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              isCorrect
                ? "bg-green-500/20 border-2 border-green-500"
                : "bg-red-500/20 border-2 border-red-500"
            }`}
          >
            <p className={`text-lg font-bold mb-2 ${isCorrect ? "text-green-400" : "text-red-400"}`}>
              {isCorrect ? "정답입니다! 🎉" : "틀렸습니다 😢"}
            </p>
            <p className="text-gray-300 text-sm">{quiz.explanation}</p>
            {isCorrect && (
              <p className="text-yellow-400 mt-2">
                보상: {calculateQuizReward(quiz, true)} 포인트 획득!
              </p>
            )}
          </motion.div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2">
          {showResult && (
            <>
              <Button
                onClick={handleNextQuiz}
                variant="outline"
                className="flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                다음 퀴즈
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                종료
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

