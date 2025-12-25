/**
 * @file components/games/exercise-timing-game.tsx
 * @description 운동 타임어택 게임
 *
 * 운동 동작을 정확한 타이밍에 맞춰 수행하는 게임으로 운동 동기 부여에 도움을 줍니다.
 *
 * 주요 기능:
 * 1. 타이밍에 맞춰 버튼 클릭
 * 2. 연속 성공 시 콤보 보너스
 * 3. 점수 및 보상 시스템
 *
 * @dependencies
 * - react: useState, useEffect, useRef
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/actions/game/save-minigame-record: 게임 기록 저장
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Trophy, RotateCcw, Zap } from "lucide-react";
import { saveMinigameRecord } from "@/actions/game/save-minigame-record";

interface ExerciseTimingGameProps {
  memberId?: string;
  onComplete?: (score: number) => void;
}

export function ExerciseTimingGame({ memberId, onComplete }: ExerciseTimingGameProps) {
  const [gameState, setGameState] = useState<"waiting" | "playing" | "finished">("waiting");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30); // 30초 게임
  const [targetTime, setTargetTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [canClick, setCanClick] = useState(false);
  const [result, setResult] = useState<"perfect" | "good" | "miss" | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 게임 시작
  const handleStart = () => {
    setGameState("playing");
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setCurrentTime(0);
    generateNewTarget();
    startGameTimer();
  };

  // 게임 타이머
  const startGameTimer = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);

    gameTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 타겟 시간 생성
  const generateNewTarget = () => {
    const randomDelay = Math.random() * 2000 + 1000; // 1-3초 사이
    setTargetTime(null);
    setCanClick(false);
    setResult(null);

    setTimeout(() => {
      setTargetTime(Date.now());
      setCanClick(true);
      setCurrentTime(Date.now());

      // 정확한 타이밍 체크를 위한 인터벌
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        setCurrentTime(Date.now());
      }, 10);
    }, randomDelay);
  };

  // 버튼 클릭 처리
  const handleClick = () => {
    if (!canClick || !targetTime) return;

    const timeDiff = Math.abs(currentTime - targetTime);
    let newResult: "perfect" | "good" | "miss";
    let points = 0;

    if (timeDiff < 100) {
      // Perfect: 100ms 이내
      newResult = "perfect";
      points = 100 + combo * 10;
      setCombo((prev) => prev + 1);
    } else if (timeDiff < 300) {
      // Good: 300ms 이내
      newResult = "good";
      points = 50 + combo * 5;
      setCombo((prev) => prev + 1);
    } else {
      // Miss
      newResult = "miss";
      setCombo(0);
    }

    setResult(newResult);
    setScore((prev) => prev + points);
    setCanClick(false);

    // 다음 타겟 생성
    setTimeout(() => {
      generateNewTarget();
    }, 1000);
  };

  // 게임 종료
  const endGame = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setGameState("finished");

    // 게임 기록 저장
    if (memberId) {
      saveMinigameRecord({
        memberId,
        gameType: "exercise_timing",
        score,
        completed: true,
      }).catch(console.error);
    }
  };

  // 게임 재시작
  const handleRestart = () => {
    if (gameTimerRef.current) clearInterval(gameTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setGameState("waiting");
    setScore(0);
    setCombo(0);
    setTimeLeft(30);
    setResult(null);
  };

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (gameState === "waiting") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Activity className="w-5 h-5 text-green-400" />
            운동 타임어택 게임
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            정확한 타이밍에 맞춰 버튼을 클릭하세요! Perfect를 연속으로 달성하면 콤보 보너스를 받을 수 있습니다.
          </p>
          <Button onClick={handleStart} className="w-full">
            게임 시작
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (gameState === "finished") {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-yellow-400" />
            게임 종료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-2">최종 점수</p>
            <p className="text-4xl font-bold text-green-400">{score}</p>
            <p className="text-gray-300 mt-4">최대 콤보: {combo}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRestart} className="flex-1" variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              다시 시작
            </Button>
            {onComplete && (
              <Button onClick={() => onComplete(score)} className="flex-1">
                완료
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-green-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            운동 타임어택 게임
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>점수: {score}</span>
            <span>콤보: {combo}</span>
            <span>시간: {timeLeft}초</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          {!canClick ? (
            <div className="space-y-4">
              <p className="text-xl font-bold text-white mb-4">준비하세요...</p>
              <div className="w-32 h-32 mx-auto border-4 border-gray-600 rounded-full flex items-center justify-center">
                <Activity className="w-16 h-16 text-gray-600" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-32 h-32 mx-auto border-4 border-green-500 rounded-full flex items-center justify-center bg-green-500/20"
              >
                <Zap className="w-16 h-16 text-green-400" />
              </motion.div>
              <p className="text-xl font-bold text-white">지금 클릭!</p>
              <Button
                onClick={handleClick}
                size="lg"
                className="w-full bg-green-500 hover:bg-green-600 text-white text-lg py-6"
              >
                클릭!
              </Button>
            </div>
          )}
        </div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-4 rounded-lg ${
              result === "perfect"
                ? "bg-yellow-500/20 text-yellow-400"
                : result === "good"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            <p className="text-xl font-bold">
              {result === "perfect" && "PERFECT! 🎯"}
              {result === "good" && "GOOD! 👍"}
              {result === "miss" && "MISS 😢"}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

