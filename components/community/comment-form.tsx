/**
 * @file components/community/comment-form.tsx
 * @description 댓글 작성 폼 컴포넌트
 *
 * 게시글에 댓글을 작성하는 폼 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui/textarea: Textarea
 * - @/components/ui/button: Button
 * - @/actions/community/create-comment: createComment
 */

"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createComment } from "@/actions/community/create-comment";

interface CommentFormProps {
  postId: string;
  parentCommentId?: string | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  placeholder?: string;
}

export function CommentForm({
  postId,
  parentCommentId = null,
  onSuccess,
  onCancel,
  placeholder = "댓글을 입력하세요...",
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("댓글 내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createComment({
      post_id: postId,
      content: content.trim(),
      parent_comment_id: parentCommentId || null,
    });

    if (result.success) {
      setContent("");
      onSuccess?.();
    } else {
      setError(result.error || "댓글 작성에 실패했습니다.");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          setError(null);
        }}
        placeholder={placeholder}
        rows={3}
        className="resize-none"
        disabled={isSubmitting}
      />
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button type="submit" size="sm" disabled={isSubmitting || !content.trim()}>
          {isSubmitting ? "작성 중..." : parentCommentId ? "답글 작성" : "댓글 작성"}
        </Button>
      </div>
    </form>
  );
}

