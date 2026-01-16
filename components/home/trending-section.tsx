/**
 * @file trending-section.tsx
 * @description 실시간 인기 순위 섹션
 * 
 * 주요 기능:
 * 1. 실시간 인기 레시피 TOP 10
 * 2. 순위 배지 표시
 * 3. 조회수, 좋아요 통계
 * 4. 자동 새로고침 (30초)
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Flame, Eye, Heart, RefreshCw } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

interface TrendingRecipe {
  id: string;
  title: string;
  image?: string;
  category?: string;
  trending: {
    viewCount: number;
    likeCount: number;
    saveCount: number;
    popularityScore: number;
  };
}

export function TrendingSection() {
  const [recipes, setRecipes] = useState<TrendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    fetchTrending();

    // 30초마다 자동 새로고침
    const interval = setInterval(() => {
      fetchTrending(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchTrending = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      const response = await fetch("/api/trending/recipes?limit=10");
      if (response.ok) {
        const data = await response.json();
        setRecipes(data.recipes || []);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error("트렌딩 조회 실패:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchTrending(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            지금 인기 있는 레시피
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200" />
                <div className="w-16 h-16 rounded-lg bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              지금 인기 있는 레시피
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">새로고침</span>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <AnimatePresence mode="popLayout">
            <div className="divide-y">
              {recipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="flex items-center gap-3 p-4 hover:bg-accent transition-colors group"
                  >
                    {/* 순위 배지 */}
                    <motion.div 
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg' : 
                          index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-md' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-md' :
                          'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}
                      `}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {index + 1}
                    </motion.div>

                    {/* 썸네일 */}
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                      {recipe.image ? (
                        <Image
                          src={recipe.image}
                          alt={recipe.title}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900 dark:to-red-900 text-3xl">
                          🔥
                        </div>
                      )}
                      {/* 트렌딩 뱃지 (TOP 3) */}
                      {index < 3 && (
                        <div className="absolute top-1 right-1">
                          <motion.div
                            animate={{ 
                              scale: [1, 1.2, 1],
                            }}
                            transition={{ 
                              duration: 1.5,
                              repeat: Infinity,
                              repeatDelay: 0.5
                            }}
                          >
                            <Flame className="w-5 h-5 text-orange-500 drop-shadow-lg" />
                          </motion.div>
                        </div>
                      )}
                    </div>

                    {/* 정보 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-1">
                        {recipe.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {recipe.trending.viewCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-500" />
                          {recipe.trending.likeCount.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-orange-500" />
                          {recipe.trending.popularityScore}
                        </span>
                      </div>
                      {recipe.category && (
                        <div className="mt-1">
                          <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 text-xs rounded-full">
                            {recipe.category}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 화살표 아이콘 */}
                    <div className="text-muted-foreground group-hover:text-primary transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {recipes.length === 0 && (
            <div className="py-12 text-center text-muted-foreground">
              <Flame className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>아직 인기 레시피가 없습니다</p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

