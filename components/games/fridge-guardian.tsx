/**
 * @file components/games/fridge-guardian.tsx
 * @description 냉장고 파수꾼 게임 메인 컴포넌트
 * 
 * 사용자가 냉장고 속 세균을 잡는 캐주얼 클릭 게임입니다.
 * 
 * 주요 기능:
 * 1. 세균/곰팡이/보스 처치 (점수 획득)
 * 2. 알레르기/신선식품 구분 (생명력 관리)
 * 3. 콤보 시스템 (연속 처치 보너스)
 * 4. 가족 프로필 알레르기 정보 연동
 * 5. 점수 저장 및 랭킹
 * 
 * @dependencies
 * - framer-motion: 애니메이션
 * - lucide-react: 아이콘
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 * - @/lib/games/fridge-guardian: 게임 로직
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, ShieldAlert, Trophy, RotateCcw, Star, Timer, Target, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import type { GameItem, GameState, GameStats } from '@/types/game/fridge-guardian';
import { DEFAULT_GAME_CONFIG, getRandomHealthTip, getScoreRank, getComboMessage } from '@/lib/games/fridge-guardian/config';
import { 
  generateRandomItemType, 
  createGameItem, 
  processItemClick, 
  createInitialStats,
  formatTime,
  formatScore,
  calculateLevel
} from '@/lib/games/fridge-guardian/utils';
import { 
  saveGameScore, 
  getUserHighScore, 
  getUserAllergyInfo 
} from '@/lib/games/fridge-guardian/supabase';
import { DIFFICULTY_CONFIG } from '@/lib/games/fridge-guardian/config';
import { soundManager } from '@/lib/games/fridge-guardian/sound';
import type { GameDifficulty, DifficultyConfig } from '@/types/game/fridge-guardian';
import { Settings } from 'lucide-react';

export default function FridgeGuardian() {
  // 인증 및 Supabase
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  
  // 게임 상태
  const [gameState, setGameState] = useState<GameState>('READY');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_GAME_CONFIG.duration);
  const [lives, setLives] = useState(DEFAULT_GAME_CONFIG.maxLives);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [items, setItems] = useState<GameItem[]>([]);
  const [stats, setStats] = useState<GameStats>(createInitialStats());
  const [highScore, setHighScore] = useState(0);
  const [allergyInfo, setAllergyInfo] = useState<string[]>([]);
  const [level, setLevel] = useState(1);
  const [scoreMultiplier, setScoreMultiplier] = useState(1);
  const [slowTimeActive, setSlowTimeActive] = useState(false);
  const [activeEffects, setActiveEffects] = useState<Map<string, { endTime: number }>>(new Map());
  
  // UI 상태
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showComboMessage, setShowComboMessage] = useState<{ message: string; emoji: string } | null>(null);
  const [difficulty, setDifficulty] = useState<GameDifficulty>('NORMAL');
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [clickEffects, setClickEffects] = useState<Array<{ id: number; x: number; y: number }>>([]);
  
  // Refs
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnerRef = useRef<NodeJS.Timeout | null>(null);
  const itemLifetimeRefs = useRef<Map<number, NodeJS.Timeout>>(new Map());
  
  // 초기 데이터 로드
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);
  
  const loadUserData = async () => {
    try {
      // 최고 점수 조회
      const { score: high } = await getUserHighScore(supabase, userId!);
      setHighScore(high);
      
      // 알레르기 정보 조회
      const allergyData = await getUserAllergyInfo(supabase, userId!);
      setAllergyInfo(allergyData.allergies);
      
      console.log('[FridgeGuardian] 사용자 데이터 로드 완료:', { highScore: high, allergies: allergyData.allergies });
    } catch (error) {
      console.error('[FridgeGuardian] 사용자 데이터 로드 실패:', error);
    }
  };
  
  // 사운드 설정 동기화
  useEffect(() => {
    soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // 아이템 생성
  const spawnItem = useCallback(() => {
    if (gameState !== 'PLAYING' || isPaused) return;
    
    const difficultyConfig: DifficultyConfig = DIFFICULTY_CONFIG[difficulty];
    // 레벨을 고려한 아이템 생성
    const itemType = generateRandomItemType(difficultyConfig, allergyInfo, level);
    const newItem = createGameItem(itemType);
    
    setItems(prev => [...prev, newItem]);
    
    // 아이템 자동 소멸 타이머 (난이도 및 시간 감속 효과에 따라 조정)
    const lifetime = slowTimeActive 
      ? difficultyConfig.itemLifetime * 1.5 
      : difficultyConfig.itemLifetime;
    const timeoutId = setTimeout(() => {
      setItems(prev => prev.filter(i => i.id !== newItem.id));
      setStats(prev => ({ ...prev, itemsMissed: prev.itemsMissed + 1 }));
      itemLifetimeRefs.current.delete(newItem.id);
    }, lifetime);
    
    itemLifetimeRefs.current.set(newItem.id, timeoutId);
  }, [gameState, isPaused, allergyInfo, difficulty, level, slowTimeActive]);
  
  // 게임 루프
  useEffect(() => {
    if (gameState === 'PLAYING' && !isPaused) {
      // 타이머
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      // 아이템 생성 (난이도 및 시간 감속 효과에 따라 생성 속도 조정)
      const difficultyConfig: DifficultyConfig = DIFFICULTY_CONFIG[difficulty];
      const spawnRate = slowTimeActive 
        ? difficultyConfig.spawnRate * 1.5 
        : difficultyConfig.spawnRate;
      spawnerRef.current = setInterval(spawnItem, spawnRate);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnerRef.current) clearInterval(spawnerRef.current);
    }
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (spawnerRef.current) clearInterval(spawnerRef.current);
    };
  }, [gameState, isPaused, spawnItem, difficulty]);
  
  // 아이템 클릭 처리
  const handleItemClick = (item: GameItem, event: React.MouseEvent) => {
    if (gameState !== 'PLAYING' || isPaused) return;
    
    // 클릭 이펙트 추가
    const rect = gameContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const clickX = ((event.clientX - rect.left) / rect.width) * 100;
      const clickY = ((event.clientY - rect.top) / rect.height) * 100;
      const effectId = Date.now();
      setClickEffects(prev => [...prev, { id: effectId, x: clickX, y: clickY }]);
      setTimeout(() => {
        setClickEffects(prev => prev.filter(e => e.id !== effectId));
      }, 500);
    }
    
    // 아이템 제거
    setItems(prev => prev.filter(i => i.id !== item.id));
    
    // 생명주기 타이머 정리
    const timeoutId = itemLifetimeRefs.current.get(item.id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      itemLifetimeRefs.current.delete(item.id);
    }
    
    // 점수 및 상태 업데이트
    const result = processItemClick(item, score, lives, combo, scoreMultiplier);
    setScore(result.newScore);
    setLives(result.newLives);
    setCombo(result.newCombo);
    
    if (result.newCombo > maxCombo) {
      setMaxCombo(result.newCombo);
    }
    
    // 특수 효과 처리
    if (result.effect) {
      if (result.effect.type === 'heal') {
        // 생명력 회복은 이미 processItemClick에서 처리됨
        soundManager.play('powerUp');
      } else if (result.effect.type === 'time') {
        setTimeLeft(prev => prev + result.effect!.value);
        soundManager.play('powerUp');
      } else if (result.effect.type === 'multiplier') {
        setScoreMultiplier(result.effect.value);
        const effectKey = 'multiplier';
        const endTime = Date.now() + (result.effect.duration! * 1000);
        setActiveEffects(prev => new Map(prev).set(effectKey, { endTime }));
        soundManager.play('powerUp');
        // 효과 종료 타이머
        setTimeout(() => {
          setScoreMultiplier(1);
          setActiveEffects(prev => {
            const newMap = new Map(prev);
            newMap.delete(effectKey);
            return newMap;
          });
        }, result.effect.duration! * 1000);
      } else if (result.effect.type === 'slow') {
        setSlowTimeActive(true);
        const effectKey = 'slowTime';
        const endTime = Date.now() + (result.effect.duration! * 1000);
        setActiveEffects(prev => new Map(prev).set(effectKey, { endTime }));
        soundManager.play('powerUp');
        // 효과 종료 타이머
        setTimeout(() => {
          setSlowTimeActive(false);
          setActiveEffects(prev => {
            const newMap = new Map(prev);
            newMap.delete(effectKey);
            return newMap;
          });
        }, result.effect.duration! * 1000);
      }
    }
    
    // 레벨 업데이트
    const difficultyConfig: DifficultyConfig = DIFFICULTY_CONFIG[difficulty];
    const newLevel = calculateLevel(result.newScore, difficultyConfig.levelUpThreshold);
    if (newLevel > level) {
      setLevel(newLevel);
      console.log(`[FridgeGuardian] 레벨 업! Level ${newLevel}`);
    }
    
    // 통계 업데이트
    setStats(prev => {
      const newStats = { ...prev };
      if (result.isCorrect) {
        newStats.correctClicks += 1;
        newStats.itemsCaught += 1;
        if (item.type === 'BOSS') {
          newStats.bossDefeated += 1;
          soundManager.play('boss');
        } else if (item.type === 'MOLD') {
          newStats.moldDefeated += 1;
          soundManager.play('catch');
        } else if (item.type === 'NORMAL') {
          newStats.normalDefeated += 1;
          soundManager.play('catch');
        } else if (item.type === 'VIRUS') {
          newStats.virusDefeated = (newStats.virusDefeated || 0) + 1;
          soundManager.play('catch');
        } else if (item.type === 'PARASITE') {
          newStats.parasiteDefeated = (newStats.parasiteDefeated || 0) + 1;
          soundManager.play('catch');
        } else if (item.type === 'POWER_UP') {
          newStats.powerUpsCollected = (newStats.powerUpsCollected || 0) + 1;
        } else if (item.type === 'TIME_BONUS') {
          newStats.timeBonusesCollected = (newStats.timeBonusesCollected || 0) + 1;
        }
      } else {
        newStats.wrongClicks += 1;
        soundManager.play('error');
      }
      newStats.level = newLevel;
      newStats.maxLevel = Math.max(newStats.maxLevel || 1, newLevel);
      return newStats;
    });
    
    // 콤보 메시지 표시 및 사운드
    if (result.newCombo > 0) {
      const comboMsg = getComboMessage(result.newCombo);
      if (comboMsg) {
        setShowComboMessage(comboMsg);
        setTimeout(() => setShowComboMessage(null), 2000);
        if (result.newCombo % 5 === 0) {
          soundManager.play('combo');
        }
      }
    }
    
    // 생명력이 0이면 게임 종료
    if (result.newLives <= 0) {
      endGame();
    }
  };
  
  // 게임 시작
  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setTimeLeft(DEFAULT_GAME_CONFIG.duration);
    setLives(DEFAULT_GAME_CONFIG.maxLives);
    setCombo(0);
    setMaxCombo(0);
    setItems([]);
    setStats(createInitialStats());
    setIsPaused(false);
    setShowDifficultySelect(false);
    setLevel(1);
    setScoreMultiplier(1);
    setSlowTimeActive(false);
    setActiveEffects(new Map());
    
    // 모든 타이머 정리
    itemLifetimeRefs.current.forEach(timeout => clearTimeout(timeout));
    itemLifetimeRefs.current.clear();
    
    // 게임 시작 사운드
    soundManager.play('gameStart');
    
    console.log('[FridgeGuardian] 게임 시작 - 난이도:', difficulty);
  };
  
  // 게임 종료
  const endGame = async () => {
    setGameState('OVER');
    
    // 게임 종료 사운드
    soundManager.play('gameOver');
    
    // 타이머 정리
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnerRef.current) clearInterval(spawnerRef.current);
    itemLifetimeRefs.current.forEach(timeout => clearTimeout(timeout));
    itemLifetimeRefs.current.clear();
    
    // 최종 통계 업데이트
    const finalStats: GameStats = {
      ...stats,
      score,
      combo,
      maxCombo,
    };
    
    // 점수 저장
    if (userId && score > 0) {
      try {
        const result = await saveGameScore(supabase, userId, score, finalStats);
        if (result.success) {
          console.log('[FridgeGuardian] 점수 저장 성공');
          
          // 최고 점수 업데이트
          if (score > highScore) {
            setHighScore(score);
          }
        } else {
          console.error('[FridgeGuardian] 점수 저장 실패:', result.error);
        }
      } catch (error) {
        console.error('[FridgeGuardian] 점수 저장 예외:', error);
      }
    }
    
    console.log('[FridgeGuardian] 게임 종료:', { score, stats: finalStats });
  };
  
  // 일시정지 토글
  const togglePause = () => {
    setIsPaused(prev => !prev);
    if (gameState === 'PLAYING') {
      setGameState('PAUSED');
    } else if (gameState === 'PAUSED') {
      setGameState('PLAYING');
    }
  };
  
  const scoreRank = getScoreRank(score);
  const healthTip = getRandomHealthTip();
  const difficultyConfig = DIFFICULTY_CONFIG[difficulty];
  
  return (
    <div 
      ref={gameContainerRef} 
      className="relative w-full max-w-3xl mx-auto h-[500px] sm:h-[600px] bg-gradient-to-br from-sky-100 via-purple-50 to-pink-50 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden border-[5px] sm:border-[10px] border-white shadow-[0_20px_60px_rgba(102,126,234,0.3)] font-sans relative"
    >
      {/* 배경 패턴 오버레이 */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(102,126,234,0.2) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(118,75,162,0.2) 0%, transparent 50%)`,
          backgroundSize: '100px 100px'
        }} />
      </div>
      {/* 상단 HUD */}
      <div className="absolute top-0 left-0 right-0 p-2 sm:p-4 flex justify-between items-start z-20 pointer-events-none gap-2">
        <div className="space-y-1 sm:space-y-1.5 flex-shrink-0">
          {/* 생명력 */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-1 bg-white/90 backdrop-blur-lg p-2 sm:p-2.5 rounded-full border-2 border-red-200 shadow-lg"
          >
            {[...Array(DEFAULT_GAME_CONFIG.maxLives)].map((_, i) => (
              <motion.div
                key={i}
                animate={i < lives ? { scale: [1, 1.2] } : {}}
                transition={{ duration: 0.5, repeat: i < lives ? Infinity : 0, repeatDelay: 2, repeatType: "reverse" }}
              >
                <Heart 
                  size={18} 
                  className="sm:w-6 sm:h-6 transition-all"
                  fill={i < lives ? "#ef4444" : "none"} 
                  style={{ color: i < lives ? "#ef4444" : "#d1d5db" }}
                />
              </motion.div>
            ))}
          </motion.div>
          {/* 점수 */}
          <motion.div 
            key={score} 
            initial={{ scale: 1.3, y: -5 }} 
            animate={{ scale: 1, y: 0 }}
            className="bg-gradient-to-br from-sky-500 to-blue-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl shadow-lg border-2 border-white/50"
          >
            <p className="text-[9px] sm:text-[10px] font-bold text-sky-100 uppercase tracking-wider mb-0.5">Score</p>
            <p className="text-xl sm:text-3xl font-black drop-shadow-md">
              {formatScore(score)}
            </p>
          </motion.div>
          {/* 최고 점수 */}
          {highScore > 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] text-gray-600 border border-gray-200"
            >
              🏆 최고: <span className="font-bold text-sky-600 text-[10px] sm:text-xs">{formatScore(highScore)}</span>
            </motion.div>
          )}
          {/* 레벨 표시 */}
          <motion.div 
            key={level}
            initial={{ scale: 1.4, y: -5, rotate: -5 }} 
            animate={{ scale: 1, y: 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg border-2 border-white/50"
          >
            <Star size={10} className="sm:w-3 sm:h-3" fill="white" /> Lv.{level}
          </motion.div>
        </div>
        
        {/* 중앙: 타이머, 콤보 및 특수 효과 */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0 min-w-0">
          {/* 타이머 */}
          <motion.div 
            animate={timeLeft < 10 ? { scale: [1, 1.05] } : {}}
            transition={{ duration: 0.5, repeat: timeLeft < 10 ? Infinity : 0, repeatType: "reverse" }}
            className="bg-gradient-to-br from-orange-400 to-red-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border-2 border-white/50 shadow-xl text-center"
          >
            <p className="text-[8px] sm:text-[10px] font-bold text-white/90 uppercase tracking-widest mb-0.5">Time</p>
            <p className={`text-xl sm:text-2xl font-mono font-black drop-shadow-md ${timeLeft < 10 ? 'animate-pulse' : ''}`}>
              {formatTime(timeLeft)}
            </p>
          </motion.div>
          
          {/* 콤보 배너 */}
          <AnimatePresence>
            {combo >= 3 && (
              <motion.div 
                initial={{ y: -50, opacity: 0, scale: 0.5 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: -20, opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 text-white px-4 sm:px-6 py-1.5 sm:py-2 rounded-full font-black italic shadow-[0_10px_30px_rgba(255,193,7,0.4)] flex items-center gap-1.5 border-2 border-white/50 text-xs sm:text-sm"
              >
                <motion.div
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Zap size={16} className="sm:w-5 sm:h-5" fill="white" />
                </motion.div>
                <span>{combo} COMBO</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* 특수 효과 표시 */}
          <AnimatePresence>
            {scoreMultiplier > 1 && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: -10 }}
                animate={{ 
                  scale: [1, 1.1], 
                  opacity: 1,
                  y: 0
                }}
                exit={{ scale: 0, opacity: 0, y: -10 }}
                transition={{ 
                  scale: { duration: 1, repeat: Infinity, repeatType: "reverse", type: "tween" }
                }}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg border-2 border-white/50"
              >
                <Star size={12} className="sm:w-3 sm:h-3" fill="white" /> 
                <span>{scoreMultiplier}x</span>
              </motion.div>
            )}
            {slowTimeActive && (
              <motion.div
                initial={{ scale: 0, opacity: 0, y: -10 }}
                animate={{ 
                  scale: [1, 1.1], 
                  opacity: 1,
                  y: 0
                }}
                exit={{ scale: 0, opacity: 0, y: -10 }}
                transition={{ 
                  scale: { duration: 1, repeat: Infinity, repeatType: "reverse", type: "tween" }
                }}
                className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-3 py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1 shadow-lg border-2 border-white/50"
              >
                <Timer size={12} className="sm:w-3 sm:h-3" fill="white" /> 
                <span>감속</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {/* 우측 빈 공간 (균형을 위해) */}
        <div className="flex-shrink-0 w-0 sm:w-auto"></div>
      </div>
      
      {/* 컨트롤 버튼 (우측 상단) */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-2 sm:top-4 right-2 sm:right-4 z-30 flex gap-1.5 sm:gap-2">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={togglePause}
            className="bg-white/90 backdrop-blur-lg p-1.5 sm:p-2 rounded-full border-2 border-gray-300 hover:border-sky-400 hover:bg-sky-50 transition-all shadow-lg pointer-events-auto"
            aria-label={isPaused ? '재개' : '일시정지'}
          >
            {isPaused ? <Play size={16} className="sm:w-5 sm:h-5 text-sky-600" /> : <Pause size={16} className="sm:w-5 sm:h-5 text-sky-600" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              const newState = !soundEnabled;
              setSoundEnabled(newState);
              soundManager.setEnabled(newState);
            }}
            className="bg-white/90 backdrop-blur-lg p-1.5 sm:p-2 rounded-full border-2 border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all shadow-lg pointer-events-auto"
            aria-label={soundEnabled ? '사운드 끄기' : '사운드 켜기'}
          >
            {soundEnabled ? <Volume2 size={16} className="sm:w-5 sm:h-5 text-purple-600" /> : <VolumeX size={16} className="sm:w-5 sm:h-5 text-purple-600" />}
          </motion.button>
        </div>
      )}
      
      {/* 게임 필드 */}
      <div className="relative w-full h-full pt-16 sm:pt-24 cursor-crosshair">
        {/* 배경 선반 */}
        <div className="absolute inset-0 grid grid-rows-3 opacity-30 pointer-events-none">
          <div className="border-b border-sky-200" />
          <div className="border-b border-sky-200" />
        </div>
        
        {/* 아이템들 */}
        <AnimatePresence>
          {items.map(item => (
            <motion.button
              key={item.id}
              initial={{ scale: 0, rotate: -20, opacity: 0, y: -20 }}
              animate={{ 
                scale: 1, 
                rotate: [0, 5, -5, 0],
                opacity: 1,
                y: 0,
              }}
              exit={{ 
                scale: 1.8, 
                opacity: 0,
                rotate: 360,
                transition: { duration: 0.3, type: "tween", ease: "easeInOut" }
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                rotate: {
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse",
                  ease: "easeInOut"
                }
              }}
              whileHover={{ scale: 1.2, zIndex: 30, filter: "brightness(1.2)" }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => handleItemClick(item, e)}
              className="absolute text-4xl sm:text-6xl select-none z-20 touch-none drop-shadow-lg filter transition-all"
              style={{ left: `${item.x}%`, top: `${item.y}%` }}
            >
              {item.emoji}
              {/* 알레르기 경고 */}
              {item.type === 'ALLERGY' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                  animate={{ scale: [1, 1.2], rotate: [0, 10] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <ShieldAlert size={12} className="sm:w-4 sm:h-4 text-white" />
                </motion.div>
              )}
              {/* 상한 식품 경고 */}
              {item.type === 'SPOILED' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-orange-500 rounded-full p-1"
                  animate={{ scale: [1, 1.2], rotate: [0, 10] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <ShieldAlert size={12} className="sm:w-4 sm:h-4 text-white" />
                </motion.div>
              )}
              {/* 신선식품 경고 */}
              {item.type === 'FRESH' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1"
                  animate={{ scale: [1, 1.2], rotate: [0, 10] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <ShieldAlert size={12} className="sm:w-4 sm:h-4 text-white" />
                </motion.div>
              )}
              {/* 파워업 표시 */}
              {item.type === 'POWER_UP' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-green-400 rounded-full p-0.5"
                  animate={{ scale: [1, 1.3] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <Heart size={10} className="sm:w-3 sm:h-3 text-white" fill="white" />
                </motion.div>
              )}
              {/* 시간 보너스 표시 */}
              {item.type === 'TIME_BONUS' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-blue-400 rounded-full p-0.5"
                  animate={{ scale: [1, 1.3] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <Timer size={10} className="sm:w-3 sm:h-3 text-white" fill="white" />
                </motion.div>
              )}
              {/* 점수 배율 표시 */}
              {item.type === 'SCORE_MULTI' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-0.5"
                  animate={{ scale: [1, 1.3] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <Star size={10} className="sm:w-3 sm:h-3 text-white" fill="white" />
                </motion.div>
              )}
              {/* 시간 감속 표시 */}
              {item.type === 'SLOW_TIME' && (
                <motion.div 
                  className="absolute -top-2 -right-2 bg-purple-400 rounded-full p-0.5"
                  animate={{ scale: [1, 1.3] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.8,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                >
                  <Timer size={10} className="sm:w-3 sm:h-3 text-white" fill="white" />
                </motion.div>
              )}
              {/* 보스/바이러스 강조 */}
              {(item.type === 'BOSS' || item.type === 'VIRUS') && (
                <motion.div 
                  className="absolute -inset-1 border-2 border-red-500 rounded-full"
                  animate={{ scale: [1, 1.1], opacity: [0.5, 0.8] }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 1.5,
                    repeatType: "reverse",
                    type: "tween",
                    ease: "easeInOut"
                  }}
                />
              )}
            </motion.button>
          ))}
        </AnimatePresence>
        
        {/* 클릭 이펙트 */}
        <AnimatePresence>
          {clickEffects.map(effect => (
            <motion.div
              key={effect.id}
              initial={{ scale: 0, opacity: 1, rotate: 0 }}
              animate={{ 
                scale: [0, 2.5], 
                opacity: [1, 0],
                rotate: 360
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", type: "tween" }}
              className="absolute pointer-events-none z-30"
              style={{ 
                left: `${effect.x}%`, 
                top: `${effect.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 rounded-full blur-md shadow-lg" />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2], opacity: [1, 0] }}
                transition={{ duration: 0.4, delay: 0.1, type: "tween" }}
                className="absolute inset-0 w-8 h-8 border-2 border-yellow-300 rounded-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* 콤보 메시지 */}
        <AnimatePresence>
          {showComboMessage && (
            <motion.div
              initial={{ scale: 0, y: 50, opacity: 0, rotate: -20 }}
              animate={{ 
                scale: 1.2, 
                y: 0,
                opacity: 1,
                rotate: 0,
              }}
              exit={{ scale: 0, opacity: 0, y: -50, rotate: 20 }}
              transition={{ 
                duration: 0.6,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 text-4xl sm:text-6xl font-black bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(255,193,7,0.8)] pointer-events-none"
              style={{
                WebkitTextStroke: '2px rgba(255,255,255,0.8)',
                textShadow: '0 0 30px rgba(255,193,7,0.6), 0 0 60px rgba(255,87,34,0.4)'
              }}
            >
              <motion.span
                animate={{ scale: [1, 1.2] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
              >
                {showComboMessage.emoji}
              </motion.span>
              {' '}
              {showComboMessage.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* 오버레이: 시작 / 종료 화면 */}
      {gameState !== 'PLAYING' && (
        <div className="absolute inset-0 z-30 bg-gradient-to-br from-sky-900/80 via-purple-900/70 to-pink-900/70 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0, y: 20 }} 
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="bg-white w-full max-w-sm max-h-[90vh] rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.3)] border-4 border-white/50 relative overflow-hidden my-4"
          >
            {/* 카드 배경 패턴 */}
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 30% 30%, rgba(102,126,234,0.3) 0%, transparent 50%),
                                 radial-gradient(circle at 70% 70%, rgba(118,75,162,0.3) 0%, transparent 50%)`,
                backgroundSize: '80px 80px'
              }} />
            </div>
            <div className="relative z-10 max-h-[85vh] overflow-y-auto pr-1">
            {gameState === 'READY' ? (
              <>
                <motion.div 
                  animate={{ rotate: [12, -12, 12] }}
                  transition={{ duration: 3, repeat: Infinity, repeatType: "reverse" }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-xl border-3 sm:border-4 border-white"
                >
                  <ShieldAlert size={32} className="sm:w-10 sm:h-10 text-white" fill="white" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-sky-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                  냉장고 파수꾼
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 leading-relaxed">
                  세균과 곰팡이를 처치하여<br/>가족의 신선한 식탁을 지켜주세요! 🛡️
                </p>
                {highScore > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 px-3 py-2 rounded-lg border-2 border-yellow-200"
                  >
                    <p className="text-xs text-gray-700">
                      🏆 최고 기록: <span className="font-black text-sky-600 text-sm">{formatScore(highScore)}점</span>
                    </p>
                  </motion.div>
                )}
                
                {/* 난이도 선택 */}
                <div className="mb-4">
                  <button
                    onClick={() => setShowDifficultySelect(!showDifficultySelect)}
                    className="w-full flex items-center justify-between p-2.5 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="text-xs sm:text-sm font-medium text-gray-700">난이도: {difficulty === 'EASY' ? '쉬움' : difficulty === 'NORMAL' ? '보통' : difficulty === 'HARD' ? '어려움' : '전문가'}</span>
                    <Settings size={14} className="text-gray-500" />
                  </button>
                  {showDifficultySelect && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 space-y-1"
                    >
                      {(['EASY', 'NORMAL', 'HARD', 'EXPERT'] as GameDifficulty[]).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => {
                            setDifficulty(diff);
                            setShowDifficultySelect(false);
                          }}
                          className={`w-full p-2 text-xs sm:text-sm rounded-lg transition-colors ${
                            difficulty === diff
                              ? 'bg-sky-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {diff === 'EASY' ? '쉬움' : diff === 'NORMAL' ? '보통' : diff === 'HARD' ? '어려움' : '전문가'}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </div>
                
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame} 
                  className="w-full bg-gradient-to-r from-sky-500 via-purple-500 to-pink-500 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(102,126,234,0.4)] hover:shadow-[0_15px_40px_rgba(102,126,234,0.6)] transition-all flex items-center justify-center gap-2 border-2 border-white/50 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <Zap size={18} className="sm:w-6 sm:h-6" fill="white" /> 
                  <span className="relative z-10">파수꾼 활동 시작</span>
                </motion.button>
              </>
            ) : (
              <>
                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 border-3 sm:border-4 border-white shadow-xl"
                >
                  <Trophy size={32} className="sm:w-10 sm:h-10 text-white" fill="white" />
                </motion.div>
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
                  Mission Clear! 🎉
                </h2>
                <motion.div 
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mb-3 bg-gradient-to-br from-sky-50 to-purple-50 px-4 py-3 rounded-xl sm:rounded-2xl border-2 border-sky-200"
                >
                  <p className="text-sky-600 font-black text-xl sm:text-2xl mb-1">
                    {formatScore(score)}점
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold">
                    {scoreRank.emoji} {scoreRank.rank}
                  </p>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-3 mb-4 text-xs text-gray-700 leading-relaxed text-left border-2 border-blue-200 shadow-inner"
                >
                  <div className="flex items-center gap-1.5 mb-1.5 font-black text-gray-800">
                    <Star size={12} className="text-yellow-500 fill-yellow-500" /> 
                    <span className="text-xs">위생 관리 팁</span>
                  </div>
                  <p className="text-gray-600 text-xs">{healthTip}</p>
                </motion.div>
                <div className="mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star size={16} className="text-purple-500" fill="currentColor" />
                    <span className="font-bold text-base text-purple-600">레벨 {level}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-[9px] sm:text-[10px] text-gray-600 bg-gray-50 rounded-lg p-2">
                    <div className="text-center">처치<br/><span className="font-bold text-sm">{stats.itemsCaught}</span></div>
                    <div className="text-center">콤보<br/><span className="font-bold text-sm">{maxCombo}</span></div>
                    <div className="text-center">보스<br/><span className="font-bold text-sm">{stats.bossDefeated}</span></div>
                    <div className="text-center">바이러스<br/><span className="font-bold text-sm">{stats.virusDefeated || 0}</span></div>
                    <div className="text-center">기생충<br/><span className="font-bold text-sm">{stats.parasiteDefeated || 0}</span></div>
                    <div className="text-center">곰팡이<br/><span className="font-bold text-sm">{stats.moldDefeated}</span></div>
                    {(stats.powerUpsCollected || 0) > 0 && (
                      <div className="text-center col-span-3 text-green-600">파워업: <span className="font-bold">{stats.powerUpsCollected}</span></div>
                    )}
                    {(stats.timeBonusesCollected || 0) > 0 && (
                      <div className="text-center col-span-3 text-blue-600">시간 보너스: <span className="font-bold">{stats.timeBonusesCollected}</span></div>
                    )}
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={startGame} 
                  className="w-full bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_rgba(0,0,0,0.5)] transition-all flex items-center justify-center gap-2 border-2 border-white/20 relative overflow-hidden group"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                  <RotateCcw size={18} className="sm:w-6 sm:h-6 relative z-10" /> 
                  <span className="relative z-10">다시 도전하기</span>
                </motion.button>
              </>
            )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

