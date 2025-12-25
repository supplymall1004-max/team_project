/**
 * @file components/community/post-form.tsx
 * @description 게시글 작성 폼 컴포넌트
 *
 * 그룹에 게시글을 작성하는 폼 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui/input: Input
 * - @/components/ui/textarea: Textarea
 * - @/components/ui/button: Button
 * - @/components/ui/select: Select
 * - @/actions/community/create-post: createPost
 * - @/types/community: PostType
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPost } from "@/actions/community/create-post";
import type { PostType } from "@/types/community";

interface PostFormProps {
  groupId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const postTypeOptions: { value: PostType; label: string }[] = [
  { value: "general", label: "일반" },
  { value: "question", label: "질문" },
  { value: "recipe", label: "레시피" },
  { value: "achievement", label: "성과" },
  { value: "challenge", label: "챌린지" },
];

export function PostForm({ groupId, onSuccess, onCancel }: PostFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState<PostType>("general");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createPost({
      group_id: groupId,
      title: title.trim(),
      content: content.trim(),
      post_type: postType,
    });

    if (result.success) {
      setTitle("");
      setContent("");
      setPostType("general");
      onSuccess?.();
    } else {
      setError(result.error || "게시글 작성에 실패했습니다.");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Select
          value={postType}
          onValueChange={(value) => setPostType(value as PostType)}
          disabled={isSubmitting}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {postTypeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError(null);
          }}
          placeholder="제목을 입력하세요"
          maxLength={200}
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            setError(null);
          }}
          placeholder="내용을 입력하세요"
          rows={8}
          className="resize-none"
          maxLength={10000}
          disabled={isSubmitting}
        />
        <p className="text-xs text-muted-foreground text-right">
          {content.length} / 10,000
        </p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            취소
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !title.trim() || !content.trim()}>
          {isSubmitting ? "작성 중..." : "게시글 작성"}
        </Button>
      </div>
    </form>
  );
}

