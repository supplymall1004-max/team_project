/**
 * @file components/games/fridge-defense.tsx
 * @description Django Defender 게임 메인 컴포넌트
 * 
 * 타워 디펜스 방식의 게임으로, 세균들이 경로를 따라 이동하고
 * 타워를 배치하여 막아내는 게임입니다.
 * 
 * 주요 기능:
 * 1. 타워 배치 및 업그레이드
 * 2. 적 웨이브 시스템
 * 3. 투사체 공격 시스템
 * 4. 점수 저장 및 랭킹
 * 
 * @dependencies
 * - framer-motion: 애니메이션
 * - lucide-react: 아이콘
 * - @/lib/supabase/clerk-client: Supabase 클라이언트
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Coins, Play, RefreshCw, Zap, Pause, 
  Sparkles, Trophy, Skull, Utensils, Send,
  Maximize2, Minimize2
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useAuth } from '@clerk/nextjs';
import type { Tower, Enemy, Projectile, DamageNumber, GameStats, TowerType } from '@/types/game/fridge-defense';

// --- 게임 설정 ---
const TILE_SIZE = 60;
const MAX_TOWERS = 15; // 최대 타워 개수 제한
const PATH_WIDTH = 80; // 경로 너비 (픽셀)

// 난이도별 경로 수
const getPathCount = (wave: number): number => {
  if (wave <= 3) return 1; // 초반: 1개 경로
  if (wave <= 7) return 2; // 중반: 2개 경로
  return 3; // 후반: 3개 경로
};

// 경로 생성 함수
const generatePaths = (boardWidth: number, boardHeight: number, pathCount: number): Array<{ id: number; startY: number; endY: number; color: string }> => {
  const paths: Array<{ id: number; startY: number; endY: number; color: string }> = [];
  const colors = ['#94a3b8', '#64748b', '#475569']; // 경로 색상
  
  if (pathCount === 1) {
    // 단일 경로: 화면 중앙
    paths.push({
      id: 0,
      startY: boardHeight * 0.5,
      endY: boardHeight * 0.5,
      color: colors[0],
    });
  } else if (pathCount === 2) {
    // 2개 경로: 상단, 하단
    paths.push({
      id: 0,
      startY: boardHeight * 0.3,
      endY: boardHeight * 0.3,
      color: colors[0],
    });
    paths.push({
      id: 1,
      startY: boardHeight * 0.7,
      endY: boardHeight * 0.7,
      color: colors[1],
    });
  } else {
    // 3개 경로: 상단, 중앙, 하단
    paths.push({
      id: 0,
      startY: boardHeight * 0.25,
      endY: boardHeight * 0.25,
      color: colors[0],
    });
    paths.push({
      id: 1,
      startY: boardHeight * 0.5,
      endY: boardHeight * 0.5,
      color: colors[1],
    });
    paths.push({
      id: 2,
      startY: boardHeight * 0.75,
      endY: boardHeight * 0.75,
      color: colors[2],
    });
  }
  
  return paths;
};

// 적 타입 정의 (난이도 상향 조절)
const ENEMY_TYPES = {
  NORMAL: { 
    name: 'GERM', 
    emoji: '🦠', 
    hp: 120, // 체력 증가 (80 -> 120)
    speed: 1.5, // 속도 증가 (1.3 -> 1.5)
    gold: 35, // 골드 감소 (50 -> 35)
    attackDamage: 6, // 타워 공격 데미지 증가 (5 -> 6)
    attackRange: 50, // 근접 공격 (타워의 PROTEIN 120보다 작게)
    attackRate: 1800, // 공격 속도 증가 (2000 -> 1800)
  },
  FAST: { 
    name: 'SUGAR_SPIKE', 
    emoji: '🍭', 
    hp: 70, // 체력 증가 (50 -> 70)
    speed: 3.2, // 속도 증가 (2.8 -> 3.2)
    gold: 50, // 골드 감소 (70 -> 50)
    attackDamage: 4, // 데미지 증가 (3 -> 4)
    attackRange: 40, // 근접 공격 (빠른 적이므로 매우 가까이 접근)
    attackRate: 1300, // 공격 속도 증가 (1500 -> 1300)
  },
  TANK: { 
    name: 'FATTY_BOMB', 
    emoji: '🍟', 
    hp: 450, // 체력 증가 (350 -> 450)
    speed: 0.7, // 속도 증가 (0.6 -> 0.7)
    gold: 120, // 골드 감소 (150 -> 120)
    attackDamage: 10, // 데미지 증가 (8 -> 10)
    attackRange: 60, // 중거리 공격 (큰 적이지만 근접 공격)
    attackRate: 2200, // 공격 속도 증가 (2500 -> 2200)
  },
  BOSS: { 
    name: 'MEGA_GERM', 
    emoji: '👹', 
    hp: 800, // 체력 증가 (600 -> 800)
    speed: 1.0, // 속도 증가 (0.8 -> 1.0)
    gold: 250, // 골드 감소 (300 -> 250)
    attackDamage: 15, // 데미지 증가 (12 -> 15)
    attackRange: 70, // 중거리 공격 (보스이지만 근접 공격)
    attackRate: 1800, // 공격 속도 증가 (2000 -> 1800)
  },
};

// 타워 데이터 정의 (난이도 상향: 비용 증가)
const TOWERS_DATA = {
  PROTEIN: { 
    id: 'PROTEIN' as TowerType, 
    name: '닭다리', 
    emoji: '🍗', 
    cost: 180, // 비용 증가 (120 -> 180)
    baseUpgradeCost: 120, // 기본 업그레이드 비용 증가 (80 -> 120)
    range: 80, // 근접 공격이므로 범위를 줄임 (120 -> 80)
    damage: 45, // 높은 데미지
    fireRate: 1200, // 공격 속도
    color: '#f97316',
    attackType: 'MELEE' as const, // 근접 공격 (칼처럼 휘두르기)
    description: '근접 공격: 1명에게 강력한 데미지',
    maxHp: 200, // 높은 방어력 (닭다리 > 브로콜리 > 아보카도)
  },
  VITAMIN: { 
    id: 'VITAMIN' as TowerType, 
    name: '브로콜리', 
    emoji: '🥦', 
    cost: 150, // 비용 증가 (100 -> 150)
    baseUpgradeCost: 90, // 기본 업그레이드 비용 증가 (60 -> 90)
    range: 140, 
    damage: 25, // 범위 공격이므로 개별 데미지는 낮음
    fireRate: 800, 
    color: '#10b981',
    attackType: 'AOE' as const, // 범위 공격 (2명 동시 공격)
    description: '범위 공격: 2명에게 동시 공격',
    maxHp: 120, // 중간 방어력
  },
  SUGAR: { 
    id: 'SUGAR' as TowerType, 
    name: '아보카도', 
    emoji: '🥑', 
    cost: 240, // 비용 증가 (160 -> 240)
    baseUpgradeCost: 180, // 기본 업그레이드 비용 증가 (120 -> 180)
    range: 220, // 원거리이므로 범위가 넓음
    damage: 50, 
    fireRate: 1500, 
    color: '#84cc16',
    attackType: 'RANGE' as const, // 원거리 투사체 (씨 던지기)
    description: '원거리 공격: 씨를 던져 1명 공격',
    maxHp: 60, // 낮은 방어력 (원거리이므로 약함)
  },
};

// 업그레이드 비용 계산 함수 (난이도 상향)
const getUpgradeCost = (towerType: TowerType, currentLevel: number): number => {
  const baseCost = TOWERS_DATA[towerType].baseUpgradeCost;
  return Math.floor(baseCost * (1 + currentLevel * 0.7)); // 레벨마다 70% 증가 (50% -> 70%)
};

// 업그레이드 스탯 증가 함수
const getUpgradeStats = (towerType: TowerType, currentLevel: number) => {
  const baseData = TOWERS_DATA[towerType];
  return {
    damage: Math.floor(baseData.damage * (1 + currentLevel * 0.3)), // 레벨당 30% 데미지 증가
    range: Math.floor(baseData.range * (1 + currentLevel * 0.1)), // 레벨당 10% 범위 증가
    fireRate: Math.floor(baseData.fireRate * (1 - currentLevel * 0.1)), // 레벨당 10% 공격 속도 증가
  };
};

// 금지 구역 생성 함수 (게임 보드의 일부 영역을 배치 불가로 설정)
const generateForbiddenZones = (boardWidth: number, boardHeight: number): Array<{ x: number; y: number }> => {
  const zones: Array<{ x: number; y: number }> = [];
  const cols = Math.floor(boardWidth / TILE_SIZE);
  const rows = Math.floor(boardHeight / TILE_SIZE);
  
  // 랜덤하게 일부 타일을 금지 구역으로 설정 (약 15-20%)
  const forbiddenCount = Math.floor(cols * rows * 0.18);
  const usedPositions = new Set<string>();
  
  for (let i = 0; i < forbiddenCount; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const col = Math.floor(Math.random() * cols);
      const row = Math.floor(Math.random() * rows);
      const key = `${col}-${row}`;
      
      // 경로 근처는 제외 (경로 Y ± 2 타일)
      const y = row * TILE_SIZE + TILE_SIZE / 2;
      const isNearPath = Math.abs(y - boardHeight * 0.25) < PATH_WIDTH ||
                         Math.abs(y - boardHeight * 0.5) < PATH_WIDTH ||
                         Math.abs(y - boardHeight * 0.75) < PATH_WIDTH;
      
      if (!usedPositions.has(key) && !isNearPath) {
        usedPositions.add(key);
        zones.push({
          x: col * TILE_SIZE + TILE_SIZE / 2,
          y: row * TILE_SIZE + TILE_SIZE / 2,
        });
        break;
      }
      attempts++;
    }
  }
  
  return zones;
};

// 랭킹 보드 컴포넌트
interface RankingBoardProps {
  currentScore: number;
  onRestart: () => void;
  onClose: () => void;
}

function RankingBoard({ currentScore, onRestart, onClose }: RankingBoardProps) {
  const [userName, setUserName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [rankings, setRankings] = useState<Array<{ name: string; wave: number }>>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useAuth();

  // 랭킹 데이터 로드
  useEffect(() => {
    loadRankings();
  }, []);

  const loadRankings = async () => {
    try {
      const response = await fetch('/api/games/fridge-defense/ranking?limit=5');
      const data = await response.json();
      if (data.rankings) {
        setRankings(data.rankings.map((r: any) => ({
          name: r.userName || '알 수 없음',
          wave: r.score
        })));
      }
    } catch (error) {
      console.error('[FridgeDefense] 랭킹 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitScore = async () => {
    if (!userName || !userId) return;
    
    try {
      // 점수 저장
      const response = await fetch('/api/games/fridge-defense/save-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: currentScore,
          stats: {
            wave: currentScore,
            enemiesKilled: 0,
            towersPlaced: 0,
            goldEarned: 0,
            damageDealt: 0,
            playTime: 0,
          }
        })
      });

      if (response.ok) {
        setIsSubmitted(true);
        await loadRankings(); // 랭킹 새로고침
      }
    } catch (error) {
      console.error('[FridgeDefense] 점수 저장 실패:', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 md:p-6 overflow-y-auto"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl my-auto">
        <div className="bg-[#339af0] p-4 md:p-6 text-white text-center">
          <Trophy size={32} className="md:w-10 md:h-10 mx-auto mb-2 text-yellow-300" />
          <h2 className="text-xl md:text-2xl font-black italic tracking-tighter uppercase">Hall of Fame</h2>
        </div>
        <div className="p-4 md:p-6 space-y-2 md:space-y-3">
          {loading ? (
            <div className="text-center py-4 text-sm">랭킹 로딩 중...</div>
          ) : (
            rankings.map((r, i) => (
              <div key={i} className="flex justify-between items-center bg-gray-50 p-2.5 md:p-3 rounded-lg md:rounded-xl border border-gray-100">
                <span className="font-bold text-gray-600 text-xs md:text-sm truncate flex-1 mr-2">{i+1}. {r.name}</span>
                <span className="font-black text-blue-600 text-xs md:text-sm flex-shrink-0">{r.wave} WAVES</span>
              </div>
            ))
          )}
          {!isSubmitted && userId && (
            <div className="mt-3 md:mt-4 flex gap-2">
              <input 
                type="text" 
                placeholder="이름 입력" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                className="flex-1 bg-gray-100 rounded-lg px-3 py-2.5 md:py-2 text-xs md:text-sm font-bold outline-none" 
              />
              <button 
                onClick={submitScore} 
                className="bg-blue-500 text-white p-2.5 md:p-2 rounded-lg hover:bg-blue-600 active:scale-95 transition-all"
              >
                <Send size={16}/>
              </button>
            </div>
          )}
          {isSubmitted && (
            <motion.p 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="text-center text-green-500 font-bold text-xs md:text-sm mt-3 md:mt-4"
            >
              ✨ 점수가 등록되었습니다!
            </motion.p>
          )}
          <div className="flex flex-col md:flex-row gap-2 mt-3 md:mt-4">
            <button 
              onClick={onRestart} 
              className="w-full bg-gray-900 text-white py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] tracking-widest uppercase hover:bg-black active:scale-95 transition-all"
            >
              다시하기
            </button>
            <button 
              onClick={onClose} 
              className="w-full bg-gray-500 text-white py-2.5 md:py-3 rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] tracking-widest uppercase hover:bg-gray-600 active:scale-95 transition-all"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 통계 표시 컴포넌트
function Stat({ icon, label, value, isFullscreen }: { icon: React.ReactNode; label: string; value: string | number; isFullscreen?: boolean }) {
  return (
    <div className="flex justify-between items-center group flex-1 md:flex-none">
      <div className={`flex items-center text-gray-500 group-hover:text-gray-300 ${isFullscreen ? 'gap-1' : 'gap-2 md:gap-3'}`}>
        {icon} <span className={`font-black tracking-widest ${isFullscreen ? 'text-[8px]' : 'text-[9px] md:text-[10px]'}`}>{label}</span>
      </div>
      <span className={`text-white font-black tabular-nums ${isFullscreen ? 'text-[10px]' : 'text-xs md:text-sm'}`}>{value}</span>
    </div>
  );
}

// 메인 게임 컴포넌트
export default function FridgeDefense() {
  const { userId } = useAuth();
  const supabase = useClerkSupabaseClient();
  
  // 게임 상태
  const [gold, setGold] = useState(600); // 초기 골드 감소 (1000 -> 600)
  const [lives, setLives] = useState(5);
  const [wave, setWave] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [todayDiet] = useState<string[]>(['PROTEIN', 'VITAMIN']); // TODO: Supabase에서 실제 데이터 가져오기
  
  // 전체화면 상태
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  
  // 게임 오브젝트
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [selectedTowerIndex, setSelectedTowerIndex] = useState<number | null>(null);
  const [skillCooldown, setSkillCooldown] = useState(0);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>('PROTEIN');
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [gamePaths, setGamePaths] = useState<Array<{ id: number; startY: number; endY: number; color: string }>>([]);
  const [pathChangeNotification, setPathChangeNotification] = useState<string | null>(null);
  const [forbiddenZones, setForbiddenZones] = useState<Array<{ x: number; y: number }>>([]);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState<number | null>(null); // 업그레이드 메뉴 표시할 타워 인덱스
  const [crisisNotification, setCrisisNotification] = useState<string | null>(null); // 위기 상황 알림
  const lastCrisisWaveRef = useRef<number>(0); // 마지막 위기 웨이브 추적
  
  // 게임 시작 시간
  const gameStartTimeRef = useRef<number>(0);
  const gameBoardRef = useRef<HTMLDivElement>(null);
  const [boardSize, setBoardSize] = useState({ width: 820, height: 600 });
  const statsRef = useRef<GameStats>({
    wave: 0,
    enemiesKilled: 0,
    towersPlaced: 0,
    goldEarned: 0,
    damageDealt: 0,
    playTime: 0,
  });

  // 전체화면 상태 감지
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
      
      // 전체화면 모드일 때 가로 모드로 변경
      if (isCurrentlyFullscreen) {
        try {
          // Screen Orientation API 사용 (지원되는 경우)
          if ('orientation' in screen && 'lock' in (screen as any).orientation) {
            (screen as any).orientation.lock('landscape').catch((err: any) => {
              console.warn('가로 모드 잠금 실패:', err);
            });
          }
        } catch (error) {
          console.warn('가로 모드 설정 실패:', error);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // 전체화면 진입
  const enterFullscreen = async () => {
    const element = gameContainerRef.current;
    if (!element) return;

    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if ((element as any).webkitRequestFullscreen) {
        // Safari
        await (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        // Firefox
        await (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        // IE/Edge
        await (element as any).msRequestFullscreen();
      }
    } catch (error) {
      console.error('전체화면 진입 실패:', error);
    }
  };

  // 전체화면 종료
  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
    } catch (error) {
      console.error('전체화면 종료 실패:', error);
    }
  };

  // 게임 보드 크기 동적 계산
  useEffect(() => {
    const updateBoardSize = () => {
      if (gameBoardRef.current) {
        const rect = gameBoardRef.current.getBoundingClientRect();
        const newSize = {
          width: Math.max(300, rect.width), // 최소 너비 300px
          height: Math.max(300, rect.height), // 최소 높이 300px
        };
        setBoardSize(newSize);
        console.log('[FridgeDefense] 게임 보드 크기 업데이트:', newSize, '전체화면:', isFullscreen);
      }
    };

    // 초기 크기 계산을 위해 약간의 지연
    const timer = setTimeout(updateBoardSize, 100);
    updateBoardSize();
    
    window.addEventListener('resize', updateBoardSize);
    // ResizeObserver를 사용하여 더 정확한 크기 감지
    const resizeObserver = new ResizeObserver(updateBoardSize);
    if (gameBoardRef.current) {
      resizeObserver.observe(gameBoardRef.current);
    }

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateBoardSize);
      resizeObserver.disconnect();
    };
  }, []);

  // 전체화면 모드 변경 시 게임 보드 크기 재계산
  useEffect(() => {
    if (gameBoardRef.current) {
      // 전체화면 전환 시 약간의 지연 후 크기 재계산
      const timer = setTimeout(() => {
        const rect = gameBoardRef.current?.getBoundingClientRect();
        if (rect) {
          const newSize = {
            width: Math.max(300, rect.width),
            height: Math.max(300, rect.height),
          };
          setBoardSize(newSize);
          console.log('[FridgeDefense] 전체화면 모드 변경으로 게임 보드 크기 업데이트:', newSize);
        }
      }, isFullscreen ? 200 : 100);
      
      return () => clearTimeout(timer);
    }
  }, [isFullscreen]);

  // 게임 오버 감지
  useEffect(() => {
    if (lives <= 0 && !isGameOver) {
      setIsGameOver(true);
      setIsPlaying(false);
      statsRef.current.playTime = Math.floor((Date.now() - gameStartTimeRef.current) / 1000);
      setTimeout(() => setShowRanking(true), 2000);
    }
  }, [lives, isGameOver]);

  // 스킬 쿨타임 루프
  useEffect(() => {
    if (skillCooldown > 0) {
      const timer = setInterval(() => setSkillCooldown(c => c - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [skillCooldown]);

  // 게임 엔진 루프
  useEffect(() => {
    if (!isPlaying || isGameOver) return;

    const interval = setInterval(() => {
      // 1. 적 이동 (각 경로를 따라 이동, 타워 공격 중이면 느리게)
      setEnemies(prev => {
        return prev.map(e => {
          const path = gamePaths.find(p => p.id === e.pathId);
          if (!path) return e;
          
          const enemyType = ENEMY_TYPES[e.type];
          if (!enemyType) return e;
          
          // 타워를 공격 중이 아닐 때만 빠르게 이동
          // 공격 중일 때는 이동 속도를 크게 감소시킴
          const baseSpeed = enemyType.speed + (wave * 0.05); // 기본 속도 계산
          const moveSpeed = e.targetTowerId ? baseSpeed * 0.2 : e.speed; // 공격 중 20% 속도
          
          // 경로를 따라 수평 이동
          const newX = e.x + moveSpeed;
          
          // 목표 지점 도달 확인
          if (newX > boardSize.width) {
            setLives(l => Math.max(0, l - 1));
            return null; // 적 제거
          }
          
          return { ...e, x: newX };
        }).filter(e => e !== null) as Enemy[];
      });

      // 2. 타워 공격 (타입별 공격 방식)
      towers.forEach(t => {
        const now = Date.now();
        const fireRate = todayDiet.includes(t.type) ? t.fireRate * 0.7 : t.fireRate; // 식단 버프
        if (now - (t.lastShot || 0) > fireRate) {
          const towerData = TOWERS_DATA[t.type];
          const nearbyEnemies = enemies.filter(e => Math.hypot(e.x - t.x, e.y - t.y) < t.range);
          
          if (nearbyEnemies.length > 0) {
            // 타워별 공격 방식
            if (towerData.attackType === 'MELEE') {
              // 근접 공격: 가장 가까운 적 1명만 공격 (칼처럼 휘두르기)
              const target = nearbyEnemies.reduce((closest, enemy) => {
                const distClosest = Math.hypot(closest.x - t.x, closest.y - t.y);
                const distEnemy = Math.hypot(enemy.x - t.x, enemy.y - t.y);
                return distEnemy < distClosest ? enemy : closest;
              });
              
              // 즉시 데미지 적용 (애니메이션 효과)
              setEnemies(prev => prev.map(e => {
                if (e.id === target.id) {
                  const newHp = e.hp - t.damage;
                  statsRef.current.damageDealt += t.damage;
                  setDamageNumbers(dn => [...dn, { 
                    id: Date.now() + Math.random(), 
                    x: target.x, 
                    y: target.y, 
                    val: t.damage 
                  }]);
                  if (newHp <= 0) {
                    setGold(g => g + target.gold);
                    statsRef.current.goldEarned += target.gold;
                    statsRef.current.enemiesKilled += 1;
                    return null;
                  }
                  return { ...e, hp: newHp };
                }
                return e;
              }).filter(e => e !== null) as Enemy[]);
              
              // 공격 애니메이션 시작
              setTowers(prev => prev.map(tower => 
                tower.id === t.id ? { ...tower, lastShot: now, attackAnimation: now } : tower
              ));
              
            } else if (towerData.attackType === 'AOE') {
              // 범위 공격: 가장 가까운 적 2명 공격 (브로콜리로 때리기)
              const targets = nearbyEnemies
                .sort((a, b) => {
                  const distA = Math.hypot(a.x - t.x, a.y - t.y);
                  const distB = Math.hypot(b.x - t.x, b.y - t.y);
                  return distA - distB;
                })
                .slice(0, 2); // 최대 2명
              
              setEnemies(prev => prev.map(e => {
                const target = targets.find(t => t.id === e.id);
                if (target) {
                  const newHp = e.hp - t.damage;
                  statsRef.current.damageDealt += t.damage;
                  setDamageNumbers(dn => [...dn, { 
                    id: Date.now() + Math.random(), 
                    x: e.x, 
                    y: e.y, 
                    val: t.damage 
                  }]);
                  if (newHp <= 0) {
                    setGold(g => g + e.gold);
                    statsRef.current.goldEarned += e.gold;
                    statsRef.current.enemiesKilled += 1;
                    return null;
                  }
                  return { ...e, hp: newHp };
                }
                return e;
              }).filter(e => e !== null) as Enemy[]);
              
              // 공격 애니메이션 시작
              setTowers(prev => prev.map(tower => 
                tower.id === t.id ? { ...tower, lastShot: now, attackAnimation: now } : tower
              ));
              
            } else {
              // 원거리 공격: 투사체 발사 (아보카도 씨 던지기)
              const target = nearbyEnemies.reduce((closest, enemy) => {
                const distClosest = Math.hypot(closest.x - t.x, closest.y - t.y);
                const distEnemy = Math.hypot(enemy.x - t.x, enemy.y - t.y);
                return distEnemy < distClosest ? enemy : closest;
              });
              
              setProjectiles(p => [...p, { 
                id: Date.now() + Math.random(), 
                x: t.x, 
                y: t.y, 
                targetId: target.id, 
                damage: t.damage, 
                color: t.color 
              }]);
              
              // 타워의 lastShot 업데이트
              setTowers(prev => prev.map(tower => 
                tower.id === t.id ? { ...tower, lastShot: now } : tower
              ));
            }
          }
        }
      });

      // 3. 투사체 이동 및 충돌
      setProjectiles(prev => prev.map(p => {
        const target = enemies.find(e => e.id === p.targetId);
        if (!target) return null;
        const dist = Math.hypot(target.x - p.x, target.y - p.y);
        if (dist < 15) {
          setEnemies(es => es.map(e => {
            if (e.id === p.targetId) {
              const newHp = e.hp - p.damage;
              statsRef.current.damageDealt += p.damage;
              setDamageNumbers(dn => [...dn, { 
                id: Date.now() + Math.random(), 
                x: target.x, 
                y: target.y, 
                val: p.damage 
              }]);
              if (newHp <= 0) {
                setGold(g => g + target.gold);
                statsRef.current.goldEarned += target.gold;
                statsRef.current.enemiesKilled += 1;
                return null;
              }
              return { ...e, hp: newHp };
            }
            return e;
          }).filter(e => e !== null) as Enemy[]);
          return null;
        }
        const dx = (target.x - p.x) / dist;
        const dy = (target.y - p.y) / dist;
        return { ...p, x: p.x + dx * 15, y: p.y + dy * 15 };
      }).filter(Boolean) as Projectile[]);

      // 4. 적이 타워를 공격 (개선된 로직)
      setEnemies(prev => prev.map(e => {
        const enemyType = ENEMY_TYPES[e.type];
        if (!enemyType) return e;
        
        // 가장 가까운 타워 찾기 (공격 범위 내) - 타워와 비슷한 범위로 설정
        const attackRange = enemyType.attackRange || 50;
        const nearbyTower = towers.find(t => {
          if (t.hp <= 0) return false; // 체력이 0인 타워는 무시
          const dist = Math.hypot(e.x - t.x, e.y - t.y);
          // 공격 범위 내에 있고, 타워가 살아있는 경우
          return dist < attackRange;
        });
        
        if (nearbyTower) {
          const now = Date.now();
          const attackRate = enemyType.attackRate || 2000;
          
          // 공격 대상 설정 (처음 타워를 발견했을 때)
          if (!e.targetTowerId || e.targetTowerId !== nearbyTower.id) {
            console.log(`[FridgeDefense] 적 ${e.type}이 타워 ${nearbyTower.id}를 발견했습니다! (거리: ${Math.hypot(e.x - nearbyTower.x, e.y - nearbyTower.y).toFixed(1)}px)`);
            // 즉시 공격 가능하도록 lastAttack을 과거로 설정
            return { ...e, targetTowerId: nearbyTower.id, lastAttack: now - attackRate };
          }
          
          // 공격 쿨타임 확인
          const timeSinceLastAttack = now - (e.lastAttack || 0);
          if (timeSinceLastAttack > attackRate) {
            const damage = enemyType.attackDamage || 5;
            
            console.log(`[FridgeDefense] 적 ${e.type}이 타워 ${nearbyTower.id}에게 ${damage} 데미지를 입혔습니다!`);
            
            // 타워에 데미지 적용
            setTowers(prev => prev.map(t => {
              if (t.id === nearbyTower.id) {
                const newHp = Math.max(0, t.hp - damage);
                
                // 데미지 숫자 표시 (타워가 받는 데미지)
                setDamageNumbers(dn => [...dn, { 
                  id: Date.now() + Math.random(), 
                  x: t.x, 
                  y: t.y - 20, 
                  val: damage,
                  isTowerDamage: true // 타워가 받는 데미지 표시
                }]);
                
                // 타워 파괴
                if (newHp <= 0) {
                  console.log(`[FridgeDefense] ⚠️ 타워 파괴: ${TOWERS_DATA[t.type].name} at (${t.x}, ${t.y})`);
                  return null;
                }
                
                return { ...t, hp: newHp, lastAttacked: now };
              }
              return t;
            }).filter(t => t !== null) as Tower[]);
            
            return { ...e, lastAttack: now };
          }
          
          // 타워를 공격 중일 때는 그대로 유지 (속도는 이동 로직에서 처리)
          return e;
        } else {
          // 타워가 없으면 타겟 해제
          if (e.targetTowerId) {
            return { ...e, targetTowerId: null };
          }
        }
        
        return e;
      }));

      // 5. 데미지 숫자 관리 및 적 스폰 (여러 경로에서 랜덤 스폰) - 난이도 조절
      // 오래된 데미지 숫자 제거 (최대 15개만 유지)
      setDamageNumbers(dn => dn.slice(-15));
      
      // 위기 상황 감지 (5의 배수 웨이브 또는 랜덤 위기)
      const isCrisisWave = wave % 5 === 0; // 5, 10, 15, 20 웨이브
      const isRandomCrisis = !isCrisisWave && wave > 3 && Math.random() < 0.1; // 10% 확률로 랜덤 위기
      const isCrisis = isCrisisWave || isRandomCrisis;
      
      // 위기 상황 알림 표시
      if (isCrisis && lastCrisisWaveRef.current !== wave) {
        lastCrisisWaveRef.current = wave;
        setCrisisNotification(`⚠️ 위기 웨이브 ${wave}! 강력한 적들이 몰려옵니다!`);
        setTimeout(() => setCrisisNotification(null), 4000);
        console.log(`[FridgeDefense] 위기 웨이브 ${wave} 시작!`);
      }
      
      // 스폰률 계산 (난이도 상향: 기본 스폰률 증가)
      let baseSpawnRate = 0.025 + (wave * 0.003) + (gamePaths.length * 0.002); // 스폰률 증가
      if (isCrisis) {
        baseSpawnRate *= 2.5; // 위기 상황일 때 스폰률 2.5배 증가
      }
      const spawnRate = baseSpawnRate;
      
      if (Math.random() < spawnRate) {
        const typeKeys = Object.keys(ENEMY_TYPES) as Array<keyof typeof ENEMY_TYPES>;
        
        // 위기 상황일 때 보스와 탱크 스폰 확률 증가
        let typeKey: keyof typeof ENEMY_TYPES;
        if (isCrisis) {
          // 위기 상황: 보스 30%, 탱크 40%, 일반 30%
          const rand = Math.random();
          if (wave >= 5 && rand < 0.3) {
            typeKey = 'BOSS';
          } else if (rand < 0.7) {
            typeKey = 'TANK'; // 탱크 많이 스폰
          } else {
            const normalTypes = typeKeys.filter(k => k !== 'BOSS' && k !== 'TANK');
            typeKey = normalTypes[Math.floor(Math.random() * normalTypes.length)];
          }
        } else {
          // 일반 상황: 기존 로직
          if (wave >= 5 && Math.random() < 0.15) {
            typeKey = 'BOSS';
          } else {
            const normalTypes = typeKeys.filter(k => k !== 'BOSS');
            typeKey = normalTypes[Math.floor(Math.random() * normalTypes.length)];
          }
        }
        
        const type = ENEMY_TYPES[typeKey];
        
        // 랜덤 경로 선택
        if (gamePaths.length > 0) {
          const randomPath = gamePaths[Math.floor(Math.random() * gamePaths.length)];
          // 체력 증가율 (난이도 상향: 더 많이 증가)
          const baseHpIncrease = Math.floor(wave * 20); // 증가율 증가 (15 -> 20)
          const hpIncrease = isCrisis ? Math.floor(baseHpIncrease * 1.5) : baseHpIncrease; // 위기 상황일 때 1.5배
          
          // 속도 증가 (웨이브가 높을수록 더 빠름)
          const speedIncrease = wave * 0.05; // 웨이브당 0.05씩 속도 증가
          
          setEnemies(prev => [...prev, { 
            id: Date.now() + Math.random(), 
            type: typeKey,
            x: -40, // 화면 밖에서 시작
            y: randomPath.startY, 
            hp: type.hp + hpIncrease, 
            maxHp: type.hp + hpIncrease,
            speed: type.speed + speedIncrease + (isCrisis ? 0.2 : 0), // 웨이브에 따른 속도 증가 + 위기 상황 보너스
            gold: type.gold + Math.floor(wave * 1.5), // 웨이브마다 골드 증가량 감소 (2 -> 1.5)
            pathId: randomPath.id,
            pathIndex: 0,
            emoji: type.emoji,
            attackDamage: type.attackDamage,
            attackRange: type.attackRange,
            lastAttack: 0,
            targetTowerId: null,
          }]);
        }
      }
    }, 33);
    
    return () => clearInterval(interval);
  }, [isPlaying, towers, enemies, wave, isGameOver, todayDiet, boardSize]);

  // 게임 시작
  const startGame = () => {
    setIsPlaying(true);
    setIsGameOver(false);
    setShowRanking(false);
    setGold(600); // 초기 골드 감소 (1000 -> 600)
    setLives(5);
    setWave(1);
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setDamageNumbers([]);
    setShowUpgradeMenu(null); // 업그레이드 메뉴 닫기
    setCrisisNotification(null); // 위기 알림 초기화
    lastCrisisWaveRef.current = 0; // 위기 웨이브 추적 초기화
    gameStartTimeRef.current = Date.now();
    statsRef.current = {
      wave: 0,
      enemiesKilled: 0,
      towersPlaced: 0,
      goldEarned: 0,
      damageDealt: 0,
      playTime: 0,
    };
    // 초기 경로 및 금지 구역 설정
    if (boardSize.width > 0 && boardSize.height > 0) {
      const paths = generatePaths(boardSize.width, boardSize.height, 1);
      setGamePaths(paths);
      const zones = generateForbiddenZones(boardSize.width, boardSize.height);
      setForbiddenZones(zones);
      console.log(`[FridgeDefense] 게임 시작: 경로 ${paths.length}개, 금지 구역 ${zones.length}개`);
    }
  };

  // 특수 스킬 사용
  const useShockwave = () => {
    if (skillCooldown > 0) return;
    setEnemies(prev => prev.map(e => ({ ...e, hp: e.hp - 150 })).filter(e => e.hp > 0));
    setSkillCooldown(30);
  };

  // 그리드 위치로 변환 (타일 기반 배치)
  const getGridPosition = (x: number, y: number) => {
    const gridX = Math.floor(x / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    const gridY = Math.floor(y / TILE_SIZE) * TILE_SIZE + TILE_SIZE / 2;
    return { gridX, gridY };
  };

  // 경로 위인지 확인 (여러 경로 고려)
  const isOnPath = (x: number, y: number) => {
    return gamePaths.some(path => {
      const pathTop = path.startY - PATH_WIDTH / 2;
      const pathBottom = path.startY + PATH_WIDTH / 2;
      return y >= pathTop && y <= pathBottom;
    });
  };

  // 경로 정보 업데이트 (웨이브 변경 시)
  useEffect(() => {
    if (boardSize.width > 0 && boardSize.height > 0 && isPlaying) {
      const pathCount = getPathCount(wave);
      const currentPathCount = gamePaths.length;
      const paths = generatePaths(boardSize.width, boardSize.height, pathCount);
      setGamePaths(paths);
      
      // 경로 수가 증가했을 때 알림 표시
      if (pathCount > currentPathCount && currentPathCount > 0) {
        setPathChangeNotification(`⚠️ 경로가 ${pathCount}개로 증가했습니다!`);
        setTimeout(() => setPathChangeNotification(null), 3000);
        console.log(`[FridgeDefense] 웨이브 ${wave}: 경로 수 증가 (${currentPathCount} → ${pathCount})`);
      } else {
        console.log(`[FridgeDefense] 웨이브 ${wave}: ${pathCount}개 경로 유지`);
      }
    }
  }, [wave, boardSize, isPlaying]);

  // 게임 보드 클릭 시 업그레이드 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // 업그레이드 메뉴나 타워가 아닌 곳을 클릭하면 메뉴 닫기
      if (showUpgradeMenu !== null && !target.closest('.upgrade-menu') && !target.closest('[data-tower-id]')) {
        setShowUpgradeMenu(null);
      }
    };
    
    if (showUpgradeMenu !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showUpgradeMenu]);

  // 웨이브 진행: 적이 모두 제거되면 다음 웨이브
  useEffect(() => {
    if (isPlaying && !isGameOver && enemies.length === 0 && wave < 20) {
      // 적이 모두 제거되고 웨이브가 진행 가능하면
      const timer = setTimeout(() => {
        setWave(prev => {
          const nextWave = prev + 1;
          console.log(`[FridgeDefense] 웨이브 ${prev} 클리어! → 웨이브 ${nextWave} 시작`);
          // 웨이브 보너스 골드
          setGold(g => g + 80 + (nextWave * 8)); // 웨이브 보너스 골드 감소 (150+15 -> 80+8)
          return nextWave;
        });
      }, 1000); // 1초 후 다음 웨이브 시작
      
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isGameOver, enemies.length, wave]);

  // 해당 위치에 이미 타워가 있는지 확인
  const hasTowerAt = (x: number, y: number) => {
    return towers.some(t => {
      const dist = Math.hypot(t.x - x, t.y - y);
      return dist < TILE_SIZE / 2; // 같은 타일 내에 있으면
    });
  };

  // 금지 구역인지 확인
  const isForbiddenZone = (x: number, y: number) => {
    return forbiddenZones.some(zone => {
      const dist = Math.hypot(zone.x - x, zone.y - y);
      return dist < TILE_SIZE / 2;
    });
  };

  // 타워 배치 (그리드 기반, 경로 제외)
  const handleGameBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPlaying || !gameBoardRef.current) return;
    
    const rect = gameBoardRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // 경계 체크
    if (clickX < TILE_SIZE / 2 || clickX > boardSize.width - TILE_SIZE / 2 ||
        clickY < TILE_SIZE / 2 || clickY > boardSize.height - TILE_SIZE / 2) {
      return;
    }

    // 그리드 위치로 변환
    const { gridX, gridY } = getGridPosition(clickX, clickY);

    // 경로 위인지 확인
    if (isOnPath(gridX, gridY)) {
      return; // 경로 위에는 배치 불가 (조용히 무시)
    }

    // 이미 타워가 있는지 확인
    if (hasTowerAt(gridX, gridY)) {
      return; // 이미 타워가 있으면 무시
    }

    // 금지 구역인지 확인
    if (isForbiddenZone(gridX, gridY)) {
      console.log('[FridgeDefense] 해당 위치는 타워를 배치할 수 없는 금지 구역입니다.');
      return;
    }

    // 최대 타워 개수 확인
    if (towers.length >= MAX_TOWERS) {
      alert(`최대 타워 개수(${MAX_TOWERS}개)에 도달했습니다. 기존 타워를 제거하거나 더 효율적으로 배치하세요!`);
      return;
    }
    
    const t = TOWERS_DATA[selectedTowerType];
    if (gold >= t.cost) {
      const newTower: Tower = {
        id: `${selectedTowerType}-${Date.now()}`,
        type: selectedTowerType,
        x: gridX,
        y: gridY,
        level: 1,
        lastShot: 0,
        damage: t.damage,
        range: t.range,
        fireRate: t.fireRate,
        color: t.color,
        emoji: t.emoji,
        attackType: t.attackType,
        hp: t.maxHp, // 타워 HP 초기화
        maxHp: t.maxHp,
      };
      setTowers(prev => [...prev, newTower]);
      setGold(g => g - t.cost);
      setShowUpgradeMenu(null); // 새 타워 배치 시 업그레이드 메뉴 닫기
      statsRef.current.towersPlaced += 1;
      console.log(`[FridgeDefense] 타워 배치: ${selectedTowerType} at (${gridX}, ${gridY}), 남은 타워: ${MAX_TOWERS - towers.length - 1}개`);
    } else {
      console.log('[FridgeDefense] 골드가 부족합니다.');
    }
  };

  return (
    <div 
      ref={gameContainerRef}
      className={`flex flex-col w-full min-h-screen bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden relative ${isFullscreen ? 'h-screen fixed inset-0' : ''}`}
    >
      {/* 상단 UI 바 - 이미지 스타일 적용 */}
      <div className={`w-full bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-b-4 border-[#4a5568] flex items-center justify-between flex-wrap gap-2 z-50 ${isFullscreen ? 'px-2 py-1.5' : 'px-4 py-3'}`}>
        {/* 왼쪽: 골드 및 체력 */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* 골드 */}
          <div className={`flex items-center gap-1.5 bg-[#2d3748] rounded-lg border-2 border-[#4a5568] shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
            <Coins className={`text-yellow-400 ${isFullscreen ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Family Treasure:</span>
            <span className={`text-yellow-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{gold.toLocaleString()}G</span>
          </div>
          
          {/* 체력 및 웨이브 */}
          <div className={`flex items-center gap-1.5 bg-[#2d3748] rounded-lg border-2 border-[#4a5568] shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
            <Heart className={`text-red-500 ${isFullscreen ? 'w-4 h-4' : 'w-5 h-5'}`} />
            <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Defense Health:</span>
            <span className={`text-red-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{lives}</span>
            <span className={`text-gray-400 ${isFullscreen ? 'mx-1' : 'mx-2'}`}>|</span>
            <span className={`text-white font-black ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Wave:</span>
            <span className={`text-blue-400 font-black ${isFullscreen ? 'text-sm' : 'text-base md:text-lg'}`}>{wave}</span>
          </div>

          {/* 버프 상태 (오늘의 식단이 있으면) */}
          {todayDiet.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex items-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg border-2 border-yellow-400 shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}
            >
              <Sparkles className={`text-yellow-300 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
              <span className={`text-white font-black uppercase ${isFullscreen ? 'text-[10px]' : 'text-xs md:text-sm'}`}>Meal Buff Active!</span>
              <div className="flex gap-0.5">
                {todayDiet.map((type, idx) => (
                  <span key={idx} className={isFullscreen ? 'text-sm' : 'text-lg'}>{TOWERS_DATA[type].emoji}</span>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* 오른쪽: 스테이지 및 컨트롤 */}
        <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-3'}`}>
          {/* 스테이지 표시 */}
          <div className={`bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg border-2 border-yellow-300 shadow-lg ${isFullscreen ? 'px-2 py-1' : 'px-4 py-2'}`}>
            <span className={`text-black font-black uppercase ${isFullscreen ? 'text-xs' : 'text-sm md:text-base'}`}>Stage {wave}</span>
          </div>

          {/* 게임 컨트롤 버튼 */}
          <div className={`flex items-center bg-[#2d3748] rounded-lg border-2 border-[#4a5568] ${isFullscreen ? 'px-1 py-0.5' : 'px-2 py-1'}`}>
            <button
              onClick={() => {
                if (!isPlaying && !isGameOver) {
                  startGame();
                } else if (isPlaying) {
                  setIsPlaying(!isPlaying);
                }
              }}
              className={`bg-green-600 hover:bg-green-700 rounded flex items-center justify-center transition-all active:scale-95 ${isFullscreen ? 'w-6 h-6' : 'w-8 h-8'}`}
            >
              {!isPlaying && !isGameOver ? (
                <Play className={`text-white ${isFullscreen ? 'w-3 h-3 ml-0.5' : 'w-4 h-4 ml-0.5'}`} />
              ) : isPlaying ? (
                <Pause className={`text-white ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4'}`} />
              ) : (
                <Play className={`text-white ${isFullscreen ? 'w-3 h-3 ml-0.5' : 'w-4 h-4 ml-0.5'}`} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 메인 게임 영역 */}
      <div className={`flex-1 flex overflow-hidden ${isFullscreen ? 'flex-row' : 'flex-col md:flex-row'}`}>
        {/* 사이드바 */}
        <aside className={`bg-[#212529] text-gray-400 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible flex-shrink-0 ${isFullscreen ? 'w-48 p-2' : 'w-full md:w-72 p-3 md:p-8 gap-3 md:gap-0'}`}>
          <div className={`flex-shrink-0 md:flex-shrink flex flex-col md:flex-col ${isFullscreen ? 'min-w-[180px]' : 'min-w-[200px] sm:min-w-[240px] md:min-w-0'}`}>
          <div className={`flex items-center gap-2 text-white font-black italic tracking-tighter ${isFullscreen ? 'mb-2 text-xs' : 'mb-4 md:mb-10 text-sm md:text-base gap-3'}`}>
            <Utensils size={isFullscreen ? 14 : 18} className={`${isFullscreen ? 'w-3 h-3' : 'md:w-5 md:h-5'} text-blue-400`} /> DJANGO_DEFENDER
          </div>
          <div className={`flex md:flex-col mb-2 md:mb-10 ${isFullscreen ? 'gap-2' : 'gap-4 md:gap-4'}`}>
            <Stat icon={<Heart className={`text-red-500 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`} />} label="LIVES" value={lives} isFullscreen={isFullscreen} />
            <Stat icon={<Coins className={`text-yellow-400 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`} />} label="GOLD" value={`${gold}G`} isFullscreen={isFullscreen} />
            <Stat icon={<RefreshCw className={`text-blue-400 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`} />} label="WAVE" value={wave} isFullscreen={isFullscreen} />
            <Stat icon={<Utensils className={`text-purple-400 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`} />} label="TOWERS" value={`${towers.length}/${MAX_TOWERS}`} isFullscreen={isFullscreen} />
            <Stat icon={<Zap className={`text-orange-400 ${isFullscreen ? 'w-3 h-3' : 'w-4 h-4 md:w-5 md:h-5'}`} />} label="PATHS" value={gamePaths.length} isFullscreen={isFullscreen} />
          </div>

          {/* 특수 스킬 */}
          <button 
            onClick={useShockwave} 
            disabled={skillCooldown > 0 || !isPlaying} 
            className={`w-full rounded-xl md:rounded-2xl font-black tracking-widest transition-all ${
              isFullscreen 
                ? 'py-1.5 mb-2 text-[8px]' 
                : 'py-3 md:py-4 mb-4 md:mb-6 text-[9px] md:text-[10px]'
            } ${
              skillCooldown > 0 || !isPlaying 
                ? 'bg-gray-800 text-gray-500' 
                : 'bg-purple-600 text-white animate-pulse hover:bg-purple-700 active:scale-95'
            }`}
          >
            {skillCooldown > 0 ? `쿨${skillCooldown}초` : '비타민 충격파'}
          </button>

          {/* 타워 선택 */}
          <div className={`flex md:flex-col overflow-x-auto md:overflow-y-auto flex-1 md:flex-1 ${isFullscreen ? 'gap-1' : 'gap-2 md:gap-2'}`}>
            {Object.values(TOWERS_DATA).map(t => (
              <button 
                key={t.id} 
              onClick={() => {
                setSelectedTowerType(t.id);
              }}
                disabled={!isPlaying && gold < t.cost}
                className={`flex-shrink-0 md:flex-shrink flex items-center justify-between rounded-lg md:rounded-xl transition-all ${
                  isFullscreen 
                    ? 'p-1.5 min-w-[100px]' 
                    : 'p-2 md:p-3 min-w-[120px] md:min-w-0 md:w-full'
                } ${
                  selectedTowerType === t.id
                    ? 'bg-blue-600 ring-2 ring-blue-400'
                    : gold >= t.cost
                    ? 'bg-[#343a40] hover:bg-gray-600 active:scale-95'
                    : 'bg-[#343a40] opacity-50 cursor-not-allowed'
                }`}
              >
                <div className={`flex items-center ${isFullscreen ? 'gap-1.5' : 'gap-2 md:gap-3'}`}>
                  <span className={isFullscreen ? 'text-lg' : 'text-xl md:text-2xl'}>{t.emoji}</span>
                  <div className="text-left">
                    <div className={`font-black text-white uppercase ${isFullscreen ? 'text-[8px]' : 'text-[9px] md:text-[10px]'}`}>{t.name}</div>
                    <div className={`text-gray-400 mt-0.5 ${isFullscreen ? 'text-[7px]' : 'text-[7px] md:text-[8px]'}`}>{t.description}</div>
                  </div>
                </div>
                <span className={`font-bold text-gray-300 ${isFullscreen ? 'text-[8px]' : 'text-[9px] md:text-[10px]'}`}>{t.cost}G</span>
              </button>
            ))}
          </div>

          {/* 게임 시작/일시정지 버튼 */}
          <button 
            onClick={() => {
              if (!isPlaying && !isGameOver) {
                startGame();
              } else {
                setIsPlaying(!isPlaying);
              }
            }}
            className={`w-full bg-[#339af0] text-white rounded-xl font-black tracking-widest hover:bg-[#228be6] active:scale-95 transition-all ${
              isFullscreen 
                ? 'py-1.5 mt-1.5 text-[8px]' 
                : 'py-3 md:py-4 mt-2 md:mt-4 text-[9px] md:text-[10px]'
            }`}
          >
            {!isPlaying && !isGameOver ? '게임 시작' : isPlaying ? '일시정지' : '다시하기'}
          </button>
          </div>
        </aside>

      {/* 게임 보드 */}
      <main 
        ref={gameBoardRef}
        onClick={handleGameBoardClick}
        onMouseMove={(e) => {
          // 게임 중이고 타워가 선택되어 있을 때만 위치 표시
          if (!isPlaying || !gameBoardRef.current || !selectedTowerType) {
            setHoveredTile(null);
            return;
          }
          const rect = gameBoardRef.current.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const { gridX, gridY } = getGridPosition(x, y);
          setHoveredTile({ x: gridX, y: gridY });
        }}
        onMouseLeave={() => setHoveredTile(null)}
        onTouchMove={(e) => {
          // 터치 이벤트도 지원 (모바일/태블릿)
          if (!isPlaying || !gameBoardRef.current || !selectedTowerType) {
            setHoveredTile(null);
            return;
          }
          const touch = e.touches[0];
          if (!touch) return;
          const rect = gameBoardRef.current.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          const { gridX, gridY } = getGridPosition(x, y);
          setHoveredTile({ x: gridX, y: gridY });
        }}
        onTouchEnd={() => setHoveredTile(null)}
        className={`flex-1 bg-gradient-to-br from-[#87ceeb] via-[#a5d8ff] to-[#b0e0e6] relative overflow-hidden w-full ${
          isFullscreen ? 'h-full' : 'min-h-[400px] md:min-h-[600px]'
        }`}
        style={isFullscreen ? { 
          height: '100%'
        } : { 
          minHeight: '400px',
          height: '100%'
        }}
      >
        <AnimatePresence>
          {isGameOver && !showRanking && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70"
            >
              <div className="text-center text-white px-4">
                <Skull size={48} className="md:w-16 md:h-16 mx-auto mb-4 text-red-500" />
                <h2 className={`font-black italic uppercase ${isFullscreen ? 'text-2xl' : 'text-3xl md:text-5xl'}`}>Game Over</h2>
                <p className={`mt-4 ${isFullscreen ? 'text-base' : 'text-lg md:text-xl'}`}>웨이브: {wave}</p>
                <button
                  onClick={() => {
                    startGame();
                    setIsGameOver(false);
                  }}
                  className={`mt-6 bg-[#339af0] text-white rounded-xl font-black tracking-widest hover:bg-[#228be6] active:scale-95 transition-all ${
                    isFullscreen 
                      ? 'px-6 py-2 text-sm' 
                      : 'px-8 py-3 text-base md:text-lg'
                  }`}
                >
                  다시하기
                </button>
              </div>
            </motion.div>
          )}
          {showRanking && (
            <RankingBoard 
              currentScore={wave} 
              onRestart={startGame}
              onClose={() => setShowRanking(false)}
            />
          )}
        </AnimatePresence>

        {/* 그리드 배치 가능 영역 표시 (성능 최적화) */}
        {isPlaying && (() => {
          const cols = Math.floor(boardSize.width / TILE_SIZE);
          const rows = Math.floor(boardSize.height / TILE_SIZE);
          const tiles: React.ReactElement[] = [];
          
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const x = col * TILE_SIZE + TILE_SIZE / 2;
              const y = row * TILE_SIZE + TILE_SIZE / 2;
              const isPathTile = isOnPath(x, y);
              const hasTower = hasTowerAt(x, y);
              const isForbidden = isForbiddenZone(x, y);
              const isHovered = hoveredTile && Math.abs(hoveredTile.x - x) < 1 && Math.abs(hoveredTile.y - y) < 1;
              
              // 경로 타일은 표시하지 않음 (여러 경로 모두 고려)
              if (isPathTile) continue;
              
              tiles.push(
                <div
                  key={`${col}-${row}`}
                  className={`absolute border border-dashed transition-all ${
                    isForbidden
                      ? 'border-red-600/80 bg-red-900/30'
                      : hasTower
                      ? 'border-red-400/50 bg-red-100/10'
                      : isHovered
                      ? 'border-green-400 bg-green-200/40'
                      : 'border-gray-300/20 bg-white/3'
                  }`}
                  style={{
                    left: `${col * TILE_SIZE}px`,
                    top: `${row * TILE_SIZE}px`,
                    width: `${TILE_SIZE}px`,
                    height: `${TILE_SIZE}px`,
                  }}
                />
              );
            }
          }
          
          return (
            <div className="absolute inset-0 pointer-events-none z-0">
              {tiles}
            </div>
          );
        })()}

        {/* 경로 디자인 (나무 느낌의 경로) */}
        {gamePaths.map((path, idx) => (
          <div 
            key={path.id}
            className="absolute left-0 w-full pointer-events-none z-5"
            style={{ 
              top: `${path.startY - PATH_WIDTH / 2}px`,
              height: `${PATH_WIDTH}px`,
            }}
          >
            {/* 나무 경로 배경 */}
            <div 
              className="absolute inset-0"
              style={{ 
                background: 'linear-gradient(90deg, #8B4513 0%, #A0522D 50%, #8B4513 100%)',
                borderTop: '4px solid #654321',
                borderBottom: '4px solid #654321',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
              }}
            />
            {/* 경로 패턴 (나무 느낌) */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 22px)',
              }}
            />
            {/* 시작점 (파이프) */}
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-16 md:w-16 md:h-20 bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-900 rounded-lg md:rounded-xl shadow-xl"
              style={{ transform: 'translateY(-50%)' }}
            />
            {/* 목표점 (냉장고) */}
            <div 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-16 h-20 md:w-20 md:h-24 bg-gradient-to-b from-pink-300 to-pink-500 border-4 border-pink-600 rounded-lg md:rounded-xl shadow-2xl flex flex-col items-center justify-center"
              style={{ transform: 'translateY(-50%)' }}
            >
              <div className="w-full h-1/2 border-b-2 border-pink-600 flex items-center justify-center">
                <div className="w-1 h-1 bg-gray-700 rounded-full" />
              </div>
              <div className="w-full h-1/2 flex items-center justify-center">
                <div className="w-1 h-1 bg-gray-700 rounded-full" />
              </div>
            </div>
          </div>
        ))}

        {/* 마우스 호버 시 배치 가능 위치 표시 */}
        {isPlaying && hoveredTile && !isOnPath(hoveredTile.x, hoveredTile.y) && !hasTowerAt(hoveredTile.x, hoveredTile.y) && !isForbiddenZone(hoveredTile.x, hoveredTile.y) && towers.length < MAX_TOWERS && (() => {
          // 화면 경계 내에 있는지 확인
          const previewX = Math.max(TILE_SIZE / 2, Math.min(hoveredTile.x, boardSize.width - TILE_SIZE / 2));
          const previewY = Math.max(TILE_SIZE / 2, Math.min(hoveredTile.y, boardSize.height - TILE_SIZE / 2));
          
          return (
            <div
              className="absolute z-10 pointer-events-none"
              style={{
                left: `${previewX - TILE_SIZE / 2}px`,
                top: `${previewY - TILE_SIZE / 2}px`,
                width: `${TILE_SIZE}px`,
                height: `${TILE_SIZE}px`,
              }}
            >
              <div className="w-full h-full border-2 border-green-400 bg-green-200/30 rounded-lg flex items-center justify-center animate-pulse">
                <span className="text-2xl opacity-70">{TOWERS_DATA[selectedTowerType].emoji}</span>
              </div>
            </div>
          );
        })()}

        {/* 최대 타워 개수 도달 시 안내 */}
        {isPlaying && towers.length >= MAX_TOWERS && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-yellow-500 text-white px-4 py-2 rounded-lg text-xs md:text-sm font-bold shadow-lg"
          >
            ⚠️ 최대 타워 개수({MAX_TOWERS}개)에 도달했습니다!
          </motion.div>
        )}

        {/* 경로 수 증가 알림 */}
        {pathChangeNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-red-600 text-white px-6 py-3 rounded-xl text-sm md:text-base font-black shadow-2xl border-4 border-yellow-400"
          >
            {pathChangeNotification}
          </motion.div>
        )}

        {/* 위기 상황 알림 */}
        {crisisNotification && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            className="absolute top-32 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-red-700 via-orange-600 to-red-700 text-white px-8 py-4 rounded-2xl text-base md:text-xl font-black shadow-2xl border-4 border-yellow-400 animate-pulse"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl md:text-3xl">🚨</span>
              <span>{crisisNotification}</span>
              <span className="text-2xl md:text-3xl">🚨</span>
            </div>
          </motion.div>
        )}

        {/* 데미지 팝업 */}
        {damageNumbers.map(d => {
          // 화면 경계 내로 제한 (패딩 추가)
          const padding = 20;
          const damageX = Math.max(padding, Math.min(d.x, boardSize.width - padding));
          const damageY = Math.max(padding, Math.min(d.y, boardSize.height - padding));
          
          // 음수 값 방지 (절댓값 사용)
          const displayVal = Math.abs(d.val);
          
          // 유효한 위치인지 확인 (화면 밖이면 표시하지 않음)
          if (damageX < 0 || damageX > boardSize.width || damageY < 0 || damageY > boardSize.height) {
            return null;
          }
          
          return (
            <motion.span 
              key={d.id} 
              initial={{ opacity: 1, y: damageY, scale: 0.8 }} 
              animate={{ opacity: 0, y: damageY - 50, scale: 1.2 }} 
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute text-red-600 font-black text-sm md:text-lg z-50 pointer-events-none drop-shadow-lg" 
              style={{ 
                left: `${damageX}px`, 
                top: `${damageY}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              -{displayVal}
            </motion.span>
          );
        })}

        {/* 적 렌더링 */}
        {enemies.map(e => {
          const enemyX = Math.max(0, Math.min(e.x, boardSize.width));
          const enemyY = Math.max(0, Math.min(e.y, boardSize.height));
          const isAttackingTower = e.targetTowerId !== null && e.targetTowerId !== undefined;
          const enemyType = ENEMY_TYPES[e.type];
          const now = Date.now();
          const attackRate = enemyType ? (enemyType.attackRate || 2000) : 2000;
          const timeSinceLastAttack = now - (e.lastAttack || 0);
          const isAttacking = isAttackingTower && timeSinceLastAttack < attackRate * 0.4; // 공격 직후 40% 시간 동안 애니메이션
          
          // 적 타입별 공격 애니메이션
          const getEnemyAttackAnimation = (): any => {
            if (!isAttacking) return {};
            
            switch (e.type) {
              case 'FAST': // 막대사탕: 휘두르기
                return {
                  rotate: [0, 30, -30, 0], // 좌우로 휘두르기
                  scale: [1, 1.2, 1],
                  x: [0, 8, -8, 0], // 좌우 이동
                  transition: {
                    duration: 0.35,
                    ease: "easeOut" as const
                  }
                };
              case 'NORMAL': // 곰팡이: 균 뿌리기
                return {
                  scale: [1, 1.15, 0.9, 1],
                  y: [0, -5, 3, 0], // 위로 올라갔다가 내려오기
                  rotate: [0, 10, -10, 0], // 약간 회전
                  transition: {
                    duration: 0.4,
                    ease: "easeOut" as const
                  }
                };
              case 'TANK': // 포토에토: 던지기
                return {
                  scale: [1, 1.3, 1],
                  y: [0, -10, 0], // 위로 던지기
                  rotate: [0, 15, -15, 0], // 회전하며 던지기
                  transition: {
                    duration: 0.5,
                    ease: "easeOut" as const
                  }
                };
              case 'BOSS': // 보스: 강력한 공격
                return {
                  scale: [1, 1.4, 0.95, 1.2, 1],
                  rotate: [0, 20, -20, 10, 0],
                  x: [0, 10, -10, 5, 0],
                  y: [0, -8, 5, -3, 0],
                  transition: {
                    duration: 0.6,
                    ease: "easeOut" as const
                  }
                };
              default:
                return {
                  scale: [1, 1.2, 1],
                  transition: { duration: 0.3, ease: "easeOut" as const }
                };
            }
          };
          
          return (
            <motion.div 
              key={e.id} 
              className="absolute z-20 pointer-events-none" 
              style={{ 
                left: `${enemyX - 20}px`, 
                top: `${enemyY - 20}px`,
                transform: 'translate(0, 0)',
                transformOrigin: 'center center'
              }}
              animate={isAttacking ? getEnemyAttackAnimation() : {}}
            >
              <span className="text-2xl md:text-3xl filter drop-shadow-md block">{e.emoji}</span>
              {/* 타워 공격 중 표시 */}
              {isAttackingTower && (
                <motion.div 
                  className="absolute -top-2 left-1/2 -translate-x-1/2 text-red-500 text-xs md:text-sm font-bold"
                  animate={{ 
                    scale: [1, 1.2, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 0.5, 
                    repeat: Infinity,
                    ease: "easeInOut" as const
                  }}
                >
                  ⚔️
                </motion.div>
              )}
              {/* 공격 이펙트 (타입별) */}
              {isAttacking && (
                <>
                  {e.type === 'FAST' && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.5, 2],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ duration: 0.35 }}
                    >
                      <span className="text-lg text-yellow-300">✨</span>
                    </motion.div>
                  )}
                  {e.type === 'NORMAL' && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.8, 1.2, 1.5],
                        y: [0, -10, -20]
                      }}
                      transition={{ duration: 0.4 }}
                    >
                      <span className="text-sm text-green-300">💨</span>
                    </motion.div>
                  )}
                  {e.type === 'TANK' && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0, y: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1.2, 1.8],
                        y: [0, -15, -30],
                        rotate: [0, 360]
                      }}
                      transition={{ duration: 0.5 }}
                    >
                      <span className="text-base text-orange-400">💥</span>
                    </motion.div>
                  )}
                  {e.type === 'BOSS' && (
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0.8, 0],
                        scale: [0.5, 1.5, 2, 2.5],
                        rotate: [0, 180, 360]
                      }}
                      transition={{ duration: 0.6 }}
                    >
                      <span className="text-xl text-red-400">🔥</span>
                    </motion.div>
                  )}
                </>
              )}
              <div className="w-6 md:w-8 h-0.5 md:h-1 bg-black/10 rounded-full mt-0.5 md:mt-1 overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all" 
                  style={{ width: `${(e.hp / e.maxHp) * 100}%` }} 
                />
              </div>
            </motion.div>
          );
        })}

        {/* 타워 렌더링 */}
        {towers.map((t, i) => {
          const towerX = Math.max(30, Math.min(t.x, boardSize.width - 30));
          const towerY = Math.max(30, Math.min(t.y, boardSize.height - 30));
          const towerData = TOWERS_DATA[t.type];
          const isAttacking = t.attackAnimation && (Date.now() - (t.attackAnimation || 0)) < 400; // 400ms 애니메이션
          
          // 공격 방향 계산 (가장 가까운 적 방향)
          let attackAngle = 0;
          if (isAttacking) {
            const nearestEnemy = enemies.find(e => Math.hypot(e.x - t.x, e.y - t.y) < t.range);
            if (nearestEnemy) {
              attackAngle = Math.atan2(nearestEnemy.y - t.y, nearestEnemy.x - t.x) * (180 / Math.PI);
            }
          }
          
          // 애니메이션 variants
          const getAnimationVariants = (): any => {
            if (!isAttacking) return {};
            
            if (towerData.attackType === 'MELEE') {
              // 닭다리: 회전 애니메이션 (칼처럼 휘두르기)
              return {
                rotate: [0, 45, -20, 0], // 회전 애니메이션
                scale: [1, 1.2, 1], // 약간 확대
                x: [0, 5, -3, 0], // 약간 이동
                y: [0, -3, 2, 0],
                transition: {
                  duration: 0.4,
                  ease: "easeOut" as const
                }
              };
            } else if (towerData.attackType === 'AOE') {
              // 브로콜리: 위아래 움직임 (때리기)
              return {
                y: [0, -15, 10, 0], // 위로 올라갔다가 내려오기
                scale: [1, 1.15, 0.95, 1], // 확대 후 축소
                rotate: [0, -5, 5, 0], // 약간의 회전
                transition: {
                  duration: 0.4,
                  ease: "easeOut" as const
                }
              };
            }
            return {};
          };
          
          return (
            <motion.div 
              key={t.id}
              data-tower-id={t.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTowerIndex(i);
                setShowUpgradeMenu(showUpgradeMenu === i ? null : i); // 업그레이드 메뉴 토글
              }} 
              className={`absolute flex flex-col items-center cursor-pointer p-1.5 md:p-2 rounded-xl md:rounded-2xl touch-manipulation z-10 ${
                selectedTowerIndex === i ? 'bg-white/30 ring-2 ring-blue-400' : ''
              }`} 
              style={{ 
                left: `${towerX - 30}px`, 
                top: `${towerY - 30}px`,
                transformOrigin: 'center center',
              }}
              animate={isAttacking ? getAnimationVariants() : {}}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* 타워 HP바 */}
              {t.hp < t.maxHp && (
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 md:w-16 h-1.5 md:h-2 bg-black/20 rounded-full overflow-hidden z-30">
                  <motion.div 
                    className={`h-full transition-colors ${
                      (t.hp / t.maxHp) > 0.6 ? 'bg-green-500' : 
                      (t.hp / t.maxHp) > 0.3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(t.hp / t.maxHp) * 100}%` }}
                    initial={{ width: `${(t.hp / t.maxHp) * 100}%` }}
                    animate={{ width: `${(t.hp / t.maxHp) * 100}%` }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
              )}
              {todayDiet.includes(t.type) && (
                <Sparkles className="text-yellow-400 absolute -top-1 md:-top-2" size={10} />
              )}
              <motion.span 
                className="text-3xl md:text-4xl drop-shadow-xl"
                animate={isAttacking && towerData.attackType === 'MELEE' ? {
                  rotate: [0, 60, -30, 0],
                  transition: { duration: 0.4, ease: "easeOut" }
                } : {}}
              >
                {t.emoji}
              </motion.span>
              <span className="text-[7px] md:text-[8px] font-black text-blue-900 mt-0.5 md:mt-1 uppercase">Lv.{t.level}</span>
              {/* 타워 HP 바 */}
              {t.hp < t.maxHp && (
                <div className="w-full max-w-[40px] h-1 bg-black/20 rounded-full mt-0.5 overflow-hidden border border-white/20">
                  <div
                    className={`h-full transition-all ${
                      t.hp / t.maxHp > 0.5 ? 'bg-green-500' : t.hp / t.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(t.hp / t.maxHp) * 100}%` }}
                  />
                </div>
              )}
              {/* 공격 타입 표시 */}
              <span className="text-[6px] md:text-[7px] font-bold text-gray-600 mt-0.5">
                {towerData.attackType === 'MELEE' ? '⚔️' : towerData.attackType === 'AOE' ? '💥' : '🎯'}
              </span>
            </motion.div>
          );
        })}

        {/* 업그레이드 메뉴 */}
        {showUpgradeMenu !== null && towers[showUpgradeMenu] && (() => {
          const tower = towers[showUpgradeMenu];
          const towerData = TOWERS_DATA[tower.type];
          const upgradeCost = getUpgradeCost(tower.type, tower.level);
          const maxLevel = 5; // 최대 레벨
          const canUpgrade = tower.level < maxLevel && gold >= upgradeCost;
          const nextStats = getUpgradeStats(tower.type, tower.level + 1);
          
          // 업그레이드 메뉴 크기 (반응형)
          const menuWidth = isFullscreen ? 180 : 220;
          const menuHeight = isFullscreen ? 320 : 380; // 내용에 따라 조정
          
          // 실제 게임 보드 크기 가져오기
          const boardRect = gameBoardRef.current?.getBoundingClientRect();
          const actualBoardWidth = boardRect?.width || boardSize.width;
          const actualBoardHeight = boardRect?.height || boardSize.height;
          
          // 메뉴 위치 계산 (화면 안에 표시되도록)
          let menuX = tower.x + 60;
          let menuY = tower.y - 100;
          
          // 오른쪽 경계 체크 (패딩 포함)
          const padding = 10;
          if (menuX + menuWidth > actualBoardWidth - padding) {
            menuX = tower.x - menuWidth - 20; // 타워 왼쪽에 표시
          }
          
          // 왼쪽 경계 체크
          if (menuX < padding) {
            menuX = padding; // 최소 여백
            // 왼쪽에도 공간이 없으면 타워 오른쪽에 표시 (화면 중앙으로)
            if (menuX + menuWidth > actualBoardWidth - padding) {
              menuX = Math.max(padding, (actualBoardWidth - menuWidth) / 2);
            }
          }
          
          // 위쪽 경계 체크
          if (menuY < padding) {
            menuY = tower.y + 60; // 타워 아래에 표시
          }
          
          // 아래쪽 경계 체크
          if (menuY + menuHeight > actualBoardHeight - padding) {
            menuY = actualBoardHeight - menuHeight - padding; // 화면 하단에서 위로
            // 여전히 공간이 없으면 타워 위에 최대한 가깝게
            if (menuY < padding) {
              menuY = padding;
            }
          }
          
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="upgrade-menu absolute z-50 bg-gray-900 text-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 overflow-y-auto max-h-[90vh]"
              style={{
                left: `${menuX}px`,
                top: `${menuY}px`,
                minWidth: isFullscreen ? '160px' : '180px',
                maxWidth: isFullscreen ? '200px' : '220px',
                maxHeight: `${Math.min(actualBoardHeight - menuY - padding, menuHeight)}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{tower.emoji}</span>
                  <div>
                    <div className="text-sm font-bold">{towerData.name}</div>
                    <div className="text-xs text-gray-400">레벨 {tower.level}/{maxLevel}</div>
                  </div>
                </div>
                <button
                  onClick={() => setShowUpgradeMenu(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              {/* 현재 스탯 */}
              <div className="mb-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">HP:</span>
                  <span className="font-bold">{tower.hp}/{tower.maxHp}</span>
                </div>
                <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all ${
                      tower.hp / tower.maxHp > 0.5 ? 'bg-green-500' : tower.hp / tower.maxHp > 0.25 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${(tower.hp / tower.maxHp) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">데미지:</span>
                  <span className="font-bold">{tower.damage}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">범위:</span>
                  <span className="font-bold">{tower.range}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">공격속도:</span>
                  <span className="font-bold">{tower.fireRate}ms</span>
                </div>
              </div>
              
              {/* 업그레이드 버튼 */}
              {tower.level < maxLevel ? (
                <div>
                  <div className="mb-2 text-xs text-gray-400">
                    다음 레벨 스탯:
                  </div>
                  <div className="mb-3 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-400">데미지:</span>
                      <span className="font-bold text-green-400">{nextStats.damage} (+{nextStats.damage - tower.damage})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">범위:</span>
                      <span className="font-bold text-green-400">{nextStats.range} (+{nextStats.range - tower.range})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">공격속도:</span>
                      <span className="font-bold text-green-400">{nextStats.fireRate}ms ({tower.fireRate - nextStats.fireRate > 0 ? '-' : '+'}{Math.abs(tower.fireRate - nextStats.fireRate)}ms)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (canUpgrade) {
                        setTowers(prev => prev.map((tw, idx) => {
                          if (idx === showUpgradeMenu) {
                            const newStats = getUpgradeStats(tw.type, tw.level + 1);
                            const towerData = TOWERS_DATA[tw.type];
                            // 업그레이드 시 HP도 증가 (레벨당 20% 증가)
                            const newMaxHp = Math.floor(towerData.maxHp * (1 + (tw.level + 1) * 0.2));
                            return {
                              ...tw,
                              level: tw.level + 1,
                              damage: newStats.damage,
                              range: newStats.range,
                              fireRate: newStats.fireRate,
                              maxHp: newMaxHp,
                              hp: Math.min(tw.hp + Math.floor(newMaxHp * 0.3), newMaxHp), // 업그레이드 시 HP 일부 회복
                            };
                          }
                          return tw;
                        }));
                        setGold(g => g - upgradeCost);
                        statsRef.current.towersPlaced += 1; // 업그레이드도 통계에 포함
                        console.log(`[FridgeDefense] 타워 업그레이드: ${towerData.name} Lv.${tower.level} → Lv.${tower.level + 1}, 비용: ${upgradeCost}G`);
                      }
                    }}
                    disabled={!canUpgrade}
                    className={`w-full py-2 rounded-lg font-bold text-sm transition-all ${
                      canUpgrade
                        ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white'
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {canUpgrade ? `업그레이드 (${upgradeCost}G)` : `골드 부족 (${upgradeCost}G 필요)`}
                  </button>
                </div>
              ) : (
                <div className="text-center text-yellow-400 font-bold text-sm py-2">
                  최대 레벨 달성!
                </div>
              )}
            </motion.div>
          );
        })()}

        {/* 투사체 */}
        {projectiles.map(p => {
          const projX = Math.max(0, Math.min(p.x, boardSize.width));
          const projY = Math.max(0, Math.min(p.y, boardSize.height));
          return (
            <div 
              key={p.id} 
              className="absolute w-2 h-2 md:w-2.5 md:h-2.5 rounded-full z-30 shadow-sm pointer-events-none" 
              style={{ 
                left: `${projX}px`, 
                top: `${projY}px`,
                backgroundColor: p.color,
                transform: 'translate(-50%, -50%)'
              }} 
            />
          );
        })}
        
        {/* 전체화면 버튼 - 오른쪽 아래 */}
        {!isFullscreen && (
          <button
            onClick={enterFullscreen}
            className="absolute bottom-4 right-4 z-50 bg-black/80 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 shadow-xl rounded-lg p-3 transition-all hover:scale-110 active:scale-95"
            title="전체화면"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        )}
        
        {/* 축소 버튼 - 전체화면 모드일 때 */}
        {isFullscreen && (
          <button
            onClick={exitFullscreen}
            className="absolute bottom-4 right-4 z-50 bg-black/80 hover:bg-black/90 backdrop-blur-md text-white border border-white/30 shadow-xl rounded-lg p-3 transition-all hover:scale-110 active:scale-95"
            title="축소"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
        )}
      </main>
      </div>

      {/* 하단 UI: 타워 선택 및 특수 능력 - 전체화면일 때는 숨김 */}
      {!isFullscreen && (
        <div className="w-full bg-gradient-to-r from-[#2d3748] to-[#1a202c] border-t-4 border-[#4a5568] px-4 py-3 z-50">
          {/* 타워 선택 카드 */}
          <div className="flex items-center gap-3 mb-3 overflow-x-auto pb-2">
            {Object.values(TOWERS_DATA).map(t => (
              <button 
                key={t.id} 
                onClick={() => {
                  setSelectedTowerType(t.id);
                }}
                disabled={!isPlaying && gold < t.cost}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all min-w-[100px] ${
                  selectedTowerType === t.id
                    ? 'bg-blue-600 border-blue-400 shadow-lg scale-105'
                    : gold >= t.cost
                    ? 'bg-[#343a40] border-[#4a5568] hover:bg-gray-600 hover:border-gray-500 active:scale-95'
                    : 'bg-[#343a40] border-[#4a5568] opacity-50 cursor-not-allowed'
                }`}
              >
                <span className="text-3xl md:text-4xl">{t.emoji}</span>
                <div className="text-center">
                  <div className="text-xs md:text-sm font-black text-white uppercase">{t.name}</div>
                  <div className="text-[10px] md:text-xs text-gray-300 mt-0.5">{t.cost}G</div>
                </div>
              </button>
            ))}
          </div>

          {/* 특수 능력 버튼 */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* 비타민 충격파 */}
            <button 
              onClick={useShockwave} 
              disabled={skillCooldown > 0 || !isPlaying} 
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-black text-xs md:text-sm transition-all ${
                skillCooldown > 0 || !isPlaying 
                  ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
                  : 'bg-purple-600 border-purple-400 text-white hover:bg-purple-700 active:scale-95 shadow-lg'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span className="uppercase">Sterilize</span>
              {skillCooldown > 0 && (
                <span className="text-xs">{skillCooldown}s</span>
              )}
            </button>

            {/* 추가 정보 표시 */}
            <div className="flex items-center gap-4 ml-auto text-xs md:text-sm text-gray-400">
              <div className="flex items-center gap-1">
                <Utensils className="w-4 h-4" />
                <span className="font-bold text-white">{towers.length}/{MAX_TOWERS}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-4 h-4" />
                <span className="font-bold text-white">{gamePaths.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

