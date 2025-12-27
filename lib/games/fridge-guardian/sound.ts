/**
 * @file lib/games/fridge-guardian/sound.ts
 * @description 냉장고 파수꾼 게임 사운드 시스템
 * 
 * 게임 효과음을 관리하는 유틸리티입니다.
 */

/**
 * 사운드 타입
 */
export type SoundType = 
  | 'catch'      // 세균 처치
  | 'boss'       // 보스 처치
  | 'combo'      // 콤보 달성
  | 'error'      // 오답 클릭
  | 'gameOver'   // 게임 종료
  | 'gameStart'  // 게임 시작
  | 'powerUp';   // 파워업 획득

/**
 * 사운드 관리 클래스
 */
class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private enabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Web Audio API를 사용한 간단한 효과음 생성
    this.initializeSounds();
  }

  /**
   * 사운드 초기화 (Web Audio API로 간단한 효과음 생성)
   */
  private initializeSounds() {
    // 실제 파일이 없어도 동적으로 사운드를 생성
    // 나중에 실제 오디오 파일로 교체 가능
  }

  /**
   * 사운드 재생
   */
  async play(type: SoundType): Promise<void> {
    if (!this.enabled) return;

    try {
      // Web Audio API로 간단한 효과음 생성
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      let frequency = 440;
      let duration = 0.1;
      
      switch (type) {
        case 'catch':
          frequency = 800;
          duration = 0.1;
          break;
        case 'boss':
          frequency = 600;
          duration = 0.2;
          break;
        case 'combo':
          frequency = 1000;
          duration = 0.15;
          break;
        case 'error':
          frequency = 200;
          duration = 0.2;
          break;
        case 'gameOver':
          frequency = 300;
          duration = 0.5;
          break;
        case 'gameStart':
          frequency = 500;
          duration = 0.3;
          break;
        case 'powerUp':
          frequency = 700;
          duration = 0.2;
          break;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type === 'error' ? 'sawtooth' : 'sine';

      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      // 사운드 재생 실패 시 무시 (사용자 상호작용 전에는 재생 불가)
      console.log('[SoundManager] 사운드 재생 실패 (정상):', error);
    }
  }

  /**
   * 사운드 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 볼륨 설정
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 사운드 활성화 상태
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// 싱글톤 인스턴스
export const soundManager = new SoundManager();

