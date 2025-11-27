/**
 * @file recipe-upload-form.tsx
 * @description 레시피 업로드 폼 컴포넌트
 *
 * 주요 기능:
 * 1. 레시피 기본 정보 입력
 * 2. 재료 추가/삭제 (구조화된 데이터)
 * 3. 단계별 조리 과정 추가/삭제
 * 4. 이미지 링크 입력 (외부 URL)
 * 5. 폼 검증 및 제출
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/nextjs";
import { createRecipe } from "@/actions/recipe-create";
import { toast } from "sonner";

interface RecipeIngredientInput {
  name: string;
  quantity: string;
  unit: string;
  notes: string;
}

interface RecipeStepInput {
  content: string;
  image_url: string;
  video_url: string;
  timer_minutes: string;
}

export function RecipeUploadForm() {
  const router = useRouter();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [cookingTimeMinutes, setCookingTimeMinutes] = useState("");
  const [servings, setServings] = useState("1");
  const [ingredients, setIngredients] = useState<RecipeIngredientInput[]>([
    { name: "", quantity: "", unit: "", notes: "" },
  ]);
  const [steps, setSteps] = useState<RecipeStepInput[]>([
    { content: "", image_url: "", video_url: "", timer_minutes: "" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: "", unit: "", notes: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleUpdateIngredient = (
    index: number,
    field: keyof RecipeIngredientInput,
    value: string
  ) => {
    const updated = [...ingredients];
    updated[index] = { ...updated[index], [field]: value };
    setIngredients(updated);
  };

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { content: "", image_url: "", video_url: "", timer_minutes: "" },
    ]);
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (
    index: number,
    field: keyof RecipeStepInput,
    value: string
  ) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("로그인이 필요합니다");
      return;
    }

    setIsSubmitting(true);

    try {
      // 데이터 변환
      const recipeInput = {
        title: title.trim(),
        description: description.trim() || undefined,
        difficulty: parseInt(difficulty),
        cookingTimeMinutes: parseInt(cookingTimeMinutes),
        servings: parseInt(servings) || 1,
        ingredients: ingredients
          .filter(ing => ing.name.trim())
          .map(ing => ({
            name: ing.name.trim(),
            quantity: ing.quantity || undefined,
            unit: ing.unit.trim() || undefined,
            notes: ing.notes.trim() || undefined,
          })),
        steps: steps
          .filter(step => step.content.trim())
          .map(step => ({
            content: step.content.trim(),
            image_url: step.image_url.trim() || undefined,
            video_url: step.video_url.trim() || undefined,
            timer_minutes: step.timer_minutes || undefined,
          })),
        userId: user.id,
      };

      console.log("[RecipeUpload] 레시피 생성 요청:", recipeInput);

      // Server Action 호출
      const result = await createRecipe(recipeInput);

      if (!result.success) {
        toast.error(result.error || "레시피 생성에 실패했습니다");
        return;
      }

      toast.success("레시피가 성공적으로 생성되었습니다!");

      // 성공 시 레시피 상세 페이지로 이동
      if (result.slug) {
        router.push(`/recipes/${result.slug}`);
      } else {
        router.push("/recipes");
      }

    } catch (err) {
      console.error("upload error", err);
      toast.error("레시피 생성 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-border/60 bg-white p-8 text-center">
        <p className="text-muted-foreground mb-4">
          레시피를 업로드하려면 로그인이 필요합니다
        </p>
        <Button onClick={() => router.push("/sign-in")}>로그인하기</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* 기본 정보 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <h2 className="text-xl font-bold">기본 정보</h2>

        <div>
          <Label htmlFor="title">제목 *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예: 맛있는 김치찌개"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="레시피에 대한 간단한 설명을 입력하세요"
            rows={3}
          />
        </div>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <div className="text-blue-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">자동 이미지 할당</p>
              <p className="text-xs text-blue-600">레시피 제목을 기반으로 자동으로 이미지가 선택됩니다</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="difficulty">난이도 *</Label>
            <select
              id="difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
            >
              <option value="1">1 (매우 쉬움)</option>
              <option value="2">2 (쉬움)</option>
              <option value="3">3 (보통)</option>
              <option value="4">4 (어려움)</option>
              <option value="5">5 (매우 어려움)</option>
            </select>
          </div>

          <div>
            <Label htmlFor="cookingTime">조리 시간 (분) *</Label>
            <Input
              id="cookingTime"
              type="number"
              min="1"
              value={cookingTimeMinutes}
              onChange={(e) => setCookingTimeMinutes(e.target.value)}
              placeholder="30"
              required
            />
          </div>

          <div>
            <Label htmlFor="servings">인분</Label>
            <Input
              id="servings"
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>
      </div>

      {/* 재료 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">재료 *</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddIngredient}
          >
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </div>

        {ingredients.map((ingredient, index) => (
          <div key={index} className="grid grid-cols-12 gap-2 items-end">
            <div className="col-span-4">
              <Label>재료명 *</Label>
              <Input
                value={ingredient.name}
                onChange={(e) =>
                  handleUpdateIngredient(index, "name", e.target.value)
                }
                placeholder="예: 돼지고기"
                required
              />
            </div>
            <div className="col-span-2">
              <Label>수량</Label>
              <Input
                type="number"
                step="0.1"
                value={ingredient.quantity}
                onChange={(e) =>
                  handleUpdateIngredient(index, "quantity", e.target.value)
                }
                placeholder="300"
              />
            </div>
            <div className="col-span-2">
              <Label>단위</Label>
              <Input
                value={ingredient.unit}
                onChange={(e) =>
                  handleUpdateIngredient(index, "unit", e.target.value)
                }
                placeholder="g"
              />
            </div>
            <div className="col-span-3">
              <Label>비고</Label>
              <Input
                value={ingredient.notes}
                onChange={(e) =>
                  handleUpdateIngredient(index, "notes", e.target.value)
                }
                placeholder="선택사항"
              />
            </div>
            <div className="col-span-1">
              {ingredients.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveIngredient(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 조리 과정 */}
      <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">조리 과정 *</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddStep}
          >
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </div>

        {steps.map((step, index) => (
          <div key={index} className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">단계 {index + 1}</h3>
              {steps.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveStep(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div>
              <Label>설명 *</Label>
              <Textarea
                value={step.content}
                onChange={(e) =>
                  handleUpdateStep(index, "content", e.target.value)
                }
                placeholder="조리 과정을 설명하세요"
                rows={3}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>이미지 URL</Label>
                <Input
                  type="url"
                  value={step.image_url}
                  onChange={(e) =>
                    handleUpdateStep(index, "image_url", e.target.value)
                  }
                  placeholder="https://example.com/step-image.jpg"
                />
              </div>
              <div>
                <Label>영상 URL</Label>
                <Input
                  type="url"
                  value={step.video_url}
                  onChange={(e) =>
                    handleUpdateStep(index, "video_url", e.target.value)
                  }
                  placeholder="https://example.com/step-video.mp4"
                />
              </div>
            </div>

            <div>
              <Label>타이머 (분)</Label>
              <Input
                type="number"
                min="0"
                value={step.timer_minutes}
                onChange={(e) =>
                  handleUpdateStep(index, "timer_minutes", e.target.value)
                }
                placeholder="선택사항"
              />
            </div>
          </div>
        ))}
      </div>

      {/* 제출 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isSubmitting ? "생성 중..." : "레시피 생성"}
        </Button>
      </div>
    </form>
  );
}

