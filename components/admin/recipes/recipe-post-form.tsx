/**
 * @file components/admin/recipes/recipe-post-form.tsx
 * @description 궁중 레시피 블로그 글 작성 폼 컴포넌트
 *
 * 주요 기능:
 * - 제목, 내용, 썸네일, 발췌문 입력
 * - 게시 상태 설정
 * - 폼 유효성 검사
 * - 글 작성 API 호출
 *
 * @dependencies
 * - react-hook-form: 폼 상태 관리
 * - @hookform/resolvers/zod: Zod 유효성 검사
 * - @/components/ui/form: 폼 컴포넌트들
 * - @/actions/admin/recipes: 서버 액션
 */

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { createRoyalRecipePost, type CreateRoyalRecipePostData } from "@/actions/admin/recipes";
import { RoyalRecipeEra } from "./recipes-page-client";

const recipePostSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요").max(200, "제목은 200자 이하로 입력해주세요"),
  content: z.string().min(1, "내용을 입력해주세요").min(10, "내용은 최소 10자 이상 입력해주세요"),
  thumbnailUrl: z.string().url("올바른 URL 형식을 입력해주세요").optional().or(z.literal("")),
  excerpt: z.string().max(300, "요약은 300자 이하로 입력해주세요").optional(),
  published: z.boolean().default(false),
});

type RecipePostFormData = z.infer<typeof recipePostSchema>;

interface RecipePostFormProps {
  era: RoyalRecipeEra;
  onSuccess: () => void;
  initialData?: Partial<RecipePostFormData>;
}

export function RecipePostForm({ era, onSuccess, initialData }: RecipePostFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<RecipePostFormData>({
    resolver: zodResolver(recipePostSchema),
    defaultValues: initialData ? {
      title: initialData.title,
      content: initialData.content,
      thumbnailUrl: initialData.thumbnailUrl,
      excerpt: initialData.excerpt,
      published: initialData.published,
    } : {
      title: "",
      content: "",
      thumbnailUrl: "",
      excerpt: "",
      published: false,
    },
  });

  const onSubmit = async (data: RecipePostFormData) => {
    console.log("글 작성 시도:", { era, ...data });

    setIsSubmitting(true);
    try {
      const result = await createRoyalRecipePost({
        ...data,
        era,
        thumbnailUrl: data.thumbnailUrl || undefined,
        excerpt: data.excerpt || undefined,
      } as CreateRoyalRecipePostData);

      if (result.success) {
        toast({
          title: "글 작성 완료",
          description: "궁중 레시피 글이 성공적으로 작성되었습니다.",
        });
        form.reset();
        onSuccess();
      } else {
        toast({
          title: "글 작성 실패",
          description: result.error || "알 수 없는 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("글 작성 중 오류:", error);
      toast({
        title: "글 작성 실패",
        description: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>제목 *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="예: 고려시대 궁중 떡볶이 레시피"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="thumbnailUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>썸네일 이미지 URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  대표 이미지를 보여줄 URL을 입력하세요.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>요약</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="글의 간단한 요약을 입력하세요..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                검색 결과나 미리보기에 표시될 요약문입니다.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>내용 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="궁중 레시피의 상세한 내용과 조리법을 작성하세요..."
                  className="min-h-[300px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">공개 설정</FormLabel>
                <FormDescription>
                  체크하면 블로그에 공개됩니다. 미체크시 임시저장 상태입니다.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => form.reset()}
            disabled={isSubmitting}
          >
            초기화
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "저장 중..." : "글 작성"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
