/**
 * @file components/games/fridge-memory-game.tsx
 * @description 냉장고 짝맞추기 게임 (스테이지 모드)
 *
 * 냉장고 속 식재료 카드를 뒤집어 짝을 맞추는 메모리 게임입니다.
 * 20스테이지까지 진행 가능하며, 각 스테이지마다 난이도가 자동으로 증가합니다.
 *
 * 주요 기능:
 * 1. 카드 뒤집기 및 매칭 시스템
 * 2. 20스테이지 자동 난이도 계산
 * 3. 아이템 시스템 (힌트, 냉동)
 * 4. 타이머 및 콤보 시스템
 * 5. 엔딩 애니메이션 (20스테이지 클리어 시)
 * 6. 시각적 피드백 (흔들림, 파티클)
 *
 * @dependencies
 * - react: useState, useEffect, useCallback
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - lucide-react: 아이콘
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, RotateCcw, Clock, Target, Sparkles, HelpCircle, Search, Snowflake } from "lucide-react";

interface CardData {
  id: string;
  food: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface StageConfig {
  pairs: number;
  cols: number;
  time: number;
}

const TOTAL_STAGES = 20;

const FOODS = [
  "🍎", "🥛", "🧀", "🐟", "🥚", "🥦", "🥩", "🍇",
  "🥕", "🍦", "🍕", "🍰", "🍞", "🥤", "🍗", "🍉",
  "🌽", "🍄", "🥑", "🥞", "🥓", "🥨", "🍩", "🍪",
  "🌶️", "🥔",
];

interface FridgeMemoryGameProps {
  memberId?: string;
  onComplete?: (score: number) => void;
}

// 스테이지 자동 계산 함수
function getStageConfig(stage: number): StageConfig {
  // 스테이지에 따라 쌍(pairs)의 개수를 늘림 (최소 4쌍 ~ 최대 24쌍)
  let pairs = 4 + Math.floor(stage * 1.2);
  if (pairs > FOODS.length) pairs = FOODS.length; // 최대 사용 가능한 음식 종류까지

  // 카드 수에 따른 그리드 열(column) 개수 결정
  let cols = 4;
  if (pairs > 8) cols = 6;
  if (pairs > 18) cols = 8;

  // 제한 시간: 기본 40초 + (쌍당 3초) - (스테이지당 1.5초씩 차감하여 난이도 상승)
  let time = 40 + (pairs * 3) - (stage * 1.5);
  if (time < 20) time = 20; // 최소 20초는 보장

  return {
    pairs,
    time: Math.floor(time),
    cols,
  };
}

export function FridgeMemoryGame({ memberId, onComplete }: FridgeMemoryGameProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [gameState, setGameState] = useState<"menu" | "playing" | "stageClear" | "finished">("menu");
  const [currentStage, setCurrentStage] = useState(0);
  const [cards, setCards] = useState<CardData[]>([]);
  const [firstCard, setFirstCard] = useState<CardData | null>(null);
  const [secondCard, setSecondCard] = useState<CardData | null>(null);
  const [lockBoard, setLockBoard] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStageClear, setShowStageClear] = useState(false);
  const [showEnding, setShowEnding] = useState(false);
  const [shakeCards, setShakeCards] = useState<Set<string>>(new Set());
  const [showParticles, setShowParticles] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  
  // 아이템 상태
  const [items, setItems] = useState({ hint: 2, freeze: 1 });

  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFrozenRef = useRef(false); // isFrozen 상태를 ref로 관리하여 클로저 문제 해결
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const freezeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRefs = useRef<{
    flip: HTMLAudioElement | null;
    match: HTMLAudioElement | null;
    fail: HTMLAudioElement | null;
    win: HTMLAudioElement | null;
  }>({
    flip: null,
    match: null,
    fail: null,
    win: null,
  });

  const stageConfig = getStageConfig(currentStage);

  // 클라이언트 마운트 확인 (Hydration mismatch 방지)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 효과음 초기화
  useEffect(() => {
    const createAudio = (frequency: number, duration: number, type: 'sine' | 'square' = 'sine') => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (e) {
        // 효과음 재생 실패 시 무시
      }
    };

    const playFlipSound = () => createAudio(400, 0.1, 'sine');
    const playMatchSound = () => createAudio(600, 0.2, 'sine');
    const playFailSound = () => createAudio(200, 0.3, 'square');
    const playWinSound = () => {
      createAudio(523, 0.1, 'sine');
      setTimeout(() => createAudio(659, 0.1, 'sine'), 100);
      setTimeout(() => createAudio(784, 0.2, 'sine'), 200);
    };

    audioRefs.current = {
      flip: { play: playFlipSound } as any,
      match: { play: playMatchSound } as any,
      fail: { play: playFailSound } as any,
      win: { play: playWinSound } as any,
    };
  }, []);

  // 스테이지 클리어
  const stageClear = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 3스테이지마다 아이템 보충
    if ((currentStage + 1) % 3 === 0) {
      setItems((prev) => ({
        hint: prev.hint + 1,
        freeze: prev.freeze + 1,
      }));
    }

    if (currentStage + 1 === TOTAL_STAGES) {
      // 최종 스테이지 클리어 시 엔딩 연출
      setShowEnding(true);
      if (audioRefs.current.win) {
        try {
          audioRefs.current.win.play();
        } catch (e) {
          // 효과음 재생 실패 시 무시
        }
      }
    } else {
      // 일반 스테이지 클리어
      setShowStageClear(true);
    }
  }, [currentStage]);

  // 게임 종료
  const endGame = useCallback((isWin: boolean) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (isWin) {
      stageClear();
    } else {
      alert("⏰ 시간이 다 되었습니다! 다시 도전해보세요!");
      setGameState("menu");
      setCurrentStage(0);
      setItems({ hint: 2, freeze: 1 });
    }
  }, [stageClear]);

  // 게임 초기화
  const initializeGame = useCallback(() => {
    const config = getStageConfig(currentStage);
    const selectedFoods = FOODS.slice(0, config.pairs);
    const gameCards: CardData[] = [];

    // 각 음식을 2개씩 생성
    selectedFoods.forEach((food, index) => {
      gameCards.push(
        { id: `card-${index}-1`, food, isFlipped: false, isMatched: false },
        { id: `card-${index}-2`, food, isFlipped: false, isMatched: false }
      );
    });

    // 카드 섞기 (Fisher-Yates Shuffle)
    for (let i = gameCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [gameCards[i], gameCards[j]] = [gameCards[j], gameCards[i]];
    }

    setCards(gameCards);
    setFirstCard(null);
    setSecondCard(null);
    setLockBoard(false);
    setMatchedCount(0);
    setTimeLeft(config.time);
    setCombo(0);
    setIsFrozen(false);
    isFrozenRef.current = false;
    setGameState("playing");

    // 타이머 시작
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      if (!isFrozenRef.current) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            endGame(false);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  }, [currentStage, endGame]);

  // 다음 스테이지 시작
  const startNextStage = useCallback(() => {
    setShowStageClear(false);
    setCurrentStage((prev) => prev + 1);
    setGameState("playing");
    // initializeGame은 currentStage 변경으로 자동 실행됨
  }, []);

  // 게임 재시작
  const resetGame = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (freezeTimerRef.current) {
      clearTimeout(freezeTimerRef.current);
      freezeTimerRef.current = null;
    }
    setGameState("menu");
    setCurrentStage(0);
    setItems({ hint: 2, freeze: 1 });
    setShowStageClear(false);
    setShowEnding(false);
    setIsFrozen(false);
    isFrozenRef.current = false;
  }, []);

  // 매칭 확인 (handleCardClick보다 먼저 정의)
  const checkMatch = useCallback((second: CardData) => {
    if (!firstCard) return;

    const isMatch = firstCard.food === second.food;

    if (isMatch) {
      // 매칭 성공
      setCombo((prevCombo) => {
        const newCombo = prevCombo + 1;
        setMaxCombo((prev) => Math.max(prev, newCombo));
        return newCombo;
      });

      // 효과음 재생
      if (audioRefs.current.match) {
        try {
          audioRefs.current.match.play();
        } catch (e) {
          // 효과음 재생 실패 시 무시
        }
      }

      // 파티클 효과
      setShowParticles(true);
      setTimeout(() => setShowParticles(false), 500);

      setCards((prevCards) =>
        prevCards.map((c) =>
          c.id === firstCard.id || c.id === second.id
            ? { ...c, isMatched: true, isFlipped: true }
            : c
        )
      );

      setMatchedCount((prev) => {
        const newCount = prev + 1;
        const config = getStageConfig(currentStage);
        if (newCount >= config.pairs) {
          setTimeout(() => stageClear(), 500);
        }
        return newCount;
      });

      setFirstCard(null);
      setSecondCard(null);
      setLockBoard(false);
    } else {
      // 매칭 실패
      setCombo(0);

      // 효과음 재생
      if (audioRefs.current.fail) {
        try {
          audioRefs.current.fail.play();
        } catch (e) {
          // 효과음 재생 실패 시 무시
        }
      }

      // 흔들림 효과
      setShakeCards(new Set([firstCard.id, second.id]));
      setTimeout(() => setShakeCards(new Set()), 600);

      setTimeout(() => {
        setCards((prevCards) =>
          prevCards.map((c) =>
            c.id === firstCard.id || c.id === second.id
              ? { ...c, isFlipped: false }
              : c
          )
        );
        setFirstCard(null);
        setSecondCard(null);
        setLockBoard(false);
      }, 1000);
    }
  }, [firstCard, currentStage, stageClear]);

  // 카드 클릭 (checkMatch 이후에 정의)
  const handleCardClick = useCallback((card: CardData) => {
    if (lockBoard || card.isFlipped || card.isMatched || gameState !== "playing" || isFrozen) {
      return;
    }

    // 효과음 재생
    if (audioRefs.current.flip) {
      try {
        audioRefs.current.flip.play();
      } catch (e) {
        // 효과음 재생 실패 시 무시
      }
    }

    // 함수형 업데이트 사용하여 cards dependency 제거
    setCards((prevCards) =>
      prevCards.map((c) =>
        c.id === card.id ? { ...c, isFlipped: true } : c
      )
    );

    if (!firstCard) {
      setFirstCard(card);
    } else {
      setSecondCard(card);
      setLockBoard(true);

      // 매칭 확인
      setTimeout(() => {
        checkMatch(card);
      }, 300);
    }
  }, [firstCard, lockBoard, gameState, isFrozen, checkMatch]);

  // currentStage 변경 시 게임 초기화
  useEffect(() => {
    if (gameState === "playing" && currentStage >= 0) {
      initializeGame();
    }

    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [currentStage, gameState, initializeGame]);

  // 힌트 아이템 사용
  const useHint = useCallback(() => {
    if (items.hint <= 0 || lockBoard || gameState !== "playing") return;

    // 이전 타이머가 있으면 정리
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
    }

    setItems((prev) => ({ ...prev, hint: prev.hint - 1 }));
    setLockBoard(true);

    // 함수형 업데이트 사용하여 cards dependency 제거
    setCards((prevCards) => {
      const unmatchedCards = prevCards.filter((c) => !c.isMatched && !c.isFlipped);
      const cardIds = unmatchedCards.map((c) => c.id);

      // setTimeout을 ref로 관리하여 메모리 누수 방지
      hintTimerRef.current = setTimeout(() => {
        setCards((currentCards) =>
          currentCards.map((c) =>
            cardIds.includes(c.id) ? { ...c, isFlipped: false } : c
          )
        );
        setLockBoard(false);
        hintTimerRef.current = null;
      }, 1500);

      // 모든 카드 뒤집기
      return prevCards.map((c) =>
        cardIds.includes(c.id) ? { ...c, isFlipped: true } : c
      );
    });
  }, [items.hint, lockBoard, gameState]);

  // 냉동 아이템 사용
  const useFreeze = useCallback(() => {
    if (items.freeze <= 0 || isFrozen || gameState !== "playing") return;

    // 이전 타이머가 있으면 정리
    if (freezeTimerRef.current) {
      clearTimeout(freezeTimerRef.current);
    }

    setItems((prev) => ({ ...prev, freeze: prev.freeze - 1 }));
    setIsFrozen(true);
    isFrozenRef.current = true;

    freezeTimerRef.current = setTimeout(() => {
      setIsFrozen(false);
      isFrozenRef.current = false;
      freezeTimerRef.current = null;
    }, 5000);
  }, [items.freeze, isFrozen, gameState]);

  // 카드 크기 계산 (스테이지에 따라)
  const cardSize = stageConfig.pairs > 18 ? "55px" : "70px";
  const cardHeight = stageConfig.pairs > 18 ? "75px" : "90px";

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-6">
      {/* 게임 타이틀 */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          🧊 냉장고 짝맞추기
        </h2>
        <p className="text-gray-600">20스테이지 챌린지! 모든 스테이지를 클리어하세요!</p>
      </div>

      {/* 메뉴 화면 */}
      <AnimatePresence>
        {gameState === "menu" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 게임 시작 버튼 */}
            <div className="flex justify-center gap-4">
              <Button
                size="lg"
                onClick={() => {
                  setCurrentStage(0);
                  setItems({ hint: 2, freeze: 1 });
                  setGameState("playing");
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                게임 시작
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setShowInstructions(true)}
              >
                <HelpCircle className="w-5 h-5 mr-2" />
                게임 방법
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 게임 화면 */}
      <AnimatePresence>
        {gameState === "playing" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            {/* 게임 정보 */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold">
                      Stage <span className="font-mono text-xl">{currentStage + 1}</span> / {TOTAL_STAGES}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className={`w-5 h-5 ${timeLeft <= 10 ? "text-red-600" : "text-blue-600"}`} />
                    <span className={`font-semibold ${timeLeft <= 10 ? "text-red-600 font-bold" : ""}`}>
                      남은 시간: <span className="font-mono">{timeLeft}초</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    <span className="font-semibold">
                      맞춘 개수: {matchedCount} / {stageConfig.pairs}
                    </span>
                  </div>
                  {combo > 0 && (
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      <span className="font-bold text-yellow-600">
                        콤보: {combo} (최대: {maxCombo})
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 아이템 버튼 */}
            <div className="flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={useHint}
                disabled={items.hint <= 0 || lockBoard}
                className="flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                힌트 ({items.hint})
              </Button>
              <Button
                variant="outline"
                onClick={useFreeze}
                disabled={items.freeze <= 0 || isFrozen}
                className="flex items-center gap-2"
              >
                <Snowflake className="w-4 h-4" />
                냉동 ({items.freeze})
              </Button>
            </div>

            {/* 카드 보드 */}
            <div
              className="grid gap-3 justify-center relative"
              style={{
                gridTemplateColumns: `repeat(${stageConfig.cols}, ${cardSize})`,
                maxWidth: "100%",
              }}
            >
              {/* 파티클 효과 */}
              {isMounted && (
                <AnimatePresence>
                  {showParticles && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 pointer-events-none z-10"
                      suppressHydrationWarning
                    >
                      {[...Array(20)].map((_, i) => {
                        // 클라이언트에서만 랜덤 값 생성 (Hydration mismatch 방지)
                        const randomX = typeof window !== 'undefined' ? Math.random() : 0;
                        const randomY = typeof window !== 'undefined' ? Math.random() : 0;
                        return (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 bg-yellow-400 rounded-full"
                            initial={{
                              x: "50%",
                              y: "50%",
                              scale: 0,
                            }}
                            animate={{
                              x: `${50 + (randomX - 0.5) * 100}%`,
                              y: `${50 + (randomY - 0.5) * 100}%`,
                              scale: [0, 1, 0],
                            }}
                            transition={{
                              duration: 0.6,
                              delay: i * 0.02,
                            }}
                          />
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {cards.map((card) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    x: shakeCards.has(card.id) ? [0, -10, 10, -10, 10, 0] : 0,
                  }}
                  transition={{
                    x: shakeCards.has(card.id)
                      ? { duration: 0.6, ease: "easeInOut" }
                      : { duration: 0.3 },
                  }}
                  whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                  whileTap={{ scale: card.isMatched ? 1 : 0.95 }}
                  className="relative cursor-pointer"
                  style={{ width: cardSize, height: cardHeight }}
                  onClick={() => handleCardClick(card)}
                >
                  <motion.div
                    className="w-full h-full rounded-lg shadow-lg border-2 transition-all duration-300"
                    animate={{
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                    }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    style={{
                      transformStyle: "preserve-3d",
                    }}
                  >
                    {/* 카드 뒷면 */}
                    <div
                      className="absolute inset-0 rounded-lg flex items-center justify-center text-4xl font-bold bg-gradient-to-br from-blue-500 to-blue-700 text-white"
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(0deg)",
                      }}
                    >
                      ?
                    </div>

                    {/* 카드 앞면 */}
                    <div
                      className={`absolute inset-0 rounded-lg flex items-center justify-center bg-white border-2 ${
                        card.isMatched
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200"
                      }`}
                      style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)",
                        fontSize: stageConfig.pairs > 18 ? "1.3rem" : "1.8rem",
                      }}
                    >
                      {card.food}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>

            {/* 게임 중단 버튼 */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={resetGame}>
                <RotateCcw className="w-4 h-4 mr-2" />
                게임 중단
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 스테이지 클리어 오버레이 */}
      <AnimatePresence>
        {showStageClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-center space-y-6"
            >
              <h2 className="text-5xl font-bold text-white mb-4">
                Stage {currentStage + 1} Clear! 🎉
              </h2>
              {(currentStage + 1) % 3 === 0 && (
                <p className="text-2xl text-yellow-400 mb-4">
                  🎁 보너스! 모든 아이템이 1개씩 추가되었습니다!
                </p>
              )}
              <Button
                size="lg"
                onClick={startNextStage}
                className="bg-gradient-to-r from-blue-600 to-purple-600"
              >
                다음 스테이지 시작
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 엔딩 오버레이 */}
      {isMounted && (
        <AnimatePresence>
          {showEnding && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 overflow-hidden"
              style={{
                background: "linear-gradient(45deg, #FFD700, #FF69B4, #ADFF2F)",
              }}
              suppressHydrationWarning
            >
              {/* 파티클 효과 */}
              {[...Array(50)].map((_, i) => {
                // 클라이언트에서만 랜덤 값 생성 (Hydration mismatch 방지)
                const randomX = typeof window !== 'undefined' ? Math.random() : 0;
                const randomY = typeof window !== 'undefined' ? Math.random() : 0;
                const randomDelay = typeof window !== 'undefined' ? Math.random() * 5 : 0;
                return (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    initial={{
                      x: "50%",
                      y: "50%",
                      scale: 0,
                      opacity: 0.8,
                    }}
                    animate={{
                      x: `${50 + (randomX - 0.5) * 100}%`,
                      y: `${50 - randomY * 100}%`,
                      scale: [0, 1, 0],
                      opacity: [0.8, 0.8, 0],
                    }}
                    transition={{
                      duration: 5,
                      delay: randomDelay,
                      repeat: Infinity,
                    }}
                  />
                );
              })}

            <div className="flex items-center justify-center h-full flex-col">
              <motion.h2
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 2 }}
                className="text-6xl font-black text-white mb-8 text-center"
                style={{ textShadow: "4px 4px 8px rgba(0,0,0,0.3)" }}
              >
                🎉 전설의 냉장고 마스터 등극! 🎉
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1 }}
                className="text-3xl text-white mb-12 text-center"
                style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}
              >
                모든 스테이지를 완벽하게 클리어했습니다!
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 2 }}
              >
                <Button
                  size="lg"
                  onClick={resetGame}
                  className="bg-green-600 hover:bg-green-700 text-white text-xl px-8 py-6"
                >
                  다시 플레이
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      )}

      {/* 게임 방법 모달 */}
      <AnimatePresence>
        {showInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowInstructions(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HelpCircle className="w-6 h-6" />
                    게임 방법
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">🎯 게임 목표</h3>
                      <p className="text-gray-700">
                        20개의 스테이지를 모두 클리어하여 냉장고 마스터가 되세요!
                        각 스테이지마다 난이도가 자동으로 증가합니다.
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">🎮 게임 방법</h3>
                      <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>카드를 클릭하여 뒤집습니다.</li>
                        <li>같은 식재료 카드 2장을 찾아 짝을 맞춥니다.</li>
                        <li>짝이 맞으면 카드가 고정되고, 틀리면 다시 뒤집힙니다.</li>
                        <li>모든 짝을 맞추면 스테이지가 클리어됩니다!</li>
                        <li>20스테이지를 모두 클리어하면 엔딩을 볼 수 있습니다!</li>
                      </ol>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">⚡ 아이템</h3>
                      <ul className="space-y-2 text-gray-700">
                        <li>
                          <strong>🔍 힌트:</strong> 모든 카드를 1.5초간 보여줍니다.
                        </li>
                        <li>
                          <strong>❄️ 냉동:</strong> 5초간 시간을 멈춥니다.
                        </li>
                        <li>
                          <strong>🎁 보너스:</strong> 3스테이지마다 아이템이 보충됩니다!
                        </li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">💡 팁</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>연속으로 맞추면 콤보가 쌓입니다!</li>
                        <li>카드의 위치를 기억하는 것이 중요합니다.</li>
                        <li>시간이 부족할 때 냉동 아이템을 활용하세요!</li>
                        <li>힌트는 정말 어려울 때만 사용하세요!</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={() => setShowInstructions(false)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      확인
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
