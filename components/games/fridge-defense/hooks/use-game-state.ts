/**
 * @file components/games/fridge-defense/hooks/use-game-state.ts
 * @description 게임 상태 관리 훅
 */

import { useState, useRef, useCallback } from 'react';
import type { 
  Tower, 
  Enemy, 
  Projectile, 
  DamageNumber, 
  GameStats, 
  TowerType,
  BoardSize,
  ForbiddenZone,
  GamePath,
} from '@/types/game/fridge-defense';
import { GAME_CONFIG } from '../utils/game-constants';

export interface UseGameStateReturn {
  // 기본 게임 상태
  gold: number;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  lives: number;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  wave: number;
  setWave: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  setIsPlaying: React.Dispatch<React.SetStateAction<boolean>>;
  isGameOver: boolean;
  setIsGameOver: React.Dispatch<React.SetStateAction<boolean>>;
  showRanking: boolean;
  setShowRanking: React.Dispatch<React.SetStateAction<boolean>>;
  
  // 게임 오브젝트
  towers: Tower[];
  setTowers: React.Dispatch<React.SetStateAction<Tower[]>>;
  enemies: Enemy[];
  setEnemies: React.Dispatch<React.SetStateAction<Enemy[]>>;
  projectiles: Projectile[];
  setProjectiles: React.Dispatch<React.SetStateAction<Projectile[]>>;
  damageNumbers: DamageNumber[];
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumber[]>>;
  
  // UI 상태
  selectedTowerIndex: number | null;
  setSelectedTowerIndex: React.Dispatch<React.SetStateAction<number | null>>;
  selectedTowerType: TowerType;
  setSelectedTowerType: React.Dispatch<React.SetStateAction<TowerType>>;
  hoveredTile: { x: number; y: number } | null;
  setHoveredTile: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  showUpgradeMenu: number | null;
  setShowUpgradeMenu: React.Dispatch<React.SetStateAction<number | null>>;
  
  // 스킬 상태
  skillCooldown: number;
  setSkillCooldown: React.Dispatch<React.SetStateAction<number>>;
  
  // 보드 및 경로
  boardSize: BoardSize;
  setBoardSize: React.Dispatch<React.SetStateAction<BoardSize>>;
  gamePaths: GamePath[];
  setGamePaths: React.Dispatch<React.SetStateAction<GamePath[]>>;
  forbiddenZones: ForbiddenZone[];
  setForbiddenZones: React.Dispatch<React.SetStateAction<ForbiddenZone[]>>;
  
  // 알림
  pathChangeNotification: string | null;
  setPathChangeNotification: React.Dispatch<React.SetStateAction<string | null>>;
  crisisNotification: string | null;
  setCrisisNotification: React.Dispatch<React.SetStateAction<string | null>>;
  
  // Refs
  gameStartTimeRef: React.MutableRefObject<number>;
  statsRef: React.MutableRefObject<GameStats>;
  lastCrisisWaveRef: React.MutableRefObject<number>;
  
  // 게임 리셋
  resetGame: () => void;
}

export function useGameState(): UseGameStateReturn {
  // 기본 게임 상태
  const [gold, setGold] = useState(GAME_CONFIG.INITIAL_GOLD);
  const [lives, setLives] = useState(GAME_CONFIG.INITIAL_LIVES);
  const [wave, setWave] = useState(GAME_CONFIG.INITIAL_WAVE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  
  // 게임 오브젝트
  const [towers, setTowers] = useState<Tower[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  
  // UI 상태
  const [selectedTowerIndex, setSelectedTowerIndex] = useState<number | null>(null);
  const [selectedTowerType, setSelectedTowerType] = useState<TowerType>('PROTEIN');
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState<number | null>(null);
  
  // 스킬 상태
  const [skillCooldown, setSkillCooldown] = useState(0);
  
  // 보드 및 경로
  const [boardSize, setBoardSize] = useState<BoardSize>({ width: 820, height: 600 });
  const [gamePaths, setGamePaths] = useState<GamePath[]>([]);
  const [forbiddenZones, setForbiddenZones] = useState<ForbiddenZone[]>([]);
  
  // 알림
  const [pathChangeNotification, setPathChangeNotification] = useState<string | null>(null);
  const [crisisNotification, setCrisisNotification] = useState<string | null>(null);
  
  // Refs
  const gameStartTimeRef = useRef<number>(0);
  const statsRef = useRef<GameStats>({
    wave: 0,
    enemiesKilled: 0,
    towersPlaced: 0,
    goldEarned: 0,
    damageDealt: 0,
    playTime: 0,
  });
  const lastCrisisWaveRef = useRef<number>(0);
  
  // 게임 리셋
  const resetGame = useCallback(() => {
    setGold(GAME_CONFIG.INITIAL_GOLD);
    setLives(GAME_CONFIG.INITIAL_LIVES);
    setWave(GAME_CONFIG.INITIAL_WAVE);
    setIsPlaying(false);
    setIsGameOver(false);
    setShowRanking(false);
    setTowers([]);
    setEnemies([]);
    setProjectiles([]);
    setDamageNumbers([]);
    setSelectedTowerIndex(null);
    setShowUpgradeMenu(null);
    setSkillCooldown(0);
    setPathChangeNotification(null);
    setCrisisNotification(null);
    lastCrisisWaveRef.current = 0;
    gameStartTimeRef.current = 0;
    statsRef.current = {
      wave: 0,
      enemiesKilled: 0,
      towersPlaced: 0,
      goldEarned: 0,
      damageDealt: 0,
      playTime: 0,
    };
  }, []);
  
  return {
    gold,
    setGold,
    lives,
    setLives,
    wave,
    setWave,
    isPlaying,
    setIsPlaying,
    isGameOver,
    setIsGameOver,
    showRanking,
    setShowRanking,
    towers,
    setTowers,
    enemies,
    setEnemies,
    projectiles,
    setProjectiles,
    damageNumbers,
    setDamageNumbers,
    selectedTowerIndex,
    setSelectedTowerIndex,
    selectedTowerType,
    setSelectedTowerType,
    hoveredTile,
    setHoveredTile,
    showUpgradeMenu,
    setShowUpgradeMenu,
    skillCooldown,
    setSkillCooldown,
    boardSize,
    setBoardSize,
    gamePaths,
    setGamePaths,
    forbiddenZones,
    setForbiddenZones,
    pathChangeNotification,
    setPathChangeNotification,
    crisisNotification,
    setCrisisNotification,
    gameStartTimeRef,
    statsRef,
    lastCrisisWaveRef,
    resetGame,
  };
}

