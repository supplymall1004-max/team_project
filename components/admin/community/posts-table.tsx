/**
 * @file components/admin/community/posts-table.tsx
 * @description 게시글 목록 테이블 컴포넌트
 */

"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { listPostsAdmin } from "@/actions/admin/community/list-posts-admin";
import { deletePostAdmin } from "@/actions/admin/community/delete-post-admin";
import type { AdminPost } from "@/types/admin/community";
import { Trash2, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function PostsTable() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<AdminPost | null>(null);
  const { toast } = useToast();

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const result = await listPostsAdmin({
        page,
        limit: 20,
        search: search || undefined,
      });

      if (result.success && result.data) {
        setPosts(result.data);
        setTotal(result.total || 0);
      } else {
        toast({
          title: "오류",
          description: result.error || "게시글 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("게시글 목록 로드 실패:", error);
      toast({
        title: "오류",
        description: "게시글 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [page, search]);

  const handleDelete = async () => {
    if (!selectedPost) return;

    const result = await deletePostAdmin(selectedPost.id);
    if (result.success) {
      toast({
        title: "성공",
        description: "게시글이 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setSelectedPost(null);
      loadPosts();
    } else {
      toast({
        title: "오류",
        description: result.error || "게시글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="게시글 제목 검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="pl-8"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>좋아요</TableHead>
              <TableHead>댓글</TableHead>
              <TableHead>조회</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  게시글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">
                    {post.is_pinned && (
                      <Badge variant="default" className="mr-2">고정</Badge>
                    )}
                    {post.title}
                  </TableCell>
                  <TableCell>{post.author.name}</TableCell>
                  <TableCell>{post.group.name}</TableCell>
                  <TableCell>{post.likeCount}</TableCell>
                  <TableCell>{post.commentCount}</TableCell>
                  <TableCell>{post.viewCount}</TableCell>
                  <TableCell>
                    {new Date(post.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedPost(post);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 {total}개 게시글
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            이전
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
          >
            다음
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 &quot;{selectedPost?.title}&quot; 게시글을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없으며, 게시글의 모든 댓글과 좋아요도 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

