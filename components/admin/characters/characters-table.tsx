/**
 * @file components/admin/characters/characters-table.tsx
 * @description 캐릭터 목록 테이블 컴포넌트
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
import { listCharactersAdmin } from "@/actions/admin/characters/list-characters-admin";
import type { AdminCharacter } from "@/types/admin/character";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function CharactersTable() {
  const [characters, setCharacters] = useState<AdminCharacter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const result = await listCharactersAdmin({
        page,
        limit: 20,
        search: search || undefined,
      });

      if (result.success && result.data) {
        setCharacters(result.data);
        setTotal(result.total || 0);
      } else {
        toast({
          title: "오류",
          description: result.error || "캐릭터 목록을 불러올 수 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("캐릭터 목록 로드 실패:", error);
      toast({
        title: "오류",
        description: "캐릭터 목록을 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();
  }, [page, search]);

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return "secondary";
    if (score >= 80) return "default";
    if (score >= 60) return "outline";
    return "destructive";
  };

  return (
    <div className="space-y-4">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="캐릭터명 검색..."
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
              <TableHead>이름</TableHead>
              <TableHead>관계</TableHead>
              <TableHead>사용자</TableHead>
              <TableHead>건강 점수</TableHead>
              <TableHead>레벨</TableHead>
              <TableHead>경험치</TableHead>
              <TableHead>생성일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : characters.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  캐릭터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              characters.map((character) => (
                <TableRow key={character.id}>
                  <TableCell className="font-medium">{character.name}</TableCell>
                  <TableCell>{character.relationship || "-"}</TableCell>
                  <TableCell>{character.userName}</TableCell>
                  <TableCell>
                    {character.healthScore !== null ? (
                      <Badge variant={getHealthScoreColor(character.healthScore)}>
                        {character.healthScore}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">Lv.{character.level}</Badge>
                  </TableCell>
                  <TableCell>
                    {character.experience} / {character.experienceToNextLevel}
                  </TableCell>
                  <TableCell>
                    {new Date(character.createdAt).toLocaleDateString("ko-KR")}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          총 {total}개 캐릭터
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
    </div>
  );
}

