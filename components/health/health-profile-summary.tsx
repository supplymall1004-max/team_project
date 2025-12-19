/**
 * @file health-profile-summary.tsx
 * @description 건강 정보 요약 표시 컴포넌트
 *
 * 주요 기능:
 * 1. 현재 건강 정보를 요약해서 표시
 * 2. 수정 버튼 제공
 */

"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Edit, User, Heart, AlertTriangle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserHealthProfile, DISEASE_LABELS, ALLERGY_LABELS, ACTIVITY_LEVEL_LABELS, Disease, Allergy } from "@/types/health";
import Link from "next/link";
import { getHealthProfile } from "@/actions/health/profile";

export function HealthProfileSummary() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserHealthProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        console.group("[HealthProfileSummary] 건강 정보 요약 로드");
        console.log("사용자 ID:", user.id);

        const profile = await getHealthProfile();
        
        console.log("✅ 건강 프로필 조회 완료:", profile);
        
        if (profile) {
          setProfile(profile);
          console.log("✅ 건강 정보 요약 로드 성공:", profile);
        } else {
          console.log("ℹ️ 건강 정보가 아직 입력되지 않았습니다");
        }
        console.groupEnd();
      } catch (err) {
        console.error("건강 정보 요약 로드 실패:", err);
        console.groupEnd();
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            건강 정보 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-muted-foreground">
            로딩 중...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            건강 정보 요약
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">
              아직 건강 정보를 입력하지 않았습니다
            </p>
            <Button asChild>
              <Link href="/health/profile">건강 정보 입력하기</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            건강 정보 요약
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/health/profile">
              <Edit className="h-4 w-4 mr-2" />
              수정
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">나이:</span>
            <span className="ml-2 font-medium">{profile.age || "미입력"}세</span>
          </div>
          <div>
            <span className="text-muted-foreground">성별:</span>
            <span className="ml-2 font-medium">
              {profile.gender === "male" ? "남성" :
               profile.gender === "female" ? "여성" :
               profile.gender === "other" ? "기타" : "미입력"}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">키:</span>
            <span className="ml-2 font-medium">{profile.height_cm || "미입력"}cm</span>
          </div>
          <div>
            <span className="text-muted-foreground">몸무게:</span>
            <span className="ml-2 font-medium">{profile.weight_kg || "미입력"}kg</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">활동량:</span>
            <span className="ml-2 font-medium">
              {profile.activity_level ? ACTIVITY_LEVEL_LABELS[profile.activity_level] : "미입력"}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">일일 칼로리 목표:</span>
            <span className="ml-2 font-medium">{profile.daily_calorie_goal || 2000}kcal</span>
          </div>
        </div>

        {/* 질병 정보 */}
        {profile.diseases && profile.diseases.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">질병 정보</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.diseases.map((disease, index) => (
                <Badge 
                  key={disease.code || `disease-${index}`} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {disease.custom_name || DISEASE_LABELS[disease.code as Disease] || disease.code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 알레르기 정보 */}
        {profile.allergies && profile.allergies.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">알레르기 정보</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.allergies.map((allergy, index) => (
                <Badge 
                  key={allergy.code || `allergy-${index}`} 
                  variant="secondary" 
                  className="text-xs"
                >
                  {allergy.custom_name || ALLERGY_LABELS[allergy.code as Allergy] || allergy.code}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 선호 식재료 */}
        {profile.preferred_ingredients && profile.preferred_ingredients.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">선호 식재료</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.preferred_ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="outline" className="text-xs bg-green-50">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 비선호 식재료 */}
        {profile.disliked_ingredients && profile.disliked_ingredients.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">비선호 식재료</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {profile.disliked_ingredients.map((ingredient) => (
                <Badge key={ingredient} variant="outline" className="text-xs bg-red-50">
                  {ingredient}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
