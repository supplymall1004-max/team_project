/**
 * @file app/community/page.tsx
 * @description 커뮤니티 메인 페이지
 *
 * 커뮤니티 그룹 목록과 검색, 필터링 기능을 제공합니다.
 *
 * @dependencies
 * - @/components/community/group-list: GroupList
 * - @/components/community/group-form: GroupForm
 * - @/components/ui/tabs: Tabs
 * - @/components/ui/button: Button
 * - @/components/ui/dialog: Dialog
 */

"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupList } from "@/components/community/group-list";
import { GroupForm } from "@/components/community/group-form";
import { getCurrentSubscription } from "@/actions/payments/get-subscription";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import type { GroupCategory } from "@/types/community";

const categoryOptions: { value: GroupCategory | "all"; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "health", label: "건강" },
  { value: "pet", label: "반려동물" },
  { value: "recipe", label: "레시피" },
  { value: "exercise", label: "운동" },
  { value: "region", label: "지역" },
];

export default function CommunityPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState<GroupCategory | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isCheckingPremium, setIsCheckingPremium] = useState(true);

  // 프리미엄 여부 확인
  useEffect(() => {
    async function checkPremium() {
      if (!isLoaded || !user) {
        setIsPremium(false);
        setIsCheckingPremium(false);
        return;
      }

      try {
        const subscription = await getCurrentSubscription();
        setIsPremium(subscription.isPremium || false);
      } catch (error) {
        console.error("[CommunityPage] 프리미엄 확인 실패:", error);
        setIsPremium(false);
      } finally {
        setIsCheckingPremium(false);
      }
    }

    checkPremium();
  }, [user, isLoaded]);

  const handleGroupCreated = () => {
    setIsCreateDialogOpen(false);
    // 그룹 목록 새로고침은 GroupList 컴포넌트에서 처리
    window.location.reload(); // 임시: 추후 상태 관리로 개선
  };

  const handleCreateGroupClick = () => {
    if (!isPremium) {
      // 프리미엄이 아닌 경우 프리미엄 페이지로 이동
      router.push("/pricing");
      return;
    }
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">커뮤니티</h1>
            <p className="text-muted-foreground mt-1">
              함께 건강하고 맛있는 삶을 나눠요
            </p>
          </div>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={(open) => {
              // 프리미엄이 아닌 경우 다이얼로그를 열 수 없도록 제한
              if (open && !isPremium) {
                router.push("/pricing");
                return;
              }
              setIsCreateDialogOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button
                className="gap-2"
                onClick={handleCreateGroupClick}
                disabled={isCheckingPremium}
              >
                <Plus className="h-4 w-4" />
                그룹 만들기
                {!isPremium && !isCheckingPremium && (
                  <Crown className="h-4 w-4 ml-1" />
                )}
              </Button>
            </DialogTrigger>
            {isPremium && (
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 그룹 만들기</DialogTitle>
                </DialogHeader>
                <GroupForm
                  onSuccess={handleGroupCreated}
                  onCancel={() => setIsCreateDialogOpen(false)}
                />
              </DialogContent>
            )}
          </Dialog>
          {!isPremium && !isCheckingPremium && (
            <div className="text-sm text-muted-foreground mt-1">
              그룹 생성은 프리미엄 회원만 이용할 수 있습니다.
            </div>
          )}
        </div>

        {/* 검색 및 필터 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="그룹 이름 또는 설명으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={category}
            onValueChange={(value) => setCategory(value as GroupCategory | "all")}
          >
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 탭 */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">전체 그룹</TabsTrigger>
            <TabsTrigger value="my">내 그룹</TabsTrigger>
            <TabsTrigger value="popular">인기 그룹</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <GroupList
              initialParams={{
                category: category !== "all" ? category : undefined,
                search: searchQuery || undefined,
                is_public: true,
              }}
            />
          </TabsContent>

          <TabsContent value="my" className="space-y-4">
            <GroupList
              initialParams={{
                category: category !== "all" ? category : undefined,
                search: searchQuery || undefined,
                // TODO: 내 그룹 필터링 로직 추가 필요
              }}
            />
          </TabsContent>

          <TabsContent value="popular" className="space-y-4">
            <GroupList
              initialParams={{
                category: category !== "all" ? category : undefined,
                search: searchQuery || undefined,
                is_public: true,
                // TODO: 인기 그룹 정렬 로직 추가 필요 (member_count, post_count 기준)
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

