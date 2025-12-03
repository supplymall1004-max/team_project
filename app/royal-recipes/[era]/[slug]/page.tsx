/**
 * @file app/royal-recipes/[era]/[slug]/page.tsx
 * @description 궁중 레시피 상세 페이지
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getRoyalRecipe, RecipeEra } from "@/lib/royal-recipes/queries";
import { getRecipeImages } from "@/lib/royal-recipes/images";

interface RoyalRecipePageProps {
  params: Promise<{ era: string; slug: string }>;
}

export async function generateStaticParams() {
  // 정적 경로 생성을 비활성화하기 위해 빈 배열 반환
  return [];
}

export default async function RoyalRecipePage({ params }: RoyalRecipePageProps) {
  const { era, slug } = await params;

  // URL 디코딩 (한글 슬러그 처리)
  const decodedSlug = decodeURIComponent(slug);

  // era 유효성 검사
  const validEras: RecipeEra[] = ["sanguk", "goryeo", "joseon"];
  if (!validEras.includes(era as RecipeEra)) {
    notFound();
  }

  const recipe = await getRoyalRecipe(era as RecipeEra, decodedSlug);

  if (!recipe) {
    notFound();
  }

  // 이미지 가져오기
  const images = getRecipeImages(recipe);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-stone-100 to-amber-200 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 뒤로가기 버튼 */}
      <div className="flex justify-start mb-6">
        <Link
          href={`/royal-recipes/${era}`}
          className="inline-flex items-center px-6 py-3 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors font-medium shadow-md"
        >
          ← {era === 'sanguk' ? '삼국시대' : era === 'goryeo' ? '고려시대' : '조선시대'} 레시피 목록으로
        </Link>
      </div>

        {/* 메인 콘텐츠 */}
        <article className="bg-white rounded-lg shadow-xl overflow-hidden border border-gray-200">
          {/* 첫 번째 사진 */}
          {images.palace && (
            <div className="relative w-full h-80 md:h-96 overflow-hidden">
              <img
                src={images.palace}
                alt={`${recipe.title} - 궁중 사진`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
            </div>
          )}

          {/* 콘텐츠 */}
          <div className="p-8">
            <header className="mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>{recipe.title}</h1>
              <div className="flex items-center text-gray-700 space-x-4">
                <span className="px-4 py-2 bg-amber-200 text-amber-900 rounded-full text-sm font-semibold shadow-sm">
                  {era === 'sanguk' ? '삼국시대' : era === 'goryeo' ? '고려시대' : '조선시대'}
                </span>
                <span className="text-sm">레시피 #{recipe.number}</span>
              </div>
            </header>

            <div className="prose prose-lg max-w-none">
              {/* 특징 */}
              {recipe.content.characteristics && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>특징</h2>
                  <p className="text-gray-800 leading-relaxed">{recipe.content.characteristics}</p>
                </section>
              )}

              {/* 재료 */}
              {recipe.content.ingredients && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>재료</h2>
                  <p className="text-gray-800 leading-relaxed">{recipe.content.ingredients}</p>
                </section>
              )}

              {/* 조리 순서 */}
              {recipe.content.steps && recipe.content.steps.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>조리 순서</h2>
                  <ol className="list-decimal list-inside space-y-2 text-gray-800">
                    {recipe.content.steps.map((step, index) => (
                      <li key={index} className="leading-relaxed">{step}</li>
                    ))}
                  </ol>
                </section>
              )}

              {/* 추가 팁 */}
              {recipe.content.tips && recipe.content.tips.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>추가 팁</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-800">
                    {recipe.content.tips.map((tip, index) => (
                      <li key={index} className="leading-relaxed">{tip}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </div>

          {/* 두 번째 사진 */}
          {images.modern && (
            <div className="relative w-full h-80 md:h-96 overflow-hidden">
              <img
                src={images.modern}
                alt={`${recipe.title} - 현대 재현 사진`}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 px-4 py-2 rounded-lg">
                <p className="text-sm text-gray-800">현대 재현 이미지</p>
              </div>
            </div>
          )}
        </article>

        {/* 하단 네비게이션 */}
        <div className="flex justify-center mt-8">
          <Link
            href={`/royal-recipes/${era}`}
            className="inline-flex items-center px-8 py-4 bg-amber-800 text-white rounded-lg hover:bg-amber-900 transition-colors font-medium shadow-lg text-lg"
          >
            다른 레시피 보기
          </Link>
        </div>
      </div>
    </div>
  );
}

