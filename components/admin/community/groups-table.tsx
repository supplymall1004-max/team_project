/**
 * @file components/admin/community/groups-table.tsx
 * @description 그룹 목록 테이블 컴포넌트
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { listGroupsAdmin } from "@/actions/admin/community/list-groups-admin";
import { deleteGroupAdmin } from "@/actions/admin/community/delete-group-admin";
import type { AdminGroup } from "@/types/admin/community";
import type { GroupCategory } from "@/types/community";
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

export function GroupsTable() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GroupCategory | "all">("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<AdminGroup | null>(null);
  const { toast } = useToast();

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      const result = await listGroupsAdmin({
        page,
        limit: 20,
        search: search || undefined,
        category: category !== "all" ? category : undefined,
      });

      if (result.success && result.data) {
        setGroups(result.data);
        setTotal(result.total || 0);
      } else {
        toast({
          title: "오류",
          description: result.error || "그룹 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("그룹 목록 로드 실패:", error);
      toast({
        title: "오류",
        description: "그룹 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, [page, search, category]);

  const handleDelete = async () => {
    if (!selectedGroup) return;

    const result = await deleteGroupAdmin(selectedGroup.id);
    if (result.success) {
      toast({
        title: "성공",
        description: "그룹이 삭제되었습니다.",
      });
      setDeleteDialogOpen(false);
      setSelectedGroup(null);
      loadGroups();
    } else {
      toast({
        title: "오류",
        description: result.error || "그룹 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const categoryLabels: Record<GroupCategory, string> = {
    health: "건강",
    pet: "반려동물",
    recipe: "레시피",
    exercise: "운동",
    region: "지역",
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="그룹명 검색..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value as GroupCategory | "all");
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="카테고리" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <SelectItem key={key} value={key}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>그룹명</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>소유자</TableHead>
              <TableHead>멤버</TableHead>
              <TableHead>게시글</TableHead>
              <TableHead>공개</TableHead>
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
            ) : groups.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  그룹이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              groups.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">{group.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {categoryLabels[group.category]}
                    </Badge>
                  </TableCell>
                  <TableCell>{group.owner.name}</TableCell>
                  <TableCell>{group.memberCount}</TableCell>
                  <TableCell>{group.postCount}</TableCell>
                  <TableCell>
                    {group.is_public ? (
                      <Badge variant="default">공개</Badge>
                    ) : (
                      <Badge variant="secondary">비공개</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(group.created_at).toLocaleDateString("ko-KR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedGroup(group);
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
          총 {total}개 그룹
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
            <AlertDialogTitle>그룹 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 "{selectedGroup?.name}" 그룹을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없으며, 그룹의 모든 게시글과 댓글도 함께 삭제됩니다.
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

