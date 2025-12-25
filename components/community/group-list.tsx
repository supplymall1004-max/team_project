/**
 * @file components/community/group-list.tsx
 * @description 그룹 목록 컴포넌트
 *
 * 커뮤니티 그룹 목록을 표시하는 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/community/group-card: GroupCard
 * - @/actions/community/list-groups: listGroups
 * - @/types/community: Group
 */

"use client";

import { useEffect, useState } from "react";
import { GroupCard } from "./group-card";
import { listGroups } from "@/actions/community/list-groups";
import type { Group, ListGroupsParams } from "@/types/community";
import { Skeleton } from "@/components/ui/skeleton";

interface GroupListProps {
  initialParams?: ListGroupsParams;
}

export function GroupList({ initialParams = {} }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadGroups = async () => {
      setLoading(true);
      setError(null);

      const result = await listGroups(initialParams);

      if (result.success && result.data) {
        setGroups(result.data.items);
      } else {
        setError(result.error || "그룹 목록을 불러오는데 실패했습니다.");
      }

      setLoading(false);
    };

    loadGroups();
  }, [initialParams]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">그룹이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <GroupCard key={group.id} group={group} />
      ))}
    </div>
  );
}

