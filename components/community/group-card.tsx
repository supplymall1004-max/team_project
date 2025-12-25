/**
 * @file components/community/group-card.tsx
 * @description 그룹 카드 컴포넌트
 *
 * 커뮤니티 그룹을 카드 형태로 표시하는 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui/card: Card, CardHeader, CardContent
 * - @/components/ui/badge: Badge
 * - lucide-react: Users, MessageSquare
 * - @/types/community: Group
 */

"use client";

import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Group } from "@/types/community";

interface GroupCardProps {
  group: Group;
  isMember?: boolean;
}

const categoryLabels: Record<Group["category"], string> = {
  health: "건강",
  pet: "반려동물",
  recipe: "레시피",
  exercise: "운동",
  region: "지역",
};

export function GroupCard({ group, isMember = false }: GroupCardProps) {
  return (
    <Link href={`/community/groups/${group.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold truncate">{group.name}</h3>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {group.description}
                </p>
              )}
            </div>
            {isMember && (
              <Badge variant="secondary" className="shrink-0">
                멤버
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              <span>{group.member_count}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span>{group.post_count}</span>
            </div>
            <Badge variant="outline" className="ml-auto">
              {categoryLabels[group.category]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

