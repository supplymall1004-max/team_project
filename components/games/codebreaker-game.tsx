/**
 * @file components/games/codebreaker-game.tsx
 * @description 코드 브레이커 게임 메인 컴포넌트
 * 
 * 비밀번호 탈출 작전 게임 - 힌트를 조합하여 비밀번호를 찾는 논리 추론 게임
 * 
 * 주요 기능:
 * 1. 레벨별 난이도 조절 (3자리 → 4자리 → 5자리)
 * 2. 힌트 시스템 (합계, 홀짝, 비교, 위치 등)
 * 3. 숫자 야구 피드백 (스트라이크/볼)
 * 4. 시간 제한 및 점수 시스템
 * 5. 등급 시스템 (브론즈 → 아인슈타인)
 * 
 * @dependencies
 * - framer-motion: 애니메이션
 * - lucide-react: 아이콘
 * - @/lib/games/codebreaker: 게임 로직
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, Clock, Target, Trophy, RotateCcw, Play, Pause, 
  Lightbulb, CheckCircle, XCircle, Timer, Zap, Star, X
} from 'lucide-react';
import type { GameState, GameLevel, Hint, BaseballFeedback, GameStats } from '@/types/game/codebreaker';
import { LEVEL_CONFIGS } from '@/lib/games/codebreaker/config';
import {
  generateSecretCode,
  generateHints,
  calculateBaseballFeedback,
  calculateScore,
  getGrade,
  getGradeName,
  formatTime,
} from '@/lib/games/codebreaker/utils';
import { COGNITIVE_FEEDBACK, EXPERT_FEEDBACK } from '@/lib/games/codebreaker/config';

export default function CodebreakerGame() {
  // 클라이언트 마운트 확인 (Hydration mismatch 방지)
  const [isMounted, setIsMounted] = useState(false);

  // 게임 상태
  const [gameState, setGameState] = useState<GameState>('READY');
  const [currentLevel, setCurrentLevel] = useState<GameLevel>(1);
  const [secretCode, setSecretCode] = useState<number[]>([]);
  const [secretCodeString, setSecretCodeString] = useState<string>('');
  const [hints, setHints] = useState<Hint[]>([]);
  const [userInput, setUserInput] = useState<string>('');
  const [attempts, setAttempts] = useState(0);
  const [timeSpent, setTimeSpent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [initialTimeLimit, setInitialTimeLimit] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [feedback, setFeedback] = useState<BaseballFeedback | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<Array<{ guess: string; feedback: BaseballFeedback }>>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailed, setShowFailed] = useState(false);
  const [cognitiveFeedback, setCognitiveFeedback] = useState<string>('');

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 클라이언트 마운트 확인
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 게임 초기화
  const initializeGame = useCallback((level: GameLevel) => {
    const config = LEVEL_CONFIGS[level];
    const code = generateSecretCode(config.codeLength, false);
    const codeString = code.join('');
    const gameHints = generateHints(code, level);

    setSecretCode(code);
    setSecretCodeString(codeString);
    setHints(gameHints);
    setUserInput('');
    setAttempts(0);
    setTimeSpent(0);
    setInitialTimeLimit(config.timeLimit || null);
    setTimeLeft(config.timeLimit || null);
    setScore(0);
    setFeedback(null);
    setAttemptHistory([]);
    setShowSuccess(false);
    setShowFailed(false);
    setCognitiveFeedback('');
    setIsPaused(false);

    console.log('[Codebreaker] 게임 초기화:', { level, code: codeString, hints: gameHints.length });
  }, []);

  // 게임 시작
  const startGame = useCallback(() => {
    initializeGame(currentLevel);
    setGameState('PLAYING');
    startTimeRef.current = Date.now();

    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentLevel, initializeGame]);

  // 게임 재시작
  const restartGame = useCallback(() => {
    setGameState('READY');
    initializeGame(currentLevel);
  }, [currentLevel, initializeGame]);

  // 레벨 선택
  const selectLevel = useCallback((level: GameLevel) => {
    setCurrentLevel(level);
    initializeGame(level);
  }, [initializeGame]);

  // 일시정지/재개
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // 게임 종료
  const endGame = useCallback((success: boolean) => {
    setGameState(success ? 'SUCCESS' : 'FAILED');
    if (!success) {
      setShowFailed(true);
      setCognitiveFeedback(EXPERT_FEEDBACK.PRACTICE);
    }
  }, []);

  // 시간 업데이트
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused && startTimeRef.current > 0) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setTimeSpent(elapsed);

        if (initialTimeLimit !== null) {
          const remaining = initialTimeLimit - elapsed;
          if (remaining <= 0) {
            setTimeLeft(0);
            endGame(false);
          } else {
            setTimeLeft(remaining);
          }
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gameState, isPaused, initialTimeLimit, endGame]);

  // 입력 검증
  const validateInput = (input: string, length: number): boolean => {
    if (input.length !== length) return false;
    if (!/^\d+$/.test(input)) return false;
    return true;
  };

  // 정답 확인
  const checkAnswer = useCallback(() => {
    if (gameState !== 'PLAYING' || isPaused) return;

    const config = LEVEL_CONFIGS[currentLevel];
    
    if (!validateInput(userInput, config.codeLength)) {
      alert(`${config.codeLength}자리 숫자를 입력해주세요.`);
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (userInput === secretCodeString) {
      // 성공!
      const finalScore = calculateScore(
        currentLevel,
        newAttempts,
        timeSpent,
        config.maxAttempts,
        config.timeLimit
      );
      setScore(finalScore);
      setTotalScore(prev => prev + finalScore);
      setGameState('SUCCESS');
      setShowSuccess(true);

      // 인지 능력 분석
      if (timeSpent < 30) {
        setCognitiveFeedback(COGNITIVE_FEEDBACK.FAST_THINKING);
      } else if (newAttempts <= 3) {
        setCognitiveFeedback(COGNITIVE_FEEDBACK.INTUITIVE);
      } else {
        setCognitiveFeedback(COGNITIVE_FEEDBACK.LOGICAL);
      }

      console.log('[Codebreaker] 성공!', { level: currentLevel, attempts: newAttempts, timeSpent, score: finalScore });
    } else {
      // 틀렸을 때 피드백
      if (config.useBaseballFeedback) {
        const fb = calculateBaseballFeedback(secretCodeString, userInput);
        setFeedback(fb);
        setAttemptHistory(prev => [...prev, { guess: userInput, feedback: fb }]);
      }

      // 시도 횟수 초과
      if (newAttempts >= config.maxAttempts) {
        endGame(false);
      } else {
        setUserInput('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  }, [gameState, isPaused, userInput, attempts, secretCodeString, currentLevel, timeSpent, endGame]);

  // 게임 포기
  const giveUp = useCallback(() => {
    endGame(false);
    setShowFailed(true);
    setCognitiveFeedback(EXPERT_FEEDBACK.PRACTICE);
  }, [endGame]);

  // 다음 레벨
  const nextLevel = useCallback(() => {
    if (currentLevel < 3) {
      const next = (currentLevel + 1) as GameLevel;
      setCurrentLevel(next);
      initializeGame(next);
      setGameState('PLAYING');
      startTimeRef.current = Date.now();
      setShowSuccess(false);
    } else {
      // 모든 레벨 완료
      setGameState('READY');
      setShowSuccess(false);
    }
  }, [currentLevel, initializeGame]);

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState === 'PLAYING' && !isPaused) {
      checkAnswer();
    }
  };

  const config = LEVEL_CONFIGS[currentLevel];
  const grade = getGrade(totalScore);
  const gradeName = getGradeName(grade);

  // 클라이언트 마운트 전에는 로딩 상태 표시 (Hydration mismatch 방지)
  if (!isMounted) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6" suppressHydrationWarning>
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6" suppressHydrationWarning>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6" suppressHydrationWarning>
      {/* 게임 헤더 */}
      <div className="mb-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-2 mb-2"
          suppressHydrationWarning
        >
          <Brain className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            코드 브레이커
          </h1>
        </motion.div>
        <p className="text-gray-600">힌트를 조합하여 비밀번호를 찾아보세요!</p>
      </div>

      {/* 레벨 선택 (게임 시작 전) */}
      {gameState === 'READY' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
          suppressHydrationWarning
        >
          <h2 className="text-xl font-semibold mb-4 text-center">레벨 선택</h2>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((level) => (
              <button
                key={level}
                onClick={() => selectLevel(level as GameLevel)}
                className={`p-4 rounded-xl border-2 transition-all ${
                  currentLevel === level
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="text-2xl font-bold mb-1">Level {level}</div>
                <div className="text-sm text-gray-600">
                  {LEVEL_CONFIGS[level as GameLevel].codeLength}자리
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {LEVEL_CONFIGS[level as GameLevel].maxAttempts}회 시도
                </div>
              </button>
            ))}
          </div>
          <button
            onClick={startGame}
            className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            <Play className="w-5 h-5 inline mr-2" />
            게임 시작
          </button>
        </motion.div>
      )}

      {/* 게임 화면 */}
      {gameState === 'PLAYING' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 pb-24 md:pb-6"
          suppressHydrationWarning
        >
          {/* 게임 정보 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className={`grid gap-4 mb-4 ${currentLevel === 1 ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 md:grid-cols-4'}`}>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">레벨</div>
                <div className="text-2xl font-bold text-purple-600">Lv.{currentLevel}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">시도</div>
                <div className="text-2xl font-bold">
                  {attempts}/{config.maxAttempts}
                </div>
              </div>
              {currentLevel !== 1 && (
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">남은 시간</div>
                  <div className="text-2xl font-bold text-red-600">
                    {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
                  </div>
                </div>
              )}
              {currentLevel === 1 && (
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">경과 시간</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(timeSpent)}
                  </div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">점수</div>
                <div className="text-2xl font-bold text-pink-600">{totalScore}</div>
              </div>
            </div>

            <div className="flex gap-2 justify-center">
              {currentLevel === 1 ? (
                <>
                  <button
                    onClick={giveUp}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-semibold flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    포기
                  </button>
                  <button
                    onClick={restartGame}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    다시하기
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={togglePause}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title={isPaused ? "재개" : "일시정지"}
                  >
                    {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={restartGame}
                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    title="다시하기"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* 힌트 섹션 */}
          {hints.length > 0 ? (
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                <h2 className="text-xl font-semibold">힌트</h2>
              </div>
              <div className="space-y-2">
                {hints.map((hint) => (
                  <motion.div
                    key={hint.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-start gap-2 p-3 bg-white rounded-lg"
                  >
                    <span className="text-purple-600 font-semibold">💡</span>
                    <span className="text-gray-700">{hint.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-blue-700">게임 방법</h2>
              </div>
              <div className="space-y-2 text-gray-700">
                <p className="text-sm leading-relaxed">
                  <strong className="text-blue-600">숫자 야구 게임</strong>입니다! 숫자를 입력하면 <strong className="text-red-600">Strike</strong>와 <strong className="text-blue-600">Ball</strong> 피드백을 받을 수 있습니다.
                </p>
                <ul className="text-sm space-y-1 list-disc list-inside ml-2">
                  <li><strong className="text-red-600">Strike (S)</strong>: 숫자와 위치가 모두 맞음</li>
                  <li><strong className="text-blue-600">Ball (B)</strong>: 숫자는 있지만 위치가 틀림</li>
                </ul>
                <p className="text-sm mt-3 text-gray-600">
                  예: 정답이 <strong>234</strong>일 때, <strong>123</strong>을 입력하면 <strong className="text-blue-600">2B</strong> (2와 3이 있지만 위치 틀림), <strong>213</strong>을 입력하면 <strong className="text-red-600">1S</strong> <strong className="text-blue-600">2B</strong> (2는 맞는 위치, 1과 3은 있지만 위치 틀림)
                </p>
              </div>
            </div>
          )}

          {/* 입력 섹션 - 모바일 최적화 */}
          <div className="bg-white rounded-2xl shadow-lg p-4 md:p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {config.codeLength}자리 숫자 입력
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                ref={inputRef}
                type="text"
                value={userInput}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, config.codeLength);
                  setUserInput(value);
                }}
                onKeyPress={handleKeyPress}
                disabled={isPaused}
                className="flex-1 px-4 py-3 text-xl sm:text-2xl text-center border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none disabled:bg-gray-100"
                placeholder="숫자 입력"
                maxLength={config.codeLength}
              />
              <button
                onClick={checkAnswer}
                disabled={isPaused || userInput.length !== config.codeLength}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                확인
              </button>
            </div>
          </div>

          {/* 피드백 섹션 */}
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 rounded-2xl shadow-lg p-6"
              suppressHydrationWarning
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-3">분석 결과</div>
                <div className="flex items-center justify-center gap-8">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-red-600 mb-1">{feedback.strikes}</div>
                    <div className="text-sm text-gray-600 font-semibold">Strike</div>
                    <div className="text-xs text-gray-500 mt-1">위치와 숫자 모두 맞음</div>
                  </div>
                  <div className="text-2xl font-bold text-gray-400">+</div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-1">{feedback.balls}</div>
                    <div className="text-sm text-gray-600 font-semibold">Ball</div>
                    <div className="text-xs text-gray-500 mt-1">숫자는 있지만 위치 틀림</div>
                  </div>
                </div>
                {/* 간단한 표시 형식 */}
                <div className="mt-4 pt-4 border-t border-gray-300">
                  <div className="text-2xl font-bold">
                    <span className="text-red-600">{feedback.strikes}S</span>
                    {feedback.balls > 0 && (
                      <>
                        <span className="text-gray-400 mx-2"> </span>
                        <span className="text-blue-600">{feedback.balls}B</span>
                      </>
                    )}
                    {feedback.strikes === 0 && feedback.balls === 0 && (
                      <span className="text-gray-500">아웃</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* 시도 기록 */}
          {attemptHistory.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">시도 기록</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {attemptHistory.map((attempt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-mono text-xl font-bold text-gray-800">{attempt.guess}</span>
                    <span className="text-lg font-bold">
                      {attempt.feedback.strikes > 0 && (
                        <span className="text-red-600">{attempt.feedback.strikes}S</span>
                      )}
                      {attempt.feedback.strikes > 0 && attempt.feedback.balls > 0 && (
                        <span className="text-gray-400 mx-1"> </span>
                      )}
                      {attempt.feedback.balls > 0 && (
                        <span className="text-blue-600">{attempt.feedback.balls}B</span>
                      )}
                      {attempt.feedback.strikes === 0 && attempt.feedback.balls === 0 && (
                        <span className="text-gray-500">아웃</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* 성공 화면 */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">성공!</h2>
                <p className="text-gray-600 mb-6">
                  {attempts}번 만에 정답을 찾았습니다!
                </p>
                <div className="bg-purple-50 rounded-xl p-4 mb-4">
                  <div className="text-sm text-gray-600 mb-1">획득 점수</div>
                  <div className="text-3xl font-bold text-purple-600">{score}점</div>
                </div>
                {cognitiveFeedback && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="text-sm font-semibold text-blue-700">{cognitiveFeedback}</div>
                  </div>
                )}
                <div className="flex gap-2">
                  {currentLevel < 3 ? (
                    <button
                      onClick={nextLevel}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      다음 레벨
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowSuccess(false);
                        setGameState('READY');
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      완료
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 실패 화면 */}
      <AnimatePresence>
        {showFailed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowFailed(false)}
          >
            <motion.div
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">실패</h2>
                <p className="text-gray-600 mb-4">
                  정답은 <span className="font-mono font-bold text-purple-600">{secretCodeString}</span>였습니다.
                </p>
                {cognitiveFeedback && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4">
                    <div className="text-sm font-semibold text-blue-700">{cognitiveFeedback}</div>
                  </div>
                )}
                <button
                  onClick={() => {
                    setShowFailed(false);
                    restartGame();
                  }}
                  className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                >
                  다시 시도
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 등급 표시 */}
      {totalScore > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white text-center"
        >
          <Trophy className="w-8 h-8 mx-auto mb-2" />
          <div className="text-sm mb-1">현재 등급</div>
          <div className="text-2xl font-bold">{gradeName}</div>
          <div className="text-sm mt-2 opacity-90">총 점수: {totalScore}점</div>
        </motion.div>
      )}
    </div>
  );
}

