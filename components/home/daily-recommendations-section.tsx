/**
 * @file daily-recommendations-section.tsx
 * @description 오늘의 추천 섹션 - 건강 상식, 인기 레시피, 개인화 추천
 * 
 * 주요 기능:
 * 1. 오늘의 건강 상식 (날짜 기반 로테이션)
 * 2. 오늘의 인기 레시피 TOP 5
 * 3. 나만을 위한 추천 (개인화)
 * 4. 애니메이션 효과
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, TrendingUp, Heart, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";

interface HealthTip {
  title: string;
  content: string;
  icon: string;
  category: string;
}

interface Recipe {
  id: string;
  title: string;
  image?: string;
  category?: string;
  calories?: number;
}

interface DailyContent {
  healthTip: HealthTip | null;
  popularRecipes: Recipe[];
  personalizedRecipes: Recipe[];
}

export function DailyRecommendationsSection() {
  const { isSignedIn } = useAuth();
  const [content, setContent] = useState<DailyContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDailyContent();
  }, [isSignedIn]);

  const fetchDailyContent = async () => {
    try {
      const response = await fetch("/api/content/daily");
      if (response.ok) {
        const data = await response.json();
        setContent(data);
      }
    } catch (error) {
      console.error("오늘의 콘텐츠 조회 실패:", error);
      // 기본 데이터 설정
      setContent({
        healthTip: {
          title: "물 마시기",
          content: "하루 8잔의 물을 마시면 신진대사가 활발해집니다.",
          icon: "💧",
          category: "nutrition"
        },
        popularRecipes: [],
        personalizedRecipes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="space-y-6">
      {/* 오늘의 건강 상식 */}
      {content.healthTip && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800 overflow-hidden relative">
            {/* 배경 장식 */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full blur-3xl opacity-30" />
            
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                <Sparkles className="w-5 h-5" />
                오늘의 건강 상식
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex items-start gap-4">
                <motion.div 
                  className="text-5xl"
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ 
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3
                  }}
                >
                  {content.healthTip.icon}
                </motion.div>
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-blue-900 dark:text-blue-100">
                    {content.healthTip.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {content.healthTip.content}
                  </p>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 text-xs rounded-full">
                      #{content.healthTip.category === 'nutrition' ? '영양' : 
                        content.healthTip.category === 'exercise' ? '운동' :
                        content.healthTip.category === 'sleep' ? '수면' : '건강'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 인기 레시피 */}
      {content.popularRecipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  오늘의 인기 레시피
                </CardTitle>
                <Link 
                  href="/recipes?sort=popular"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  더보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {content.popularRecipes.slice(0, 6).map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/recipes/${recipe.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                        <div className="relative h-40 bg-gradient-to-br from-gray-100 to-gray-200">
                          {recipe.image ? (
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-4xl">
                              🍽️
                            </div>
                          )}
                          {index < 3 && (
                            <div className="absolute top-2 left-2">
                              <span className={`
                                inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white
                                ${index === 0 ? 'bg-yellow-500' : 
                                  index === 1 ? 'bg-gray-400' : 
                                  'bg-orange-600'}
                              `}>
                                {index + 1}
                              </span>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-3">
                          <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                            {recipe.title}
                          </h4>
                          {recipe.calories && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {recipe.calories}kcal
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* 나만을 위한 추천 (로그인 시) */}
      {isSignedIn && content.personalizedRecipes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-pink-200 dark:border-pink-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                  나만을 위한 추천
                </CardTitle>
                <Link 
                  href="/diet"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  더보기
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {content.personalizedRecipes.slice(0, 4).map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link href={`/recipes/${recipe.id}`}>
                      <Card className="overflow-hidden hover:shadow-md transition-all duration-300 cursor-pointer group">
                        <div className="relative h-32 bg-gradient-to-br from-pink-50 to-rose-50">
                          {recipe.image ? (
                            <Image
                              src={recipe.image}
                              alt={recipe.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-3xl">
                              ❤️
                            </div>
                          )}
                        </div>
                        <CardContent className="p-2">
                          <h4 className="font-medium text-xs line-clamp-2 group-hover:text-primary transition-colors">
                            {recipe.title}
                          </h4>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

