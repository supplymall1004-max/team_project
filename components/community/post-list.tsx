/**
 * @file components/community/post-list.tsx
 * @description 게시글 목록 컴포넌트
 *
 * 커뮤니티 게시글 목록을 표시하는 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/community/post-card: PostCard
 * - @/actions/community/list-posts: listPosts
 * - @/types/community: PostWithAuthor, ListPostsParams
 */

"use client";

import { useEffect, useState, useMemo } from "react";
import { PostCard } from "./post-card";
import { listPosts } from "@/actions/community/list-posts";
import type { PostWithAuthor, ListPostsParams } from "@/types/community";
import { Skeleton } from "@/components/ui/skeleton";

interface PostListProps {
  groupId: string;
  initialParams?: Omit<ListPostsParams, "group_id">;
}

export function PostList({ groupId, initialParams = {} }: PostListProps) {
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // initialParams를 메모이제이션하여 불필요한 재실행 방지
  const memoizedParams = useMemo(() => {
    return {
      post_type: initialParams.post_type,
      sort: initialParams.sort,
      page: initialParams.page,
      limit: initialParams.limit,
    };
  }, [
    initialParams.post_type,
    initialParams.sort,
    initialParams.page,
    initialParams.limit,
  ]);

  useEffect(() => {
    const loadPosts = async () => {
      setLoading(true);
      setError(null);

      const result = await listPosts({
        ...memoizedParams,
        group_id: groupId,
      });

      if (result.success && result.data) {
        setPosts(result.data.items);
      } else {
        setError(result.error || "게시글 목록을 불러오는데 실패했습니다.");
      }

      setLoading(false);
    };

    loadPosts();
  }, [groupId, memoizedParams]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
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

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">게시글이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} showGroup={false} />
      ))}
    </div>
  );
}

