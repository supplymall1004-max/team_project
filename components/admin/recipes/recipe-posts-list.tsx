/**
 * @file components/admin/recipes/recipe-posts-list.tsx
 * @description 작성된 궁중 레시피 글 목록 컴포넌트
 *
 * 주요 기능:
 * - 작성된 글 목록 표시
 * - 시대별 필터링
 * - 게시 상태 토글
 * - 글 수정/삭제 기능
 *
 * @dependencies
 * - @tanstack/react-query: 데이터 패칭
 * - @/components/ui/table: 테이블 컴포넌트
 * - @/components/ui/badge: 뱃지 컴포넌트
 * - @/actions/admin/recipes: 서버 액션
 */

"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getRoyalRecipePosts, updateRoyalRecipePost, deleteRoyalRecipePost, RoyalRecipeEra, RoyalRecipePost } from "@/actions/admin/recipes";
import { EditRecipePostDialog } from "./edit-recipe-post-dialog";
import { Crown, Castle, Shield, Edit, Trash2, Eye } from "lucide-react";

interface RecipePostsListProps {
  refreshTrigger: number;
}

const ERA_ICONS = {
  goryeo: Crown,
  joseon: Castle,
  three_kingdoms: Shield,
} as const;

const ERA_LABELS = {
  goryeo: "고려",
  joseon: "조선",
  three_kingdoms: "삼국",
} as const;

const ERA_COLORS = {
  goryeo: "bg-yellow-100 text-yellow-800",
  joseon: "bg-blue-100 text-blue-800",
  three_kingdoms: "bg-green-100 text-green-800",
} as const;

export function RecipePostsList({ refreshTrigger }: RecipePostsListProps) {
  const [selectedEra, setSelectedEra] = useState<RoyalRecipeEra | "all">("all");
  const [editingPost, setEditingPost] = useState<RoyalRecipePost | null>(null);
  const { toast } = useToast();

  const { data: postsResult, isLoading, refetch } = useQuery({
    queryKey: ["royal-recipe-posts", refreshTrigger],
    queryFn: getRoyalRecipePosts,
  });

  const posts = postsResult?.success ? postsResult.data : [];

  // 필터링된 게시물
  const filteredPosts = selectedEra === "all"
    ? posts
    : posts.filter(post => post.era === selectedEra);

  const handlePublishToggle = async (postId: string, currentPublished: boolean) => {
    console.log("게시 상태 변경:", { postId, published: !currentPublished });

    try {
      const result = await updateRoyalRecipePost(postId, {
        published: !currentPublished,
      });

      if (result.success) {
        toast({
          title: "상태 변경 완료",
          description: `글이 ${!currentPublished ? "공개" : "비공개"}되었습니다.`,
        });
        refetch();
      } else {
        toast({
          title: "상태 변경 실패",
          description: result.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("게시 상태 변경 중 오류:", error);
      toast({
        title: "상태 변경 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (postId: string, title: string) => {
    console.log("글 삭제:", postId);

    try {
      const result = await deleteRoyalRecipePost(postId);

      if (result.success) {
        toast({
          title: "삭제 완료",
          description: `"${title}" 글이 삭제되었습니다.`,
        });
        refetch();
      } else {
        toast({
          title: "삭제 실패",
          description: result.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("글 삭제 중 오류:", error);
      toast({
        title: "삭제 실패",
        description: "네트워크 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">시대 필터:</span>
          <Select value={selectedEra} onValueChange={(value) => setSelectedEra(value as RoyalRecipeEra | "all")}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="goryeo">고려시대</SelectItem>
              <SelectItem value="joseon">조선시대</SelectItem>
              <SelectItem value="three_kingdoms">삼국시대</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-sm text-muted-foreground">
          총 {filteredPosts.length}개의 글
        </div>
      </div>

      {/* 테이블 */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          작성된 글이 없습니다.
        </div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>시대</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>작성일</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => {
                const EraIcon = ERA_ICONS[post.era];

                return (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="max-w-[300px]">
                        <div className="truncate font-medium">{post.title}</div>
                        {post.excerpt && (
                          <div className="text-sm text-muted-foreground truncate mt-1">
                            {post.excerpt}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={ERA_COLORS[post.era]}>
                        <EraIcon className="w-3 h-3 mr-1" />
                        {ERA_LABELS[post.era]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={post.published}
                          onCheckedChange={() => handlePublishToggle(post.id, post.published)}
                        />
                        <span className="text-sm text-muted-foreground">
                          {post.published ? "공개" : "비공개"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            // TODO: 글 보기 기능 구현
                            console.log("글 보기:", post.slug);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setEditingPost(post)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>글 삭제</AlertDialogTitle>
                              <AlertDialogDescription>
                                &quot;{post.title}&quot; 글을 정말 삭제하시겠습니까?
                                이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>취소</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(post.id, post.title)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 수정 다이얼로그 */}
      {editingPost && (
        <EditRecipePostDialog
          post={editingPost}
          open={!!editingPost}
          onOpenChange={(open) => {
            if (!open) setEditingPost(null);
          }}
          onSuccess={() => {
            setEditingPost(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}
