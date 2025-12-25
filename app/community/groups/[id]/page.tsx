/**
 * @file app/community/groups/[id]/page.tsx
 * @description 그룹 상세 페이지
 *
 * 그룹 정보, 멤버 목록, 게시글 목록을 표시합니다.
 *
 * @dependencies
 * - @/components/community/post-list: PostList
 * - @/components/community/post-form: PostForm
 * - @/actions/community/get-group: getGroup
 * - @/actions/community/join-group: joinGroup
 * - @/actions/community/leave-group: leaveGroup
 */

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Users, MessageSquare, Settings, LogOut, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostList } from "@/components/community/post-list";
import { PostForm } from "@/components/community/post-form";
import { getGroup } from "@/actions/community/get-group";
import { joinGroup } from "@/actions/community/join-group";
import { leaveGroup } from "@/actions/community/leave-group";
import type { GroupWithMembership } from "@/types/community";
import { Skeleton } from "@/components/ui/skeleton";

const categoryLabels: Record<string, string> = {
  health: "건강",
  pet: "반려동물",
  recipe: "레시피",
  exercise: "운동",
  region: "지역",
};

export default function GroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.id as string;

  const [group, setGroup] = useState<GroupWithMembership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isCreatePostDialogOpen, setIsCreatePostDialogOpen] = useState(false);

  useEffect(() => {
    const loadGroup = async () => {
      setLoading(true);
      setError(null);

      const result = await getGroup(groupId);

      if (result.success && result.data) {
        setGroup(result.data);
      } else {
        setError(result.error || "그룹을 불러오는데 실패했습니다.");
      }

      setLoading(false);
    };

    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const handleJoin = async () => {
    setIsJoining(true);
    const result = await joinGroup(groupId);

    if (result.success) {
      // 그룹 정보 다시 로드
      const groupResult = await getGroup(groupId);
      if (groupResult.success && groupResult.data) {
        setGroup(groupResult.data);
      }
    }

    setIsJoining(false);
  };

  const handleLeave = async () => {
    if (!confirm("정말 이 그룹에서 탈퇴하시겠습니까?")) {
      return;
    }

    setIsLeaving(true);
    const result = await leaveGroup(groupId);

    if (result.success) {
      // 그룹 정보 다시 로드
      const groupResult = await getGroup(groupId);
      if (groupResult.success && groupResult.data) {
        setGroup(groupResult.data);
      }
    }

    setIsLeaving(false);
  };

  const handlePostCreated = () => {
    setIsCreatePostDialogOpen(false);
    // 게시글 목록 새로고침은 PostList 컴포넌트에서 처리
    window.location.reload(); // 임시: 추후 상태 관리로 개선
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <p className="text-destructive">{error || "그룹을 찾을 수 없습니다."}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/community")}
          >
            커뮤니티로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="space-y-6">
        {/* 그룹 헤더 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{group.name}</h1>
                  <Badge variant="outline">
                    {categoryLabels[group.category] || group.category}
                  </Badge>
                  {!group.is_public && (
                    <Badge variant="secondary">비공개</Badge>
                  )}
                  {group.is_family_only && (
                    <Badge variant="secondary">가족 전용</Badge>
                  )}
                </div>
                {group.description && (
                  <p className="text-muted-foreground">{group.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    <span>{group.member_count}명</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4" />
                    <span>{group.post_count}개 게시글</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {group.is_member ? (
                  <>
                    {group.user_role === "owner" && (
                      <Button variant="outline" size="sm" className="gap-2">
                        <Settings className="h-4 w-4" />
                        관리
                      </Button>
                    )}
                    <Dialog
                      open={isCreatePostDialogOpen}
                      onOpenChange={setIsCreatePostDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm">게시글 작성</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>게시글 작성</DialogTitle>
                        </DialogHeader>
                        <PostForm
                          groupId={groupId}
                          onSuccess={handlePostCreated}
                          onCancel={() => setIsCreatePostDialogOpen(false)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLeave}
                      disabled={isLeaving || group.user_role === "owner"}
                      className="gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      {isLeaving ? "탈퇴 중..." : "탈퇴"}
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="gap-2"
                  >
                    <LogIn className="h-4 w-4" />
                    {isJoining ? "가입 중..." : "가입하기"}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 게시글 목록 */}
        {group.is_member ? (
          <Tabs defaultValue="posts" className="space-y-4">
            <TabsList>
              <TabsTrigger value="posts">게시글</TabsTrigger>
              <TabsTrigger value="members">멤버</TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4">
              <PostList groupId={groupId} />
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>멤버 목록</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    멤버 목록 기능은 추후 구현 예정입니다.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                이 그룹의 게시글을 보려면 가입해주세요.
              </p>
              <Button onClick={handleJoin} disabled={isJoining}>
                {isJoining ? "가입 중..." : "가입하기"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

