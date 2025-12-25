/**
 * @file components/games/skin-collection.tsx
 * @description 스킨 컬렉션 UI
 *
 * 수집한 스킨 목록 및 미리보기를 표시하는 UI 컴포넌트입니다.
 *
 * 주요 기능:
 * 1. 수집한 스킨 목록 표시
 * 2. 미수집 스킨 표시 (흐릿하게)
 * 3. 스킨 활성화
 * 4. 스킨 상세 정보 표시
 *
 * @dependencies
 * - react: useState, useEffect
 * - framer-motion: 애니메이션
 * - @/components/ui: Card, Button
 * - @/lib/game/collection-system: SKINS, getRarityColor, getRarityBgColor
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Palette, Lock, Check, Sparkles } from "lucide-react";
import {
  SKINS,
  getRarityColor,
  getRarityBgColor,
  calculateCollectionProgress,
  type Skin,
} from "@/lib/game/collection-system";

interface UserSkin {
  skinId: string;
  unlockedAt: string;
  isActive: boolean;
}

interface SkinCollectionProps {
  memberId?: string;
  onSkinActivate?: (skinId: string) => void;
}

export function SkinCollection({ memberId, onSkinActivate }: SkinCollectionProps) {
  const [userSkins, setUserSkins] = useState<Map<string, UserSkin>>(new Map());
  const [activeSkinId, setActiveSkinId] = useState<string>("default");
  const [loading, setLoading] = useState(true);

  // 사용자 스킨 로드 (useCallback으로 메모이제이션)
  const loadUserSkins = useCallback(async () => {
    try {
      // TODO: 실제 API 호출로 대체
      // const response = await fetch(`/api/game/skins?memberId=${memberId}`);
      // const data = await response.json();
      
      // 임시 데이터
      const skins = new Map<string, UserSkin>();
      skins.set("default", {
        skinId: "default",
        unlockedAt: new Date().toISOString(),
        isActive: true,
      });
      setUserSkins(skins);
      setActiveSkinId("default");
    } catch (error) {
      console.error("스킨 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    loadUserSkins();
  }, [loadUserSkins]);

  // 스킨 활성화 (useCallback으로 메모이제이션)
  const handleActivateSkin = useCallback(async (skinId: string) => {
    // TODO: 실제 API 호출로 대체
    // await fetch(`/api/game/skins/activate`, {
    //   method: "POST",
    //   body: JSON.stringify({ memberId, skinId }),
    // });

    setActiveSkinId(skinId);
    setUserSkins((prev) => {
      const updated = new Map(prev);
      // 기존 활성 스킨 비활성화
      prev.forEach((skin, id) => {
        if (skin.isActive) {
          updated.set(id, { ...skin, isActive: false });
        }
      });
      // 새 스킨 활성화
      const newSkin = updated.get(skinId);
      if (newSkin) {
        updated.set(skinId, { ...newSkin, isActive: true });
      }
      return updated;
    });

    onSkinActivate?.(skinId);
  }, [memberId, onSkinActivate]);

  const unlockedCount = Array.from(userSkins.values()).length;
  const totalCount = SKINS.length;
  const progress = calculateCollectionProgress(unlockedCount, totalCount);

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
        <CardContent className="py-8">
          <div className="text-center text-gray-400">로딩 중...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 border-2 border-purple-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-purple-400" />
            스킨 컬렉션
          </div>
          <div className="text-sm text-gray-400">
            {unlockedCount} / {totalCount} ({progress}%)
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SKINS.map((skin, index) => {
            const userSkin = userSkins.get(skin.id);
            const isUnlocked = !!userSkin;
            const isActive = userSkin?.isActive || false;

            return (
              <motion.div
                key={skin.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative p-4 rounded-lg border-2 ${
                  isUnlocked
                    ? getRarityColor(skin.rarity)
                    : "border-gray-700 text-gray-600"
                } ${getRarityBgColor(skin.rarity)} ${
                  !isUnlocked ? "opacity-50" : ""
                }`}
              >
                {!isUnlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                    <Lock className="w-8 h-8 text-gray-500" />
                  </div>
                )}

                {isActive && (
                  <div className="absolute top-2 right-2">
                    <Check className="w-5 h-5 text-green-400 bg-green-500/20 rounded-full p-1" />
                  </div>
                )}

                <div className="text-center">
                  <div className="text-4xl mb-2">{skin.imageUrl ? "🖼️" : "👤"}</div>
                  <h3 className="font-bold text-sm mb-1">{skin.name}</h3>
                  <p className="text-xs text-gray-400 mb-2">{skin.description}</p>
                  <div className="text-xs mb-2">
                    <span className={`px-2 py-1 rounded ${getRarityBgColor(skin.rarity)} ${getRarityColor(skin.rarity)}`}>
                      {skin.rarity.toUpperCase()}
                    </span>
                  </div>
                  {isUnlocked && !isActive && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleActivateSkin(skin.id)}
                      className="w-full mt-2"
                    >
                      활성화
                    </Button>
                  )}
                  {isActive && (
                    <div className="text-xs text-green-400 mt-2">활성화됨</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

