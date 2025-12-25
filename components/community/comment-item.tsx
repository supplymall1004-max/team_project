/**
 * @file components/community/comment-item.tsx
 * @description 댓글 아이템 컴포넌트
 *
 * 게시글 댓글을 표시하는 컴포넌트입니다. 대댓글도 지원합니다.
 *
 * @dependencies
 * - @/components/ui/avatar: Avatar
 * - @/components/ui/button: Button
 * - lucide-react: Heart, Reply
 * - @/types/community: CommentWithAuthor
 */

"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Heart, Reply } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toggleLike } from "@/actions/community/toggle-like";
import type { CommentWithAuthor } from "@/types/community";

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply?: (commentId: string) => void;
  isReply?: boolean;
}

export function CommentItem({
  comment,
  onReply,
  isReply = false,
}: CommentItemProps) {
  const [isLiked, setIsLiked] = useState(comment.is_liked || false);
  const [likeCount, setLikeCount] = useState(comment.like_count);
  const [isLoading, setIsLoading] = useState(false);

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
    addSuffix: true,
    locale: ko,
  });

  const handleLike = async () => {
    if (isLoading) return;

    setIsLoading(true);
    const result = await toggleLike(null, comment.id);

    if (result.success && result.data) {
      setIsLiked(result.data.liked);
      setLikeCount((prev) => (result.data?.liked ? prev + 1 : prev - 1));
    }

    setIsLoading(false);
  };

  return (
    <div className={`${isReply ? "ml-8 mt-3" : ""}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={comment.author.profile_image_url || undefined}
            alt={comment.author.name}
          />
          <AvatarFallback>
            {comment.author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{comment.author.name}</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <p className="text-sm mb-2 whitespace-pre-wrap break-words">
            {comment.content}
          </p>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={handleLike}
              disabled={isLoading}
            >
              <Heart
                className={`h-3.5 w-3.5 mr-1 ${isLiked ? "fill-red-500 text-red-500" : ""}`}
              />
              {likeCount}
            </Button>
            {onReply && !isReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onReply(comment.id)}
              >
                <Reply className="h-3.5 w-3.5 mr-1" />
                답글
              </Button>
            )}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-3 space-y-2">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  isReply={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

