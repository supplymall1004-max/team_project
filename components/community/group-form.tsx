/**
 * @file components/community/group-form.tsx
 * @description 그룹 생성 폼 컴포넌트
 *
 * 새로운 커뮤니티 그룹을 생성하는 폼 컴포넌트입니다.
 *
 * @dependencies
 * - @/components/ui/input: Input
 * - @/components/ui/textarea: Textarea
 * - @/components/ui/button: Button
 * - @/components/ui/select: Select
 * - @/components/ui/switch: Switch
 * - @/actions/community/create-group: createGroup
 * - @/types/community: GroupCategory
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/actions/community/create-group";
import type { GroupCategory } from "@/types/community";

interface GroupFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const categoryOptions: { value: GroupCategory; label: string }[] = [
  { value: "health", label: "건강" },
  { value: "pet", label: "반려동물" },
  { value: "recipe", label: "레시피" },
  { value: "exercise", label: "운동" },
  { value: "region", label: "지역" },
];

export function GroupForm({ onSuccess, onCancel }: GroupFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<GroupCategory>("health");
  const [isPublic, setIsPublic] = useState(true);
  const [isFamilyOnly, setIsFamilyOnly] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("그룹 이름을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createGroup({
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      is_public: isPublic,
      is_family_only: isFamilyOnly,
    });

    if (result.success) {
      setName("");
      setDescription("");
      setCategory("health");
      setIsPublic(true);
      setIsFamilyOnly(false);
      onSuccess?.();
    } else {
      setError(result.error || "그룹 생성에 실패했습니다.");
    }

    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">그룹 이름 *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          placeholder="그룹 이름을 입력하세요"
          maxLength={100}
          disabled={isSubmitting}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">그룹 설명</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError(null);
          }}
          placeholder="그룹에 대한 설명을 입력하세요"
          rows={4}
          className="resize-none"
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="category">카테고리 *</Label>
        <Select
          value={category}
          onValueChange={(value) => setCategory(value as GroupCategory)}
          disabled={isSubmitting}
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categoryOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isPublic">공개 그룹</Label>
            <p className="text-sm text-muted-foreground">
              모든 사용자가 그룹을 조회할 수 있습니다
            </p>
          </div>
          <Switch
            id="isPublic"
            checked={isPublic}
            onCheckedChange={setIsPublic}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="isFamilyOnly">가족 전용 그룹</Label>
            <p className="text-sm text-muted-foreground">
              가족 구성원만 참여할 수 있습니다
            </p>
          </div>
          <Switch
            id="isFamilyOnly"
            checked={isFamilyOnly}
            onCheckedChange={setIsFamilyOnly}
            disabled={isSubmitting}
          />
        </div>
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
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? "생성 중..." : "그룹 생성"}
        </Button>
      </div>
    </form>
  );
}

