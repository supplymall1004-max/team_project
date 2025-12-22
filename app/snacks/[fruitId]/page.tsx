/**
 * @file app/snacks/[fruitId]/page.tsx
 * @description 제철과일 및 간식 판매 상세 페이지
 * 
 * 주요 기능:
 * 1. 제철과일 상세 정보 표시
 * 2. 영양 정보 및 건강 효능 표시
 * 3. 판매 안내 메시지 (미구현 기능 안내)
 */

import { notFound } from "next/navigation";
import { getFruitById } from "@/lib/utils/fruit-mapper";
import { FruitDetailClient } from "@/components/snacks/fruit-detail-client";
import { DirectionalEntrance } from "@/components/motion/directional-entrance";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    fruitId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { fruitId } = resolvedParams;
  const fruit = getFruitById(fruitId);
  
  if (!fruit) {
    return {
      title: "제철과일을 찾을 수 없습니다 | 맛의 아카이브",
    };
  }
  
  return {
    title: `${fruit.name} - 제철과일 상세 | 맛의 아카이브`,
    description: `${fruit.name}의 영양 정보, 건강 효능, 제철 시기 등을 확인하세요.`,
  };
}

export default async function FruitDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { fruitId } = resolvedParams;
  const fruit = getFruitById(fruitId);
  
  if (!fruit) {
    notFound();
  }
  
  return (
    <DirectionalEntrance direction="up" delay={0.3}>
      <FruitDetailClient fruit={fruit} />
    </DirectionalEntrance>
  );
}

