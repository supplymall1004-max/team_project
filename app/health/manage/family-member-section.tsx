/**
 * @file health/manage/family-member-section.tsx
 * @description 건강 정보 관리 페이지용 가족 구성원 섹션 컴포넌트
 *
 * 주요 기능:
 * 1. 가족 구성원 데이터 로드
 * 2. 구독 플랜 정보 로드
 * 3. FamilyMemberList 컴포넌트에 데이터 전달
 */

"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { FamilyMemberList } from "@/components/family/family-member-list";
import { FamilyMember } from "@/types/family";
import { LoadingSpinner } from "@/components/loading-spinner";

interface SubscriptionInfo {
  plan: string;
  maxMembers: number;
}

export function FamilyMemberSection() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo>({
    plan: "free",
    maxMembers: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadFamilyData = async () => {
      try {
        console.group("[FamilyMemberSection] 가족 구성원 데이터 로드");
        console.log("사용자 ID:", user.id);

        // 먼저 사용자 동기화 확인
        console.log("🔄 사용자 동기화 상태 확인 중...");
        try {
          const syncCheckResponse = await fetch("/api/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (syncCheckResponse.ok) {
            console.log("✅ 사용자 동기화 확인됨");
          } else {
            console.warn("⚠️ 사용자 동기화 실패:", syncCheckResponse.status);
          }
        } catch (syncError) {
          console.warn("⚠️ 사용자 동기화 확인 중 에러:", syncError);
        }

        // Clerk 인증 토큰 가져오기
        const token = await getToken();

        // 가족 구성원 데이터 로드 (구독 정보 포함)
        const membersResponse = await fetch("/api/family/members", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        console.log("📡 가족 구성원 API 응답 상태:", membersResponse.status, membersResponse.statusText);
        console.log("📡 응답 헤더:", Object.fromEntries(membersResponse.headers.entries()));
        
        if (membersResponse.ok) {
          const membersResult = await membersResponse.json();
          console.log("✅ API 응답 데이터:", membersResult);
          
          setMembers(membersResult.members || []);

          // 구독 정보 설정
          setSubscriptionInfo({
            plan: membersResult.subscription?.plan || "free",
            maxMembers: membersResult.subscription?.maxMembers || 1,
          });

          console.log(`✅ ${membersResult.members?.length || 0}명의 가족 구성원 로드 성공`);
          console.log(`✅ 구독 플랜: ${membersResult.subscription?.plan || "free"}, 최대 구성원: ${membersResult.subscription?.maxMembers || 1}`);
        } else {
          let errorData = {};
          try {
            const text = await membersResponse.text();
            console.error("❌ 응답 본문 (텍스트):", text);
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (parseError) {
            console.error("❌ 응답 파싱 실패:", parseError);
          }
          
          console.error("❌ 가족 구성원 데이터 로드 실패:", membersResponse.status, membersResponse.statusText);
          console.error("❌ 에러 상세:", errorData);
          setError(`가족 구성원 정보를 불러오는데 실패했습니다. (오류: ${membersResponse.status})`);
        }

        console.groupEnd();
      } catch (err) {
        console.error("가족 데이터 로드 실패:", err);
        console.groupEnd();
        setError("데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadFamilyData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // getToken은 Clerk hook에서 제공하는 안정적인 함수이므로 의존성에서 제외

  const handleRefresh = async () => {
    setIsLoading(true);
    setError(null);
    // useEffect가 다시 실행되도록 user를 의존성으로 둠
    if (user) {
      const loadFamilyData = async () => {
        try {
          console.group("[FamilyMemberSection] 가족 구성원 데이터 새로고침");

          // Clerk 인증 토큰 가져오기
          const token = await getToken();

          const membersResponse = await fetch("/api/family/members", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (membersResponse.ok) {
            const membersResult = await membersResponse.json();
            setMembers(membersResult.members || []);
            
            // 구독 정보 업데이트
            setSubscriptionInfo({
              plan: membersResult.subscription?.plan || "free",
              maxMembers: membersResult.subscription?.maxMembers || 1,
            });
            
            console.log(`✅ ${membersResult.members?.length || 0}명의 가족 구성원 새로고침 성공`);
          } else {
            console.error("가족 구성원 데이터 새로고침 실패:", membersResponse.status);
            setError("가족 구성원 정보를 새로고침하는데 실패했습니다.");
          }

          console.groupEnd();
        } catch (err) {
          console.error("가족 데이터 새로고침 실패:", err);
          console.groupEnd();
          setError("데이터를 새로고침하는데 실패했습니다.");
        } finally {
          setIsLoading(false);
        }
      };

      loadFamilyData();
    }
  };

  const handleReset = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.group("[FamilyMemberSection] 가족 구성원 데이터 초기화 및 재로드");
      
      // 1. 초기화 API 호출
      console.log("🔄 가족 구성원 데이터 초기화 중...");
      const resetResponse = await fetch("/api/admin/reset-family-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (resetResponse.ok) {
        const resetResult = await resetResponse.json();
        console.log("✅ 초기화 완료:", resetResult.message);
      } else {
        const resetError = await resetResponse.json();
        console.warn("⚠️ 초기화 경고:", resetError.message || resetError.error);
        // 초기화 실패해도 계속 진행 (이미 빈 상태일 수 있음)
      }
      
      // 2. 사용자 동기화 확인
      console.log("🔄 사용자 동기화 확인 중...");
      try {
        const syncResponse = await fetch("/api/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        
        if (syncResponse.ok) {
          console.log("✅ 사용자 동기화 확인됨");
        } else {
          console.warn("⚠️ 사용자 동기화 실패:", syncResponse.status);
        }
      } catch (syncError) {
        console.warn("⚠️ 사용자 동기화 확인 중 에러:", syncError);
      }
      
      // 3. 가족 구성원 데이터 다시 불러오기
      console.log("🔄 가족 구성원 데이터 다시 불러오는 중...");
      const token = await getToken();
      
      const membersResponse = await fetch("/api/family/members", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (membersResponse.ok) {
        const membersResult = await membersResponse.json();
        setMembers(membersResult.members || []);
        
        // 구독 정보 업데이트
        setSubscriptionInfo({
          plan: membersResult.subscription?.plan || "free",
          maxMembers: membersResult.subscription?.maxMembers || 1,
        });
        
        console.log(`✅ ${membersResult.members?.length || 0}명의 가족 구성원 로드 성공`);
        console.log(`✅ 구독 플랜: ${membersResult.subscription?.plan || "free"}, 최대 구성원: ${membersResult.subscription?.maxMembers || 1}`);
      } else {
        const errorText = await membersResponse.text();
        console.error("❌ 가족 구성원 데이터 로드 실패:", membersResponse.status, errorText);
        setError(`가족 구성원 정보를 불러오는데 실패했습니다. (오류: ${membersResponse.status})`);
      }
      
      console.groupEnd();
    } catch (err) {
      console.error("❌ 초기화 및 재로드 실패:", err);
      console.groupEnd();
      setError("초기화 및 데이터 로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner label="가족 구성원 정보를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4 dark:bg-red-950">
        <p className="text-sm text-red-800 dark:text-red-200">
          ⚠️ {error}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleRefresh}
            className="text-sm text-red-600 hover:underline"
          >
            다시 시도
          </button>
          <span className="text-red-400">|</span>
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:underline"
          >
            초기화 후 재로드
          </button>
        </div>
      </div>
    );
  }

  return (
    <FamilyMemberList
      members={members}
      maxMembers={subscriptionInfo.maxMembers}
      currentPlan={subscriptionInfo.plan}
      onRefresh={handleRefresh}
      onReset={handleReset}
    />
  );
}
