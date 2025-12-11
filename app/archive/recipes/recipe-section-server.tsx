/**
 * @file recipe-section-server.tsx
 * @description RecipeSection을 Server Component로 래핑하여 Client Component에서 사용
 * 서버 컴포넌트로 동작하여 server-only import 문제를 해결
 */

import { RecipeSection } from '@/components/recipes/recipe-section';

export function RecipeSectionServer() {
  return <RecipeSection />;
}
