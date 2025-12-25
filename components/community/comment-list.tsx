/**
 * @file components/community/comment-list.tsx
 * @description 댓글 목록 컴포넌트
 *
 * 게시글의 댓글 목록을 표시하고 댓글 작성 기능을 제공합니다.
 *
 * @dependencies
 * - @/components/community/comment-item: CommentItem
 * - @/components/community/comment-form: CommentForm
 * - @/actions/community/list-comments: listComments
 * - @/types/community: CommentWithAuthor
 */

"use client";

import { useEffect, useState } from "react";
import { CommentItem } from "./comment-item";
import { CommentForm } from "./comment-form";
import { listComments } from "@/actions/community/list-comments";
import type { CommentWithAuthor, ListCommentsParams } from "@/types/community";
import { Skeleton } from "@/components/ui/skeleton";

interface CommentListProps {
  postId: string;
  initialParams?: Omit<ListCommentsParams, "post_id">;
}

export function CommentList({ postId, initialParams = {} }: CommentListProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const loadComments = async () => {
    setLoading(true);
    setError(null);

    const result = await listComments({
      ...initialParams,
      post_id: postId,
    });

    if (result.success && result.data) {
      setComments(result.data.items);
    } else {
      setError(result.error || "댓글 목록을 불러오는데 실패했습니다.");
    }

    setLoading(false);
  };

  useEffect(() => {
    loadComments();
  }, [postId, initialParams]);

  const handleCommentAdded = () => {
    loadComments();
    setReplyingTo(null);
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CommentForm
        postId={postId}
        parentCommentId={replyingTo}
        onSuccess={handleCommentAdded}
        onCancel={() => setReplyingTo(null)}
      />
      {comments.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground text-sm">
            첫 번째 댓글을 작성해보세요!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={handleReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}

