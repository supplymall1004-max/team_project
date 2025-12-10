/**
 * @file components/royal-recipes/royal-recipe-detail.tsx
 * @description 궁중 레시피 상세 컴포넌트 (사진 + 글 + 사진 형식)
 * 고서(古書) 느낌의 전통적인 디자인 적용
 */

import { RoyalRecipe } from "@/lib/royal-recipes/parser";
import { getRecipeImages } from "@/lib/royal-recipes/images";
import { RoyalRecipeTitle } from "./royal-recipe-title";

/**
 * 이미지 경로에서 파일명을 추출하여 제목으로 변환합니다.
 */
function getTitleFromImage(imagePath: string | null): string | null {
  if (!imagePath) return null;
  
  // 경로에서 파일명 추출
  const filename = imagePath.split("/").pop() || "";
  
  // 확장자 제거
  const nameWithoutExt = filename.replace(/\.(png|jpg|jpeg)$/i, "");
  
  // 번호 제거 (예: "1. " 또는 "1.")
  const nameWithoutNumber = nameWithoutExt.replace(/^\d+\.\s*/, "").trim();
  
  return nameWithoutNumber || null;
}

interface RoyalRecipeDetailProps {
  recipe: RoyalRecipe;
}

export function RoyalRecipeDetail({ recipe }: RoyalRecipeDetailProps) {
  let images = { palace: null as string | null, modern: null as string | null };
  try {
    images = getRecipeImages(recipe);
  } catch (error) {
    console.error("[RoyalRecipeDetail] 이미지 로드 실패:", error);
  }
  
  const { content } = recipe;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* 첫 번째 사진: 궁중 레시피 사진 */}
        {images.palace && (
          <div className="relative w-full aspect-video overflow-hidden rounded-lg border-4 border-amber-800/30 shadow-2xl bg-gray-100" style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(139, 69, 19, 0.1)',
          }}>
            <img
              src={images.palace}
              alt={`${recipe.title} 궁중 사진`}
              className="w-full h-full object-cover"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-900/10 z-10 pointer-events-none" />
          </div>
        )}

        {/* 레시피 내용 - 고서 느낌의 서책 */}
        <div 
          className="relative bg-gradient-to-br from-amber-50 to-stone-100 rounded-lg border-4 border-amber-800/40 shadow-2xl p-8 sm:p-12"
          style={{
            backgroundImage: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(139, 69, 19, 0.03) 2px,
                rgba(139, 69, 19, 0.03) 4px
              ),
              radial-gradient(circle at 20% 50%, rgba(139, 69, 19, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(139, 69, 19, 0.05) 0%, transparent 50%)
            `,
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 100px rgba(139, 69, 19, 0.1)',
          }}
        >
          {/* 서책 장식 테두리 */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-800/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-800/50 to-transparent" />
          
          <div className="space-y-8">
            {/* 제목 - 사진 파일명 기반 */}
            <div className="text-center border-b-2 border-amber-800/30 pb-6">
              <RoyalRecipeTitle
                title={images.palace ? (getTitleFromImage(images.palace) || recipe.title) : recipe.title}
                className="mb-4"
              />
              {content.characteristics && (
                <p className="text-lg sm:text-xl text-amber-800 font-medium leading-relaxed max-w-3xl mx-auto">
                  {content.characteristics}
                </p>
              )}
            </div>

            {/* 재료 */}
            {content.ingredients && (
              <div className="bg-amber-100/50 border-2 border-amber-800/30 rounded-lg p-6 shadow-inner">
                <h2 className="text-2xl font-bold text-amber-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                  <span className="text-3xl">📜</span>
                  재료
                </h2>
                <p className="text-lg text-amber-900 leading-relaxed" style={{ fontFamily: 'serif' }}>
                  {content.ingredients}
                </p>
              </div>
            )}

            {/* 조리 순서 */}
            {content.steps.length > 0 ? (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3" style={{ fontFamily: 'serif' }}>
                  <span className="text-4xl">📖</span>
                  조리 순서
                </h2>
                <div className="space-y-4">
                  {content.steps.map((step, index) => (
                    <div
                      key={index}
                      className="relative bg-white/80 border-2 border-amber-800/20 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
                      style={{
                        backgroundImage: 'linear-gradient(to right, rgba(139, 69, 19, 0.02) 0%, transparent 10%)',
                      }}
                    >
                      <div className="flex gap-4 items-start">
                        <div 
                          className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white font-bold text-xl flex items-center justify-center shadow-lg"
                          style={{ fontFamily: 'serif' }}
                        >
                          {index + 1}
                        </div>
                        <p className="flex-1 text-lg text-amber-900 leading-relaxed" style={{ fontFamily: 'serif' }}>
                          {step}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : recipe.rawContent ? (
              // 조리 순서가 파싱되지 않은 경우 rawContent 표시
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-amber-900 mb-6 flex items-center gap-3" style={{ fontFamily: 'serif' }}>
                  <span className="text-4xl">📖</span>
                  조리 방법
                </h2>
                <div className="bg-white/80 border-2 border-amber-800/20 rounded-lg p-6 shadow-md">
                  <pre 
                    className="text-lg text-amber-900 leading-relaxed whitespace-pre-wrap font-serif"
                    style={{ fontFamily: 'serif' }}
                  >
                    {recipe.rawContent}
                  </pre>
                </div>
              </div>
            ) : null}

            {/* 추가 팁 */}
            {content.tips && content.tips.length > 0 && (
              <div className="bg-blue-50/50 border-2 border-blue-800/30 rounded-lg p-6 shadow-inner">
                <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2" style={{ fontFamily: 'serif' }}>
                  <span className="text-3xl">💡</span>
                  추가 팁
                </h2>
                <ul className="space-y-3">
                  {content.tips.map((tip, index) => (
                    <li key={index} className="flex gap-3 text-lg text-blue-900 leading-relaxed" style={{ fontFamily: 'serif' }}>
                      <span className="text-blue-700 text-xl flex-shrink-0">•</span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 마지막 사진: 현대 이미지 */}
        {images.modern && (
          <div className="relative w-full aspect-[16/12] overflow-hidden rounded-lg border-4 border-amber-800/30 shadow-2xl bg-gray-100" style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(139, 69, 19, 0.1)',
          }}>
            <img
              src={images.modern}
              alt={`${recipe.title} 현대 이미지`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-amber-900/10 z-10 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}

