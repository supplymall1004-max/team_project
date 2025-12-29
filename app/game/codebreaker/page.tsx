/**
 * @file app/game/codebreaker/page.tsx
 * @description 코드 브레이커 게임 페이지
 * 
 * 비밀번호 탈출 작전 게임 - 힌트를 조합하여 비밀번호를 찾는 논리 추론 게임
 */

import { Metadata } from 'next';
import { CodebreakerWrapper } from '@/components/games/codebreaker-wrapper';

export const metadata: Metadata = {
  title: '코드 브레이커 | 뇌 훈련 숫자맞추기 | Flavor Archive',
  description: '힌트를 조합하여 비밀번호를 찾는 논리 추론 게임으로 뇌를 훈련하세요!',
};

export default function CodebreakerPage() {
  return <CodebreakerWrapper />;
}

