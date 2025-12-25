/**
 * @file components/admin/community/comments-table.tsx
 * @description 댓글 목록 테이블 컴포넌트
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
import { listCommentsAdmin } from "@/actions/admin/community/list-comments-admin";
import { deleteCommentAdmin } from "@/actions/admin/community/delete-comment-admin";
import type { AdminComment } from "@/types/admin/community";
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

export function CommentsTable() {
  const [comments, setComments] = useState<AdminComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComment, setSelectedComment] = useState<AdminComment | null>(null);
  const { toast } = useToast();

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const result = await listCommentsAdmin({
        page,
        limit: 20,
        search: search || undefined,
      });

      if (result.success && result.data) {
        setComments(result.data);
        setTotal(result.total || 0);
      } else {
        toast({
          title: "오류",
          description: result.error || "댓글 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("댓글 목록 로드 실패:", error);
      toast({
        title: "오류",
        description: "댓글 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [page, search]);

  const handleDelete = async () => {
    if (!selectedComment) return;

    const result = await deleteCommentAdmin(selectedComment.id);
    if (result.success) {
      toast({
        title: "성공",
        description: "댓글이 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setSelectedComment(null);
      loadComments();
    } else {
      toast({
        title: "오류",
        description: result.error || "댓글 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="댓글 내용 검색..."
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
              <TableHead>내용</TableHead>
              <TableHead>작성자</TableHead>
              <TableHead>게시글</TableHead>
              <TableHead>그룹</TableHead>
              <TableHead>좋아요</TableHead>
              <TableHead>생성일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  댓글이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell className="max-w-md truncate">
                    {comment.content}
                  </TableCell>
                  <TableCell>{comment.author.name}</TableCell>
                  <TableCell className="max-w-xs truncate">
                    {comment.post.title}
                  </TableCell>
                  <TableCell>{comment.post.group.name}</TableCell>
                  <TableCell>{comment.likeCount}</TableCell>
                  <TableCell>
                    {new Date(comment.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedComment(comment);
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
          총 {total}개 댓글
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
            <AlertDialogTitle>댓글 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 댓글을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
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

