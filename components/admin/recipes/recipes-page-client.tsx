/**
 * @file components/admin/recipes/recipes-page-client.tsx
 * @description 궁중 레시피 블로그 글 작성 클라이언트 컴포넌트
 *
 * 주요 기능:
 * - 시대 선택 (고려/조선/삼국시대)
 * - 블로그 글 작성 폼
 * - 기존 글 목록 및 관리
 *
 * @dependencies
 * - components/admin/recipes/era-selector: 시대 선택 컴포넌트
 * - components/admin/recipes/recipe-post-form: 글 작성 폼
 * - components/admin/recipes/recipe-posts-list: 글 목록 컴포넌트
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EraSelector } from "./era-selector";
import { RecipePostForm } from "./recipe-post-form";
import { RecipePostsList } from "./recipe-posts-list";

export type RoyalRecipeEra = "goryeo" | "joseon" | "three_kingdoms";

const ERA_LABELS = {
  goryeo: "고려시대 궁중 레시피",
  joseon: "조선시대 궁중 레시피",
  three_kingdoms: "삼국시대 궁중 레시피",
} as const;

export function RecipesPageClient() {
  const [selectedEra, setSelectedEra] = useState<RoyalRecipeEra | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleEraSelect = (era: RoyalRecipeEra) => {
    console.log("선택된 시대:", era);
    setSelectedEra(era);
  };

  const handlePostCreated = () => {
    console.log("새 글 작성됨, 목록 새로고침");
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">레시피 작성</h1>
          <p className="text-muted-foreground">
            궁중 레시피 블로그 글을 작성하고 관리합니다.
          </p>
        </div>
      </div>

      <Tabs defaultValue="write" className="space-y-6">
        <TabsList>
          <TabsTrigger value="write">글 작성</TabsTrigger>
          <TabsTrigger value="manage">글 관리</TabsTrigger>
        </TabsList>

        <TabsContent value="write" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>시대 선택</CardTitle>
              <CardDescription>
                작성할 궁중 레시피의 시대를 선택하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EraSelector
                selectedEra={selectedEra}
                onEraSelect={handleEraSelect}
              />
            </CardContent>
          </Card>

          {selectedEra && (
            <Card>
              <CardHeader>
                <CardTitle>{ERA_LABELS[selectedEra]} 작성</CardTitle>
                <CardDescription>
                  선택한 시대의 궁중 레시피 글을 작성하세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RecipePostForm
                  era={selectedEra}
                  onSuccess={handlePostCreated}
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>작성된 글 목록</CardTitle>
              <CardDescription>
                작성된 궁중 레시피 글을 관리합니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecipePostsList refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}




