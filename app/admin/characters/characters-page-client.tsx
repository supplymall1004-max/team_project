/**
 * @file app/admin/characters/characters-page-client.tsx
 * @description 관리자 캐릭터 관리 페이지 클라이언트 컴포넌트
 */

"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharacterStatsCards } from "@/components/admin/characters/character-stats-cards";
import { CharactersTable } from "@/components/admin/characters/characters-table";
import type { AdminCharacterStats } from "@/types/admin/character";

interface CharactersPageClientProps {
  initialStats?: AdminCharacterStats;
}

export function CharactersPageClient({ initialStats }: CharactersPageClientProps) {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">캐릭터 관리</h1>
        <p className="text-muted-foreground mt-2">
          캐릭터 정보, 게임화 데이터, 건강 점수를 관리하세요
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard">대시보드</TabsTrigger>
          <TabsTrigger value="characters">캐릭터 목록</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-6">
          {initialStats && <CharacterStatsCards stats={initialStats} />}
        </TabsContent>

        <TabsContent value="characters" className="mt-6">
          <CharactersTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}

